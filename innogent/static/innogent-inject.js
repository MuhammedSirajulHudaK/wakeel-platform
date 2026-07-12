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
      "html[data-wakeel-embed] body{overflow:hidden}" +
      // strip every floating React-Flow toolbar/control so ONLY the diagram remains
      "html[data-wakeel-embed] .react-flow__panel," +
      "html[data-wakeel-embed] .react-flow__controls," +
      "html[data-wakeel-embed] .react-flow__minimap," +
      "html[data-wakeel-embed] .react-flow__attribution{display:none !important}" +
      // keep node interaction but remove the connect-handles' hover chrome
      "html[data-wakeel-embed] .react-flow__background{opacity:.5}";
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
      // strip every floating overlay in the canvas: hide direct children of .react-flow
      // except the core rendering layers, so only nodes + edges + background remain.
      var rf = document.querySelector(".react-flow");
      if (rf) {
        var CORE = /react-flow__(viewport|renderer|pane|edges|nodes|edgelabel|background|selection|nodesselection|attribution)/;
        for (var c = 0; c < rf.children.length; c++) {
          var ch = rf.children[c];
          var cls = typeof ch.className === "string" ? ch.className : "";
          if (!CORE.test(cls) && !ch.classList.contains("wk-hide")) ch.classList.add("wk-hide");
        }
      }
      // hide the small ICON toolbars floating over the canvas (left tool rail,
      // bottom-left undo/redo/history). Content-based so it doesn't depend on CSS position.
      var floaters = document.querySelectorAll("div,section,aside,nav");
      for (var f2 = 0; f2 < floaters.length; f2++) {
        var fe = floaters[f2];
        if (fe.classList.contains("wk-hide")) continue;
        if (fe.closest && (fe.closest(".react-flow__viewport") || fe.closest(".react-flow__node") || fe.closest(".copilot"))) continue;
        var rc = fe.getBoundingClientRect();
        if (rc.width === 0 || rc.height === 0) continue;
        if (rc.width > 260 || rc.height > 360) continue; // clusters are small; skip big containers
        var svgs = fe.querySelectorAll("svg").length;
        var btns = fe.querySelectorAll('button,[role="button"]').length;
        var txt = (fe.textContent || "").replace(/\s+/g, "");
        var isIconBar = (svgs >= 3 || btns >= 3) && txt.length < 24;
        if (!isIconBar) continue;
        var nearLeft = rc.left < 80;
        var nearBottom = (window.innerHeight - rc.bottom) < 96;
        var nearTop = rc.top < 96;
        if (nearLeft || nearBottom || nearTop) fe.classList.add("wk-hide");
      }
      // "Variable Inspect" pill (sometimes rendered outside .react-flow)
      var vi = document.querySelectorAll("div,span,button");
      for (var m = 0; m < vi.length; m++) {
        var vt = (vi[m].textContent || "").trim();
        if (/^variable inspect$/i.test(vt) && vi[m].querySelectorAll("*").length <= 3 && !vi[m].classList.contains("wk-hide")) vi[m].classList.add("wk-hide");
      }
      // hide the top operations toolbar (Preview/Run/Features/Publish) if it isn't a react-flow panel
      var TB = ["Preview", "Run", "Test Run", "Features", "Publish"];
      var btns = document.querySelectorAll("button");
      var hits = [];
      for (var k = 0; k < btns.length; k++) {
        var bt = (btns[k].textContent || "").trim();
        if (TB.indexOf(bt) !== -1) hits.push(btns[k]);
      }
      if (hits.length >= 2) {
        var a2 = hits[0];
        var has = function (el) { return hits.filter(function (n) { return el.contains(n); }).length >= 2; };
        var g2 = 0;
        while (a2 && a2.parentElement && !has(a2.parentElement) === false && g2++ < 8) { if (has(a2)) break; a2 = a2.parentElement; }
        // climb to the toolbar row (contains >=2 of the buttons, sits in the top ~15% of the canvas)
        var bar = hits[0];
        while (bar && bar.parentElement && !has(bar)) bar = bar.parentElement;
        while (bar && bar.parentElement && has(bar.parentElement) && bar.parentElement.getBoundingClientRect().height < 90) bar = bar.parentElement;
        if (bar && bar.getBoundingClientRect().top < window.innerHeight * 0.25 && !bar.classList.contains("wk-hide")) bar.classList.add("wk-hide");
      }
      return done;
    }
    var tries = 0;
    var iv = setInterval(function () { if (hideChrome() || tries++ > 30) clearInterval(iv); }, 400);
    new MutationObserver(function () { hideChrome(); }).observe(document.documentElement, { childList: true, subtree: true });
    // fit the whole flow into view (Dify uses custom controls, so try several selectors).
    // The auto-opening node panel is handled server-side by clearing node selection.
    function fit() {
      var b = document.querySelector(".react-flow__controls-fitview") ||
              document.querySelector('[data-testid="rf__controls-fitview"]') ||
              document.querySelector('[aria-label*="fit" i],[title*="fit view" i]');
      if (b) { try { b.click(); } catch (e) {} }
    }
    var fitN = 0;
    var fitIv = setInterval(function () { fit(); if (++fitN > 6) clearInterval(fitIv); }, 500);
    window.addEventListener("resize", fit);
  }

  // ---- Build Assistant on app pages ----
  function loadAssistant() {
    if (!/\/app\/[0-9a-f-]{36}/i.test(location.pathname)) return;
    // when embedded inside Wakeel, the Wakeel Build Assistant sits beside the canvas —
    // don't inject a second one inside the iframe.
    if (/[?&]embed=wakeel/.test(location.search)) return;
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
