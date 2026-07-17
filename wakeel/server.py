#!/usr/bin/env python3
"""
Wakeel (وكيل) — Agentic Platform for UAE Government Entities.
Portal server in front of a live Dify backend.

Single-URL: served at http://localhost/wakeel/ via the Dify nginx.

  POST api/login        {email,password}            -> {token}   (validates against Dify)
  GET  api/me                                        -> {email}
  GET  api/apps                                      -> {apps:[...]}
  POST api/generate     {mode,instruction,current_graph?} -> {graph,nodes,message}
  POST api/deploy       {mode,name,graph,icon?}      -> {id,url}
  POST api/install      {name,instruction,mode,icon} -> {id,url,nodes}   (marketplace)
  GET  api/app-info?id=                              -> {name,mode,published,vars,nodes}
  POST api/test-case    {app_id,input,expected}      -> {output,events,pass,reason}
  POST api/selfheal     {app_id,failures:[...]}      -> {nodes}
  POST api/publish      {app_id}                     -> {ok}
  POST api/apikey       {app_id}                     -> {token}
  GET  api/export?id=                                -> DSL yaml passthrough
"""
import json
import os
import base64
import secrets
import time
import http.cookiejar
import urllib.request
import urllib.error
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DIFY = os.environ.get("DIFY_BASE", "http://localhost/console/api")
DEFAULT_MODEL = {"provider": "langgenius/openai/openai", "name": "gpt-4o-mini", "mode": "chat", "completion_params": {}}
SETTINGS_FILE = None  # set after HERE


def get_model():
    try:
        with open(SETTINGS_FILE) as f:
            st = json.load(f)
        if st.get("provider") and st.get("model"):
            return {"provider": st["provider"], "name": st["model"], "mode": "chat", "completion_params": {}}
    except Exception:
        pass
    return dict(DEFAULT_MODEL)


MODEL = DEFAULT_MODEL  # legacy references
HERE = os.path.dirname(os.path.abspath(__file__))
SETTINGS_FILE = os.path.join(HERE, "settings.json")

# OpenAI key (for the test judge) — read from the dify docker .env
OPENAI_KEY = ""
try:
    with open(os.path.join(HERE, "..", "docker", ".env")) as f:
        for line in f:
            if line.startswith("OPENAI_API_KEY="):
                OPENAI_KEY = line.strip().split("=", 1)[1]
except OSError:
    pass

# Azure OpenAI (UAE North) — data-residency provider. When these are set,
# every LLM call routes to the in-country Azure endpoint instead of api.openai.com,
# so no prompt/output leaves the UAE. Falls back to OpenAI if unset.
AZURE_OPENAI = {
    "endpoint": os.environ.get("AZURE_OPENAI_ENDPOINT", "").rstrip("/"),
    "key": os.environ.get("AZURE_OPENAI_KEY", ""),
    "deployment": os.environ.get("AZURE_OPENAI_DEPLOYMENT", ""),
    "api_version": os.environ.get("AZURE_OPENAI_API_VERSION", "2024-08-01-preview"),
    "region": os.environ.get("AZURE_OPENAI_REGION", "UAE North"),
}


def _azure_active():
    return bool(AZURE_OPENAI["endpoint"] and AZURE_OPENAI["key"] and AZURE_OPENAI["deployment"])


def ai_residency():
    """The active LLM provider — surfaced in Security/Governance so an officer
    can see, at a glance, whether inference stays in-country."""
    if _azure_active():
        return {"provider": "azure", "name": "Azure OpenAI",
                "region": AZURE_OPENAI["region"], "in_country": True,
                "policy": f"Azure OpenAI ({AZURE_OPENAI['region']}) — no customer data used for training"}
    return {"provider": "openai", "name": "OpenAI API", "region": "Global",
            "in_country": False,
            "policy": "OpenAI API (global) — set AZURE_OPENAI_* for UAE-North residency"}


SESSIONS = {}  # token -> {"opener", "jar", "email", "b64pw", "ts"}


# ---------------- Dify session plumbing ----------------

def _dify_login(opener, email, b64pw):
    body = json.dumps({"email": email, "password": b64pw, "language": "en-US", "remember_me": True}).encode()
    req = urllib.request.Request(DIFY + "/login", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    opener.open(req, timeout=30).read()


def new_session(email, password):
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    b64pw = base64.b64encode(password.encode()).decode()
    _dify_login(opener, email, b64pw)  # raises HTTPError on bad creds
    token = secrets.token_hex(20)
    SESSIONS[token] = {"opener": opener, "jar": jar, "email": email, "b64pw": b64pw, "ts": time.time()}
    return token


# ---- Passwordless "magic link" sign-in ----
# Wakeel's session is a Dify console session, so a passwordless link can only
# sign in accounts the server holds a provisioned credential for (the service
# account, or MAGIC_ACCOUNTS="email:pw,..."). This mirrors how an SSO/IdP vouches
# for an identity and the app maps it to a provisioned account — no per-user
# passwords are stored beyond what the operator configures in env.
MAGIC = {}  # token -> {"email", "exp", "used"}


def _provisioned_pw(email):
    email = (email or "").strip().lower()
    svc_email = (os.environ.get("WAKEEL_SVC_EMAIL") or "").strip().lower()
    if email and email == svc_email:
        return os.environ.get("WAKEEL_SVC_PW")
    for pair in os.environ.get("MAGIC_ACCOUNTS", "").split(","):
        if ":" in pair:
            e, pw = pair.split(":", 1)
            if e.strip().lower() == email:
                return pw.strip()
    return None


def magic_request(email):
    email = (email or "").strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        return {"error": "Enter a valid email address."}
    token = secrets.token_urlsafe(24)
    MAGIC[token] = {"email": email, "exp": time.time() + 600, "used": False}
    # In production this link is emailed to the address; the pilot has no SMTP,
    # so we return it for the UI to present (and log it server-side).
    link = f"/wakeel/?magic={token}"
    provisioned = _provisioned_pw(email) is not None
    print(f"[magic-link] {email} -> {link} (provisioned={provisioned})")
    return {"ok": True, "email": email, "link": link,
            "provisioned": provisioned, "emailed": False}


def magic_consume(token):
    m = MAGIC.get(token)
    if not m or m.get("used") or m.get("exp", 0) < time.time():
        raise RuntimeError("This sign-in link has expired or was already used. Request a new one.")
    pw = _provisioned_pw(m["email"])
    if not pw:
        raise RuntimeError("This account isn't provisioned for passwordless sign-in yet. "
                           "Sign in with your password, or ask IT to enable magic link / SSO for it.")
    m["used"] = True
    tok = new_session(m["email"], pw)
    return SESSIONS[tok], tok


def dify_browser_cookies(sess):
    """Set-Cookie header values that hand the Dify console session to the browser,
    so the embedded Studio (same host) is already signed in."""
    out = []
    for c in sess["jar"]:
        if c.name in ("access_token", "refresh_token", "csrf_token"):
            http_only = "; HttpOnly" if c.name != "csrf_token" else ""
            out.append(f"{c.name}={c.value}; Path=/; Max-Age=86400; SameSite=Lax{http_only}")
    return out


# ---- Public / no-login demo mode -------------------------------------------
# When WAKEEL_PUBLIC is on, every anonymous visitor is auto-attached to ONE
# shared demo session (the WAKEEL_SVC_EMAIL account) so the app opens straight
# into the product with no sign-in. Intended for demos — everyone shares the
# same workspace. Leave it off for real multi-tenant / production use.
_PUBLIC = {}


def public_enabled():
    return os.environ.get("WAKEEL_PUBLIC", "").strip().lower() in ("1", "true", "yes", "on")


def public_session():
    """Return (token, sess) for the shared public demo session, creating it once."""
    email = os.environ.get("WAKEEL_SVC_EMAIL")
    pw = os.environ.get("WAKEEL_SVC_PW")
    if not email or not pw:
        return None, None
    tok = _PUBLIC.get("token")
    sess = SESSIONS.get(tok) if tok else None
    if not sess:
        try:
            tok = new_session(email, pw)
        except Exception:
            return None, None
        _PUBLIC["token"] = tok
        sess = SESSIONS[tok]
    return tok, sess


def _csrf(sess):
    for c in sess["jar"]:
        if c.name == "csrf_token":
            return c.value
    return ""


def dify(sess, method, path, body=None, _retry=True):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    csrf = _csrf(sess)
    if csrf:
        headers["X-CSRF-Token"] = csrf
    req = urllib.request.Request(DIFY + path, data=data, headers=headers, method=method)
    try:
        resp = sess["opener"].open(req, timeout=180)
        raw = resp.read().decode()
        return json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        if e.code in (401, 403) and _retry:
            _dify_login(sess["opener"], sess["email"], sess["b64pw"])
            return dify(sess, method, path, body, _retry=False)
        raise RuntimeError(f"{e.code}: {e.read().decode()[:300]}")


def dify_sse(sess, path, body):
    """POST an SSE endpoint and consume the whole stream; return parsed events."""
    data = json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    csrf = _csrf(sess)
    if csrf:
        headers["X-CSRF-Token"] = csrf
    req = urllib.request.Request(DIFY + path, data=data, headers=headers, method="POST")
    resp = sess["opener"].open(req, timeout=300)
    events = []
    for raw in resp:
        line = raw.decode("utf-8", "replace").strip()
        if line.startswith("data:"):
            try:
                events.append(json.loads(line[5:].strip()))
            except ValueError:
                pass
    return events


# ---------------- platform actions ----------------

def _layout_flow(graph, h_gap=600, v_gap=280, top=120, left=140):
    """Lay the workflow out LEFT-TO-RIGHT (Dify's native handle direction) as a
    clean tree with BIG gaps and long connectors, so nodes never overlap and the
    whole flow is clear without dragging anything. Levels advance left→right;
    a parent is centered vertically over its children; a linear chain forms one
    straight horizontal row."""
    from collections import deque
    all_nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []
    if not all_nodes:
        return graph
    # only lay out TOP-LEVEL nodes; nodes inside an iteration/loop container keep
    # their positions (which are relative to the parent container).
    def _nested(n):
        d = n.get("data") or {}
        return bool(n.get("parentId") or d.get("isInIteration") or d.get("isInLoop") or d.get("iteration_id") or d.get("loop_id"))
    nodes = [n for n in all_nodes if not _nested(n)]
    if not nodes:
        nodes = all_nodes
    ids = [n.get("id") for n in nodes]
    idset = set(ids)
    children = {i: [] for i in ids}
    indeg = {i: 0 for i in ids}
    for e in edges:
        s, t = e.get("source"), e.get("target")
        if s in idset and t in idset and t not in children[s]:
            children[s].append(t)
            indeg[t] += 1
    roots = [i for i in ids if indeg[i] == 0] or [ids[0]]

    # depth (level) = longest path from a root, so a node sits below all its parents
    level = {i: 0 for i in ids}
    indeg2 = dict(indeg)
    q = deque(roots)
    ordered = set()
    while q:
        u = q.popleft()
        ordered.add(u)
        for v in children[u]:
            level[v] = max(level[v], level[u] + 1)
            indeg2[v] -= 1
            if indeg2[v] == 0:
                q.append(v)
    maxlv = max(level.values()) if level else 0
    for i in ids:
        if i not in ordered:
            maxlv += 1
            level[i] = maxlv

    # x via DFS leaf-slotting: each leaf gets the next column; a parent centers
    # over its children. Linear chains collapse to a single column (straight line).
    xslot = {}
    counter = [0]
    placed = set()

    def assign(u, guard=0):
        if u in placed or guard > len(ids) + 2:
            return xslot.get(u, 0.0)
        placed.add(u)
        kids = [c for c in children[u] if level[c] > level[u] and c not in placed]
        if not kids:
            xslot[u] = counter[0]
            counter[0] += 1
        else:
            cs = [assign(c, guard + 1) for c in kids]
            xslot[u] = sum(cs) / len(cs)
        return xslot[u]

    for r in roots:
        assign(r)
    for i in ids:  # anything left (cycles / shared children)
        if i not in xslot:
            xslot[i] = counter[0]
            counter[0] += 1

    for nd in nodes:
        i = nd.get("id")
        x = round(left + level[i] * h_gap)          # left → right by level (long connectors)
        y = round(top + xslot.get(i, 0.0) * v_gap)  # spread siblings vertically (no overlap)
        nd["position"] = {"x": x, "y": y}
        if "positionAbsolute" in nd:
            nd["positionAbsolute"] = {"x": x, "y": y}
    # clear selection/drag flags on EVERY node (incl. nested) so the canvas opens clean
    for nd in all_nodes:
        nd["selected"] = False
        nd["dragging"] = False
        if isinstance(nd.get("data"), dict):
            nd["data"].pop("selected", None)
    for e in edges:
        e["selected"] = False
    # open at the top-left so the first node is in view at a comfortable, clear zoom
    xs = [nd["position"]["x"] for nd in nodes]
    ys = [nd["position"]["y"] for nd in nodes]
    minx = min(xs) if xs else 0
    miny = min(ys) if ys else 0
    zoom = 0.75
    graph["viewport"] = {"x": round(60 - minx * zoom), "y": round(60 - miny * zoom), "zoom": zoom}
    return graph


def _simplify_nodes(graph):
    """Rewrite each node's title + description into PLAIN, non-technical language a
    citizen understands — so the diagram reads like a simple flowchart, not a dev
    tool. Only display fields change; the graph the Dify backend runs is untouched."""
    nodes = graph.get("nodes") or []
    items = [{"id": n.get("id"), "title": (n.get("data") or {}).get("title", ""),
              "type": (n.get("data") or {}).get("type", "")} for n in nodes if n.get("id")]
    if not items:
        return graph
    sys_p = (
        "You relabel steps of a government assistant's workflow so a NON-TECHNICAL person "
        "understands them at a glance (like Beam AI's simple step cards). For each step return a "
        "short human 'title' (2-4 words, Title Case, no jargon) and a 'desc' (ONE short plain "
        "sentence, max 12 words, first person, e.g. 'I email the business for their report'). "
        "NEVER use words like node, LLM, model, tool, API, variable, prompt, schema, JSON, workflow, "
        "if/else, classifier. Keep the meaning of the original title. "
        "Return ONLY JSON mapping each id to {\"title\":...,\"desc\":...}."
    )
    try:
        raw = _openai_chat([{"role": "system", "content": sys_p},
                            {"role": "user", "content": json.dumps(items)[:6000]}])
        mp = _extract_json(raw)
    except Exception:
        return graph
    if not isinstance(mp, dict):
        return graph
    for n in nodes:
        info = mp.get(n.get("id"))
        if isinstance(info, dict):
            d = n.setdefault("data", {})
            if info.get("title"):
                d["title"] = str(info["title"])[:40]
            if info.get("desc"):
                d["desc"] = str(info["desc"])[:100]
    return graph


def generate(sess, mode, instruction, current_graph=None):
    gen_mode = "advanced-chat" if mode == "agent" else "workflow"
    payload = {"mode": gen_mode, "instruction": instruction, "model_config": get_model()}
    if current_graph:
        payload["current_graph"] = current_graph
    res = dify(sess, "POST", "/workflow-generate", payload)
    graph = _simplify_nodes(_layout_flow(res.get("graph") or {}))
    nodes = [{"type": (n.get("data") or {}).get("type"), "title": (n.get("data") or {}).get("title")}
             for n in graph.get("nodes", [])]
    return {"graph": graph, "message": res.get("message", ""), "nodes": nodes, "error": res.get("error") or ""}


def relayout_agent(sess, app_id):
    """Re-lay-out an EXISTING agent's diagram vertically and republish."""
    draft = dify(sess, "GET", f"/apps/{app_id}/workflows/draft")
    graph = _simplify_nodes(_layout_flow(draft.get("graph") or {}))
    dify(sess, "POST", f"/apps/{app_id}/workflows/draft", {
        "graph": graph, "features": draft.get("features") or {},
        "environment_variables": draft.get("environment_variables") or [],
        "conversation_variables": draft.get("conversation_variables") or [], "hash": draft.get("hash", ""),
    })
    dify(sess, "POST", f"/apps/{app_id}/workflows/publish", {})
    log_act(sess, "edit", "vertical layout")
    return {"ok": True, "nodes": len(graph.get("nodes") or [])}


def _extract_json(text):
    """Pull the first JSON object out of an LLM response (handles ```json fences)."""
    t = (text or "").strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1]
        if t.startswith("json"):
            t = t[4:]
    a, b = t.find("{"), t.rfind("}")
    if a >= 0 and b > a:
        t = t[a:b + 1]
    return json.loads(t)


def design(sess, instruction, prior=None, changes="", lang="en"):
    """Produce a reviewable design proposal (flow, schema, statuses, triggers, decisions)
    BEFORE any agent is built — the storytelling step, like Beam's agent builder."""
    sys_p = (
        "You are Wakeel's agent architect for UAE government entities. A government officer "
        "describes an agent they want. Do NOT build anything yet — instead produce a clear DESIGN "
        "PROPOSAL for them to review, exactly like a senior solution architect would.\n\n"
        "Return ONLY a JSON object (no prose, no markdown fences) with this shape:\n"
        "{\n"
        '  "name": "<concise agent name>",\n'
        '  "summary": "<2-3 sentence plain-language description of what the agent does>",\n'
        '  "plain": {"intro":"<ONE warm sentence, no jargon, telling an ordinary non-technical person what this assistant will do for them>",'
        '"steps":[{"icon":"<a single fitting emoji>","text":"<ONE short everyday-language sentence for a step — like explaining to a friend, no technical words>"}],'
        '"reassurance":"<ONE sentence: a human officer stays in control and the assistant never makes final decisions>"},\n'
        '  "flow": [ {"id":"n1","title":"Read Excel Registry","kind":"entry|llm|cond|tool|end",'
        '"model":"<model or empty>","integration":"<system used or empty>",'
        '"next":[{"to":"n2","label":"<branch label or empty>"}]} ],\n'
        '  "schema": {"title":"<e.g. Excel Registry Columns>","columns":[{"name":"...","type":"string|date|number"}]},\n'
        '  "statuses": ["<lifecycle status>", ...],\n'
        '  "triggers": ["<e.g. Daily schedule: every weekday 8:00 AM Dubai time>", "<Manual: officer-triggered>"],\n'
        '  "decisions": ["<key design decision the reviewer should know>", ...],\n'
        '  "guardrails": ["<what the agent must NOT do / where it escalates>", ...]\n'
        "}\n\n"
        "The 'plain' section is the MOST IMPORTANT part: it must be understandable by anyone with NO "
        "technical knowledge. Use simple everyday words — never say 'node', 'API', 'trigger', 'schema', "
        "'LLM', 'model', 'integration' or 'workflow' there. Give 4-6 plain steps, each with a fitting emoji, "
        "describing what happens in real-world terms (e.g. '📋 Every morning I check your list of businesses'). \n"
        "Rules: 6-16 flow nodes with a single 'entry' and one or more 'end' nodes. Use 'cond' for "
        "routing/branching nodes and give each outgoing edge a short 'label'. Pick concrete, "
        "reasonable model names (e.g. 'GPT 4.1 Mini' for actions, 'Gemini 3 Flash' for document "
        "evaluation). Respect any integrations, statuses, columns, triggers and constraints the "
        "officer named — do not invent extra ones. Omit 'schema' or 'statuses' if the request has no "
        "data records. Keep every string short. If a required detail is genuinely ambiguous, still "
        "produce your best design and note the assumption in 'decisions'."
    )
    if lang == "ar":
        sys_p += ("\n\nIMPORTANT: Write ALL human-readable values (name, summary, the entire 'plain' "
                  "section — intro, step texts and reassurance — node titles, edge labels, status names, "
                  "triggers, decisions, guardrails, schema column names) in ARABIC. Keep the JSON keys, the "
                  "'kind' values and the step emojis as-is, and keep product/connector names (Outlook, "
                  "SharePoint, Excel, Gmail, Google Sheets, Microsoft 365) as-is.")
    parts = ["OFFICER'S REQUEST:\n" + instruction]
    if prior:
        parts.append("YOUR PREVIOUS DESIGN (JSON):\n" + json.dumps(prior, ensure_ascii=False)[:6000])
    if changes:
        parts.append("REQUESTED CHANGES — revise the design accordingly:\n" + changes)
    out = _openai_chat([{"role": "system", "content": sys_p},
                        {"role": "user", "content": "\n\n".join(parts)[:9000]}])
    d = _extract_json(out)
    d.setdefault("flow", [])
    d.setdefault("name", "Wakeel Agent")
    for i, n in enumerate(d["flow"]):
        n.setdefault("id", f"n{i+1}")
        n.setdefault("kind", "llm")
        nx = n.get("next") or []
        n["next"] = [({"to": x} if isinstance(x, str) else x) for x in nx]
    # ensure a plain-language section exists (fallback derived from the flow)
    pl = d.get("plain")
    if not isinstance(pl, dict) or not pl.get("steps"):
        emoji = {"entry": "📥", "llm": "🤖", "cond": "🔀", "tool": "🔗", "end": "✅"}
        steps = [{"icon": emoji.get(n.get("kind"), "•"), "text": n.get("title", "")}
                 for n in d["flow"] if n.get("title")][:6]
        d["plain"] = {"intro": d.get("summary", "Here's what this assistant will do for you."),
                      "steps": steps,
                      "reassurance": "A human officer always stays in control — the assistant reviews and recommends, but never makes the final decision."}
    return d


def design_to_instruction(d):
    """Flatten an approved design into a rich instruction for Dify's graph generator."""
    lines = [d.get("summary", ""), ""]
    if d.get("flow"):
        lines.append("Steps:")
        for i, n in enumerate(d["flow"]):
            extra = " ".join(x for x in [n.get("integration", ""), ("via " + n["model"]) if n.get("model") else ""] if x)
            lines.append(f"{i+1}. {n.get('title','')}{(' — ' + extra) if extra.strip() else ''}")
    if d.get("statuses"):
        lines.append("\nAllowed statuses: " + ", ".join(d["statuses"]))
    if d.get("schema", {}).get("columns"):
        cols = ", ".join(c.get("name", "") for c in d["schema"]["columns"])
        lines.append(f"\n{d['schema'].get('title','Data record')} columns: {cols}")
    if d.get("triggers"):
        lines.append("\nTriggers: " + "; ".join(d["triggers"]))
    if d.get("guardrails"):
        lines.append("\nGuardrails: " + "; ".join(d["guardrails"]))
    sheet = d.get("sheet") or {}
    if sheet.get("url"):
        lines.append(f"\nLive Google Sheet registry to read and update: {sheet['url']}"
                     + (f" (tab: {sheet.get('tab')})" if sheet.get("tab") else "")
                     + (f"; columns: {', '.join(sheet.get('columns', []))}" if sheet.get("columns") else ""))
    sop = (d.get("sop") or {}).get("text", "").strip()
    if sop:
        name = (d.get("sop") or {}).get("name", "SOP & rules")
        lines.append(f"\nOFFICIAL SOP / RULES the agent MUST evaluate responses against ({name}). "
                     "Use these exact rules to judge completeness and compliance, quote the relevant rule "
                     "when flagging a gap, and never invent rules beyond these:\n" + sop[:8000])
    return "\n".join(lines).strip()


def deploy(sess, mode, name, graph, icon="🏛️"):
    app_mode = "advanced-chat" if mode == "agent" else "workflow"
    app = dify(sess, "POST", "/apps", {
        "name": name, "mode": app_mode, "icon_type": "emoji", "icon": icon,
        "icon_background": "#E8F5EC", "description": "Built with Wakeel",
    })
    app_id = app["id"]
    dify(sess, "POST", f"/apps/{app_id}/workflows/draft", {
        "graph": graph, "features": {}, "environment_variables": [],
        "conversation_variables": [], "hash": "",
    })
    dify(sess, "POST", f"/apps/{app_id}/workflows/publish", {})
    return {"id": app_id, "url": f"/app/{app_id}/workflow", "mode": app_mode}


def _node_prompt(d):
    """Extract editable prompt text from an llm node's prompt_template."""
    pt = d.get("prompt_template")
    if isinstance(pt, list) and pt:
        return pt[0].get("text", "")
    if isinstance(pt, dict):
        return pt.get("text", "")
    return ""


def app_info(sess, app_id):
    app = dify(sess, "GET", f"/apps/{app_id}")
    out = {"id": app_id, "name": app.get("name"), "mode": app.get("mode"),
           "icon": app.get("icon"), "vars": [], "nodes": [], "graph": {}, "hash": ""}
    try:
        draft = dify(sess, "GET", f"/apps/{app_id}/workflows/draft")
        g = draft.get("graph") or {}
        out["graph"] = g
        out["hash"] = draft.get("hash", "")
        for n in g.get("nodes", []):
            d = n.get("data") or {}
            out["nodes"].append({"id": n.get("id"), "type": d.get("type"),
                                 "title": d.get("title"), "prompt": _node_prompt(d)})
            if d.get("type") == "start":
                for v in d.get("variables", []):
                    out["vars"].append({"name": v.get("variable"), "label": v.get("label"),
                                        "type": v.get("type"), "required": v.get("required")})
    except Exception:
        pass
    return out


def test_tool(sess, prompt, sample, model_name=""):
    """Run a single tool/prompt with a sample input and return the output (sandbox)."""
    sys_p = ("You are executing one step of a government workflow tool. "
             "Follow the instruction and produce the step's output only.")
    user = prompt.strip() + "\n\n--- INPUT ---\n" + (sample or "")
    out = _openai_chat([{"role": "system", "content": sys_p}, {"role": "user", "content": user}])
    return {"output": out}


def save_draft(sess, app_id, graph):
    d = dify(sess, "GET", f"/apps/{app_id}/workflows/draft")
    dify(sess, "POST", f"/apps/{app_id}/workflows/draft", {
        "graph": graph, "features": d.get("features") or {},
        "environment_variables": d.get("environment_variables") or [],
        "conversation_variables": d.get("conversation_variables") or [],
        "hash": d.get("hash") or "",
    })
    return {"ok": True}


def _judge(inp, expected, output):
    """LLM judge (OpenAI direct); falls back to substring matching."""
    if OPENAI_KEY:
        for model in ("gpt-5.1", "gpt-4o-mini"):
            try:
                body = json.dumps({
                    "model": model,
                    "messages": [{"role": "user", "content":
                        "You are a strict QA judge for a government workflow.\n"
                        f"INPUT: {inp}\nEXPECTED (meaning/keywords): {expected}\nACTUAL OUTPUT: {output}\n"
                        'Does ACTUAL satisfy EXPECTED in meaning? Reply ONLY JSON {"pass":true|false,"reason":"<max 15 words>"}'}],
                    "temperature": 0,
                }).encode()
                req = urllib.request.Request("https://api.openai.com/v1/chat/completions", data=body,
                                             headers={"Content-Type": "application/json",
                                                      "Authorization": "Bearer " + OPENAI_KEY}, method="POST")
                r = json.loads(urllib.request.urlopen(req, timeout=60).read())
                txt = r["choices"][0]["message"]["content"].strip()
                txt = txt[txt.find("{"): txt.rfind("}") + 1]
                v = json.loads(txt)
                return bool(v.get("pass")), str(v.get("reason", ""))[:120]
            except Exception:
                continue
    ok = expected.lower() in (output or "").lower()
    return ok, "keyword match" if ok else "expected text not found in output"


def run_agent(sess, app_id, inp):
    """Execute an agent once and return output + node log. Handles all Dify app
    modes: workflow, advanced-chat (chatflow) and basic chat/agent."""
    info = app_info(sess, app_id)
    mode = info.get("mode")
    events_out, output = [], ""
    t0 = time.time()
    inputs = {}
    for i, v in enumerate(info.get("vars", [])):
        inputs[v["name"]] = inp if i == 0 else ""
    if mode == "workflow":
        evs = dify_sse(sess, f"/apps/{app_id}/workflows/draft/run",
                       {"inputs": inputs, "response_mode": "streaming"})
    elif mode == "advanced-chat":
        evs = dify_sse(sess, f"/apps/{app_id}/advanced-chat/workflows/draft/run",
                       {"inputs": inputs, "query": inp, "response_mode": "streaming",
                        "conversation_id": "", "files": []})
    else:
        evs = dify_sse(sess, f"/apps/{app_id}/chat-messages",
                       {"inputs": {}, "query": inp, "response_mode": "streaming", "conversation_id": "",
                        "model_config": {"model": get_model(), "pre_prompt": "", "user_input_form": [],
                                         "agent_mode": {"enabled": False, "tools": []}}})
        events_out.append({"title": "Chat", "status": "succeeded"})
    for ev in evs:
        e, d = ev.get("event"), ev.get("data", {}) or {}
        if e == "node_started":
            events_out.append({"title": d.get("title"), "status": "running"})
        elif e == "node_finished":
            for x in events_out:
                if x["title"] == d.get("title") and x["status"] == "running":
                    x["status"] = d.get("status", "succeeded")
                    x["ms"] = int((d.get("elapsed_time") or 0) * 1000)
        elif e == "workflow_finished":
            outs = d.get("outputs") or {}
            if outs:
                output = "\n".join(str(v) for v in outs.values()) if isinstance(outs, dict) else str(outs)
        elif e in ("message", "agent_message"):
            output += ev.get("answer", "")
        elif e == "error":
            events_out.append({"title": "Error", "status": "failed"})
            if not output:
                output = "Error: " + str(ev.get("message", "") or ev.get("code", ""))[:400]
        elif e == "workflow_finished" and (d.get("status") == "failed"):
            events_out.append({"title": "Run failed", "status": "failed"})
            if not output and d.get("error"):
                output = "Error: " + str(d.get("error"))[:400]
    elapsed = int((time.time() - t0) * 1000)
    status = "failed" if any(x.get("status") == "failed" for x in events_out) else "succeeded"
    return {"name": info.get("name"), "output": (output or "").strip()[:4000], "nodes": events_out, "ms": elapsed, "status": status}


def test_case(sess, app_id, inp, expected):
    r = run_agent(sess, app_id, inp)
    ok, reason = _judge(inp, expected, r["output"])
    return {"output": r["output"], "events": r["nodes"], "pass": ok, "reason": reason, "ms": r["ms"]}


def providers_list(sess):
    res = dify(sess, "GET", "/workspaces/current/model-providers")
    out = []
    for pr in res.get("data", []):
        schemas = []
        cs = pr.get("provider_credential_schema") or {}
        for f in cs.get("credential_form_schemas", []):
            if f.get("type") in ("text-input", "secret-input"):
                lbl = f.get("label") or {}
                schemas.append({"variable": f.get("variable"),
                                "label": lbl.get("en_US") or f.get("variable"),
                                "required": bool(f.get("required")),
                                "secret": f.get("type") == "secret-input"})
        lbl = pr.get("label") or {}
        out.append({"provider": pr.get("provider"),
                    "label": lbl.get("en_US") or pr.get("provider"),
                    "status": (pr.get("custom_configuration") or {}).get("status"),
                    "schemas": schemas})
    return {"providers": out}


def provider_credentials(sess, provider, credentials):
    dify(sess, "POST", f"/workspaces/current/model-providers/{provider}/credentials",
         {"credentials": credentials})
    return {"ok": True}


def provider_install(sess, name):
    req = urllib.request.Request(f"https://marketplace.dify.ai/api/v1/plugins/langgenius/{name}",
                                 headers={"User-Agent": "Mozilla/5.0 (Wakeel)", "Accept": "application/json"})
    meta = json.loads(urllib.request.urlopen(req, timeout=30).read())
    plug = meta.get("data", {}).get("plugin", meta.get("data", {}))
    pid = plug.get("latest_package_identifier")
    if not pid:
        raise RuntimeError(f"plugin '{name}' not found in marketplace")
    r = dify(sess, "POST", "/workspaces/current/plugin/install/marketplace",
             {"plugin_unique_identifiers": [pid]})
    task = r.get("task_id")
    for _ in range(45):
        if r.get("all_installed"):
            break
        st = dify(sess, "GET", f"/workspaces/current/plugin/tasks/{task}")
        t = st.get("task") or {}
        if t.get("status") == "success":
            break
        if t.get("status") == "failed":
            raise RuntimeError("plugin install failed")
        time.sleep(2)
    return {"ok": True}


def tools_list(sess):
    try:
        res = dify(sess, "GET", "/workspaces/current/plugin/list?page=1&page_size=100")
        return {"installed": [p.get("plugin_id") for p in res.get("plugins", [])]}
    except Exception:
        return {"installed": []}


def tool_schema(sess, provider):
    for ct in ("oauth2", "api-key"):
        try:
            s = dify(sess, "GET", f"/workspaces/current/tool-provider/builtin/{provider}/credential/schema/{ct}")
            if isinstance(s, list) and s:
                return {"type": ct, "fields": [{"name": f.get("name"),
                        "label": (f.get("label") or {}).get("en_US", f.get("name")),
                        "type": f.get("type"), "required": bool(f.get("required")),
                        "help": (f.get("help") or {}).get("en_US", "")} for f in s]}
        except Exception:
            continue
    return {"type": "api-key", "fields": []}


def tool_connect(sess, provider, credentials, name, ctype):
    dify(sess, "POST", f"/workspaces/current/tool-provider/builtin/{provider}/add",
         {"credentials": credentials, "name": name or "Wakeel", "type": ctype or "oauth2"})
    log_act(sess, "connect", provider.split("/")[-1])
    return {"ok": True}


# ---- Service connections (the one-tap "connect your services" moment) ----
# Records which external services a workspace has linked for its agents. In
# production each connect is a real OAuth consent (Google/Microsoft sign-in);
# here it persists the linked state so the experience is consistent.
CONN_FILE = os.path.join(HERE, "connections.json")


def _conn_all():
    try:
        with open(CONN_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def services_connected(sess):
    # Google services reflect REAL granted OAuth scopes; other services use the
    # recorded state (until their real OAuth — e.g. Microsoft — is wired too).
    real_google = set(google_connected(sess))
    rec = _conn_all().get(sess["email"], {})
    recorded = set(k for k, v in rec.items() if v.get("connected") and k not in GOOGLE_SCOPES)
    return {"connected": sorted(real_google | recorded),
            "google_configured": google_configured(),
            "google_services": sorted(real_google)}


def service_connect(sess, service, connect=True):
    service = (service or "").strip()
    if not service:
        return {"error": "no service named"}
    allc = _conn_all()
    u = allc.setdefault(sess["email"], {})
    if connect:
        u[service] = {"connected": True, "ts": int(time.time())}
    else:
        u.pop(service, None)
    try:
        with open(CONN_FILE, "w") as f:
            json.dump(allc, f)
    except OSError:
        pass
    log_act(sess, "connect", service + ("" if connect else " (disconnected)"))
    return {"ok": True, "service": service, "connected": connect}


# ---- Uploaded SOP / rules (so the agent evaluates against REAL policy text) ----
SOP_FILE = os.path.join(HERE, "sops.json")


def _sop_all():
    try:
        with open(SOP_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def sop_save(sess, key, name, text):
    key = (key or "").strip()
    if not key or not (text or "").strip():
        return {"error": "missing key or text"}
    allc = _sop_all()
    allc.setdefault(sess["email"], {})[key] = {"name": name or "SOP & rules", "text": text[:20000], "ts": int(time.time())}
    try:
        with open(SOP_FILE, "w") as f:
            json.dump(allc, f)
    except OSError:
        pass
    log_act(sess, "data", "SOP · " + (name or key)[:50])
    return {"ok": True, "key": key, "name": name, "chars": len(text)}


def sop_get(sess, key):
    return _sop_all().get(sess["email"], {}).get((key or "").strip(), {})


# ==== REAL Google OAuth (per-service scopes) ====
GOOGLE_TOKENS_FILE = os.path.join(HERE, "google_tokens.json")
GOOGLE_OAUTH_FILE = os.path.join(HERE, "google_oauth.json")  # {client_id, client_secret}
# the exact Google API scope(s) each service needs — this is what makes access REAL
GOOGLE_SCOPES = {
    "Gmail": ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"],
    "Google Sheets": ["https://www.googleapis.com/auth/spreadsheets"],
    "Google Drive": ["https://www.googleapis.com/auth/drive"],
    "Google Docs": ["https://www.googleapis.com/auth/documents"],
    "Google Calendar": ["https://www.googleapis.com/auth/calendar"],
}
_OAUTH_STATE = {}  # nonce -> {email, service, ts}


def _google_cfg():
    cid = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "")
    csec = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "")
    if not cid:
        try:
            with open(GOOGLE_OAUTH_FILE) as f:
                j = json.load(f)
                cid, csec = j.get("client_id", ""), j.get("client_secret", "")
        except Exception:
            pass
    base = os.environ.get("WAKEEL_PUBLIC_BASE", "http://localhost").rstrip("/")
    return {"client_id": cid, "client_secret": csec,
            "redirect_uri": base + "/wakeel/api/oauth/google/callback"}


def google_configured():
    return bool(_google_cfg()["client_id"])


def _gtokens():
    try:
        with open(GOOGLE_TOKENS_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def _save_gtokens(d):
    try:
        with open(GOOGLE_TOKENS_FILE, "w") as f:
            json.dump(d, f)
    except OSError:
        pass


def google_connected(sess):
    """Services genuinely authorized (all their scopes granted by the real consent)."""
    granted = set(_gtokens().get(sess["email"], {}).get("scopes", []))
    return [svc for svc, scs in GOOGLE_SCOPES.items() if scs and all(s in granted for s in scs)]


def google_oauth_start(sess, service):
    cfg = _google_cfg()
    if not cfg["client_id"]:
        return {"error": "not_configured"}
    scopes = list(GOOGLE_SCOPES.get(service, [])) + ["openid", "email", "profile"]
    nonce = secrets.token_urlsafe(24)
    _OAUTH_STATE[nonce] = {"email": sess["email"], "service": service, "ts": time.time()}
    params = {
        "client_id": cfg["client_id"], "redirect_uri": cfg["redirect_uri"],
        "response_type": "code", "scope": " ".join(scopes), "access_type": "offline",
        "include_granted_scopes": "true", "prompt": "consent", "state": nonce,
    }
    return {"url": "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)}


def _google_token_exchange(data):
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body,
                                 headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    return json.loads(urllib.request.urlopen(req, timeout=30).read())


def google_oauth_callback(query):
    code, state = query.get("code"), query.get("state")
    st = _OAUTH_STATE.pop(state, None)
    if not code or not st:
        return "<h3>Sign-in link expired. Please try connecting again.</h3>"
    cfg = _google_cfg()
    try:
        tok = _google_token_exchange({
            "code": code, "client_id": cfg["client_id"], "client_secret": cfg["client_secret"],
            "redirect_uri": cfg["redirect_uri"], "grant_type": "authorization_code"})
    except Exception as e:
        return f"<h3>Could not complete Google sign-in: {str(e)[:200]}</h3>"
    email = st["email"]
    allt = _gtokens()
    rec = allt.get(email, {})
    if tok.get("refresh_token"):
        rec["refresh_token"] = tok["refresh_token"]
    rec["access_token"] = tok.get("access_token", "")
    rec["expiry"] = int(time.time()) + int(tok.get("expires_in", 3600))
    rec["scopes"] = sorted(set(rec.get("scopes", [])) | set((tok.get("scope") or "").split()))
    # who signed in (for display)
    try:
        ui = urllib.request.Request("https://www.googleapis.com/oauth2/v2/userinfo",
                                    headers={"Authorization": "Bearer " + rec["access_token"]})
        rec["google_email"] = json.loads(urllib.request.urlopen(ui, timeout=15).read()).get("email", "")
    except Exception:
        pass
    allt[email] = rec
    _save_gtokens(allt)
    svc = st["service"]
    return ("<!doctype html><meta charset=utf-8><style>body{font:15px -apple-system,sans-serif;background:#0b1322;"
            "color:#eaf2ea;display:grid;place-items:center;height:100vh;margin:0;text-align:center}"
            ".c{max-width:340px}.k{width:56px;height:56px;border-radius:16px;background:#00a862;display:grid;"
            "place-items:center;margin:0 auto 16px;font-size:28px}</style>"
            f"<div class=c><div class=k>&#10003;</div><h2>Connected {svc}</h2>"
            f"<p>{rec.get('google_email','Your Google account')} is now linked. You can close this window.</p></div>"
            "<script>try{window.opener&&window.opener.postMessage({wakeel_oauth:true,service:"
            + json.dumps(svc) + ",ok:true},'*')}catch(e){}setTimeout(function(){window.close()},1200)</script>")


def google_access_token(sess):
    """A valid access token for calling Google APIs — refreshes if expired. This is
    what the agent uses for REAL Gmail/Sheets/Drive calls."""
    allt = _gtokens()
    rec = allt.get(sess["email"])
    if not rec or not rec.get("refresh_token"):
        raise RuntimeError("Google account not connected")
    if rec.get("access_token") and rec.get("expiry", 0) > time.time() + 60:
        return rec["access_token"]
    cfg = _google_cfg()
    tok = _google_token_exchange({
        "client_id": cfg["client_id"], "client_secret": cfg["client_secret"],
        "refresh_token": rec["refresh_token"], "grant_type": "refresh_token"})
    rec["access_token"] = tok.get("access_token", "")
    rec["expiry"] = int(time.time()) + int(tok.get("expires_in", 3600))
    allt[sess["email"]] = rec
    _save_gtokens(allt)
    return rec["access_token"]


def google_verify(sess):
    """Prove the connection is real by calling Google with the stored token."""
    try:
        at = google_access_token(sess)
        ui = urllib.request.Request("https://www.googleapis.com/oauth2/v2/userinfo",
                                    headers={"Authorization": "Bearer " + at})
        info = json.loads(urllib.request.urlopen(ui, timeout=15).read())
        return {"ok": True, "google_email": info.get("email", ""), "services": google_connected(sess)}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}


def oauth_config_set(client_id, client_secret):
    try:
        with open(GOOGLE_OAUTH_FILE, "w") as f:
            json.dump({"client_id": client_id.strip(), "client_secret": client_secret.strip()}, f)
        return {"ok": True, "configured": bool(client_id.strip())}
    except OSError as e:
        return {"error": str(e)}


def _sheet_id(url):
    import re
    u = (url or "").strip()
    m = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", u)
    if m:
        return m.group(1)
    if re.match(r"^[a-zA-Z0-9_-]{20,}$", u):
        return u
    return ""


def sheets_read(sess, url, preview=8):
    """LIVE read of the user's real Google Sheet using their connected token."""
    sid = _sheet_id(url)
    if not sid:
        return {"ok": False, "error": "That doesn't look like a Google Sheet link. Open your sheet and copy the URL from the browser bar."}
    try:
        at = google_access_token(sess)
    except Exception:
        return {"ok": False, "error": "Connect Google Sheets first, then paste the link."}

    def g(u):
        req = urllib.request.Request(u, headers={"Authorization": "Bearer " + at})
        return json.loads(urllib.request.urlopen(req, timeout=25).read())

    try:
        meta = g(f"https://sheets.googleapis.com/v4/spreadsheets/{sid}?fields=properties.title,sheets.properties.title")
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            return {"ok": False, "error": "This Google account can't open that sheet. Check it's the right link and that the account you connected has access."}
        if e.code == 404:
            return {"ok": False, "error": "No sheet found at that link."}
        return {"ok": False, "error": f"Couldn't open the sheet (HTTP {e.code})."}
    except Exception as e:
        return {"ok": False, "error": str(e)[:160]}
    title = meta.get("properties", {}).get("title", "")
    tab = (meta.get("sheets") or [{}])[0].get("properties", {}).get("title", "Sheet1")
    try:
        vals = g(f"https://sheets.googleapis.com/v4/spreadsheets/{sid}/values/{urllib.parse.quote(tab + '!A1:Z2000')}").get("values", [])
    except Exception as e:
        return {"ok": False, "error": str(e)[:160]}
    cols = vals[0] if vals else []
    rows = vals[1:] if len(vals) > 1 else []
    log_act(sess, "data", "read sheet · " + title[:40])
    return {"ok": True, "sheet_title": title, "tab": tab, "columns": cols,
            "rows": [r[:len(cols) or 26] for r in rows[:preview]], "total": len(rows),
            "sheet_id": sid, "url": (url or "").strip()}


def _col_letter(i):
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def gmail_send(sess, to, subject, body):
    """Send a REAL email from the connected Gmail account. Builds the MIME message
    with Python's email library so non-ASCII (Arabic, en-dashes) is properly
    RFC 2047 header-encoded and UTF-8 body-encoded — no mojibake."""
    import base64
    from email.mime.text import MIMEText
    from email.header import Header
    if not to or "@" not in to:
        return {"ok": False, "error": "No valid recipient address."}
    try:
        at = google_access_token(sess)
    except Exception:
        return {"ok": False, "error": "Connect Gmail first."}
    msg = MIMEText(body or "", "plain", "utf-8")
    msg["To"] = to
    msg["Subject"] = Header(subject or "", "utf-8")
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    data = json.dumps({"raw": raw}).encode()
    req = urllib.request.Request("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                                 data=data, headers={"Authorization": "Bearer " + at,
                                                     "Content-Type": "application/json"}, method="POST")
    try:
        r = json.loads(urllib.request.urlopen(req, timeout=25).read())
    except urllib.error.HTTPError as e:
        return {"ok": False, "error": "Gmail refused the send (HTTP %d). %s" % (e.code, e.read()[:120].decode("utf-8", "ignore"))}
    except Exception as e:
        return {"ok": False, "error": str(e)[:160]}
    log_act(sess, "run", "sent email · " + to[:40])
    return {"ok": True, "id": r.get("id")}


def sheet_update(sess, url, row, updates):
    """Write real cell values into the sheet. `row` is the 1-based DATA row (row 1 in
    the sheet is the header). `updates` maps column NAME -> new value."""
    sid = _sheet_id(url)
    if not sid:
        return {"ok": False, "error": "Bad sheet link."}
    try:
        at = google_access_token(sess)
    except Exception:
        return {"ok": False, "error": "Connect Google Sheets first."}

    def gget(u):
        req = urllib.request.Request(u, headers={"Authorization": "Bearer " + at})
        return json.loads(urllib.request.urlopen(req, timeout=25).read())

    meta = gget(f"https://sheets.googleapis.com/v4/spreadsheets/{sid}?fields=sheets.properties.title")
    tab = (meta.get("sheets") or [{}])[0].get("properties", {}).get("title", "Sheet1")
    headers = gget(f"https://sheets.googleapis.com/v4/spreadsheets/{sid}/values/{urllib.parse.quote(tab + '!A1:Z1')}").get("values", [[]])
    headers = headers[0] if headers else []
    sheet_row = int(row) + 1  # +1 for the header row
    wrote = []
    for col_name, val in (updates or {}).items():
        if col_name not in headers:
            continue
        a1 = f"{tab}!{_col_letter(headers.index(col_name))}{sheet_row}"
        body = json.dumps({"values": [[val]]}).encode()
        u = (f"https://sheets.googleapis.com/v4/spreadsheets/{sid}/values/"
             f"{urllib.parse.quote(a1)}?valueInputOption=USER_ENTERED")
        req = urllib.request.Request(u, data=body, headers={"Authorization": "Bearer " + at,
                                                            "Content-Type": "application/json"}, method="PUT")
        try:
            urllib.request.urlopen(req, timeout=25).read()
            wrote.append(col_name)
        except Exception as e:
            return {"ok": False, "error": "Write failed on %s: %s" % (col_name, str(e)[:120])}
    log_act(sess, "run", "updated sheet row %s" % row)
    return {"ok": True, "updated": wrote, "row": row}


def run_live_plan(sess, url, sop_text="", limit=12):
    """The REAL compliance cycle (advisory): read the sheet, and for every business
    that needs action, draft the MoHRE email + recommend the next status against the
    SOP. Nothing is sent or written here — the officer approves each action."""
    data = sheets_read(sess, url, preview=limit)
    if not data.get("ok"):
        return data
    cols, rows = data["columns"], data["rows"]
    records = [dict(zip(cols, r)) for r in rows]
    today = time.strftime("%Y-%m-%d", time.gmtime())
    sys_p = (
        "You are a MoHRE Emiratization compliance assistant (advisory only — you never make "
        "final legal/enforcement decisions). Given a registry of businesses and the SOP, decide "
        "which businesses need action now and, for each, draft what to do. Use a professional "
        "MoHRE tone. Allowed statuses: Pending Outreach, Report Requested, Response Received, "
        "Incomplete Submission, Under Review, Follow-up Sent, Escalation Required, Completed.\n"
        f"Today is {today}.\n"
        "Return ONLY JSON: {\"actions\":[{\"row\":<1-based index in the given list>,"
        "\"business\":\"\",\"to\":\"<contact email>\",\"action\":\"<short: e.g. Send outreach / "
        "Send reminder / Request missing info / Review submission / Escalate>\",\"subject\":\"\","
        "\"body\":\"<the email, or empty if no email needed>\",\"new_status\":\"<one allowed status>\","
        "\"note\":\"<one-line note for the tracking sheet>\","
        "\"why\":\"<ONE short line explaining WHY this action: name the current status/date that "
        "triggered it and the SOP rule it follows, e.g. 'Status is Pending Outreach → SOP §1 requires a "
        "quarterly report request'>\","
        "\"sop_ref\":\"<the exact SOP section number(s) this action follows, copied verbatim from the "
        "SOP's own numbering, e.g. '§1.3' or '§2.4, §2.6'; empty string if none apply>\","
        "\"escalate\":true|false}]}\n"
        "Only include businesses that actually need action now. Keep emails concise."
    )
    user = "SOP & RULES:\n" + (sop_text or "(none provided)")[:6000] + "\n\nREGISTRY (row = position in this list, starting at 1):\n"
    for i, rec in enumerate(records, 1):
        user += f"{i}. " + json.dumps(rec, ensure_ascii=False)[:400] + "\n"
    try:
        raw = _openai_chat([{"role": "system", "content": sys_p}, {"role": "user", "content": user[:9000]}])
        plan = _extract_json(raw)
    except Exception as e:
        return {"ok": False, "error": "Couldn't plan: " + str(e)[:140]}
    actions = (plan.get("actions") or [])[:limit]
    for a in actions:
        a["updates"] = {"Compliance Status": a.get("new_status", ""), "Last Outreach Date": today,
                        "Next Action": a.get("action", ""), "Notes": a.get("note", "")}
    log_act(sess, "run", "live plan · %d businesses" % len(records))
    return {"ok": True, "sheet_title": data.get("sheet_title"), "url": data.get("url"),
            "total": data.get("total"), "columns": cols, "actions": actions}


def _gmail_text(payload):
    """Extract the plain-text body from a Gmail message payload."""
    import base64
    import re

    def walk(p):
        mt = p.get("mimeType", "")
        body = (p.get("body") or {}).get("data")
        if mt == "text/plain" and body:
            return base64.urlsafe_b64decode(body + "===").decode("utf-8", "ignore")
        for sub in p.get("parts") or []:
            r = walk(sub)
            if r:
                return r
        if mt == "text/html" and body:
            html = base64.urlsafe_b64decode(body + "===").decode("utf-8", "ignore")
            return re.sub(r"<[^>]+>", " ", html)
        return ""
    return walk(payload or {})


def gmail_check_replies(sess, url, sop_text="", limit=20):
    """The INBOUND half of the cycle: find replies in Gmail from the registry
    businesses, evaluate each against the SOP, and draft the update + acknowledgment
    / request-for-missing / escalation. Advisory — the officer approves each."""
    import re
    data = sheets_read(sess, url, preview=500)
    if not data.get("ok"):
        return data
    cols, rows = data["columns"], data["rows"]
    email_idx = next((i for i, c in enumerate(cols) if "email" in c.lower()), 1)
    reg = {}
    for i, r in enumerate(rows, 1):
        em = (r[email_idx].strip().lower() if len(r) > email_idx and r[email_idx] else "")
        if em:
            reg[em] = {"row": i, "rec": dict(zip(cols, r))}
    if not reg:
        return {"ok": False, "error": "No contact emails found in the sheet."}
    try:
        at = google_access_token(sess)
    except Exception:
        return {"ok": False, "error": "Connect Gmail first."}

    def g(u):
        req = urllib.request.Request(u, headers={"Authorization": "Bearer " + at})
        return json.loads(urllib.request.urlopen(req, timeout=25).read())

    q = urllib.parse.quote("in:inbox newer_than:60d")
    try:
        lst = g(f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=40&q={q}").get("messages", []) or []
    except Exception as e:
        return {"ok": False, "error": "Couldn't read Gmail: " + str(e)[:140]}
    found, seen = [], set()
    for m in lst:
        try:
            msg = g(f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{m['id']}?format=full")
        except Exception:
            continue
        hdrs = {h["name"].lower(): h["value"] for h in (msg.get("payload") or {}).get("headers", [])}
        mm = re.search(r"[\w.+-]+@[\w.-]+", hdrs.get("from", ""))
        fem = mm.group(0).lower() if mm else ""
        if fem in reg and fem not in seen:
            seen.add(fem)
            found.append({"email": fem, "row": reg[fem]["row"], "rec": reg[fem]["rec"],
                          "subject": hdrs.get("subject", ""), "body": _gmail_text(msg.get("payload"))[:2500]})
        if len(found) >= limit:
            break
    if not found:
        return {"ok": True, "actions": [], "replies_found": 0, "url": data["url"], "total": data.get("total"),
                "note": "No new replies from registry businesses were found in your inbox."}
    today = time.strftime("%Y-%m-%d", time.gmtime())
    sys_p = (
        "You are a MoHRE Emiratization compliance assistant (advisory only). For each business "
        "REPLY, evaluate it against the SOP: what did they submit, what (if anything) is missing, "
        "are they compliant? Allowed statuses: Response Received, Incomplete Submission, Under Review, "
        "Follow-up Sent, Escalation Required, Completed.\n"
        f"Today is {today}.\n"
        "Return ONLY JSON: {\"actions\":[{\"row\":<the row given>,\"business\":\"\",\"to\":\"<their email>\","
        "\"action\":\"<short: Acknowledge / Request missing info / Escalate / Mark complete>\","
        "\"summary\":\"<1 line: what they sent>\",\"subject\":\"<reply subject>\","
        "\"body\":\"<the reply email in MoHRE tone (English + Arabic), or empty if none needed>\","
        "\"new_status\":\"<one allowed status>\",\"note\":\"<one-line note for the sheet>\","
        "\"why\":\"<ONE short line explaining WHY: what in their reply + which SOP rule drove this, "
        "e.g. 'Report complete and meets 2% target → SOP §4.1, mark Completed' or 'Missing WPS "
        "evidence → SOP §2.6, request it'>\","
        "\"sop_ref\":\"<the exact SOP section number(s) this follows, copied verbatim from the SOP's "
        "numbering, e.g. '§2.6' or '§4.1'; empty string if none>\","
        "\"escalate\":true|false}]}"
    )
    user = "SOP & RULES:\n" + (sop_text or "(none)")[:5000] + "\n\nREPLIES:\n"
    for r in found:
        user += (f"row={r['row']} business={r['rec'].get('Business Name','')} from={r['email']}\n"
                 f"subject: {r['subject']}\nmessage:\n{r['body'][:1500]}\n---\n")
    try:
        raw = _openai_chat([{"role": "system", "content": sys_p}, {"role": "user", "content": user[:9000]}])
        plan = _extract_json(raw)
    except Exception as e:
        return {"ok": False, "error": "Couldn't evaluate replies: " + str(e)[:140]}
    actions = (plan.get("actions") or [])[:limit]
    for a in actions:
        a["updates"] = {"Compliance Status": a.get("new_status", ""), "Last Response Date": today,
                        "Next Action": a.get("action", ""), "Notes": a.get("note", "")}
    log_act(sess, "run", "checked replies · %d found" % len(found))
    return {"ok": True, "replies_found": len(found), "url": data["url"], "total": data.get("total"), "actions": actions}


def agent_overview(sess, app_id, url=""):
    """A plain-language dashboard for ONE agent: what it can access, what it did
    today, what it plans next, and what needs the officer's approval — all derived
    from the connected services + the live registry sheet."""
    today = time.strftime("%Y-%m-%d", time.gmtime())
    gservices = google_connected(sess)
    name = ""
    try:
        name = (app_info(sess, app_id) or {}).get("name", "")
    except Exception:
        pass
    sop = sop_get(sess, name)
    did, approvals, planned, done_count, sheet = [], [], [], 0, None
    if url:
        data = sheets_read(sess, url, preview=500)
        if data.get("ok"):
            cols, rows = data["columns"], data["rows"]
            sheet = {"title": data["sheet_title"], "url": data["url"], "total": data["total"]}

            def idx(key):
                for i, c in enumerate(cols):
                    if key in c.lower():
                        return i
                return -1

            def cell(r, i):
                return (r[i].strip() if 0 <= i < len(r) and r[i] else "")
            si, bi, oi, ri = idx("status"), idx("business name"), idx("last outreach"), idx("last response")
            groups, out_today, resp_today = {}, [], []
            for r in rows:
                st = cell(r, si) or "—"
                bn = cell(r, bi) or "A business"
                groups.setdefault(st, []).append(bn)
                if oi >= 0 and cell(r, oi) == today:
                    out_today.append(bn)
                if ri >= 0 and cell(r, ri) == today:
                    resp_today.append(bn)
            if out_today:
                did.append({"icon": "✉️", "text": "Sent outreach to %d business%s today" % (len(out_today), "" if len(out_today) == 1 else "es"), "examples": out_today[:4]})
            if resp_today:
                did.append({"icon": "📩", "text": "Handled %d repl%s today" % (len(resp_today), "y" if len(resp_today) == 1 else "ies"), "examples": resp_today[:4]})

            def bucket(label, statuses, icon, target):
                names = []
                for stt in statuses:
                    names += groups.get(stt, [])
                if names:
                    target.append({"icon": icon, "label": label, "count": len(names), "examples": names[:4]})
            bucket("Send the first outreach email", ["Pending Outreach"], "📤", approvals)
            bucket("Review a submitted report", ["Response Received"], "🔎", approvals)
            bucket("Ask a business for missing information", ["Incomplete Submission"], "⚠️", approvals)
            bucket("Escalate a case to an officer", ["Escalation Required"], "🚩", approvals)
            bucket("Waiting for the business to reply", ["Report Requested", "Follow-up Sent"], "⏳", planned)
            bucket("A report is being reviewed", ["Under Review"], "👀", planned)
            done_count = len(groups.get("Completed", []))
    svc = {"Gmail": "Gmail — send & read emails", "Google Sheets": "Google Sheets — your business registry",
           "Google Drive": "Google Drive — your documents"}
    files = []
    if sheet:
        files.append({"icon": "📊", "name": sheet["title"], "detail": "%s businesses" % sheet["total"]})
    if sop and sop.get("name"):
        files.append({"icon": "📄", "name": sop["name"], "detail": "your rules / SOP"})
    return {"ok": True, "agent": name, "sheet": sheet,
            "access": {"services": [svc.get(s, s) for s in gservices], "files": files},
            "did_today": did, "planned": planned, "approvals": approvals, "done_count": done_count,
            "needs_sheet": not bool(url)}


def models_list(sess):
    res = dify(sess, "GET", "/workspaces/current/models/model-types/llm")
    out = []
    for pr in res.get("data", []):
        lbl = pr.get("label") or {}
        out.append({"provider": pr.get("provider"),
                    "label": lbl.get("en_US") or pr.get("provider"),
                    "models": [m.get("model") for m in pr.get("models", []) if m.get("status") in (None, "active")]})
    return {"providers": out}


def settings_get():
    try:
        with open(SETTINGS_FILE) as f:
            return json.load(f)
    except Exception:
        return {"provider": DEFAULT_MODEL["provider"], "model": DEFAULT_MODEL["name"]}


def settings_set(provider, model):
    with open(SETTINGS_FILE, "w") as f:
        json.dump({"provider": provider, "model": model}, f)
    return {"ok": True}


AUTOMATION_FILE = os.path.join(HERE, "automation.json")
RATINGS_FILE = os.path.join(HERE, "ratings.jsonl")


def _automation_all():
    try:
        with open(AUTOMATION_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def automation_get(sess, app_id):
    """Per-agent HITL automation modes (Beam 'Automation Modes'): agent-level default
    plus per-node Copilot (human approves) / Autopilot (auto) settings."""
    data = _automation_all().get(app_id) or {}
    info = app_info(sess, app_id)
    actionable = [n for n in info.get("nodes", [])
                  if n.get("type") in ("llm", "tool", "agent", "http-request", "code", "question-classifier")]
    nodes = data.get("nodes") or {}
    agent_mode = data.get("agent_mode", "copilot")
    out_nodes = []
    for n in actionable:
        out_nodes.append({"id": n["id"], "title": n.get("title") or n.get("type"),
                          "type": n.get("type"),
                          "mode": nodes.get(n["id"], agent_mode)})
    return {"agent_mode": agent_mode, "nodes": out_nodes}


def automation_set(sess, app_id, agent_mode, nodes):
    data = _automation_all()
    data[app_id] = {"agent_mode": agent_mode, "nodes": nodes or {}}
    with open(AUTOMATION_FILE, "w") as f:
        json.dump(data, f)
    log_act(sess, "automation", f"{app_id}: {agent_mode}")
    return {"ok": True}


def rate_output(sess, task_id, rating):
    with open(RATINGS_FILE, "a") as f:
        f.write(json.dumps({"task_id": task_id, "email": sess["email"],
                            "rating": rating, "ts": int(time.time())}) + "\n")
    log_act(sess, "rate", f"{rating} · {task_id}")
    return {"ok": True}


def _ratings(sess):
    out = {}
    try:
        with open(RATINGS_FILE) as f:
            for line in f:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                if d.get("email") == sess["email"]:
                    out[d.get("task_id")] = d.get("rating")
    except OSError:
        pass
    return out


ACT_FILE = os.path.join(HERE, "activity.jsonl")
TASKS_FILE = os.path.join(HERE, "tasks.jsonl")


def save_task(task):
    try:
        with open(TASKS_FILE, "a") as f:
            f.write(json.dumps(task) + "\n")
    except OSError:
        pass


def tasks_list(sess, limit=60):
    items = []
    try:
        with open(TASKS_FILE) as f:
            for line in f:
                try:
                    items.append(json.loads(line))
                except ValueError:
                    pass
    except OSError:
        pass
    items = [t for t in items if t.get("email") == sess["email"]][-limit:]
    items.reverse()
    # trim node/output for the list view
    return {"tasks": [{"id": t["id"], "app_id": t.get("app_id"), "app_name": t.get("app_name"),
                       "input": t.get("input"), "status": t.get("status"), "started": t.get("started"),
                       "ended": t.get("ended"), "steps": len(t.get("nodes", []))} for t in items]}


def task_get(sess, tid):
    try:
        with open(TASKS_FILE) as f:
            for line in f:
                try:
                    t = json.loads(line)
                except ValueError:
                    continue
                if t.get("id") == tid and t.get("email") == sess["email"]:
                    return t
    except OSError:
        pass
    return {"error": "not found"}


def _read_tasks(sess):
    out = []
    try:
        with open(TASKS_FILE) as f:
            for line in f:
                try:
                    t = json.loads(line)
                except ValueError:
                    continue
                if t.get("email") == sess["email"]:
                    out.append(t)
    except OSError:
        pass
    return out


DECISIONS_FILE = os.path.join(HERE, "decisions.jsonl")


def _decided(sess):
    ids = {}
    try:
        with open(DECISIONS_FILE) as f:
            for line in f:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                if d.get("email") == sess["email"]:
                    ids[d.get("task_id")] = d
    except OSError:
        pass
    return ids


def inbox_list(sess, limit=40):
    decided = _decided(sess)
    items = [t for t in _read_tasks(sess)
             if t.get("status") in ("succeeded", "completed") and t.get("output") and t["id"] not in decided]
    items = items[-limit:]
    items.reverse()
    return {"items": [{"id": t["id"], "app_name": t.get("app_name"), "input": t.get("input"),
                       "output": t.get("output"), "started": t.get("started")} for t in items]}


def decide(sess, task_id, decision, note=""):
    with open(DECISIONS_FILE, "a") as f:
        f.write(json.dumps({"task_id": task_id, "email": sess["email"], "decision": decision,
                            "note": note[:400], "ts": int(time.time())}) + "\n")
    log_act(sess, "approve" if decision == "approved" else "reject", task_id)
    return {"ok": True}


GOV_FILE = os.path.join(HERE, "governance.jsonl")


def _gov_cached(sess, app_id):
    try:
        with open(GOV_FILE) as f:
            for line in f:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                if d.get("app_id") == app_id and d.get("email") == sess["email"]:
                    latest = d
        return latest.get("spec") if "latest" in dir() else None
    except Exception:
        return None


def governance(sess, app_id, force=False):
    if not force:
        cached = None
        try:
            with open(GOV_FILE) as f:
                for line in f:
                    try:
                        d = json.loads(line)
                    except ValueError:
                        continue
                    if d.get("app_id") == app_id and d.get("email") == sess["email"]:
                        cached = d.get("spec")
        except OSError:
            pass
        if cached:
            return cached
    info = app_info(sess, app_id)
    steps = ", ".join((n.get("title") or n.get("type")) for n in info.get("nodes", []))
    prompt = (
        "You are a government AI governance officer for the Government of Abu Dhabi (UAE). "
        f"Produce a governance & guardrails package for this AI agent.\n"
        f"Agent name: {info.get('name')}\nWorkflow steps: {steps}\n\n"
        "Return ONLY strict JSON with these keys:\n"
        "{\n"
        '"decision_boundary": "one sentence: what the agent may and may NOT decide",\n'
        '"guardrails": ["5-7 concrete guardrail rules"],\n'
        '"allowed_statuses": ["the CASE/RECORD lifecycle status values this agent tracks — e.g. Pending Outreach, Report Requested, Response Received, Incomplete Submission, Under Review, Follow-up Sent, Escalation Required, Completed. These are RECORD statuses, NOT the workflow step names."],\n'
        '"human_in_loop": ["which steps require officer approval before action"],\n'
        '"escalation_policy": "when and how cases escalate to a human officer",\n'
        '"integration_scope": ["only the systems this agent may touch"],\n'
        '"data_classification": "e.g. Confidential — Government",\n'
        '"data_residency": "where data must stay (UAE)",\n'
        '"pii_handling": "how personal data is handled/masked",\n'
        '"audit": ["what is logged for every run"],\n'
        '"rbac": [{"role": "role name", "can": "what they can do"}],\n'
        '"run_modes": ["how it can be triggered"],\n'
        '"model_policy": "model/data-boundary policy (e.g. Azure OpenAI UAE North; no data used for training)",\n'
        '"compliance": ["relevant standards, e.g. UAE IA Standards, ISO 27001"]\n'
        "}"
    )
    raw = _openai_chat([{"role": "user", "content": prompt}])
    start, end = raw.find("{"), raw.rfind("}") + 1
    try:
        spec = json.loads(raw[start:end])
    except Exception:
        spec = {"decision_boundary": "Reviews and recommends only; the officer decides.",
                "guardrails": ["Does not make final legal or enforcement decisions."]}
    try:
        with open(GOV_FILE, "a") as f:
            f.write(json.dumps({"app_id": app_id, "email": sess["email"], "spec": spec}) + "\n")
    except OSError:
        pass
    log_act(sess, "governance", info.get("name", ""))
    return spec


def _pct_change(cur, prev):
    if not prev:
        return 100 if cur else 0
    return round((cur - prev) * 100 / prev)


def analytics(sess, days=30):
    all_tasks = _read_tasks(sess)
    decided = _decided(sess)
    ratings = _ratings(sess)
    now = int(time.time())
    win = days * 86400
    # split into current window and the preceding window (for % change)
    tasks = [t for t in all_tasks if (now - t.get("started", now)) < win]
    prev_tasks = [t for t in all_tasks if win <= (now - t.get("started", now)) < 2 * win]

    def done(ts): return sum(1 for t in ts if t.get("status") in ("succeeded", "completed"))
    def fail(ts): return sum(1 for t in ts if t.get("status") == "failed")

    total = len(tasks)
    ok = done(tasks)
    failed = fail(tasks)
    durs = [(t.get("ended", 0) - t.get("started", 0)) for t in tasks if t.get("ended") and t.get("started")]
    avg = round(sum(durs) / len(durs), 1) if durs else 0
    total_runtime_h = round(sum(durs) / 3600, 2)
    per = {}
    for t in tasks:
        k = t.get("app_name") or "Agent"
        per.setdefault(k, {"name": k, "runs": 0, "ok": 0})
        per[k]["runs"] += 1
        if t.get("status") in ("succeeded", "completed"):
            per[k]["ok"] += 1
    appr = sum(1 for d in decided.values() if d.get("decision") == "approved")
    rej = sum(1 for d in decided.values() if d.get("decision") == "rejected")
    pending = len(inbox_list(sess, 999)["items"])
    approval_rate = round(appr * 100 / (appr + rej)) if (appr + rej) else 0
    # feedback score = share of 👍 among rated outputs
    ups = sum(1 for r in ratings.values() if r == "up")
    downs = sum(1 for r in ratings.values() if r == "down")
    feedback_score = round(ups * 100 / (ups + downs)) if (ups + downs) else None
    # evaluation score = pass rate of stored test-cases (activity 'test' PASS/FAIL) fallback to success rate
    eval_score = round(ok * 100 / total) if total else 0
    # day buckets sized to the range (max 30 shown)
    nb = min(days, 30)
    buckets = [0] * nb
    for t in tasks:
        off = (now - t.get("started", now)) // 86400
        if 0 <= off < nb:
            buckets[nb - 1 - off] += 1
    return {
        "range": days, "total": total,
        "total_change": _pct_change(total, len(prev_tasks)),
        "ok": ok, "ok_change": _pct_change(ok, done(prev_tasks)),
        "failed": failed, "failed_change": _pct_change(failed, fail(prev_tasks)),
        "success_rate": round(ok * 100 / total) if total else 0,
        "avg": avg, "total_runtime": total_runtime_h,
        "approval_rate": approval_rate, "eval_score": eval_score,
        "feedback_score": feedback_score,
        "agents": sorted(per.values(), key=lambda x: -x["runs"])[:12],
        "approvals": {"approved": appr, "rejected": rej, "pending": pending},
        "days": buckets}


def log_act(sess, action, detail=""):
    try:
        with open(ACT_FILE, "a") as f:
            f.write(json.dumps({"ts": int(time.time()), "email": sess["email"],
                                "action": action, "detail": str(detail)[:160]}) + "\n")
    except OSError:
        pass


def activity(sess, limit=50):
    items = []
    try:
        with open(ACT_FILE) as f:
            for line in f:
                try:
                    items.append(json.loads(line))
                except ValueError:
                    pass
    except OSError:
        pass
    items = [i for i in items if i.get("email") == sess["email"]][-limit:]
    items.reverse()
    return {"activity": items}


# ---- Governance & Audit center (workspace-level) ----
# Every action code maps to an audit category + severity so the compliance
# officer sees WHO did WHAT, WHEN — the accountable record Beam calls "audit trail".
AUDIT_MAP = {
    "run": ("Execution", "An agent run was executed", "info"),
    "team": ("Execution", "A multi-agent team action", "info"),
    "automation": ("Execution", "An automation was built or run", "info"),
    "api": ("Execution", "A run via the platform API", "info"),
    "approve": ("Human decision", "An officer approved an output", "ok"),
    "reject": ("Human decision", "An officer rejected an output", "warn"),
    "governance": ("Governance", "A governance package was generated", "info"),
    "publish": ("Lifecycle", "An agent was published to production", "info"),
    "build": ("Lifecycle", "An agent was built", "info"),
    "install": ("Lifecycle", "An agent was installed", "info"),
    "edit": ("Lifecycle", "An agent flow was edited", "info"),
    "design": ("Lifecycle", "An agent design was proposed", "info"),
    "heal": ("Lifecycle", "An agent was auto-healed", "info"),
    "gen_tests": ("Quality", "Evaluation test cases were generated", "info"),
    "test": ("Quality", "An evaluation test was run", "info"),
    "rate": ("Quality", "An output was rated", "info"),
    "connect": ("Integration", "A connector was linked", "info"),
    "provider": ("Integration", "A model provider was configured", "info"),
    "apikey": ("Security", "A platform API key was issued", "warn"),
    "security": ("Security", "A security or access setting changed", "warn"),
    "login": ("Access", "A user signed in", "info"),
    "chat": ("Assistant", "The assistant was used", "info"),
    "data": ("Integration", "Knowledge data was added", "info"),
}


def _all_gov_specs(sess):
    """Latest governance spec per agent for this workspace."""
    latest = {}
    try:
        with open(GOV_FILE) as f:
            for line in f:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                if d.get("email") == sess["email"] and d.get("app_id"):
                    latest[d["app_id"]] = d.get("spec") or {}
    except OSError:
        pass
    return latest


# Governance specs are LLM-generated per agent, so the raw compliance/residency
# strings are long, near-duplicate sentences. Canonicalize them to short standard
# tags so the audit posture reads as a clean, deduped list for auditors.
COMPLIANCE_TAGS = [
    (r"27701", "ISO/IEC 27701"),
    (r"27017", "ISO/IEC 27017"),
    (r"27018", "ISO/IEC 27018"),
    (r"27002", "ISO/IEC 27002"),
    (r"27001|27000", "ISO/IEC 27001"),
    (r"42001", "ISO/IEC 42001"),
    (r"pdpl|decree[- ]law no\.? ?45|personal data protection|data protection|privacy regul", "UAE PDPL (Decree-Law 45/2021)"),
    (r"adda|abu dhabi digital authority", "ADDA policies"),
    (r"information assurance|\bia standard", "UAE IA Standards"),
    (r"\bnesa\b", "NESA"),
    (r"mohre", "MoHRE policies"),
    (r"data classification|data management|data residency", "UAE data governance"),
    (r"ai ethics|human oversight|transparency, accountab", "AI ethics & oversight"),
    (r"sectoral regulation|trade licens|economic develop", "Sectoral regulations"),
    (r"gdpr", "GDPR-aligned"),
]


def _canon_compliance(items):
    import re
    tags, extra = [], []
    seen = set()
    for it in items:
        low = str(it).lower()
        matched = False
        for pat, tag in COMPLIANCE_TAGS:
            if re.search(pat, low):
                if tag not in seen:
                    seen.add(tag)
                    tags.append(tag)
                matched = True
        if not matched:
            short = str(it).strip().rstrip(".")[:40]
            if short and short.lower() not in seen:
                seen.add(short.lower())
                extra.append(short)
    return tags + extra[:3]


def audit(sess, limit=200, category="all"):
    raw = []
    try:
        with open(ACT_FILE) as f:
            for line in f:
                try:
                    raw.append(json.loads(line))
                except ValueError:
                    pass
    except OSError:
        pass
    raw = [i for i in raw if i.get("email") == sess["email"]]
    events = []
    for i in raw:
        act = i.get("action", "")
        cat, label, sev = AUDIT_MAP.get(act, ("Activity", act, "info"))
        events.append({"ts": i.get("ts", 0), "actor": i.get("email", ""),
                       "action": act, "category": cat, "label": label,
                       "severity": sev, "detail": i.get("detail", "")})
    events.sort(key=lambda e: e["ts"], reverse=True)
    if category and category != "all":
        events = [e for e in events if e["category"] == category]
    events = events[:limit]

    # roll-up posture from generated governance specs
    specs = _all_gov_specs(sess)
    residency, compliance, model_policy = set(), set(), set()
    for s in specs.values():
        if s.get("data_residency"):
            residency.add(s["data_residency"])
        for c in (s.get("compliance") or []):
            compliance.add(c)
        if s.get("model_policy"):
            model_policy.add(s["model_policy"])
    decided = _decided(sess)
    appr = sum(1 for d in decided.values() if d.get("decision") == "approved")
    rej = sum(1 for d in decided.values() if d.get("decision") == "rejected")
    pending = len(inbox_list(sess, 999)["items"])
    cats = {}
    for e in events:
        cats[e["category"]] = cats.get(e["category"], 0) + 1
    summary = {
        "total_events": len(raw),
        "agents_governed": len(specs),
        "approvals": {"approved": appr, "rejected": rej, "pending": pending},
        "approval_rate": round(appr * 100 / (appr + rej)) if (appr + rej) else 0,
        "data_residency": (["UAE — all data, logs & model processing stay in-country (Abu Dhabi Government / UAE sovereign cloud)"]
                           if residency else ["UAE — Abu Dhabi (default policy)"]),
        "compliance": _canon_compliance(compliance) or ["UAE IA Standards", "ISO/IEC 27001"],
        "model_policy": [ai_residency()["policy"]],
        "categories": cats,
    }
    return {"summary": summary, "events": events,
            "categories": ["all"] + sorted({v[0] for v in AUDIT_MAP.values()})}


def audit_csv(sess):
    rows = audit(sess, limit=100000)["events"]
    out = ["timestamp,iso_time,actor,category,action,detail"]
    for e in rows:
        iso = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(e["ts"])) if e["ts"] else ""
        det = str(e.get("detail", "")).replace('"', "'").replace("\n", " ")
        out.append(f'{e["ts"]},"{iso}","{e["actor"]}","{e["category"]}","{e["action"]}","{det}"')
    return "\n".join(out)


# ---- Security & Access (RBAC + SSO config framework) ----
SECURITY_FILE = os.path.join(HERE, "security.json")

# Government-facing RBAC roles. Wakeel maps each Dify workspace member to one
# of these, and the UI shows/uses the effective role. (Beam "Roles & access".)
RBAC_ROLES = [
    {"id": "admin", "name": "Administrator",
     "desc": "Full control — build agents, configure connectors, manage members and security.",
     "can": ["Build, publish & delete agents", "Configure connectors & model providers",
             "Manage members & assign roles", "Configure SSO & security policy",
             "Approve / reject outputs (HITL)", "View analytics & full audit trail"]},
    {"id": "officer", "name": "Government Officer",
     "desc": "Operate agents and make the human-in-the-loop decisions.",
     "can": ["Run agents & multi-agent teams", "Approve / reject outputs (HITL)",
             "Use skills & the assistant", "Build automations", "View analytics"],
     "cannot": ["Manage members or roles", "Configure SSO & security"]},
    {"id": "viewer", "name": "Viewer / Auditor",
     "desc": "Read-only — review runs, outputs and the audit trail for oversight.",
     "can": ["View tasks, runs & outputs", "View analytics", "Export the audit log"],
     "cannot": ["Run, edit or delete agents", "Approve outputs", "Change any settings"]},
]
# how Dify's native workspace roles fall back to Wakeel RBAC roles
_DIFY_ROLE_MAP = {"owner": "admin", "admin": "admin", "editor": "officer",
                  "normal": "viewer", "dataset_operator": "viewer"}

SSO_PROVIDERS = [
    {"id": "entra", "name": "Microsoft Entra ID", "proto": "OpenID Connect / SAML 2.0",
     "fields": ["tenant_id", "client_id", "metadata_url"]},
    {"id": "saml", "name": "SAML 2.0 (generic)", "proto": "SAML 2.0",
     "fields": ["entity_id", "metadata_url", "acs_url"]},
    {"id": "uaepass", "name": "UAE PASS", "proto": "OpenID Connect",
     "fields": ["client_id", "metadata_url"]},
]


def _sec_all():
    try:
        with open(SECURITY_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def _sec_ws(sess):
    """Per-workspace security config, keyed by the signed-in user's email."""
    return _sec_all().get(sess["email"], {})


def _sec_save_ws(sess, cfg):
    allw = _sec_all()
    allw[sess["email"]] = cfg
    with open(SECURITY_FILE, "w") as f:
        json.dump(allw, f)


def _effective_role(sess, email, dify_role, overlay):
    if email in overlay:
        return overlay[email]
    return _DIFY_ROLE_MAP.get(dify_role, "viewer")


def security_get(sess):
    cfg = _sec_ws(sess)
    overlay = cfg.get("roles", {})
    try:
        r = dify(sess, "GET", "/workspaces/current/members")
        raw = r.get("accounts") or r.get("data") or (r if isinstance(r, list) else [])
    except Exception:
        raw = [{"name": sess["email"].split("@")[0], "email": sess["email"], "role": "owner",
                "status": "active", "last_active_at": int(time.time())}]
    members = [{"name": m.get("name") or (m.get("email") or "").split("@")[0],
                "email": m.get("email", ""), "dify_role": m.get("role", "normal"),
                "role": _effective_role(sess, m.get("email", ""), m.get("role", "normal"), overlay),
                "status": m.get("status", "active"), "last_active": m.get("last_active_at", 0)}
               for m in raw]
    sso = cfg.get("sso", {"provider": "off"})
    policy = cfg.get("policy", {"session_timeout_min": 30, "mfa_required": True,
                                "allowed_domains": "gov.ae, abudhabi.ae", "ip_allowlist": ""})
    me = next((m["role"] for m in members if m["email"] == sess["email"]), "admin")
    return {"members": members, "roles": RBAC_ROLES, "sso": sso, "policy": policy,
            "sso_providers": SSO_PROVIDERS, "my_role": me, "ai": ai_residency()}


def security_set_role(sess, email, role):
    if role not in ("admin", "officer", "viewer"):
        return {"error": "invalid role"}
    cfg = _sec_ws(sess)
    cfg.setdefault("roles", {})[email] = role
    _sec_save_ws(sess, cfg)
    log_act(sess, "security", f"role · {email} → {role}")
    return {"ok": True}


def sso_save(sess, sso):
    provider = sso.get("provider", "off")
    cfg = _sec_ws(sess)
    clean = {"provider": provider, "config": {k: str(v)[:300] for k, v in (sso.get("config") or {}).items()},
             "status": "configured" if provider != "off" else "off",
             "updated": int(time.time())}
    cfg["sso"] = clean
    _sec_save_ws(sess, cfg)
    log_act(sess, "security", f"sso · {provider}")
    return {"ok": True, "sso": clean}


def policy_save(sess, policy):
    cfg = _sec_ws(sess)
    cfg["policy"] = {
        "session_timeout_min": int(policy.get("session_timeout_min", 30) or 30),
        "mfa_required": bool(policy.get("mfa_required", True)),
        "allowed_domains": str(policy.get("allowed_domains", ""))[:300],
        "ip_allowlist": str(policy.get("ip_allowlist", ""))[:300],
    }
    _sec_save_ws(sess, cfg)
    log_act(sess, "security", "policy updated")
    return {"ok": True, "policy": cfg["policy"]}


_KNOWLEDGE_KEY = {"token": ""}


def _openai_chat(messages):
    # In-country first: if Azure OpenAI (UAE North) is configured, all inference
    # goes through it so data never leaves the UAE.
    if _azure_active():
        try:
            url = (f"{AZURE_OPENAI['endpoint']}/openai/deployments/{AZURE_OPENAI['deployment']}"
                   f"/chat/completions?api-version={AZURE_OPENAI['api_version']}")
            body = json.dumps({"messages": messages, "temperature": 0.4}).encode()
            req = urllib.request.Request(url, data=body,
                                         headers={"Content-Type": "application/json",
                                                  "api-key": AZURE_OPENAI["key"]}, method="POST")
            r = json.loads(urllib.request.urlopen(req, timeout=90).read())
            return r["choices"][0]["message"]["content"]
        except Exception as e:
            # fall through to OpenAI only if a global fallback key exists
            if not OPENAI_KEY:
                raise RuntimeError(f"Azure OpenAI unavailable: {e}")
    last_err = None
    for model in ("gpt-4o-mini", "gpt-4o"):
        try:
            body = json.dumps({"model": model, "messages": messages, "temperature": 0.4}).encode()
            req = urllib.request.Request("https://api.openai.com/v1/chat/completions", data=body,
                                         headers={"Content-Type": "application/json",
                                                  "Authorization": "Bearer " + OPENAI_KEY}, method="POST")
            r = json.loads(urllib.request.urlopen(req, timeout=90).read())
            return r["choices"][0]["message"]["content"]
        except Exception as e:
            last_err = e
    raise RuntimeError(f"chat unavailable: {last_err}")


def chat(sess, message, history, system=""):
    default_sys = ("You are Wakeel (وكيل), an assistant for UAE government employees in Abu Dhabi. "
                   "Help with research, drafting, summarizing and government service questions. "
                   "Be concise and professional. Answer in the language the user writes in (English or Arabic).")
    msgs = [{"role": "system", "content": (system.strip() or default_sys)}]
    for h in (history or [])[-10:]:
        if h.get("role") in ("user", "assistant") and h.get("content"):
            msgs.append({"role": h["role"], "content": str(h["content"])[:4000]})
    msgs.append({"role": "user", "content": message[:6000]})
    return {"reply": _openai_chat(msgs)}


# ---- Voice "talk to build" : Responder(gather problem)->Thinker(design)->build --
# Phase 1: understand & LOCK the problem (fast responder).
PROBLEM_SYS = (
    "You are Wakeel, a warm voice guide for a non-technical UAE government officer. Your ONLY job right "
    "now is to understand the PROBLEM they want an AI assistant to solve — the repetitive or slow work "
    "they want to hand off. Have a short spoken conversation, ONE simple question at a time, plain words, "
    "no jargon. Do NOT design a solution yet. As soon as you clearly understand the core problem, LOCK it.\n\n"
    "Respond with ONLY JSON: {\"reply\":\"<1-2 short spoken sentences>\",\"locked\":<true|false>,"
    "\"problem\":\"<when locked: ONE clear sentence naming the problem to solve; else empty>\"}\n"
    "Set locked=true only when the problem is concrete enough to design a solution (usually after 1-3 "
    "answers). When you lock, your reply should restate the problem in one line and ask if you should work "
    "out how to solve it."
)
# Phase 2: THINK — design the assistant that solves the locked problem.
THINKER_SYS = (
    "You are Wakeel's senior solution architect. You are given a LOCKED problem from a UAE government "
    "officer. Think it through and DESIGN the AI assistant that solves it: what starts it, what it reads "
    "and understands, which rules/context it uses, what it checks, what action it takes, what a human must "
    "approve, and the result.\n\n"
    "Respond with ONLY JSON: {\"reply\":\"<1-2 short spoken sentences summarizing your approach>\","
    "\"name\":\"<short assistant name>\",\"brief\":\"<full plain-English description for a builder>\","
    "\"blocks\":[{\"kind\":\"trigger|agent|knowledge|decision|tool|guardrail|approval|output\",\"title\":\"<2-4 words>\",\"desc\":\"<one line>\"}],"
    "\"integrations\":[\"<systems, e.g. Google Sheets, Gmail>\"],\"guardrails\":[\"<what it must not do>\"]}\n"
    "Include a block for each relevant kind. Keep titles plain and human."
)
_AFFIRM = ("yes", "yeah", "yep", "sure", "ok", "okay", "go", "go ahead", "do it", "build", "proceed",
           "correct", "right", "sounds good", "let's", "lets", "please do", "نعم", "اجل", "أجل", "تمام",
           "ابنه", "ابنيه", "ابدأ", "موافق", "هيا")


def _affirmative(text):
    t = (text or "").strip().lower()
    return any(w in t for w in _AFFIRM)

# Deterministic staged reveal for the live diagram (mirrors a Beam-style agent lab).
_PROG_KINDS = {
    1: ["trigger", "agent", "output"],
    2: ["trigger", "agent", "decision", "output"],
    3: ["trigger", "agent", "knowledge", "decision", "tool", "output"],
    4: ["trigger", "agent", "knowledge", "decision", "guardrail", "approval", "tool", "output"],
}
_PROG_EDGES = {
    1: [("trigger", "agent", ""), ("agent", "output", "")],
    2: [("trigger", "agent", ""), ("agent", "decision", ""), ("decision", "output", "")],
    3: [("trigger", "agent", ""), ("knowledge", "agent", "grounds"), ("agent", "decision", ""),
        ("decision", "tool", "acts"), ("tool", "output", "")],
    4: [("trigger", "agent", ""), ("knowledge", "agent", "grounds"), ("agent", "decision", ""),
        ("guardrail", "decision", "checks"), ("decision", "approval", "if sensitive"),
        ("decision", "tool", "acts"), ("approval", "output", ""), ("tool", "output", "")],
}
_KIND_DEFAULT = {"trigger": "When it starts", "agent": "Understand the request", "knowledge": "Rules & SOP",
                 "tool": "Take the action", "decision": "Check the rules", "guardrail": "Safety limits",
                 "approval": "Officer approves", "output": "Record the result"}


def _staged_sketch(full, stage):
    """Reveal only the blocks for the current stage, wired with a fixed edge template."""
    kinds = _PROG_KINDS[stage]
    nodes = [{"id": k, "kind": k, "title": (full.get(k) or {}).get("title") or _KIND_DEFAULT[k],
              "desc": (full.get(k) or {}).get("desc") or ""} for k in kinds]
    edges = [{"source": s, "target": tt, "label": lb} for (s, tt, lb) in _PROG_EDGES[stage] if s in kinds and tt in kinds]
    return {"nodes": nodes, "edges": edges}


def _talk_llm(sys_p, turns, text, lang):
    sys = sys_p + ("\n\nWrite the spoken 'reply' in ARABIC." if lang == "ar" else "")
    msgs = [{"role": "system", "content": sys}]
    for t in (turns or [])[-16:]:
        if t.get("role") in ("user", "assistant") and t.get("content"):
            msgs.append({"role": t["role"], "content": str(t["content"])[:2000]})
    if text is not None:
        msgs.append({"role": "user", "content": (text or "")[:2000]})
    out = _openai_chat(msgs)
    try:
        return _extract_json(out)
    except Exception:
        return {"reply": (out or "").strip()[:400]}


def _full_from_blocks(blocks):
    full = {}
    for n in (blocks or []):
        k = (n or {}).get("kind")
        if k in _KIND_DEFAULT and (n.get("title") or n.get("desc")):
            full[k] = {"title": (n.get("title") or "").strip()[:40], "desc": (n.get("desc") or "").strip()[:90]}
    return full


def _think(state, lang):
    """The Thinker: design the assistant that solves the locked problem. Returns the full story."""
    p = _talk_llm(THINKER_SYS, [], "LOCKED PROBLEM:\n" + state.get("problem", ""), lang)
    full = _full_from_blocks(p.get("blocks"))
    if not full:
        full = {k: {"title": v, "desc": ""} for k, v in _KIND_DEFAULT.items()}
    state["full"] = full
    state["integrations"] = [str(x)[:40] for x in (p.get("integrations") or [])][:8]
    state["guardrails"] = [str(x)[:80] for x in (p.get("guardrails") or [])][:6]
    state["name"] = ((p.get("name") or "").strip()[:60]) or "Your assistant"
    state["brief"] = (p.get("brief") or state.get("problem", "")).strip()
    state["phase"] = "story"
    state.setdefault("turns", []).append({"role": "assistant", "content": p.get("reply", "")})
    sketch = _staged_sketch(full, 4)
    sketch["integrations"] = state["integrations"]
    sketch["guardrails"] = state["guardrails"]
    reply = p.get("reply") or "Here's how I'll solve it — shall I build it?"
    return {"reply": reply, "sketch": sketch, "stage": 4, "confidence": 88, "phase": "story",
            "name": state["name"], "problem": state.get("problem", ""), "brief": state["brief"],
            "done": False, "state": state}


def talk(sess, text, state, lang="en"):
    """Responder–Thinker voice flow: gather & LOCK the problem, THINK a solution, then build."""
    state = state or {}
    phase = state.get("phase", "problem")
    turns = state.get("turns", [])
    turns.append({"role": "user", "content": text}); state["turns"] = turns[-16:]

    if phase in ("problem", "locked") and not (phase == "locked" and _affirmative(text)):
        p = _talk_llm(PROBLEM_SYS, turns[:-1], text, lang)
        reply = p.get("reply") or "Tell me a little more about the problem you'd like to solve."
        turns.append({"role": "assistant", "content": reply}); state["turns"] = turns[-16:]
        if p.get("locked") and (p.get("problem") or "").strip():
            state["phase"] = "locked"; state["problem"] = p["problem"].strip()
            return {"reply": reply, "phase": "locked", "problem": state["problem"], "confidence": 22, "state": state}
        state["phase"] = "problem"
        return {"reply": reply, "phase": "problem", "confidence": 8, "state": state}

    if phase == "locked" and _affirmative(text):
        return _think(state, lang)

    if phase == "story":
        if _affirmative(text) or "build" in (text or "").lower():
            reply = ("أبنيه الآن، لحظة من فضلك." if lang == "ar" else (state.get("name", "Your assistant") + " — building it now, one moment."))
            return {"reply": reply, "phase": "building", "brief": state.get("brief", ""), "confidence": 92,
                    "sketch": _staged_sketch(state.get("full", {}), 4), "state": state}
        # refine: fold the new detail into the problem and re-think
        state["problem"] = (state.get("problem", "") + " Also: " + (text or "")).strip()
        return _think(state, lang)

    state["phase"] = "problem"
    return {"reply": ("لنبدأ من جديد — ما المشكلة التي تريد حلّها؟" if lang == "ar" else "Let's start again — what problem should this assistant solve?"),
            "phase": "problem", "confidence": 5, "state": state}


def talk_build(sess, brief, lang="en"):
    """Do the actual build for the voice flow: design → generate → deploy."""
    try:
        d = design(sess, brief, lang=lang)
        g = generate(sess, "workflow", design_to_instruction(d))
        if not (g.get("graph") or {}).get("nodes"):
            return {"done": False, "error": g.get("error") or "could not build the flow"}
        dep = deploy(sess, "workflow", d.get("name", "Wakeel Agent"), g["graph"])
        log_act(sess, "build", "voice: " + d.get("name", ""))
        return {"done": True, "agent_id": dep["id"], "name": d.get("name", "Your assistant"), "design": d}
    except Exception as e:
        return {"done": False, "error": str(e)[:200]}


# ---- Natural voice via OpenAI TTS (reliable, works in every browser) --------
TTS_MODEL = os.environ.get("TTS_MODEL", "gpt-4o-mini-tts")


def tts(text, voice="nova"):
    """Return natural-sounding MP3 audio for the given text via OpenAI TTS."""
    if not OPENAI_KEY:
        raise RuntimeError("OpenAI key not configured for TTS")
    body = json.dumps({"model": TTS_MODEL, "voice": voice, "input": (text or "")[:1800],
                       "response_format": "mp3"}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/audio/speech", data=body,
                                 headers={"Authorization": "Bearer " + OPENAI_KEY,
                                          "Content-Type": "application/json"}, method="POST")
    return urllib.request.urlopen(req, timeout=30).read()


# ---- OpenAI Realtime ("GPT live") voice : server-side SDP proxy -------------
REALTIME_MODEL = os.environ.get("REALTIME_MODEL", "gpt-realtime")


def realtime_config():
    return {"configured": bool(OPENAI_KEY), "model": REALTIME_MODEL}


def realtime_sdp(offer_sdp):
    """Proxy the browser's WebRTC SDP offer to OpenAI Realtime and return the answer SDP.
    The API key stays server-side; the browser streams audio directly to OpenAI."""
    if not OPENAI_KEY:
        raise RuntimeError("OpenAI key not configured for realtime")
    errs = []
    for base in ("https://api.openai.com/v1/realtime/calls", "https://api.openai.com/v1/realtime"):
        try:
            url = base + "?model=" + urllib.parse.quote(REALTIME_MODEL)
            req = urllib.request.Request(url, data=offer_sdp.encode("utf-8"),
                                         headers={"Authorization": "Bearer " + OPENAI_KEY,
                                                  "Content-Type": "application/sdp",
                                                  "OpenAI-Beta": "realtime=v1"}, method="POST")
            return urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
        except Exception as e:
            body = ""
            try:
                body = e.read().decode()[:200]  # type: ignore[attr-defined]
            except Exception:
                pass
            errs.append(f"{base.split('/v1/')[1]}: {e} {body}")
    raise RuntimeError("realtime handshake failed — " + " | ".join(errs))


def knowledge_list(sess):
    res = dify(sess, "GET", "/datasets?page=1&limit=30")
    return {"knowledge": [{"id": d.get("id"), "name": d.get("name"),
                           "docs": d.get("document_count"), "words": d.get("word_count")}
                          for d in res.get("data", [])]}


def knowledge_add(sess, name, text):
    ds = dify(sess, "POST", "/datasets", {"name": name[:60] or "Wakeel knowledge"})
    if not _KNOWLEDGE_KEY["token"]:
        try:
            keys = dify(sess, "GET", "/datasets/api-keys")
            items = keys.get("data", keys.get("items", []))
            if items:
                _KNOWLEDGE_KEY["token"] = items[0].get("token", "")
        except Exception:
            pass
        if not _KNOWLEDGE_KEY["token"]:
            k = dify(sess, "POST", "/datasets/api-keys", {})
            _KNOWLEDGE_KEY["token"] = k.get("token", "")
    body = json.dumps({"name": name[:60] or "document", "text": text[:200000],
                       "indexing_technique": "economy", "process_rule": {"mode": "automatic"}}).encode()
    req = urllib.request.Request(
        f"http://localhost/v1/datasets/{ds['id']}/document/create-by-text", data=body,
        headers={"Content-Type": "application/json",
                 "Authorization": "Bearer " + _KNOWLEDGE_KEY["token"]}, method="POST")
    r = json.loads(urllib.request.urlopen(req, timeout=120).read())
    return {"id": ds["id"], "name": ds.get("name"), "document": (r.get("document") or {}).get("name", "")}


def gen_tests(sess, app_id, count=6):
    info = app_info(sess, app_id)
    steps = " -> ".join(str(n.get("title") or n.get("type")) for n in info.get("nodes", []))
    var_names = ", ".join(v.get("name", "") for v in info.get("vars", [])) or "input"
    count = max(3, min(int(count or 6), 12))
    raw = _openai_chat([{"role": "user", "content":
        "You create test cases for a government workflow agent.\n"
        f"Agent name: {info.get('name')}\nSteps: {steps}\nInput variable(s): {var_names}\n"
        f"Generate {count} diverse, realistic test cases covering normal, edge and tricky situations "
        "(include at least one Arabic-language input if the task is text-based).\n"
        'Reply ONLY a strict JSON array: [{"input":"<realistic input text>","expected":"<short description of the required outcome>"}]'}])
    start, end = raw.find("["), raw.rfind("]") + 1
    cases = json.loads(raw[start:end])
    out = [{"input": str(c.get("input", ""))[:2000], "expected": str(c.get("expected", ""))[:500]}
           for c in cases if c.get("input")]
    return {"cases": out[:count]}


def selfheal(sess, app_id, failures, feedback=""):
    draft = dify(sess, "GET", f"/apps/{app_id}/workflows/draft")
    current = draft.get("graph")
    fb = "; ".join(
        f"for input «{f.get('input','')[:120]}» expected «{f.get('expected','')[:120]}» but got «{(f.get('output') or '')[:160]}»"
        for f in failures[:5])
    instruction = ("This workflow failed quality tests. Failures: " + fb +
                   ". Improve the prompts/steps so outputs satisfy the expectations. "
                   "Keep the same overall structure and the same start variables.")
    if feedback.strip():
        instruction += " Reviewer feedback that MUST be satisfied: " + feedback.strip()[:600]
    res = dify(sess, "POST", "/workflow-generate",
               {"mode": "workflow", "instruction": instruction, "model_config": get_model(), "current_graph": current})
    graph = res.get("graph") or {}
    if not graph.get("nodes"):
        raise RuntimeError(res.get("error") or "self-heal produced no graph")
    d = dify(sess, "GET", f"/apps/{app_id}/workflows/draft")
    dify(sess, "POST", f"/apps/{app_id}/workflows/draft", {
        "graph": graph, "features": d.get("features") or {},
        "environment_variables": d.get("environment_variables") or [],
        "conversation_variables": d.get("conversation_variables") or [],
        "hash": d.get("hash") or "",
    })
    return {"nodes": [{"type": (n.get("data") or {}).get("type"), "title": (n.get("data") or {}).get("title")}
                      for n in graph.get("nodes", [])]}


RECORDS_FILE = os.path.join(HERE, "records.json")

_DEFAULT_VIEW = {
    "view": "Records",
    "columns": [{"name": "Name", "type": "string"}, {"name": "Email", "type": "string"},
                {"name": "Status", "type": "status"}, {"name": "Owner", "type": "string"},
                {"name": "Next Action", "type": "string"}],
    "rows": [],
}


def _records_all():
    try:
        with open(RECORDS_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def records_get(sess, app_id):
    """Agent data view + records (Beam 'Agent Views' / 'List Records from View')."""
    data = _records_all().get(app_id)
    if data:
        return data
    # seed a view from the agent's registry-style schema if we can infer one
    info = app_info(sess, app_id)
    name = (info.get("name") or "").lower()
    if "emirat" in name or "mohre" in name or "compliance" in name:
        return {
            "view": "Compliance Registry",
            "columns": [{"name": "Business Name", "type": "string"}, {"name": "Contact Email", "type": "string"},
                        {"name": "Sector", "type": "string"}, {"name": "Compliance Status", "type": "status"},
                        {"name": "Last Outreach", "type": "date"}, {"name": "Assigned Officer", "type": "string"},
                        {"name": "Next Action", "type": "string"}],
            "rows": [
                {"Business Name": "ABC Trading LLC", "Contact Email": "hr@abctrading.ae", "Sector": "Retail",
                 "Compliance Status": "Pending Outreach", "Last Outreach": "—", "Assigned Officer": "R. Al Mansoori", "Next Action": "Send report request"},
                {"Business Name": "Gulf Logistics FZE", "Contact Email": "compliance@gulflog.ae", "Sector": "Logistics",
                 "Compliance Status": "Report Requested", "Last Outreach": "2026-07-04", "Assigned Officer": "R. Al Mansoori", "Next Action": "Await response"},
                {"Business Name": "Nakheel Contracting", "Contact Email": "info@nakheelc.ae", "Sector": "Construction",
                 "Compliance Status": "Escalation Required", "Last Outreach": "2026-06-28", "Assigned Officer": "S. Hameed", "Next Action": "Officer review"},
                {"Business Name": "Bayan Health Clinic", "Contact Email": "admin@bayanhealth.ae", "Sector": "Healthcare",
                 "Compliance Status": "Completed", "Last Outreach": "2026-07-01", "Assigned Officer": "S. Hameed", "Next Action": "—"},
            ],
        }
    return dict(_DEFAULT_VIEW)


def records_save(sess, app_id, view, columns, rows):
    data = _records_all()
    data[app_id] = {"view": view or "Records", "columns": columns or [], "rows": (rows or [])[:500]}
    with open(RECORDS_FILE, "w") as f:
        json.dump(data, f)
    return {"ok": True}


# ---------------- Automations (manage the bundled engine WITHOUT ever showing it) ----------------
N8N_BASE = os.environ.get("N8N_BASE_URL", "http://localhost/automations")
N8N_BID = "wakeel-svc-browser"
N8N_EMAIL = os.environ.get("N8N_EMAIL", "admin@wakeel.local")
N8N_PW = os.environ.get("N8N_PW", "Wakeel12345")
_N8N = {}


def _n8n_login():
    body = json.dumps({"emailOrLdapLoginId": N8N_EMAIL, "password": N8N_PW}).encode()
    req = urllib.request.Request(N8N_BASE + "/rest/login", data=body,
                                 headers={"Content-Type": "application/json", "browser-id": N8N_BID}, method="POST")
    r = urllib.request.urlopen(req, timeout=20)
    for c in (r.headers.get_all("Set-Cookie") or []):
        if c.startswith("n8n-auth="):
            return c.split(";")[0].split("=", 1)[1]
    raise RuntimeError("automation engine login failed")


def n8n_api(method, path, body=None):
    if not _N8N.get("cookie"):
        _N8N["cookie"] = _n8n_login()

    def call():
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(N8N_BASE + path, data=data, method=method,
                                     headers={"Content-Type": "application/json", "browser-id": N8N_BID,
                                              "Cookie": "n8n-auth=" + _N8N["cookie"]})
        raw = urllib.request.urlopen(req, timeout=30).read()
        return json.loads(raw or "{}")
    try:
        return call()
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            _N8N["cookie"] = _n8n_login()
            return call()
        raise


# step type -> (n8n node type, typeVersion, params, friendly label, kind)
STEP_MAP = {
    "trigger_schedule": ("n8n-nodes-base.scheduleTrigger", 1.2, {"rule": {"interval": [{"field": "days", "triggerAtHour": 8}]}}, "Every day 08:00", "trigger"),
    "trigger_webhook": ("n8n-nodes-base.webhook", 2, {"path": "wakeel", "httpMethod": "POST"}, "On incoming request", "trigger"),
    "read_excel": ("n8n-nodes-base.microsoftExcel", 2.1, {"resource": "worksheet", "operation": "getAll"}, "Read Excel (SharePoint)", "tool"),
    "call_agent": ("n8n-nodes-base.httpRequest", 4.2, {"method": "POST", "url": "http://localhost/v1/workflows/run"}, "Ask a Wakeel agent", "agent"),
    "send_outlook": ("n8n-nodes-base.microsoftOutlook", 2, {"resource": "message", "operation": "send"}, "Send email (Outlook)", "tool"),
    "update_excel": ("n8n-nodes-base.microsoftExcel", 2.1, {"resource": "worksheet", "operation": "update"}, "Update Excel", "tool"),
    "condition": ("n8n-nodes-base.if", 2, {}, "Condition / branch", "cond"),
    "notify": ("n8n-nodes-base.set", 3.4, {}, "Compile summary", "end"),
}
_TYPE_KIND = {"scheduleTrigger": ("Schedule", "trigger"), "webhook": ("Webhook", "trigger"),
              "microsoftExcel": ("Excel", "tool"), "microsoftOutlook": ("Outlook", "tool"),
              "httpRequest": ("Call agent", "agent"), "if": ("Condition", "cond"), "set": ("Notify", "end")}


def _clean_wf(w):
    nodes = w.get("nodes", [])
    steps = []
    trig = "Manual"
    for n in nodes:
        base = (n.get("type") or "").split(".")[-1]
        label, kind = _TYPE_KIND.get(base, (base, "tool"))
        if kind == "trigger":
            trig = n.get("name") or label
        steps.append({"title": n.get("name") or label, "kind": kind})
    return {"id": w.get("id"), "name": w.get("name"), "active": bool(w.get("active")),
            "trigger": trig, "steps": steps}


def automations_list(sess):
    r = n8n_api("GET", "/rest/workflows")
    data = r.get("data", r)
    items = data if isinstance(data, list) else []
    out = []
    for w in items:
        full = w
        if not w.get("nodes"):  # the list view omits node detail — fetch the workflow
            try:
                full = n8n_api("GET", "/rest/workflows/" + str(w.get("id"))).get("data", w)
            except Exception:
                full = w
        if full.get("name") == "My workflow":
            continue  # skip n8n's default starter workflow
        out.append(_clean_wf(full))
    return {"automations": out}


def _assemble_n8n(name, steps):
    nodes, conns, prev = [], {}, None
    for i, s in enumerate(steps):
        m = STEP_MAP.get(s.get("type"))
        if not m:
            continue
        ntype, ver, params, label, kind = m
        nm = (s.get("title") or label)[:60]
        if any(x["name"] == nm for x in nodes):
            nm = f"{nm} {i}"
        nodes.append({"parameters": dict(params), "id": f"n{i}", "name": nm, "type": ntype,
                      "typeVersion": ver, "position": [260 + i * 240, 300]})
        if prev is not None:
            conns.setdefault(prev, {"main": [[]]})["main"][0].append({"node": nm, "type": "main", "index": 0})
        prev = nm
    return {"name": name[:80] or "Automation", "nodes": nodes, "connections": conns,
            "settings": {"executionOrder": "v1"}}


def automation_build(sess, description):
    sys_p = ("You design a simple automation for a UAE government workflow. Use ONLY these step types:\n"
             "trigger_schedule (runs on a daily timer), trigger_webhook (starts from an incoming request),\n"
             "read_excel (read rows from SharePoint Excel), call_agent (ask a Wakeel AI agent to decide/draft),\n"
             "send_outlook (send an email via Outlook), update_excel (write back to Excel),\n"
             "condition (branch on a value), notify (compile a summary).\n"
             "Return ONLY JSON: {\"name\":\"<short automation name>\",\"steps\":[{\"type\":\"...\",\"title\":\"<short label>\"}]}\n"
             "3-8 steps, in order, starting with a trigger. Keep titles short and concrete.")
    out = _openai_chat([{"role": "system", "content": sys_p}, {"role": "user", "content": description[:2000]}])
    d = _extract_json(out)
    steps = d.get("steps") or []
    wf = _assemble_n8n(d.get("name") or "Automation", steps)
    if not wf["nodes"]:
        raise RuntimeError("could not design that automation")
    res = n8n_api("POST", "/rest/workflows", wf)
    created = res.get("data", res)
    log_act(sess, "automation", "built · " + (d.get("name") or "")[:50])
    return _clean_wf(created)


def automation_delete(sess, wid):
    n8n_api("DELETE", "/rest/workflows/" + wid)
    return {"ok": True}


def automation_toggle(sess, wid, active):
    n8n_api("PATCH", "/rest/workflows/" + wid, {"active": bool(active)})
    return {"ok": True}


def automation_run(sess, wid):
    """Trigger an automation on demand. Reports a friendly message when a
    connector hasn't been authorized yet (the common case in a fresh workspace)."""
    full = n8n_api("GET", "/rest/workflows/" + wid).get("data", {})
    nodes = full.get("nodes", [])
    trig = next((n for n in nodes if "trigger" in (n.get("type", "")).lower()), (nodes[0] if nodes else None))
    body = {"workflowData": full}
    if trig:
        body["triggerToStartFrom"] = {"name": trig.get("name")}
    try:
        res = n8n_api("POST", "/rest/workflows/" + wid + "/run", body)
        eid = (res.get("data") or {}).get("executionId") or res.get("executionId")
        log_act(sess, "run", "automation · " + (full.get("name") or "")[:40])
        return {"ok": True, "executionId": eid}
    except urllib.error.HTTPError as e:
        msg = ""
        try:
            msg = json.loads(e.read().decode()).get("message", "")
        except Exception:
            pass
        low = msg.lower()
        if any(k in low for k in ("required", "credential", "not been set", "authorize", "no credentials")):
            return {"ok": False, "needs_connector": True,
                    "message": "Connect this automation's apps first (Integrations → Microsoft 365), then run it."}
        return {"ok": False, "message": (msg[:300] or "run failed")}
    except Exception as e:
        return {"ok": False, "message": str(e)[:300]}


# ---------------- Multi-Agent Collaboration (Agent Teams) ----------------
TEAMS_FILE = os.path.join(HERE, "teams.json")


def _teams_all():
    try:
        with open(TEAMS_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def teams_list(sess):
    return {"teams": [t for t in _teams_all().values() if t.get("email") == sess["email"]]}


def team_save(sess, team):
    data = _teams_all()
    tid = team.get("id") or ("tm-" + secrets.token_hex(6))
    data[tid] = {"id": tid, "email": sess["email"], "name": (team.get("name") or "Team")[:60],
                 "goal": (team.get("goal") or "")[:400], "members": (team.get("members") or [])[:8]}
    with open(TEAMS_FILE, "w") as f:
        json.dump(data, f)
    log_act(sess, "team", "saved · " + data[tid]["name"])
    return data[tid]


def team_delete(sess, tid):
    data = _teams_all()
    data.pop(tid, None)
    with open(TEAMS_FILE, "w") as f:
        json.dump(data, f)
    return {"ok": True}


def team_run(sess, tid, inp):
    """Supervisor orchestrates specialist agents: route -> run each -> synthesize."""
    team = _teams_all().get(tid)
    if not team:
        raise RuntimeError("team not found")
    apps = {a["id"]: a["name"] for a in dify(sess, "GET", "/apps?page=1&limit=100").get("data", [])}
    members = [{"i": i, "id": m, "name": apps.get(m, "Agent")}
               for i, m in enumerate(team.get("members", [])) if m in apps]
    if not members:
        raise RuntimeError("this team has no valid member agents")
    roster = "\n".join(f'{m["i"]}. {m["name"]}' for m in members)
    route_raw = _openai_chat([
        {"role": "system", "content":
         "You are the SUPERVISOR of a team of specialist UAE government AI agents. Given the task, decide "
         "which agents to involve and the specific sub-task to give each. Use ONLY the listed agents. "
         'Return ONLY JSON: {"plan":"<1-2 sentence plan>","calls":[{"member":<index>,"input":"<sub-task>"}]}. '
         "Use 1-4 calls."},
        {"role": "user", "content": f"TASK:\n{inp}\n\nAVAILABLE AGENTS:\n{roster}"}])
    route = _extract_json(route_raw)
    steps = []
    for c in (route.get("calls") or [])[:4]:
        m = next((x for x in members if x["i"] == c.get("member")), None)
        if not m:
            continue
        sub = c.get("input") or inp
        try:
            r = run_agent(sess, m["id"], sub)
            steps.append({"agent": m["name"], "input": sub, "output": r["output"], "status": r["status"]})
        except Exception as e:
            steps.append({"agent": m["name"], "input": sub, "output": "⚠️ " + str(e)[:200], "status": "failed"})
    combined = "\n\n".join(f'[{s["agent"]}]\n{s["output"]}' for s in steps) or "(no agent output)"
    final = _openai_chat([
        {"role": "system", "content":
         "You are the supervisor. Combine the specialist agents' outputs into ONE clear, professional final "
         "answer for a UAE government officer. Be concise. Flag anything that needs a human decision."},
        {"role": "user", "content": f"TASK:\n{inp}\n\nSPECIALIST OUTPUTS:\n{combined}"}])
    save_task({"id": secrets.token_hex(8), "email": sess["email"], "app_id": tid,
               "app_name": team["name"] + " · team", "input": inp[:400], "status": "succeeded",
               "output": final[:4000],
               "nodes": [{"title": "Supervisor · plan & route", "status": "succeeded"}]
               + [{"title": s["agent"], "status": s["status"]} for s in steps]
               + [{"title": "Supervisor · synthesize", "status": "succeeded"}],
               "started": int(time.time()), "ended": int(time.time()), "source": "team"})
    log_act(sess, "run", "team · " + team["name"][:40])
    return {"plan": route.get("plan", ""), "steps": steps, "final": final}


EVAL_FILE = os.path.join(HERE, "evaluations.json")


def _eval_all():
    try:
        with open(EVAL_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def eval_get(sess, app_id):
    """Persisted test dataset + last results for an agent (Beam 'Test Datasets' / 'Evaluation Framework')."""
    return {"cases": _eval_all().get(app_id, [])}


def eval_save(sess, app_id, cases):
    data = _eval_all()
    data[app_id] = (cases or [])[:50]
    with open(EVAL_FILE, "w") as f:
        json.dump(data, f)
    return {"ok": True}


# ---------------- Beam-compatible public API (x-api-key) ----------------
BEAMKEYS_FILE = os.path.join(HERE, "beamkeys.json")
_SVC = {}


def _svc_session():
    """A headless Dify session for the Beam API — uses a service account from env
    (WAKEEL_SVC_EMAIL / WAKEEL_SVC_PW). Never stores per-user passwords."""
    email = os.environ.get("WAKEEL_SVC_EMAIL")
    pw = os.environ.get("WAKEEL_SVC_PW")
    if not email or not pw:
        raise RuntimeError("service account not configured (set WAKEEL_SVC_EMAIL / WAKEEL_SVC_PW)")
    s = _SVC.get("sess")
    if s and s.get("email") == email:
        return s
    token = new_session(email, pw)
    _SVC["sess"] = SESSIONS[token]
    return _SVC["sess"]


def beam_keys():
    try:
        with open(BEAMKEYS_FILE) as f:
            return json.load(f)
    except Exception:
        return {"keys": []}


def beam_key_new(sess, label):
    data = beam_keys()
    key = "wk-" + secrets.token_hex(20)
    data["keys"].append({"key": key, "label": (label or "API key")[:60], "created": int(time.time()),
                         "email": sess["email"]})
    with open(BEAMKEYS_FILE, "w") as f:
        json.dump(data, f)
    log_act(sess, "apikey", "platform key issued")
    return {"key": key, "label": label}


def beam_keys_list(sess):
    ks = beam_keys().get("keys", [])
    return {"keys": [{"label": k.get("label"), "created": k.get("created"),
                      "preview": (k.get("key", "")[:7] + "…" + k.get("key", "")[-4:])} for k in ks]}


def beam_key_ok(key):
    return bool(key) and any(k.get("key") == key for k in beam_keys().get("keys", []))


def beam_task_shape(t):
    return {"id": t.get("id"), "agentId": t.get("app_id"), "agentName": t.get("app_name"),
            "status": t.get("status"), "input": t.get("input"), "output": t.get("output"),
            "steps": t.get("nodes", []), "createdAt": t.get("started"), "completedAt": t.get("ended")}


def beam_create_task(sess, agent_id, inp):
    tid = secrets.token_hex(8)
    started = int(time.time())
    r = run_agent(sess, agent_id, inp)
    task = {"id": tid, "email": sess["email"], "app_id": agent_id, "app_name": r.get("name"),
            "input": inp, "status": r["status"], "output": r["output"], "nodes": r["nodes"],
            "started": started, "ended": int(time.time()), "source": "api"}
    save_task(task)
    log_act(sess, "run", "api · " + (inp or "")[:50])
    return beam_task_shape(task)


# ---------------- HTTP ----------------

class H(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="application/json", extra=None, cookies=None):
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode()
        elif isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        for ck in (cookies or []):
            self.send_header("Set-Cookie", ck)
        self.end_headers()
        self.wfile.write(body)

    def _file(self, name, ctype):
        try:
            with open(os.path.join(HERE, "static", name), "rb") as f:
                self._send(200, f.read(), ctype)
        except FileNotFoundError:
            self._send(404, {"error": "not found"})

    def _nocache(self, name, ctype):
        """Serve a static asset that must never be stale (app.js / style.css)."""
        try:
            with open(os.path.join(HERE, "static", name), "rb") as f:
                self._send(200, f.read(), ctype,
                           extra={"Cache-Control": "no-cache, must-revalidate"})
        except FileNotFoundError:
            self._send(404, {"error": "not found"})

    def _asset_version(self):
        v = 0
        for n in ("app.js", "style.css"):
            try:
                v = max(v, int(os.path.getmtime(os.path.join(HERE, "static", n))))
            except OSError:
                pass
        return v

    def _index(self):
        """Serve index.html with a cache-busting version stamped onto app.js / style.css
        so browsers always pick up the latest build."""
        try:
            with open(os.path.join(HERE, "static", "index.html"), encoding="utf-8") as f:
                html = f.read()
        except FileNotFoundError:
            return self._send(404, {"error": "not found"})
        v = self._asset_version()
        html = html.replace('href="style.css"', f'href="style.css?v={v}"')
        html = html.replace('<script src="app.js"></script>',
                            f'<script>window.__WV="{v}"</script>\n<script src="app.js?v={v}"></script>')
        # public mode: hand anonymous visitors the shared demo session so the app
        # opens with no sign-in screen.
        cookies = None
        if public_enabled() and self._sess() is None:
            tok, sess = public_session()
            if tok and sess:
                cookies = [f"wakeel_t={tok}; Path=/; Max-Age=86400; SameSite=Lax"] + dify_browser_cookies(sess)
        self._send(200, html.encode(), "text/html; charset=utf-8",
                   extra={"Cache-Control": "no-cache, must-revalidate"}, cookies=cookies)

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or b"{}") if n else {}

    def _sess(self):
        ck = self.headers.get("Cookie", "")
        for part in ck.split(";"):
            part = part.strip()
            if part.startswith("wakeel_t="):
                return SESSIONS.get(part.split("=", 1)[1])
        return None

    def _stream_run(self, sess, b):
        """Live-execute an agent and stream Dify's node events to the browser (SSE)."""
        app_id = b.get("app_id", "")
        inp = b.get("input", "")
        try:
            info = app_info(sess, app_id)
        except Exception as e:
            return self._send(500, {"error": str(e)})
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "close")
        self.end_headers()

        def emit(obj):
            try:
                self.wfile.write(b"data: " + json.dumps(obj).encode() + b"\n\n")
                self.wfile.flush()
            except Exception:
                pass

        headers = {"Content-Type": "application/json"}
        csrf = _csrf(sess)
        if csrf:
            headers["X-CSRF-Token"] = csrf
        task = {"id": secrets.token_hex(8), "email": sess["email"], "app_id": app_id,
                "app_name": info.get("name"), "input": inp[:400], "started": int(time.time()),
                "nodes": [], "output": "", "status": "running"}
        answer = ""
        try:
            if info.get("mode") == "workflow":
                inputs = {}
                for i, v in enumerate(info.get("vars", [])):
                    inputs[v["name"]] = inp if i == 0 else ""
                data = json.dumps({"inputs": inputs, "response_mode": "streaming"}).encode()
                path = DIFY + f"/apps/{app_id}/workflows/draft/run"
            elif info.get("mode") == "advanced-chat":
                inputs = {}
                for i, v in enumerate(info.get("vars", [])):
                    inputs[v["name"]] = inp if i == 0 else ""
                data = json.dumps({"inputs": inputs, "query": inp, "response_mode": "streaming",
                                   "conversation_id": "", "files": []}).encode()
                path = DIFY + f"/apps/{app_id}/advanced-chat/workflows/draft/run"
            else:
                data = json.dumps({"inputs": {}, "query": inp, "response_mode": "streaming",
                                   "conversation_id": "",
                                   "model_config": {"model": get_model(), "pre_prompt": "",
                                                    "user_input_form": [], "agent_mode": {"enabled": False, "tools": []}}}).encode()
                path = DIFY + f"/apps/{app_id}/chat-messages"
            req = urllib.request.Request(path, data=data, headers=headers, method="POST")
            resp = sess["opener"].open(req, timeout=300)
            for raw in resp:
                line = raw.decode("utf-8", "replace").strip()
                if not line.startswith("data:"):
                    continue
                try:
                    ev = json.loads(line[5:].strip())
                except ValueError:
                    continue
                emit(ev)
                e, d = ev.get("event"), ev.get("data", {}) or {}
                if e == "node_finished":
                    task["nodes"].append({"title": d.get("title"), "status": d.get("status"),
                                          "ms": int((d.get("elapsed_time") or 0) * 1000)})
                elif e in ("message", "agent_message"):
                    answer += ev.get("answer", "")
                elif e == "workflow_finished":
                    outs = d.get("outputs") or {}
                    answer = "\n".join(str(v) for v in outs.values()) if isinstance(outs, dict) else str(outs)
                    task["status"] = d.get("status", "succeeded")
            if task["status"] == "running":
                task["status"] = "succeeded"
            task["output"] = answer[:4000]
            emit({"event": "__done__", "task_id": task["id"]})
            log_act(sess, "run", inp[:60])
        except Exception as e:
            task["status"] = "failed"
            task["output"] = str(e)[:400]
            emit({"event": "error", "message": str(e)})
        task["ended"] = int(time.time())
        save_task(task)

    def _beam(self):
        """Beam-compatible public API (base /beam, auth: x-api-key header)."""
        key = self.headers.get("x-api-key") or self.headers.get("X-Api-Key")
        if not beam_key_ok(key):
            return self._send(401, {"error": {"code": 401, "message": "invalid or missing x-api-key"}})
        try:
            sess = _svc_session()
        except Exception as e:
            return self._send(503, {"error": {"code": 503, "message": str(e)}})
        p = self.path.split("?")[0]
        parts = [x for x in p.split("/") if x]  # ['beam', 'agent-tasks', '{id}', 'approve']
        method = self.command
        try:
            if method == "GET" and p == "/beam/users/current":
                return self._send(200, {"email": sess["email"], "workspace": "wakeel"})
            if method == "GET" and p == "/beam/agents":
                res = dify(sess, "GET", "/apps?page=1&limit=50")
                return self._send(200, {"data": [{"id": a["id"], "name": a["name"], "mode": a["mode"]}
                                                 for a in res.get("data", [])]})
            if method == "GET" and len(parts) == 3 and parts[1] in ("agents", "agent-graphs"):
                return self._send(200, app_info(sess, parts[2]))
            if len(parts) >= 2 and parts[1] == "agent-tasks":
                if method == "POST" and len(parts) == 2:
                    b = self._body()
                    aid = b.get("agentId") or b.get("agent_id")
                    if not aid:
                        return self._send(400, {"error": {"code": 400, "message": "agentId is required"}})
                    return self._send(201, beam_create_task(sess, aid, b.get("input", "")))
                if method == "GET" and len(parts) == 3 and parts[2] == "analytics":
                    return self._send(200, analytics(sess, 30))
                if method == "GET" and len(parts) == 2:
                    items = _read_tasks(sess); items.reverse()
                    return self._send(200, {"data": [beam_task_shape(t) for t in items[:100]]})
                if method == "GET" and len(parts) == 3:
                    t = task_get(sess, parts[2])
                    if t.get("error"):
                        return self._send(404, {"error": {"code": 404, "message": "task not found"}})
                    return self._send(200, beam_task_shape(t))
                if method == "POST" and len(parts) == 4:
                    tid, action = parts[2], parts[3]
                    if action in ("approve", "reject"):
                        decide(sess, tid, "approved" if action == "approve" else "rejected", "")
                        return self._send(200, {"id": tid, "status": action + ("d" if action == "approve" else "ed")})
                    if action == "rate":
                        b = self._body(); rate_output(sess, tid, b.get("rating", "up"))
                        return self._send(200, {"id": tid, "rating": b.get("rating", "up")})
                    if action == "retry":
                        t = task_get(sess, tid)
                        if t.get("error"):
                            return self._send(404, {"error": {"code": 404, "message": "task not found"}})
                        return self._send(201, beam_create_task(sess, t.get("app_id"), t.get("input", "")))
            return self._send(404, {"error": {"code": 404, "message": "unknown endpoint"}})
        except Exception as e:
            return self._send(500, {"error": {"code": 500, "message": str(e)[:300]}})

    def do_GET(self):
        p = self.path.split("?")[0]
        if p.startswith("/beam/"):
            return self._beam()
        if p in ("/", "/index.html"):
            return self._index()
        if p == "/app.js":
            return self._nocache("app.js", "application/javascript")
        if p == "/style.css":
            return self._nocache("style.css", "text/css")
        if p == "/voicelab.css":
            return self._nocache("voicelab.css", "text/css")
        if p == "/tour.html":
            return self._file("tour.html", "text/html; charset=utf-8")
        if p == "/wakeel-mark.svg":
            return self._file("wakeel-mark.svg", "image/svg+xml")
        if p == "/api/health":
            return self._send(200, {"ok": True, "sessions": len(SESSIONS), "asset_v": self._asset_version()})
        if p == "/api/realtime":
            return self._send(200, realtime_config())
        if p == "/api/oauth/google/callback":
            # top-level redirect back from Google — no session guard (uses signed state)
            q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
            q = {k: urllib.parse.unquote(v) for k, v in q.items()}
            return self._send(200, google_oauth_callback(q), "text/html; charset=utf-8")
        sess = self._sess()
        if p.startswith("/api/") and not sess:
            return self._send(401, {"error": "login required"})
        if p == "/api/sso":
            # refresh the browser's Dify console cookies from the server-side session
            return self._send(200, {"ok": True}, cookies=dify_browser_cookies(sess))
        try:
            if p == "/api/me":
                return self._send(200, {"email": sess["email"]})
            if p == "/api/apps":
                res = dify(sess, "GET", "/apps?page=1&limit=50")
                apps = [{"id": a["id"], "name": a["name"], "mode": a["mode"], "icon": a.get("icon"),
                         "created_at": a.get("created_at"), "url": f"/app/{a['id']}/workflow"}
                        for a in res.get("data", [])]
                return self._send(200, {"apps": apps})
            if p == "/api/app-info":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, app_info(sess, q.get("id", "")))
            if p == "/api/export":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                res = dify(sess, "GET", f"/apps/{q.get('id','')}/export?include_secret=false")
                return self._send(200, res)
            if p == "/api/knowledge":
                return self._send(200, knowledge_list(sess))
            if p == "/api/activity":
                return self._send(200, activity(sess))
            if p == "/api/audit":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, audit(sess, category=urllib.parse.unquote(q.get("category", "all"))))
            if p == "/api/audit-export":
                csv = audit_csv(sess)
                return self._send(200, csv, ctype="text/csv; charset=utf-8",
                                  extra={"Content-Disposition": "attachment; filename=wakeel-audit-log.csv"})
            if p == "/api/security":
                return self._send(200, security_get(sess))
            if p == "/api/services":
                return self._send(200, services_connected(sess))
            if p == "/api/oauth/google/start":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, google_oauth_start(sess, urllib.parse.unquote(q.get("service", ""))))
            if p == "/api/google/verify":
                return self._send(200, google_verify(sess))
            if p == "/api/sop":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, sop_get(sess, urllib.parse.unquote(q.get("key", ""))))
            if p == "/api/tasks":
                return self._send(200, tasks_list(sess))
            if p == "/api/task":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, task_get(sess, q.get("id", "")))
            if p == "/api/inbox":
                return self._send(200, inbox_list(sess))
            if p == "/api/analytics":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, analytics(sess, int(q.get("range", "30") or 30)))
            if p == "/api/automation":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, automation_get(sess, q.get("id", "")))
            if p == "/api/eval":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, eval_get(sess, q.get("id", "")))
            if p == "/api/records":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, records_get(sess, q.get("id", "")))
            if p == "/api/automations":
                try:
                    return self._send(200, automations_list(sess))
                except Exception as e:
                    return self._send(200, {"automations": [], "error": str(e)[:200]})
            if p == "/api/teams":
                return self._send(200, teams_list(sess))
            if p == "/api/beam-keys":
                return self._send(200, beam_keys_list(sess))
            if p == "/api/governance":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                return self._send(200, governance(sess, q.get("id", ""), q.get("force") == "1"))
            if p == "/api/providers":
                return self._send(200, providers_list(sess))
            if p == "/api/models":
                return self._send(200, models_list(sess))
            if p == "/api/tools":
                return self._send(200, tools_list(sess))
            if p == "/api/tool-schema":
                q = dict(x.split("=", 1) for x in (self.path.split("?", 1) + [""])[1].split("&") if "=" in x)
                import urllib.parse as _up
                return self._send(200, tool_schema(sess, _up.unquote(q.get("provider", ""))))
            if p == "/api/settings":
                return self._send(200, settings_get())
        except Exception as e:
            return self._send(500, {"error": str(e)})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        p = self.path.split("?")[0]
        if p.startswith("/beam/"):
            return self._beam()
        if p == "/api/realtime":
            # raw SDP offer -> OpenAI Realtime answer SDP (not JSON)
            if not self._sess():
                return self._send(401, {"error": "login required"})
            try:
                n = int(self.headers.get("Content-Length", 0))
                offer = self.rfile.read(n).decode("utf-8", "ignore")
                return self._send(200, realtime_sdp(offer).encode("utf-8"), "application/sdp")
            except Exception as e:
                return self._send(500, {"error": str(e)})
        try:
            b = self._body()
            if p == "/api/login":
                try:
                    token = new_session(b.get("email", ""), b.get("password", ""))
                except Exception:
                    return self._send(401, {"error": "invalid credentials"})
                sess = SESSIONS[token]
                log_act(sess, "login")
                return self._send(200, {"token": token},
                                  cookies=[f"wakeel_t={token}; Path=/; Max-Age=86400; SameSite=Lax"]
                                          + dify_browser_cookies(sess))
            if p == "/api/magic-request":
                return self._send(200, magic_request(b.get("email", "")))
            if p == "/api/magic-consume":
                try:
                    msess, mtok = magic_consume(b.get("token", ""))
                except Exception as e:
                    return self._send(401, {"error": str(e)})
                log_act(msess, "login")
                return self._send(200, {"token": mtok},
                                  cookies=[f"wakeel_t={mtok}; Path=/; Max-Age=86400; SameSite=Lax"]
                                          + dify_browser_cookies(msess))
            sess = self._sess()
            if not sess:
                return self._send(401, {"error": "login required"})
            if p == "/api/run":
                return self._stream_run(sess, b)
            if p == "/api/logout":
                ck = self.headers.get("Cookie", "")
                for part in ck.split(";"):
                    part = part.strip()
                    if part.startswith("wakeel_t="):
                        SESSIONS.pop(part.split("=", 1)[1], None)
                gone = "; Path=/; Max-Age=0; SameSite=Lax"
                return self._send(200, {"ok": True}, cookies=[
                    "wakeel_t=" + gone, "access_token=" + gone,
                    "refresh_token=" + gone, "csrf_token=" + gone])
            if p == "/api/design":
                d = design(sess, b.get("instruction", ""), b.get("prior"), b.get("changes", ""), b.get("lang", "en"))
                log_act(sess, "design", d.get("name", ""))
                return self._send(200, d)
            if p == "/api/generate":
                instruction = b.get("instruction", "")
                if b.get("design"):
                    instruction = design_to_instruction(b["design"])
                return self._send(200, generate(sess, b.get("mode", "workflow"), instruction,
                                                b.get("current_graph")))
            if p == "/api/deploy":
                r = deploy(sess, b.get("mode", "workflow"), b.get("name", "Untitled"),
                           b.get("graph", {}), b.get("icon", "🏛️"))
                log_act(sess, "build", b.get("name", ""))
                return self._send(200, r)
            if p == "/api/relayout":
                return self._send(200, relayout_agent(sess, b.get("app_id", "")))
            if p == "/api/install":
                g = generate(sess, b.get("mode", "workflow"), b.get("instruction", ""))
                if not g["graph"].get("nodes"):
                    return self._send(500, {"error": g.get("error") or "generation failed"})
                d = deploy(sess, b.get("mode", "workflow"), b.get("name", "Untitled"), g["graph"],
                           b.get("icon", "🏛️"))
                d["nodes"] = g["nodes"]
                log_act(sess, "install", b.get("name", ""))
                return self._send(200, d)
            if p == "/api/test-case":
                r = test_case(sess, b.get("app_id", ""), b.get("input", ""), b.get("expected", ""))
                log_act(sess, "test", ("PASS" if r.get("pass") else "FAIL") + " · " + b.get("input", "")[:60])
                return self._send(200, r)
            if p == "/api/gen-tests":
                r = gen_tests(sess, b.get("app_id", ""), b.get("count", 6))
                log_act(sess, "gen_tests", f"{len(r.get('cases', []))} cases")
                return self._send(200, r)
            if p == "/api/selfheal":
                r = selfheal(sess, b.get("app_id", ""), b.get("failures", []), b.get("feedback", ""))
                log_act(sess, "heal", f"{len(b.get('failures', []))} failing case(s)")
                return self._send(200, r)
            if p == "/api/publish":
                dify(sess, "POST", f"/apps/{b.get('app_id','')}/workflows/publish", {})
                log_act(sess, "publish")
                return self._send(200, {"ok": True})
            if p == "/api/save-draft":
                r = save_draft(sess, b.get("app_id", ""), b.get("graph", {}))
                log_act(sess, "edit", "edited flow")
                return self._send(200, r)
            if p == "/api/decide":
                return self._send(200, decide(sess, b.get("task_id", ""), b.get("decision", ""), b.get("note", "")))
            if p == "/api/automation":
                return self._send(200, automation_set(sess, b.get("app_id", ""), b.get("agent_mode", "copilot"), b.get("nodes", {})))
            if p == "/api/rate":
                return self._send(200, rate_output(sess, b.get("task_id", ""), b.get("rating", "up")))
            if p == "/api/eval-save":
                return self._send(200, eval_save(sess, b.get("app_id", ""), b.get("cases", [])))
            if p == "/api/automation-build":
                return self._send(200, automation_build(sess, b.get("description", "")))
            if p == "/api/automation-delete":
                return self._send(200, automation_delete(sess, b.get("id", "")))
            if p == "/api/automation-toggle":
                return self._send(200, automation_toggle(sess, b.get("id", ""), b.get("active", False)))
            if p == "/api/automation-run":
                return self._send(200, automation_run(sess, b.get("id", "")))
            if p == "/api/team-save":
                return self._send(200, team_save(sess, b.get("team", {})))
            if p == "/api/team-delete":
                return self._send(200, team_delete(sess, b.get("id", "")))
            if p == "/api/team-run":
                return self._send(200, team_run(sess, b.get("id", ""), b.get("input", "")))
            if p == "/api/service-connect":
                return self._send(200, service_connect(sess, b.get("service", ""), b.get("connect", True)))
            if p == "/api/sop-save":
                return self._send(200, sop_save(sess, b.get("key", ""), b.get("name", ""), b.get("text", "")))
            if p == "/api/sheets-read":
                return self._send(200, sheets_read(sess, b.get("url", "")))
            if p == "/api/run-live-plan":
                return self._send(200, run_live_plan(sess, b.get("url", ""), b.get("sop", "")))
            if p == "/api/gmail-check-replies":
                return self._send(200, gmail_check_replies(sess, b.get("url", ""), b.get("sop", "")))
            if p == "/api/agent-overview":
                return self._send(200, agent_overview(sess, b.get("app_id", ""), b.get("url", "")))
            if p == "/api/gmail-send":
                return self._send(200, gmail_send(sess, b.get("to", ""), b.get("subject", ""), b.get("body", "")))
            if p == "/api/sheet-update":
                return self._send(200, sheet_update(sess, b.get("url", ""), b.get("row", 0), b.get("updates", {})))
            if p == "/api/oauth/config":
                return self._send(200, oauth_config_set(b.get("client_id", ""), b.get("client_secret", "")))
            if p == "/api/security-role":
                return self._send(200, security_set_role(sess, b.get("email", ""), b.get("role", "")))
            if p == "/api/security-sso":
                return self._send(200, sso_save(sess, b.get("sso", {})))
            if p == "/api/security-policy":
                return self._send(200, policy_save(sess, b.get("policy", {})))
            if p == "/api/beam-key":
                return self._send(200, beam_key_new(sess, b.get("label", "")))
            if p == "/api/records-save":
                return self._send(200, records_save(sess, b.get("app_id", ""), b.get("view", ""), b.get("columns", []), b.get("rows", [])))
            if p == "/api/test-tool":
                return self._send(200, test_tool(sess, b.get("prompt", ""), b.get("input", ""), b.get("model", "")))
            if p == "/api/apikey":
                r = dify(sess, "POST", f"/apps/{b.get('app_id','')}/api-keys", {})
                return self._send(200, {"token": r.get("token", "")})
            if p == "/api/provider/credentials":
                r = provider_credentials(sess, b.get("provider", ""), b.get("credentials", {}))
                log_act(sess, "provider", b.get("provider", "").split("/")[-1])
                return self._send(200, r)
            if p == "/api/provider/install":
                return self._send(200, provider_install(sess, b.get("name", "")))
            if p == "/api/tool-connect":
                return self._send(200, tool_connect(sess, b.get("provider", ""), b.get("credentials", {}), b.get("name", ""), b.get("type", "oauth2")))
            if p == "/api/settings":
                return self._send(200, settings_set(b.get("provider", ""), b.get("model", "")))
            if p == "/api/chat":
                r = chat(sess, b.get("message", ""), b.get("history", []), b.get("system", ""))
                log_act(sess, "chat", b.get("message", "")[:60])
                return self._send(200, r)
            if p == "/api/tts":
                try:
                    audio = tts(b.get("text", ""), b.get("voice", "nova"))
                    return self._send(200, audio, "audio/mpeg")
                except Exception as e:
                    return self._send(500, {"error": str(e)[:160]})
            if p == "/api/talk":
                return self._send(200, talk(sess, b.get("text", ""), b.get("state"), b.get("lang", "en")))
            if p == "/api/talk-build":
                return self._send(200, talk_build(sess, b.get("brief", ""), b.get("lang", "en")))
            if p == "/api/knowledge":
                r = knowledge_add(sess, b.get("name", ""), b.get("text", ""))
                log_act(sess, "data", b.get("name", ""))
                return self._send(200, r)
            return self._send(404, {"error": "not found"})
        except Exception as e:
            return self._send(500, {"error": str(e)})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8800"))
    print(f"Wakeel platform running on http://localhost:{port} (behind nginx at /wakeel/)")
    ThreadingHTTPServer(("0.0.0.0", port), H).serve_forever()
