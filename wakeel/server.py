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
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DIFY = os.environ.get("DIFY_BASE", "http://localhost/console/api")
DEFAULT_MODEL = {"provider": "langgenius/openai/openai", "name": "gpt-5.1", "mode": "chat", "completion_params": {}}
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


def dify_browser_cookies(sess):
    """Set-Cookie header values that hand the Dify console session to the browser,
    so the embedded Studio (same host) is already signed in."""
    out = []
    for c in sess["jar"]:
        if c.name in ("access_token", "refresh_token", "csrf_token"):
            http_only = "; HttpOnly" if c.name != "csrf_token" else ""
            out.append(f"{c.name}={c.value}; Path=/; Max-Age=86400; SameSite=Lax{http_only}")
    return out


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

def generate(sess, mode, instruction, current_graph=None):
    gen_mode = "advanced-chat" if mode == "agent" else "workflow"
    payload = {"mode": gen_mode, "instruction": instruction, "model_config": get_model()}
    if current_graph:
        payload["current_graph"] = current_graph
    res = dify(sess, "POST", "/workflow-generate", payload)
    graph = res.get("graph") or {}
    nodes = [{"type": (n.get("data") or {}).get("type"), "title": (n.get("data") or {}).get("title")}
             for n in graph.get("nodes", [])]
    return {"graph": graph, "message": res.get("message", ""), "nodes": nodes, "error": res.get("error") or ""}


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
        '  "flow": [ {"id":"n1","title":"Read Excel Registry","kind":"entry|llm|cond|tool|end",'
        '"model":"<model or empty>","integration":"<system used or empty>",'
        '"next":[{"to":"n2","label":"<branch label or empty>"}]} ],\n'
        '  "schema": {"title":"<e.g. Excel Registry Columns>","columns":[{"name":"...","type":"string|date|number"}]},\n'
        '  "statuses": ["<lifecycle status>", ...],\n'
        '  "triggers": ["<e.g. Daily schedule: every weekday 8:00 AM Dubai time>", "<Manual: officer-triggered>"],\n'
        '  "decisions": ["<key design decision the reviewer should know>", ...],\n'
        '  "guardrails": ["<what the agent must NOT do / where it escalates>", ...]\n'
        "}\n\n"
        "Rules: 6-16 flow nodes with a single 'entry' and one or more 'end' nodes. Use 'cond' for "
        "routing/branching nodes and give each outgoing edge a short 'label'. Pick concrete, "
        "reasonable model names (e.g. 'GPT 4.1 Mini' for actions, 'Gemini 3 Flash' for document "
        "evaluation). Respect any integrations, statuses, columns, triggers and constraints the "
        "officer named — do not invent extra ones. Omit 'schema' or 'statuses' if the request has no "
        "data records. Keep every string short. If a required detail is genuinely ambiguous, still "
        "produce your best design and note the assumption in 'decisions'."
    )
    if lang == "ar":
        sys_p += ("\n\nIMPORTANT: Write ALL human-readable values (name, summary, node titles, edge "
                  "labels, status names, triggers, decisions, guardrails, schema column names) in "
                  "ARABIC. Keep the JSON keys and the 'kind' values in English, and keep product/"
                  "connector names (Outlook, SharePoint, Excel, Microsoft 365) as-is.")
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


def test_case(sess, app_id, inp, expected):
    info = app_info(sess, app_id)
    events_out, output = [], ""
    if info["mode"] == "workflow":
        inputs = {}
        for i, v in enumerate(info["vars"]):
            inputs[v["name"]] = inp if i == 0 else ""
        t0 = time.time()
        evs = dify_sse(sess, f"/apps/{app_id}/workflows/draft/run",
                       {"inputs": inputs, "response_mode": "streaming"})
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
                output = "\n".join(str(v) for v in outs.values()) if isinstance(outs, dict) else str(outs)
        elapsed = int((time.time() - t0) * 1000)
    else:
        # conversational app — run via chat
        evs = dify_sse(sess, f"/apps/{app_id}/chat-messages",
                       {"inputs": {}, "query": inp, "response_mode": "streaming", "conversation_id": "",
                        "model_config": {"model": get_model(), "pre_prompt": "", "user_input_form": [],
                                         "agent_mode": {"enabled": False, "tools": []}}})
        for ev in evs:
            if ev.get("event") in ("message", "agent_message"):
                output += ev.get("answer", "")
        events_out.append({"title": "Chat", "status": "succeeded"})
        elapsed = 0
    ok, reason = _judge(inp, expected, output)
    return {"output": output[:4000], "events": events_out, "pass": ok, "reason": reason, "ms": elapsed}


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
    req = urllib.request.Request(f"https://marketplace.dify.ai/api/v1/plugins/langgenius/{name}")
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


_KNOWLEDGE_KEY = {"token": ""}


def _openai_chat(messages):
    last_err = None
    for model in ("gpt-5.1", "gpt-4o-mini"):
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


def chat(sess, message, history):
    msgs = [{"role": "system", "content":
             "You are Wakeel (وكيل), an assistant for UAE government employees in Abu Dhabi. "
             "Help with research, drafting, summarizing and government service questions. "
             "Be concise and professional. Answer in the language the user writes in (English or Arabic)."}]
    for h in (history or [])[-10:]:
        if h.get("role") in ("user", "assistant") and h.get("content"):
            msgs.append({"role": h["role"], "content": str(h["content"])[:4000]})
    msgs.append({"role": "user", "content": message[:6000]})
    return {"reply": _openai_chat(msgs)}


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

    def do_GET(self):
        p = self.path.split("?")[0]
        if p in ("/", "/index.html"):
            return self._file("index.html", "text/html; charset=utf-8")
        if p == "/app.js":
            return self._file("app.js", "application/javascript")
        if p == "/style.css":
            return self._file("style.css", "text/css")
        if p == "/wakeel-mark.svg":
            return self._file("wakeel-mark.svg", "image/svg+xml")
        if p == "/api/health":
            return self._send(200, {"ok": True, "sessions": len(SESSIONS)})
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
                r = chat(sess, b.get("message", ""), b.get("history", []))
                log_act(sess, "chat", b.get("message", "")[:60])
                return self._send(200, r)
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
