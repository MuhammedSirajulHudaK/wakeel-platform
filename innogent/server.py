#!/usr/bin/env python3
"""
Innogent — chat-first, Beam-style front-end that drives a live Dify backend.

Serves a single-page UI and proxies a handful of high-level actions to Dify's
console API (login/cookies handled server-side, so the browser never sees Dify):

  POST /api/generate  {mode, instruction, current_graph?}  -> {graph, message, nodes}
  POST /api/deploy    {mode, name, graph}                   -> {id, url}
  GET  /api/apps                                            -> {apps:[...]}
  GET  /api/health                                          -> {ok, dify_version}

Run:  python3 innogent/server.py   (listens on http://localhost:8800)
"""
import json
import os
import base64
import http.cookiejar
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DIFY = os.environ.get("DIFY_BASE", "http://localhost/console/api")
EMAIL = os.environ.get("DIFY_EMAIL", "admin@wakeel.local")
PASSWORD = os.environ.get("DIFY_PASSWORD", "Wakeel@12345")
MODEL = {"provider": "langgenius/openai/openai", "name": "gpt-5.1", "mode": "chat", "completion_params": {}}
HERE = os.path.dirname(os.path.abspath(__file__))

_cj = http.cookiejar.CookieJar()
_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_cj))


def _csrf():
    for c in _cj:
        if c.name == "csrf_token":
            return c.value
    return ""


def _login():
    body = json.dumps({
        "email": EMAIL,
        "password": base64.b64encode(PASSWORD.encode()).decode(),
        "language": "en-US", "remember_me": True,
    }).encode()
    req = urllib.request.Request(DIFY + "/login", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    _opener.open(req, timeout=30).read()


def dify(method, path, body=None, _retry=True):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    csrf = _csrf()
    if csrf:
        headers["X-CSRF-Token"] = csrf
    req = urllib.request.Request(DIFY + path, data=data, headers=headers, method=method)
    try:
        resp = _opener.open(req, timeout=120)
        raw = resp.read().decode()
        return json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        if e.code in (401, 403) and _retry:
            _login()
            return dify(method, path, body, _retry=False)
        detail = e.read().decode()[:500]
        raise RuntimeError(f"Dify {method} {path} -> {e.code}: {detail}")


# ---- high level actions -----------------------------------------------------

def generate(mode, instruction, current_graph=None):
    gen_mode = "advanced-chat" if mode == "agent" else "workflow"
    payload = {"mode": gen_mode, "instruction": instruction, "model_config": MODEL}
    if current_graph:
        payload["current_graph"] = current_graph
    res = dify("POST", "/workflow-generate", payload)
    graph = res.get("graph") or {}
    nodes = [{"type": n.get("data", {}).get("type"), "title": n.get("data", {}).get("title")}
             for n in graph.get("nodes", [])]
    return {"graph": graph, "message": res.get("message", ""), "nodes": nodes,
            "error": res.get("error") or ""}


def deploy(mode, name, graph):
    app_mode = "advanced-chat" if mode == "agent" else "workflow"
    icon = "🤖" if mode == "agent" else "🔁"
    app = dify("POST", "/apps", {
        "name": name, "mode": app_mode, "icon_type": "emoji", "icon": icon,
        "icon_background": "#E6EEFF", "description": "Built with Innogent",
    })
    app_id = app["id"]
    dify("POST", f"/apps/{app_id}/workflows/draft", {
        "graph": graph, "features": {}, "environment_variables": [],
        "conversation_variables": [], "hash": "",
    })
    dify("POST", f"/apps/{app_id}/workflows/publish", {})
    return {"id": app_id, "url": f"http://localhost/app/{app_id}/workflow",
            "mode": app_mode}


def list_apps():
    res = dify("GET", "/apps?page=1&limit=30")
    out = []
    for a in res.get("data", []):
        out.append({"id": a.get("id"), "name": a.get("name"), "mode": a.get("mode"),
                    "icon": a.get("icon"), "url": f"http://localhost/app/{a.get('id')}/workflow"})
    return {"apps": out}


# ---- http handler -----------------------------------------------------------

class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="application/json"):
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode()
        elif isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _file(self, name, ctype):
        try:
            with open(os.path.join(HERE, "static", name), "rb") as f:
                self._send(200, f.read(), ctype)
        except FileNotFoundError:
            self._send(404, b"not found", "text/plain")

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or b"{}") if n else {}

    def do_GET(self):
        if self.path == "/" or self.path.startswith("/?"):
            return self._file("index.html", "text/html; charset=utf-8")
        if self.path == "/app.js":
            return self._file("app.js", "application/javascript")
        if self.path == "/style.css":
            return self._file("style.css", "text/css")
        # ---- assets injected into the real Dify pages ----
        if self.path.startswith("/innogent-inject.js"):
            return self._file("innogent-inject.js", "application/javascript")
        if self.path.startswith("/innogent-assistant.js"):
            return self._file("studio-assistant.js", "application/javascript")
        if self.path.startswith("/innogent-logo-white.svg"):
            return self._file("innogent-logo-white.svg", "image/svg+xml")
        if self.path.startswith("/innogent-logo.svg"):
            return self._file("innogent-logo.svg", "image/svg+xml")
        if self.path.startswith("/innogent-favicon.svg"):
            return self._file("innogent-favicon.svg", "image/svg+xml")
        if self.path == "/api/health":
            try:
                dify("GET", "/workspaces")
                return self._send(200, {"ok": True})
            except Exception as e:
                return self._send(500, {"ok": False, "error": str(e)})
        if self.path.startswith("/api/apps"):
            try:
                return self._send(200, list_apps())
            except Exception as e:
                return self._send(500, {"error": str(e)})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        try:
            b = self._body()
            if self.path == "/api/generate":
                return self._send(200, generate(b.get("mode", "workflow"),
                                                b.get("instruction", ""),
                                                b.get("current_graph")))
            if self.path == "/api/deploy":
                return self._send(200, deploy(b.get("mode", "workflow"),
                                              b.get("name", "Untitled"),
                                              b.get("graph", {})))
            return self._send(404, {"error": "not found"})
        except Exception as e:
            return self._send(500, {"error": str(e)})


if __name__ == "__main__":
    try:
        _login()
        print("Logged in to Dify as", EMAIL)
    except Exception as e:
        print("WARN: initial Dify login failed:", e)
    port = int(os.environ.get("PORT", "8800"))
    print(f"Innogent running at http://localhost:{port}")
    ThreadingHTTPServer(("0.0.0.0", port), H).serve_forever()
