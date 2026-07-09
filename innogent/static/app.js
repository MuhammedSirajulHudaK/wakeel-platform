const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let mode = "agent";
let lastGraph = null;
let lastInstruction = "";

/* ---- mode pills ---- */
function setMode(m) {
  mode = m;
  $$(".pill").forEach(p => p.classList.toggle("active", p.dataset.mode === m));
}
$$(".pill").forEach(p => p.onclick = () => setMode(p.dataset.mode));

/* ---- chips & recommended prefill ---- */
$$(".chip").forEach(c => c.onclick = () => { setMode(c.dataset.mode); $("#prompt").value = c.textContent.trim(); $("#prompt").focus(); });
$$(".rec-card").forEach(c => c.onclick = () => { setMode(c.dataset.mode); $("#prompt").value = c.dataset.p; build(); });

/* ---- composer ---- */
$("#prompt").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); build(); }
});
$("#sendBtn").onclick = build;
$("#backBtn").onclick = () => { $("#build").hidden = true; $(".hero").hidden = false; };
$("#newBtn").onclick = () => showView("home", true);

function bubble(cls, html) {
  const d = document.createElement("div");
  d.className = "bubble " + cls;
  d.innerHTML = html;
  $("#chat").appendChild(d);
  d.scrollIntoView({ behavior: "smooth", block: "end" });
  return d;
}

async function build() {
  const instruction = $("#prompt").value.trim();
  if (!instruction) return;
  lastInstruction = instruction;
  $(".hero").hidden = true;
  $("#build").hidden = false;
  $("#chat").innerHTML = "";
  $("#deploybar").hidden = true;
  $("#buildTitle").textContent = mode === "agent" ? "Building your agent" : "Building your workflow";
  bubble("me", esc(instruction));
  const thinking = bubble("bot", `<span class="typing"><i></i><i></i><i></i></span> Planning the ${mode}…`);

  try {
    const r = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, instruction })
    });
    const data = await r.json();
    thinking.remove();
    if (data.error && (!data.nodes || !data.nodes.length)) {
      bubble("bot", "⚠️ " + esc(data.error));
      return;
    }
    lastGraph = data.graph;
    bubble("bot", `Here's the plan for <b>${esc(data.message || instruction)}</b>. I mapped it to ${data.nodes.length} steps:`);
    renderPlan(data.nodes);
    bubble("bot", "Looks good? Name it and deploy — it'll be created and published as a live app you can run.");
    $("#appName").value = suggestName(data.message || instruction);
    $("#deploybar").hidden = false;
  } catch (e) {
    thinking.remove();
    bubble("bot", "⚠️ " + esc(e.message));
  }
}

function renderPlan(nodes) {
  const wrap = document.createElement("div");
  wrap.className = "plan";
  nodes.forEach((n, i) => {
    const s = document.createElement("div");
    s.className = "step";
    s.innerHTML = `<div class="step-n">${i + 1}</div><div class="step-t">${esc(n.title || n.type)}</div><div class="step-k">${esc(n.type)}</div>`;
    wrap.appendChild(s);
  });
  $("#chat").appendChild(wrap);
  wrap.scrollIntoView({ behavior: "smooth", block: "end" });
}

$("#deployBtn").onclick = async () => {
  const name = $("#appName").value.trim() || "Untitled build";
  $("#deployBtn").disabled = true;
  const b = bubble("bot", `<span class="typing"><i></i><i></i><i></i></span> Creating & publishing “${esc(name)}”…`);
  try {
    const r = await fetch("/api/deploy", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, name, graph: lastGraph })
    });
    const d = await r.json();
    b.remove();
    if (d.error) { bubble("bot", "⚠️ " + esc(d.error)); $("#deployBtn").disabled = false; return; }
    const s = document.createElement("div");
    s.className = "success";
    s.innerHTML = `✅ <b>${esc(name)}</b> is live in your workspace.<br><a href="${d.url}" target="_blank">Open the builder →</a>`;
    $("#chat").appendChild(s);
    s.scrollIntoView({ behavior: "smooth", block: "end" });
    loadAgents();
  } catch (e) {
    b.remove(); bubble("bot", "⚠️ " + esc(e.message));
  } finally { $("#deployBtn").disabled = false; }
};

/* ---- views ---- */
function showView(v, resetHome) {
  $$(".nav-i").forEach(n => n.classList.toggle("active", n.dataset.view === v));
  $("#crumb").textContent = cap(v);
  if (v === "home") {
    $("#view-home").hidden = false; $("#view-list").hidden = true;
    if (resetHome) { $("#build").hidden = true; $(".hero").hidden = false; $("#prompt").value = ""; }
  } else {
    $("#view-home").hidden = true; $("#view-list").hidden = false;
    $("#listTitle").textContent = cap(v);
    loadList(v);
  }
}
$$(".nav-i").forEach(n => n.onclick = () => showView(n.dataset.view));
$("#listNew").onclick = () => showView("home", true);

async function loadList(v) {
  const cards = $("#cards");
  cards.innerHTML = `<div class="empty">Loading…</div>`;
  const modes = { agents: ["agent-chat", "advanced-chat"], workflows: ["workflow"] };
  try {
    const d = await (await fetch("/api/apps")).json();
    let apps = d.apps || [];
    if (modes[v]) apps = apps.filter(a => modes[v].includes(a.mode));
    if (!apps.length) { cards.innerHTML = `<div class="empty">No ${v} yet. Hit <b>New</b> and describe one.</div>`; return; }
    cards.innerHTML = "";
    apps.forEach(a => {
      const c = document.createElement("div");
      c.className = "card";
      c.innerHTML = `<div class="card-ic">${a.icon || "🤖"}</div><div class="card-t">${esc(a.name)}</div><div class="card-m">${a.mode}</div>`;
      c.onclick = () => window.open(a.url, "_blank");
      cards.appendChild(c);
    });
  } catch (e) { cards.innerHTML = `<div class="empty">⚠️ ${esc(e.message)}</div>`; }
}

async function loadAgents() {
  try {
    const d = await (await fetch("/api/apps")).json();
    const mini = $("#agentMini"); mini.innerHTML = "";
    (d.apps || []).slice(0, 5).forEach(a => {
      const el = document.createElement("a");
      el.className = "nav-i mini";
      el.innerHTML = `<span>${a.icon || "🤖"}</span> ${esc(a.name)}`;
      el.onclick = () => window.open(a.url, "_blank");
      mini.appendChild(el);
    });
  } catch (e) {}
}

/* ---- copilot ---- */
$("#copilotBtn").onclick = () => { $(".app").classList.add("copilot-open"); $("#copilot").hidden = false; };
$("#copClose").onclick = () => { $(".app").classList.remove("copilot-open"); $("#copilot").hidden = true; };
$("#copSend").onclick = copSend;
$("#copInput").addEventListener("keydown", e => { if (e.key === "Enter") copSend(); });
async function copSend() {
  const t = $("#copInput").value.trim(); if (!t) return;
  $("#copInput").value = "";
  const body = $(".cop-body");
  const m = document.createElement("div"); m.className = "cop-msg me"; m.textContent = t; body.appendChild(m);
  const b = document.createElement("div"); b.className = "cop-msg bot";
  b.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`; body.appendChild(b);
  b.scrollIntoView();
  try {
    const r = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, instruction: t, current_graph: lastGraph })
    });
    const d = await r.json();
    lastGraph = d.graph || lastGraph;
    b.innerHTML = d.nodes && d.nodes.length
      ? `Updated the plan → ${d.nodes.map(n => esc(n.title)).join(" · ")}. Open Home to deploy.`
      : "Done. " + esc(d.message || "");
  } catch (e) { b.textContent = "⚠️ " + e.message; }
}

/* ---- utils ---- */
const esc = s => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function suggestName(s) { return s.split(/[.\n]/)[0].slice(0, 40).replace(/^\w/, c => c.toUpperCase()); }

loadAgents();
