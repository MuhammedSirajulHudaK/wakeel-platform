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
