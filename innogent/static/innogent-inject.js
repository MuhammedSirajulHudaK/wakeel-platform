/* Innogent global rebrand — injected by nginx into every Dify page.
   Replaces the "Dify" name/title/favicon and loads the Build Assistant on app pages. */
(function () {
  if (window.__innogentBrand) return;
  window.__innogentBrand = true;

  var NAME = "Wakeel";

  // ---- title + favicon ----
  function brandHead() {
    if (document.title && /dify/i.test(document.title))
      document.title = document.title.replace(/dify/gi, NAME);
    else if (!/innogent/i.test(document.title || ""))
      document.title = NAME;
    document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(function (l) {
      l.href = "/favicon.ico";
    });
    if (!document.querySelector('link[data-inno]')) {
      var l = document.createElement("link");
      l.rel = "icon"; l.type = "image/svg+xml"; l.href = "/favicon.ico"; l.setAttribute("data-inno", "1");
      document.head.appendChild(l);
    }
  }

  // ---- replace visible "Dify" text ----
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };
  function brandText(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !/Dify|LangGenius/i.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        while (p && p !== root) { if (SKIP[p.nodeName] || (p.isContentEditable)) return NodeFilter.FILTER_REJECT; p = p.parentNode; }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var hits = [], n;
    while ((n = w.nextNode())) hits.push(n);
    hits.forEach(function (t) {
      // keep code-ish tokens (langgenius/openai provider ids, .dify, dify_) intact; only rebrand standalone words
      t.nodeValue = t.nodeValue
        .replace(/\bDify\b/g, NAME).replace(/\bInnogent\b/g, NAME)
        .replace(/\bLangGenius,?\s+Inc\.?/g, NAME + ", Inc.")
        .replace(/\bLangGenius\b/g, NAME);
    });
  }

  var pending = false;
  function run() {
    pending = false;
    brandHead();
    brandText(document.body);
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(run); } }

  function start() {
    run();
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    loadAssistant();
    if (/[?&]embed=wakeel/.test(location.search)) embedMode();
  }

  // ---- Wakeel embed: show ONLY the orchestration canvas (strip studio chrome) ----
  function embedMode() {
    document.documentElement.setAttribute("data-wakeel-embed", "1");
    var css = document.createElement("style");
    css.textContent =
      "html[data-wakeel-embed] .wk-hide{display:none !important}" +
      "html[data-wakeel-embed] body{overflow:hidden}";
    document.head.appendChild(css);
    function hideChrome() {
      var LABELS = ["Orchestrate", "API Access", "Logs", "Monitoring", "Annotations"];
      // find the app-detail left nav: an element whose direct nav items match the labels
      var cands = document.querySelectorAll("a,button,li,div,span");
      var items = [];
      for (var i = 0; i < cands.length; i++) {
        var t = (cands[i].textContent || "").trim();
        if (LABELS.indexOf(t) !== -1 && cands[i].querySelectorAll("*").length <= 3) items.push(cands[i]);
      }
      var done = false;
      if (items.length >= 3) {
        // common ancestor of the nav items
        var anc = items[0];
        var contains = function (a) { return items.every(function (n) { return a.contains(n); }); };
        while (anc && !contains(anc)) anc = anc.parentElement;
        // walk up to the left sidebar column (narrower than half the viewport)
        var side = anc, guard = 0;
        while (side && side.parentElement && side.parentElement.getBoundingClientRect().width < window.innerWidth * 0.55 && guard++ < 6) side = side.parentElement;
        if (side && side.getBoundingClientRect().width < window.innerWidth * 0.55) { side.classList.add("wk-hide"); done = true; }
      }
      // hide the small "Auto-Saved / Published" status line for a cleaner look
      var cands2 = document.querySelectorAll("div,span,p");
      for (var j = 0; j < cands2.length; j++) {
        var tt = (cands2[j].textContent || "").trim();
        if (/^Auto-Saved/.test(tt) && cands2[j].querySelectorAll("*").length <= 4 && !cands2[j].classList.contains("wk-hide")) { cands2[j].classList.add("wk-hide"); }
      }
      return done;
    }
    var tries = 0;
    var iv = setInterval(function () { if (hideChrome() || tries++ > 30) clearInterval(iv); }, 400);
    new MutationObserver(function () { hideChrome(); }).observe(document.documentElement, { childList: true, subtree: true });
  }

  // ---- Build Assistant on app pages ----
  function loadAssistant() {
    if (!/\/app\/[0-9a-f-]{36}/i.test(location.pathname)) return;
    if (document.getElementById("inno-assistant-loader")) return;
    var s = document.createElement("script");
    s.id = "inno-assistant-loader";
    s.src = "/innogent-assistant.js?v=9";
    document.body.appendChild(s);
  }
  // app pages are client-routed — keep checking on navigation
  setInterval(loadAssistant, 1500);

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
