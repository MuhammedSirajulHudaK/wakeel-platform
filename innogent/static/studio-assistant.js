/* Innogent Build Assistant — docked right-side chat panel injected into Dify Studio.
   Chat to build/edit the CURRENT app's workflow. History persists across the
   canvas refresh (localStorage) so it behaves like a real chat builder. */
(function () {
  if (window.__innogentAssistant) { window.__innogentAssistant.open(); return; }

  var MODEL = { provider: "langgenius/openai/openai", name: "gpt-5.1", mode: "chat", completion_params: {} };
  var BLUE = "#00843D";

  function cookie(n) { var m = document.cookie.split("; ").find(function (r) { return r.indexOf(n + "=") === 0; }); return m ? m.split("=")[1] : ""; }
  function appId() { var m = location.pathname.match(/\/app\/([0-9a-f-]{36})/i); return m ? m[1] : null; }
  async function api(method, path, bd) {
    var r = await fetch("/console/api" + path, {
      method: method, credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": cookie("csrf_token") },
      body: bd ? JSON.stringify(bd) : undefined,
    });
    var t = await r.text();
    if (!r.ok) throw new Error((JSON.parse(t || "{}").message) || (path + " -> " + r.status));
    return t ? JSON.parse(t) : {};
  }
  function esc(s) { return (s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---- persistent history (per app) ----
  var HKEY = "inno_chat_" + (appId() || "none");
  function loadHist() { try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch (e) { return []; } }
  function saveHist(h) { try { localStorage.setItem(HKEY, JSON.stringify(h.slice(-60))); } catch (e) {} }
  var hist = loadHist();

  // ---- styles ----
  var css = document.createElement("style");
  css.textContent = `
  :root{--inno-w:384px}
  #inno-fab{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;align-items:center;gap:8px;
    background:${BLUE};color:#fff;border:0;border-radius:999px;padding:12px 18px;font:700 14px -apple-system,Segoe UI,sans-serif;
    box-shadow:0 8px 24px rgba(0,132,61,.45);cursor:pointer}
  #inno-dock{position:fixed;top:0;right:0;bottom:0;width:var(--inno-w);max-width:100vw;z-index:2147483000;
    background:#fff;border-left:1px solid #e7ebf2;box-shadow:-8px 0 40px rgba(16,32,64,.12);
    display:none;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;transform:translateX(100%);transition:transform .18s ease}
  #inno-dock.on{display:flex;transform:none}
  .inno-hd{display:flex;align-items:center;gap:10px;padding:14px 14px;border-bottom:1px solid #eef1f6}
  .inno-logo{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,${BLUE},#0aa155);color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px;flex:none}
  .inno-ttl{font-weight:750;font-size:14px;color:#0d1526;line-height:1.1}
  .inno-sub{font-size:11px;color:#7a8699}
  .inno-actions{margin-left:auto;display:flex;gap:2px}
  .inno-ic{border:0;background:none;color:#7a8699;cursor:pointer;border-radius:8px;padding:6px;display:grid;place-items:center}
  .inno-ic:hover{background:#eef3ff;color:${BLUE}}
  .inno-ic svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .inno-body{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:#f8fafd}
  .inno-b{max-width:90%;padding:10px 13px;border-radius:13px;font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
  .inno-b.me{align-self:flex-end;background:${BLUE};color:#fff;border-bottom-right-radius:4px}
  .inno-b.bot{align-self:flex-start;background:#fff;border:1px solid #e7ebf2;color:#0d1526;border-bottom-left-radius:4px}
  .inno-b.bot b{color:${BLUE}}
  .inno-b.ok{align-self:flex-start;background:#eefbf3;border:1px solid #c7efd6;color:#0d7a3f}
  .inno-plan{align-self:flex-start;width:100%;background:#fff;border:1px solid #e7ebf2;border-radius:12px;padding:5px}
  .inno-step{display:flex;gap:10px;align-items:center;padding:8px 9px;font-size:12.5px;color:#3b475c}
  .inno-step:not(:last-child){border-bottom:1px solid #f0f3f8}
  .inno-step b{width:22px;height:22px;border-radius:7px;background:#eef3ff;color:${BLUE};display:grid;place-items:center;font-size:11px;font-weight:800;flex:none}
  .inno-step .k{margin-left:auto;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#9aa6b8}
  .inno-ft{padding:12px;border-top:1px solid #eef1f6;display:flex;gap:8px;align-items:flex-end}
  .inno-ft textarea{flex:1;border:1px solid #e7ebf2;border-radius:11px;padding:10px 12px;font:inherit;font-size:13px;resize:none;outline:0;height:40px;max-height:120px}
  .inno-ft textarea:focus{border-color:${BLUE}}
  .inno-ft .send{border:0;background:${BLUE};color:#fff;border-radius:11px;height:40px;padding:0 15px;font-weight:700;cursor:pointer;flex:none}
  .inno-ft .send:disabled{opacity:.5}
  .inno-typ{display:inline-flex;gap:4px}.inno-typ i{width:5px;height:5px;border-radius:50%;background:#7a8699;animation:inb 1s infinite}
  .inno-typ i:nth-child(2){animation-delay:.15s}.inno-typ i:nth-child(3){animation-delay:.3s}
  @keyframes inb{0%,60%,100%{opacity:.3}30%{opacity:1}}
  `;
  document.head.appendChild(css);

  var fab = document.createElement("button");
  fab.id = "inno-fab"; fab.innerHTML = "✦ Build Assistant";
  document.documentElement.appendChild(fab);

  var dock = document.createElement("div");
  dock.id = "inno-dock";
  dock.innerHTML = `
    <div class="inno-hd">
      <div class="inno-logo">و</div>
      <div><div class="inno-ttl">Wakeel Build Assistant</div><div class="inno-sub">Chat to build this app</div></div>
      <div class="inno-actions">
        <button class="inno-ic" id="inno-new" title="New chat"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>
        <button class="inno-ic" id="inno-close" title="Collapse"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
      </div>
    </div>
    <div class="inno-body" id="inno-body"></div>
    <div class="inno-ft">
      <textarea id="inno-in" placeholder="Describe a step to add or change…"></textarea>
      <button class="send" id="inno-send">Send</button>
    </div>`;
  document.documentElement.appendChild(dock);

  var body = dock.querySelector("#inno-body");
  var input = dock.querySelector("#inno-in");

  function render(m) {
    var d = document.createElement("div");
    if (m.cls === "plan") {
      d.className = "inno-plan";
      d.innerHTML = (m.steps || []).map(function (s, i) {
        return '<div class="inno-step"><b>' + (i + 1) + '</b>' + esc(s.title) + '<span class="k">' + esc(s.type) + '</span></div>';
      }).join("");
    } else {
      d.className = "inno-b " + m.cls;
      d.innerHTML = m.html;
    }
    body.appendChild(d); body.scrollTop = body.scrollHeight; return d;
  }
  function push(m) { hist.push(m); saveHist(hist); return render(m); }

  // Split layout: constrain <body> itself (the one guaranteed container) to the
  // left region and give it a transform, so EVERY fixed-position descendant of the
  // Studio is relative to the narrowed body and clipped — the panel (mounted on
  // <html>, outside body) then sits beside the Studio instead of overlaying it.
  var W = 384;
  function shiftLayout(on) {
    var b = document.body;
    b.style.transition = "width .18s ease";
    if (on) {
      b.style.width = "calc(100vw - " + W + "px)";
      b.style.height = "100vh";
      b.style.overflow = "hidden";
      b.style.transform = "translateZ(0)"; // establishes containing block for fixed children
    } else {
      b.style.width = ""; b.style.height = ""; b.style.overflow = ""; b.style.transform = "";
    }
  }
  function open() { dock.classList.add("on"); fab.style.display = "none"; shiftLayout(true); input.focus(); }
  function close() { dock.classList.remove("on"); fab.style.display = "flex"; shiftLayout(false); }

  fab.onclick = open;
  dock.querySelector("#inno-close").onclick = close;
  dock.querySelector("#inno-new").onclick = function () {
    hist = []; saveHist(hist); body.innerHTML = ""; greet(true);
  };

  var mode = "workflow", metaReady = false;
  async function loadMeta() {
    var id = appId(); if (!id) return;
    try { var app = await api("GET", "/apps/" + id); mode = app.mode === "workflow" ? "workflow" : "advanced-chat"; window.__innoAppName = app.name; metaReady = true; } catch (e) {}
  }
  function greet(force) {
    if (hist.length && !force) return;
    push({ cls: "bot", html: "Hi! I'm your build assistant for <b>" + esc(window.__innoAppName || "this app") + "</b>. Tell me what to add or change — e.g. “add an if/else node that branches on the result”." });
  }

  async function send() {
    var text = input.value.trim(); if (!text) return;
    var id = appId(); if (!id) { push({ cls: "bot", html: "Open a workflow or chatflow app first." }); return; }
    input.value = ""; input.style.height = "40px";
    push({ cls: "me", html: esc(text) });
    var t = render({ cls: "bot", html: '<span class="inno-typ"><i></i><i></i><i></i></span> Building…' });
    dock.querySelector("#inno-send").disabled = true;
    try {
      if (!metaReady) await loadMeta();
      var current = null;
      try { var d0 = await api("GET", "/apps/" + id + "/workflows/draft"); current = d0.graph; } catch (e) {}
      var gen = await api("POST", "/workflow-generate", { mode: mode, instruction: text, model_config: MODEL, current_graph: current });
      if (!gen.graph || !(gen.graph.nodes || []).length) { t.remove(); push({ cls: "bot", html: "⚠️ " + esc(gen.error || "Couldn't build that.") }); return; }
      // save with the LIVE hash (retry once on conflict)
      async function saveDraft() {
        var d = {}; try { d = await api("GET", "/apps/" + id + "/workflows/draft"); } catch (e) {}
        return api("POST", "/apps/" + id + "/workflows/draft", {
          graph: gen.graph, features: d.features || {},
          environment_variables: d.environment_variables || [], conversation_variables: d.conversation_variables || [],
          hash: d.hash || "",
        });
      }
      try { await saveDraft(); } catch (e) { await saveDraft(); }
      t.remove();
      var steps = (gen.graph.nodes || []).map(function (n) { return { title: (n.data || {}).title || (n.data || {}).type, type: (n.data || {}).type }; });
      push({ cls: "ok", html: "✅ Applied — " + steps.length + " steps. Refreshing the canvas…" });
      push({ cls: "plan", steps: steps });
      // reload so the canvas re-renders; history + open state persist so it's seamless
      try { sessionStorage.setItem("inno_open", "1"); } catch (e) {}
      setTimeout(function () { location.reload(); }, 650);
    } catch (e) { t.remove(); push({ cls: "bot", html: "⚠️ " + esc(e.message) }); }
    finally { dock.querySelector("#inno-send").disabled = false; }
  }
  dock.querySelector("#inno-send").onclick = send;
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
  input.addEventListener("input", function () { input.style.height = "40px"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });

  // ---- boot ----
  hist.forEach(render);
  var reopened = false;
  try { if (sessionStorage.getItem("inno_open")) { sessionStorage.removeItem("inno_open"); reopened = true; } } catch (e) {}
  loadMeta().then(function () { greet(false); if (reopened) push({ cls: "ok", html: "✅ Canvas updated. What next?" }); });
  window.__innogentAssistant = { open: open, close: close };
  if (reopened || !hist.length) open(); else open();
})();
