/* Wakeel وكيل — Agentic Platform for UAE Government Entities */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------------- professional icon set (inline SVG, stroke style) ---------------- */
const IC_ = (path, extra) => `<svg class="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra || ""}>${path}</svg>`;
const IC = {
  agent: IC_('<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="3.5" r="1.2"/><path d="M9.2 13h.01M14.8 13h.01M9.5 16h5"/>'),
  chat: IC_('<path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L4 21l1.5-4.6A8.5 8.5 0 1 1 21 12z"/>'),
  data: IC_('<ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13"/><path d="M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8"/>'),
  flow: IC_('<rect x="3" y="3" width="6.5" height="6.5" rx="1.6"/><rect x="14.5" y="14.5" width="6.5" height="6.5" rx="1.6"/><path d="M9.5 6.2h6a2 2 0 0 1 2 2v6.3"/>'),
  book: IC_('<path d="M2 4.5h6.5a3.5 3.5 0 0 1 3.5 3.5v12a3 3 0 0 0-3-3H2zM22 4.5h-6.5A3.5 3.5 0 0 0 12 8v12a3 3 0 0 1 3-3h7z"/>'),
  chamber: IC_('<path d="M3 21h18M4 9.5h16M12 3L4 9.5h16zM6.5 9.5V18M10.2 9.5V18M13.8 9.5V18M17.5 9.5V18"/>'),
  economy: IC_('<path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/>'),
  digital: IC_('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  municipality: IC_('<path d="M6 21V7l6-4v18M12 21h6V11l-6-4"/><path d="M8.8 9h.01M8.8 12h.01M8.8 15h.01M15 13h.01M15 16h.01"/>'),
  health: IC_('<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>'),
  education: IC_('<path d="M22 9L12 4.5 2 9l10 4.5L22 9z"/><path d="M6 11.2V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.8"/>'),
  justice: IC_('<path d="M12 4.5v15M9 19.5h6M12 6.5l5.5 1M12 6.5l-5.5 1"/><path d="M3.5 13.5a3 3 0 0 0 6 0L6.5 7.7zM14.5 13.5a3 3 0 0 0 6 0l-3-5.8z"/>'),
  police: IC_('<path d="M12 3l8 3v5.5c0 5-3.4 8.3-8 9.5-4.6-1.2-8-4.5-8-9.5V6z"/><path d="M9.5 12l2 2 3.5-4"/>'),
  tax: IC_('<path d="M5.5 3h13v18l-2.2-1.4-2.1 1.4-2.2-1.4-2.1 1.4-2.2-1.4L5.5 21z"/><path d="M9 8.5h6M9 12.5h6"/>'),
  identity: IC_('<rect x="3" y="5" width="18" height="14" rx="2.2"/><circle cx="8.8" cy="11" r="1.9"/><path d="M6.2 15.8a2.9 2.9 0 0 1 5.2 0M14 9.5h4.5M14 13h4.5"/>'),
  uae: `<svg class="icn" viewBox="0 0 24 24" fill="none"><rect x="3" y="5.5" width="18" height="4.4" rx="0" fill="#00843D"/><rect x="3" y="9.9" width="18" height="4.2" fill="#ffffff" stroke="#d9d9de" stroke-width="0.4"/><rect x="3" y="14.1" width="18" height="4.4" fill="#101214"/><rect x="3" y="5.5" width="5" height="13" fill="#CE1126"/></svg>`,
  api: IC_('<path d="M9 7V3.5M15 7V3.5"/><path d="M7 7h10v3.5a5 5 0 0 1-10 0z"/><path d="M12 15.5V21"/>'),
  cloud: IC_('<path d="M17.5 19a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 6.3 12 4 4 0 0 0 7 19z"/>'),
  server: IC_('<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>'),
  globe: IC_('<circle cx="12" cy="12" r="8.7"/><path d="M3.3 12h17.4M12 3.3a13.5 13.5 0 0 1 0 17.4 13.5 13.5 0 0 1 0-17.4"/>'),
  heal: IC_('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
  check: IC_('<path d="M20 6L9 17l-5-5"/>'),
};

/* ---------------- i18n ---------------- */
const I18N = {
  en: {
    platform: "Agentic Platform for Government", login_title: "Wakeel", login_sub: "Sign in with your entity account",
    email: "Email address", password: "Password", signin: "Sign in", signing: "Signing in…", bad_login: "Invalid credentials",
    build: "Build", edit: "Edit", test: "Feedback", deploy: "Deploy", market: "Marketplace", community: "Community",
    st_design: "Design", st_deploy: "Deploy", st_test: "Test", st_ready: "Ready",
    smoke_ok: "Smoke test passed", smoke_fail: "Needs attention — review in Feedback",
    build_h: "What should your agent do?", build_sub: "Describe it in plain language — Wakeel builds it for you. Or just chat, or add your documents.",
    agent: "Build an Agent", chat_mode: "Chat", add_data: "Add data", go: "Build", hint: "↵ to build · Shift+↵ new line",
    chat_ph: "Ask anything — research a topic, draft a letter, summarize a document…",
    chat_hint: "↵ to send", send: "Send",
    kb_name: "Name (e.g. Trade License Policies)", kb_text: "Paste the content — policies, procedures, FAQs…",
    kb_save: "Add to knowledge", kb_saving: "Adding…", kb_saved: "Added. Your agents can now use this knowledge.",
    kb_existing: "Your knowledge", kb_docs: "documents", kb_words: "words",
    edit_h: "Edit an agent", edit_sub: "Open an agent to change how it works — chat with the Build Assistant inside, or adjust the steps visually.",
    community_h: "Community", community_sub: "Champions and use cases from government innovators across the UAE.",
    open_ext: "Open in a new tab ↗",
    ph: "e.g. Review a trade license application, check required fields, and draft an approval or rejection letter…",
    my_agents: "Your agents & workflows", open_studio: "Open in Studio",
    planning: "Planning the steps…", built: "Workflow designed — review the steps below", name_ph: "Name this agent",
    deploy_btn: "Deploy", deployed: "Deployed & published.", open: "Open", test_it: "Test it",
    chips: ["Summarize a citizen complaint and route it", "Check trade license application completeness", "Draft a bilingual approval letter", "Classify service requests by priority"],
    market_h: "Government Solutions Marketplace", market_sub: "Pre-built workflows for Abu Dhabi entities. Install to your workspace with one click.",
    all: "All departments", install: "Install", installing: "Building…", installed: "Installed", steps: "steps",
    test_h: "Feedback & testing", test_sub: "Give feedback as test cases with expected outcomes. Wakeel scores accuracy and self-heals failures.",
    pick: "Choose an agent", input: "Test input", expected: "Expected outcome", status: "Status", add_case: "+ Add case",
    run_tests: "Run tests", running: "Running…", accuracy: "Accuracy", passed: "passed", selfheal: "Self-heal & retest",
    healing: "Self-healing the workflow…", healed: "Workflow updated — re-running tests…",
    heal_note: "Self-healing sends failing cases back to the AI, which revises the workflow, then tests run again.",
    idle: "Idle", pass: "Pass", fail: "Fail", output: "Output",
    deploy_h: "Deploy & integrate", deploy_sub: "Publish your agent and take it to your channels and infrastructure.",
    publish: "Publish latest version", published: "Published", get_key: "Create API key", export_dsl: "Export package (DSL)",
    live: "Live", guide: "Guide", api_card: "Wakeel API", api_desc: "Call this agent from any government system via REST.",
    azure_card: "Microsoft Azure (UAE North)", azure_desc: "Run the full platform in your Azure tenancy for data residency. Export the package and deploy with the guide.",
    onprem_card: "On-Premises / Sovereign Cloud", onprem_desc: "Deploy inside your entity's datacenter with Docker Compose or Kubernetes.",
    web_card: "Web & TAMM channel", web_desc: "Share as a web app or embed into portals.",
    welcome: "Welcome", signout: "Sign out",
    created: "Created", activity: "Activity", no_activity: "No activity yet",
    settings: "Settings", def_model: "Default model for new agents", save: "Save", saved: "Saved",
    providers: "Model providers", configure: "Configure", active: "Active", not_conf: "Not configured",
    add_provider: "Add a provider", installing_p: "Installing…", act_provider: "Configured provider",
    gen_tests: "Generate test cases", generating: "Generating…", act_gen_tests: "Generated test cases",
    fb_label: "Your feedback for self-healing", fb_ph: "e.g. Replies must always end with a bilingual English/Arabic signature…",
    gen_hint: "Review the generated cases — edit any of them, remove ones you disagree with, or add your own.",
    act_login: "Signed in", act_build: "Built an agent", act_install: "Installed from marketplace",
    act_test: "Ran a test", act_heal: "Self-healed an agent", act_data: "Added knowledge",
    act_chat: "Chat", act_publish: "Published an agent",
  },
  ar: {
    platform: "المنصة الوكيلة للجهات الحكومية", login_title: "وكيل", login_sub: "سجّل الدخول بحساب جهتك",
    email: "البريد الإلكتروني", password: "كلمة المرور", signin: "تسجيل الدخول", signing: "جارٍ الدخول…", bad_login: "بيانات غير صحيحة",
    build: "بناء", edit: "تعديل", test: "التقييم", deploy: "نشر", market: "السوق", community: "المجتمع",
    st_design: "تصميم", st_deploy: "نشر", st_test: "اختبار", st_ready: "جاهز",
    smoke_ok: "نجح الاختبار الأولي", smoke_fail: "يحتاج مراجعة — راجع التقييم",
    build_h: "ماذا تريد أن يفعل وكيلك؟", build_sub: "صِف المطلوب بلغة بسيطة — وكيل يبنيه لك. أو تحدّث معه، أو أضف مستنداتك.",
    agent: "بناء وكيل", chat_mode: "محادثة", add_data: "أضف بيانات", go: "ابنِ", hint: "↵ للبناء · Shift+↵ سطر جديد",
    chat_ph: "اسأل عن أي شيء — ابحث في موضوع، اكتب خطاباً، لخّص مستنداً…",
    chat_hint: "↵ للإرسال", send: "أرسل",
    kb_name: "الاسم (مثال: سياسات الرخص التجارية)", kb_text: "الصق المحتوى — سياسات، إجراءات، أسئلة شائعة…",
    kb_save: "أضف إلى المعرفة", kb_saving: "جارٍ الإضافة…", kb_saved: "تمت الإضافة. يمكن لوكلائك الآن استخدام هذه المعرفة.",
    kb_existing: "معرفتك", kb_docs: "مستندات", kb_words: "كلمة",
    edit_h: "عدّل وكيلاً", edit_sub: "افتح وكيلاً لتغيير طريقة عمله — تحدّث مع مساعد البناء بداخله أو عدّل الخطوات بصرياً.",
    community_h: "المجتمع", community_sub: "روّاد وحالات استخدام من مبتكري الحكومة في الإمارات.",
    open_ext: "افتح في تبويب جديد ↗",
    ph: "مثال: راجع طلب رخصة تجارية وتحقق من الحقول المطلوبة وأنشئ خطاب موافقة أو رفض…",
    my_agents: "وكلاؤك وسير أعمالك", open_studio: "افتح في الاستوديو",
    planning: "جارٍ تخطيط الخطوات…", built: "تم تصميم سير العمل — راجع الخطوات أدناه", name_ph: "اسم الوكيل",
    deploy_btn: "انشر", deployed: "تم النشر بنجاح.", open: "افتح", test_it: "اختبره",
    chips: ["لخّص شكوى متعامل ووجّهها", "تحقق من اكتمال طلب رخصة تجارية", "أنشئ خطاب موافقة ثنائي اللغة", "صنّف طلبات الخدمة حسب الأولوية"],
    market_h: "سوق الحلول الحكومية", market_sub: "سير عمل جاهزة لجهات أبوظبي — ثبّتها في مساحتك بنقرة واحدة.",
    all: "كل الجهات", install: "تثبيت", installing: "جارٍ البناء…", installed: "تم التثبيت", steps: "خطوات",
    test_h: "التقييم والاختبار", test_sub: "شغّل حالات اختبار بنتائج متوقعة — وكيل يقيس الدقة ويعالج الإخفاقات ذاتياً.",
    pick: "اختر وكيلاً", input: "مدخل الاختبار", expected: "النتيجة المتوقعة", status: "الحالة", add_case: "+ أضف حالة",
    run_tests: "شغّل الاختبارات", running: "جارٍ التشغيل…", accuracy: "الدقة", passed: "ناجحة", selfheal: "معالجة ذاتية وإعادة اختبار",
    healing: "جارٍ المعالجة الذاتية…", healed: "تم تحديث سير العمل — إعادة الاختبار…",
    heal_note: "المعالجة الذاتية تعيد الحالات الفاشلة إلى الذكاء الاصطناعي ليعدّل سير العمل ثم تُعاد الاختبارات.",
    idle: "قيد الانتظار", pass: "نجاح", fail: "إخفاق", output: "الناتج",
    deploy_h: "النشر والتكامل", deploy_sub: "انشر وكيلك وادمجه في قنواتك وبنيتك التحتية.",
    publish: "انشر أحدث نسخة", published: "منشور", get_key: "أنشئ مفتاح API", export_dsl: "صدّر الحزمة (DSL)",
    live: "مباشر", guide: "دليل", api_card: "واجهة وكيل البرمجية", api_desc: "استدعِ هذا الوكيل من أي نظام حكومي عبر REST.",
    azure_card: "مايكروسوفت أزور (الإمارات الشمالية)", azure_desc: "شغّل المنصة في بيئة أزور الخاصة بجهتك لسيادة البيانات — صدّر الحزمة واتبع الدليل.",
    onprem_card: "داخل مركز البيانات / سحابة سيادية", onprem_desc: "انشر داخل مركز بيانات جهتك عبر Docker أو Kubernetes.",
    web_card: "الويب وقناة تم", web_desc: "شارك كتطبيق ويب أو ادمجه في البوابات.",
    welcome: "مرحباً", signout: "تسجيل الخروج",
    created: "أُنشئ", activity: "سجل النشاط", no_activity: "لا يوجد نشاط بعد",
    settings: "الإعدادات", def_model: "النموذج الافتراضي للوكلاء الجدد", save: "احفظ", saved: "تم الحفظ",
    providers: "مزوّدو النماذج", configure: "إعداد", active: "مفعّل", not_conf: "غير مُعدّ",
    add_provider: "أضف مزوّداً", installing_p: "جارٍ التثبيت…", act_provider: "أعدّ مزوّداً",
    gen_tests: "ولّد حالات اختبار", generating: "جارٍ التوليد…", act_gen_tests: "ولّد حالات اختبار",
    fb_label: "ملاحظاتك للمعالجة الذاتية", fb_ph: "مثال: يجب أن تنتهي الردود دائماً بتوقيع ثنائي اللغة…",
    gen_hint: "راجع الحالات المولّدة — عدّل أياً منها أو احذف ما لا توافق عليه أو أضف حالاتك.",
    act_login: "تسجيل دخول", act_build: "بنى وكيلاً", act_install: "ثبّت من السوق",
    act_test: "شغّل اختباراً", act_heal: "معالجة ذاتية لوكيل", act_data: "أضاف معرفة",
    act_chat: "محادثة", act_publish: "نشر وكيلاً",
  },
};
let LANG = localStorage.getItem("wakeel_lang") || "en";
const t = k => (I18N[LANG][k] !== undefined ? I18N[LANG][k] : I18N.en[k] || k);
function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(typeof ts === "number" ? ts * 1000 : ts);
  if (isNaN(d)) return "";
  return new Intl.DateTimeFormat(LANG === "ar" ? "ar-AE" : "en-GB",
    { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}
function timeAgo(ts) {
  const s = Math.max(1, Math.floor(Date.now() / 1000 - ts));
  const units = [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [sec, u] of units) if (s >= sec) return Math.floor(s / sec) + u;
  return s + "s";
}
function applyDir() { document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr"; document.documentElement.lang = LANG; }

/* ---------------- marketplace data: 10 Abu Dhabi entities × 5 workflows ---------------- */
const DEPTS = [
  { id: "chamber", icn: "chamber", en: "Abu Dhabi Chamber", ar: "غرفة أبوظبي", ic: "🏛️" },
  { id: "added", icn: "economy", en: "Economic Development (ADDED)", ar: "دائرة التنمية الاقتصادية", ic: "📈" },
  { id: "tamm", icn: "digital", en: "TAMM / Digital Government", ar: "تم — الحكومة الرقمية", ic: "🖥️" },
  { id: "dmt", icn: "municipality", en: "Municipalities & Transport", ar: "دائرة البلديات والنقل", ic: "🏗️" },
  { id: "doh", icn: "health", en: "Department of Health", ar: "دائرة الصحة", ic: "🏥" },
  { id: "adek", icn: "education", en: "Education & Knowledge (ADEK)", ar: "دائرة التعليم والمعرفة", ic: "🎓" },
  { id: "adjd", icn: "justice", en: "Judicial Department", ar: "دائرة القضاء", ic: "⚖️" },
  { id: "police", icn: "police", en: "Abu Dhabi Police", ar: "شرطة أبوظبي", ic: "🛡️" },
  { id: "fta", icn: "tax", en: "Federal Tax Authority", ar: "الهيئة الاتحادية للضرائب", ic: "🧾" },
  { id: "icp", icn: "identity", en: "Identity & Citizenship (ICP)", ar: "الهوية والجنسية", ic: "🪪" },
];
const TPL = [
  // Chamber
  { d: "chamber", en: "Membership Renewal Assistant", ar: "مساعد تجديد العضوية", ds: "Reviews a membership renewal request, checks required details, drafts the approval letter.", i: "Take a company membership renewal request text, verify company name, license number and expiry are present, then draft a formal approval letter or a list of missing items." },
  { d: "chamber", en: "Certificate of Origin Checker", ar: "مدقق شهادة المنشأ", ds: "Validates certificate-of-origin requests and drafts the response.", i: "Take a certificate of origin request, check exporter, goods description and destination country are present, then draft an approval note or request for missing information." },
  { d: "chamber", en: "Trade Inquiry Responder", ar: "الرد على الاستفسارات التجارية", ds: "Answers member trade inquiries in formal bilingual tone.", i: "Take a trade inquiry from a member company, summarize the question, and draft a helpful formal reply in English and Arabic." },
  { d: "chamber", en: "Event Registration Summarizer", ar: "ملخص تسجيل الفعاليات", ds: "Summarizes event registrations for the events team.", i: "Take a list of event registration entries and produce a summary with counts by company size and a highlights list." },
  { d: "chamber", en: "Member Feedback Analyzer", ar: "محلل ملاحظات الأعضاء", ds: "Classifies member feedback and proposes actions.", i: "Take member feedback text, classify sentiment and topic, then propose two concrete follow-up actions." },
  // ADDED
  { d: "added", en: "Trade License Reviewer", ar: "مراجع الرخص التجارية", ds: "Pre-screens trade license applications for completeness.", i: "Take a trade license application summary, check activity, trade name, owner details and documents are present, output a completeness report and a draft decision." },
  { d: "added", en: "License Renewal Reminder", ar: "تذكير تجديد الرخصة", ds: "Drafts renewal reminders from license records.", i: "Take a license record with expiry date and company details, and draft a professional renewal reminder in English and Arabic." },
  { d: "added", en: "Inspection Report Summarizer", ar: "ملخص تقارير التفتيش", ds: "Condenses inspection reports into decisions & actions.", i: "Take a field inspection report, summarize violations found, severity, and produce a recommended action list." },
  { d: "added", en: "Investor Query Assistant", ar: "مساعد استفسارات المستثمرين", ds: "Answers investor questions about setting up in Abu Dhabi.", i: "Take an investor question about starting a business in Abu Dhabi and draft a clear, structured answer with next steps." },
  { d: "added", en: "Trade Name Validator", ar: "مدقق الاسم التجاري", ds: "Checks proposed trade names against naming rules.", i: "Take a proposed trade name, check it against common naming rules (no offensive words, no religious references, not misleading), and output pass/fail with reasons." },
  // TAMM
  { d: "tamm", en: "Service Request Triage", ar: "فرز طلبات الخدمة", ds: "Classifies incoming service requests and routes them.", i: "Take a citizen service request, classify it by category and urgency, and output the routing decision with a short justification." },
  { d: "tamm", en: "Complaint Router", ar: "موجّه الشكاوى", ds: "Routes complaints to the right entity with a summary.", i: "Take a citizen complaint, identify the responsible government entity, summarize the complaint in two sentences, and draft an acknowledgment message." },
  { d: "tamm", en: "Service Guide Assistant", ar: "مساعد دليل الخدمات", ds: "Explains how to complete a government service.", i: "Take a question about a government service and produce a step-by-step guide with required documents and fees placeholders." },
  { d: "tamm", en: "Customer Sentiment Analyzer", ar: "محلل مشاعر المتعاملين", ds: "Scores feedback sentiment for the happiness index.", i: "Take customer feedback text, output sentiment score 1-10, key drivers, and one improvement suggestion." },
  { d: "tamm", en: "Appointment Confirmation Drafter", ar: "مسودة تأكيد المواعيد", ds: "Creates bilingual appointment confirmations.", i: "Take appointment details (service, date, location) and draft a bilingual English/Arabic confirmation message." },
  // DMT
  { d: "dmt", en: "Building Permit Pre-Check", ar: "الفحص المسبق لرخص البناء", ds: "Pre-validates permit applications before review.", i: "Take a building permit application summary, check plot, consultant, drawings and NOC references are present, and output a pre-check report." },
  { d: "dmt", en: "Parking Fine Appeal Reviewer", ar: "مراجع اعتراضات المواقف", ds: "Assesses appeals and drafts decisions.", i: "Take a parking fine appeal, assess the justification, and draft an accept or reject decision with reasoning." },
  { d: "dmt", en: "Road Incident Summarizer", ar: "ملخص بلاغات الطرق", ds: "Summarizes road incident reports for dispatch.", i: "Take a road incident report, extract location, severity and required crew, and output a dispatch summary." },
  { d: "dmt", en: "Contractor Document Verifier", ar: "مدقق مستندات المقاولين", ds: "Checks contractor submissions for completeness.", i: "Take a contractor document submission list, compare with required documents for classification, and output missing items." },
  { d: "dmt", en: "Facility Feedback Analyzer", ar: "محلل ملاحظات المرافق", ds: "Turns public facility feedback into maintenance actions.", i: "Take public feedback about a facility, classify the issue type, and produce a prioritized maintenance action." },
  // DoH
  { d: "doh", en: "Medical License Screener", ar: "فاحص التراخيص الطبية", ds: "Pre-screens healthcare professional license applications.", i: "Take a medical professional license application summary, check qualifications, experience and documents, and output an eligibility pre-screen." },
  { d: "doh", en: "Patient Complaint Classifier", ar: "مصنف شكاوى المرضى", ds: "Classifies patient complaints by severity & type.", i: "Take a patient complaint, classify severity (critical/major/minor) and type, and draft an acknowledgment with next steps." },
  { d: "doh", en: "Facility Inspection Summarizer", ar: "ملخص تفتيش المنشآت الصحية", ds: "Summarizes clinical inspection findings.", i: "Take a health facility inspection report and produce a findings summary with compliance score and corrective actions." },
  { d: "doh", en: "Insurance Pre-Approval Drafter", ar: "مسودة الموافقات التأمينية", ds: "Drafts insurance pre-approval assessments.", i: "Take a treatment pre-approval request, check policy criteria mentioned, and draft an approval or more-information letter." },
  { d: "doh", en: "Health Advisory Writer", ar: "كاتب الإرشادات الصحية", ds: "Writes bilingual public health advisories.", i: "Take a health topic and key facts, and write a short public advisory in English and Arabic." },
  // ADEK
  { d: "adek", en: "School Registration Assistant", ar: "مساعد تسجيل المدارس", ds: "Guides parents through school registration.", i: "Take a parent's school registration question, and produce required documents, steps, and deadlines guidance." },
  { d: "adek", en: "Scholarship Application Reviewer", ar: "مراجع طلبات البعثات", ds: "Screens scholarship applications against criteria.", i: "Take a scholarship application summary, evaluate against GPA, major and age criteria, and output an eligibility assessment." },
  { d: "adek", en: "Parent Inquiry Responder", ar: "الرد على استفسارات أولياء الأمور", ds: "Answers parent inquiries formally.", i: "Take a parent inquiry about schooling, summarize it, and draft a warm formal reply with the relevant policy points." },
  { d: "adek", en: "Teacher License Checker", ar: "مدقق رخص المعلمين", ds: "Verifies teacher licensing requirements.", i: "Take a teacher's profile summary, check degree, experience and training requirements, and output a licensing checklist result." },
  { d: "adek", en: "School Report Summarizer", ar: "ملخص تقارير المدارس", ds: "Summarizes school performance reports.", i: "Take a school performance report and output strengths, weaknesses and three recommended interventions." },
  // ADJD
  { d: "adjd", en: "Case Filing Assistant", ar: "مساعد قيد الدعاوى", ds: "Prepares case filing summaries and checks documents.", i: "Take a case filing request, check parties, claim type and documents are present, and output a filing readiness summary." },
  { d: "adjd", en: "Legal Document Summarizer", ar: "ملخص المستندات القانونية", ds: "Summarizes legal documents into plain language.", i: "Take a legal document text and produce a plain-language summary with key obligations and dates." },
  { d: "adjd", en: "Hearing Schedule Notifier", ar: "إشعارات الجلسات", ds: "Drafts hearing notifications for parties.", i: "Take hearing details (case number, date, court room) and draft formal bilingual notifications for both parties." },
  { d: "adjd", en: "Contract Clause Extractor", ar: "مستخرج بنود العقود", ds: "Extracts key clauses & risks from contracts.", i: "Take a contract text, extract parties, term, payment, termination and liability clauses, and flag unusual terms." },
  { d: "adjd", en: "Legal Translation Drafter", ar: "مسودة الترجمة القانونية", ds: "Drafts EN↔AR legal translations for review.", i: "Take a short legal text and produce a careful Arabic translation with translator notes for ambiguous terms." },
  // Police
  { d: "police", en: "Incident Report Classifier", ar: "مصنف البلاغات", ds: "Classifies incident reports by type & priority.", i: "Take an incident report, classify type and priority, and output the classification with the recommended unit." },
  { d: "police", en: "Lost & Found Matcher", ar: "مطابق المفقودات", ds: "Matches lost item reports with found items.", i: "Take a lost item description and a list of found items, and output the best matches with confidence notes." },
  { d: "police", en: "Traffic Appeal Reviewer", ar: "مراجع التظلمات المرورية", ds: "Reviews traffic fine appeals and drafts decisions.", i: "Take a traffic fine appeal, evaluate the claim, and draft an accept/reject decision with reasoning." },
  { d: "police", en: "Community Tip Triage", ar: "فرز بلاغات المجتمع", ds: "Triages community tips for follow-up.", i: "Take a community tip, assess credibility and urgency, and output a triage decision with next action." },
  { d: "police", en: "Report Summary Generator", ar: "مولد ملخص التقارير", ds: "Generates executive summaries of long reports.", i: "Take a long incident report and produce a one-paragraph executive summary and a bullet timeline." },
  // FTA
  { d: "fta", en: "VAT Registration Screener", ar: "فاحص تسجيل ضريبة القيمة المضافة", ds: "Pre-screens VAT registration applications.", i: "Take a VAT registration application summary, check turnover threshold and documents, and output an eligibility screen." },
  { d: "fta", en: "Tax Query Assistant", ar: "مساعد الاستفسارات الضريبية", ds: "Answers routine tax questions clearly.", i: "Take a taxpayer question, and draft a clear answer with the relevant rule summarized in plain language." },
  { d: "fta", en: "Return Anomaly Explainer", ar: "شرح ملاحظات الإقرارات", ds: "Explains anomalies found in tax returns.", i: "Take a tax return anomaly description and draft a clear letter asking the taxpayer for clarification." },
  { d: "fta", en: "Penalty Appeal Drafter", ar: "مسودة اعتراض الغرامات", ds: "Assesses penalty appeals and drafts outcomes.", i: "Take a penalty appeal, evaluate the stated cause against common waiver criteria, and draft a decision." },
  { d: "fta", en: "Invoice Compliance Checker", ar: "مدقق توافق الفواتير", ds: "Checks invoices against e-invoicing rules.", i: "Take an invoice's field list, check required VAT invoice fields are present, and output a compliance report." },
  // ICP
  { d: "icp", en: "Visa Application Pre-Screener", ar: "الفحص المسبق للتأشيرات", ds: "Pre-screens visa applications for completeness.", i: "Take a visa application summary, check passport validity, sponsor and documents, and output a pre-screen result." },
  { d: "icp", en: "Document Expiry Notifier", ar: "إشعار انتهاء المستندات", ds: "Drafts expiry reminders for IDs & permits.", i: "Take a resident's document record with expiry dates and draft a bilingual reminder listing renewal steps." },
  { d: "icp", en: "Golden Visa Eligibility Checker", ar: "مدقق أهلية الإقامة الذهبية", ds: "Checks golden visa eligibility categories.", i: "Take an applicant profile, evaluate against golden visa categories (investor, talent, student), and output eligibility with the strongest category." },
  { d: "icp", en: "Application Status Explainer", ar: "شرح حالة الطلب", ds: "Explains application statuses in simple terms.", i: "Take an application status code and history, and draft a simple explanation of where the application stands and what happens next." },
  { d: "icp", en: "Family Sponsorship Assistant", ar: "مساعد إقامة العائلة", ds: "Guides family sponsorship requirements.", i: "Take a sponsor's situation summary and output the family sponsorship requirements, documents and steps." },
];

/* ---------------- state ---------------- */
let ME = null, APPS = [], MODE = "workflow", LASTGRAPH = null, TAB = "build";
let CASES = [{ input: "", expected: "", status: "idle" }];
let TESTAPP = "", TESTBUSY = false, DEPT = "all", INSTALLED = {};

async function api(method, path, body) {
  const r = await fetch("api/" + path, {
    method, headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined, credentials: "include",
  });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401) { ME = null; renderLogin(); throw new Error("session expired"); }
  if (!r.ok) throw new Error(d.error || r.status);
  return d;
}

/* ---------------- login ---------------- */
function renderLogin() {
  applyDir();
  $("#root").innerHTML = `
  <div class="login">
    <div class="login-card fade">
      <div class="mark"><span>وكيل</span></div>
      <h1>${t("login_title")} <span class="ar-name">${LANG === "ar" ? "Wakeel" : "وكيل"}</span></h1>
      <div class="sub">${t("platform")}<br>${t("login_sub")}</div>
      <div class="field"><label>${t("email")}</label><input id="em" type="email" autocomplete="username" /></div>
      <div class="field"><label>${t("password")}</label><input id="pw" type="password" autocomplete="current-password" /></div>
      <button class="btn block" id="go">${t("signin")}</button>
      <div class="err" id="err"></div>
      <div class="foot">${IC.uae} Government of Abu Dhabi · <a href="#" id="langsw" style="color:var(--green)">${LANG === "en" ? "العربية" : "English"}</a></div>
    </div>
  </div>`;
  $("#langsw").onclick = e => { e.preventDefault(); LANG = LANG === "en" ? "ar" : "en"; localStorage.setItem("wakeel_lang", LANG); renderLogin(); };
  const go = async () => {
    $("#go").disabled = true; $("#go").textContent = t("signing"); $("#err").textContent = "";
    try {
      await api("POST", "login", { email: $("#em").value.trim(), password: $("#pw").value });
      await boot();
    } catch (e) { $("#err").textContent = t("bad_login"); $("#go").disabled = false; $("#go").textContent = t("signin"); }
  };
  $("#go").onclick = go;
  $("#pw").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
}

/* ---------------- shell ---------------- */
function renderShell() {
  applyDir();
  const tabs = [
    ["build", t("build"), '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>'],
    ["edit", t("edit"), '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 20h4L20 8l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>'],
    ["test", t("test"), '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 12l2 2 4-5"/><circle cx="12" cy="12" r="9"/></svg>'],
    ["deploy", t("deploy"), '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'],
    ["market", t("market"), '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 7h16l-1.5 12h-13z"/><path d="M8 7a4 4 0 0 1 8 0"/></svg>'],
    ["community", t("community"), '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="9" cy="8" r="3.2"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M13.5 18.5a4.3 4.3 0 0 1 7 -2.7"/></svg>'],
  ];
  $("#root").innerHTML = `
  <div class="shell">
    <div class="topbar">
      <div class="brand">
        <div class="mark"><span>وكيل</span></div>
        <div><div class="brand-name">Wakeel</div><div class="brand-sub">${t("platform")}</div></div>
      </div>
      <div class="tabs">${tabs.map(([id, label, ic]) => `<button class="tab ${TAB === id ? "active" : ""}" data-tab="${id}">${ic}${label}</button>`).join("")}</div>
      <div class="top-right">
        <button class="lang" id="gear" title="${t("settings")}"><svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2z"/></svg></button>
        <button class="lang" id="lang">${LANG === "en" ? "العربية" : "EN"}</button>
        <div class="avatar" id="avatar" title="${esc(ME.email)}">${esc((ME.email || "U")[0].toUpperCase())}</div>
      </div>
    </div>
    <div class="main" id="view"></div>
    <div class="bottomnav">${tabs.map(([id, label, ic]) => `<button class="bn-i ${TAB === id ? "active" : ""}" data-tab="${id}">${ic}<span>${label}</span></button>`).join("")}</div>
  </div>`;
  document.querySelectorAll(".tab, .bn-i").forEach(b => b.onclick = () => { TAB = b.dataset.tab; location.hash = TAB; renderShell(); });
  $("#lang").onclick = () => { LANG = LANG === "en" ? "ar" : "en"; localStorage.setItem("wakeel_lang", LANG); renderShell(); };
  $("#avatar").onclick = toggleProfile;
  $("#gear").onclick = openSettings;
  ({ build: renderBuild, edit: renderEdit, test: renderTest, deploy: renderDeploy, market: renderMarket, community: renderCommunity }[TAB])();
}

/* ---------------- BUILD ---------------- */
let BMODE = "agent";           // agent | chat | data
let CHAT = [];                 // chat history for the Chat mode

function renderBuild() {
  const pills = `
    <div class="mode-row">
      <button class="pill ${BMODE === "agent" ? "active" : ""}" data-m="agent">${IC.agent} ${t("agent")}</button>
      <button class="pill ${BMODE === "chat" ? "active" : ""}" data-m="chat">${IC.chat} ${t("chat_mode")}</button>
      <button class="pill ${BMODE === "data" ? "active" : ""}" data-m="data">${IC.data} ${t("add_data")}</button>
    </div>`;
  let inner = "";
  if (BMODE === "agent") {
    inner = `
    <div class="composer">${pills}
      <textarea id="ins" placeholder="${esc(t("ph"))}"></textarea>
      <div class="composer-foot"><span class="hint">${t("hint")}</span><button class="btn" id="build">${t("go")} →</button></div>
    </div>
    <div class="chips">${t("chips").map(c => `<button class="chip">${esc(c)}</button>`).join("")}</div>
    <div class="feed" id="feed"></div>
    <div class="sect-h"><h3>${t("my_agents")}</h3></div>
    <div class="grid" id="agents"><div class="empty">…</div></div>`;
  } else if (BMODE === "chat") {
    inner = `
    <div class="composer">${pills}
      <div class="feed" id="chatlog" style="margin:6px 0 10px;max-height:46vh;overflow:auto"></div>
      <textarea id="cmsg" placeholder="${esc(t("chat_ph"))}"></textarea>
      <div class="composer-foot"><span class="hint">${t("chat_hint")}</span><button class="btn" id="csend">${t("send")} →</button></div>
    </div>`;
  } else {
    inner = `
    <div class="composer">${pills}
      <div class="field" style="margin-top:6px"><input id="kbn" placeholder="${esc(t("kb_name"))}" style="width:100%;border:1px solid var(--hairline);border-radius:12px;padding:11px 14px;font-size:14px;outline:0"/></div>
      <textarea id="kbt" placeholder="${esc(t("kb_text"))}" style="min-height:140px"></textarea>
      <div class="composer-foot"><span class="hint" id="kbmsg"></span><button class="btn" id="kbsave">${t("kb_save")} ↑</button></div>
    </div>
    <div class="sect-h"><h3>${t("kb_existing")}</h3></div>
    <div class="grid" id="kblist"><div class="empty">…</div></div>`;
  }
  $("#view").innerHTML = `
  <div class="fade">
    <div class="build-hero">
      <div class="halo">✦</div>
      <h2>${t("build_h")}</h2><p>${t("build_sub")}</p>
    </div>
    ${inner}
  </div>`;
  document.querySelectorAll(".pill").forEach(p => p.onclick = () => { BMODE = p.dataset.m; renderBuild(); });

  if (BMODE === "agent") {
    document.querySelectorAll(".chip").forEach(c => c.onclick = () => { $("#ins").value = c.textContent; $("#ins").focus(); });
    $("#build").onclick = doBuild;
    $("#ins").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doBuild(); } });
    loadAgents();
    if (window.__prefill) { $("#ins").value = window.__prefill; window.__prefill = null; doBuild(); }
  } else if (BMODE === "chat") {
    drawChat();
    $("#csend").onclick = doChat;
    $("#cmsg").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doChat(); } });
    $("#cmsg").focus();
  } else {
    $("#kbsave").onclick = doAddData;
    loadKnowledge();
  }
}

function drawChat() {
  const log = $("#chatlog"); if (!log) return;
  log.innerHTML = "";
  CHAT.forEach(m => {
    const d = document.createElement("div");
    if (m.role === "user") { d.className = "bubble-me"; d.textContent = m.content; }
    else { d.className = "evt"; d.innerHTML = `<div class="ic">و</div><div style="white-space:pre-wrap;font-size:14px">${esc(m.content)}</div>`; }
    log.appendChild(d);
  });
  log.scrollTop = log.scrollHeight;
}

async function doChat() {
  const msg = $("#cmsg").value.trim(); if (!msg) return;
  $("#cmsg").value = "";
  CHAT.push({ role: "user", content: msg }); drawChat();
  const log = $("#chatlog");
  const w = document.createElement("div"); w.className = "evt run";
  w.innerHTML = `<div class="ic"><div class="spin"></div></div><div class="st">…</div>`;
  log.appendChild(w); log.scrollTop = log.scrollHeight;
  try {
    const r = await api("POST", "chat", { message: msg, history: CHAT.slice(0, -1) });
    CHAT.push({ role: "assistant", content: r.reply });
  } catch (e) { CHAT.push({ role: "assistant", content: "⚠️ " + e.message }); }
  drawChat();
}

async function doAddData() {
  const name = $("#kbn").value.trim(), text = $("#kbt").value.trim();
  if (!name || !text) return;
  $("#kbsave").disabled = true; $("#kbmsg").textContent = t("kb_saving");
  try {
    await api("POST", "knowledge", { name, text });
    $("#kbmsg").textContent = "✅ " + t("kb_saved");
    $("#kbn").value = ""; $("#kbt").value = "";
    loadKnowledge();
  } catch (e) { $("#kbmsg").textContent = "⚠️ " + e.message; }
  finally { $("#kbsave").disabled = false; }
}

async function loadKnowledge() {
  try {
    const d = await api("GET", "knowledge");
    const el = $("#kblist"); if (!el) return;
    el.innerHTML = (d.knowledge || []).length ? "" : `<div class="empty">—</div>`;
    (d.knowledge || []).forEach(k => {
      const c = document.createElement("div");
      c.className = "acard";
      c.innerHTML = `<div class="ic">${IC.book}</div><div class="nm">${esc(k.name)}</div><div class="md">${k.docs || 0} ${t("kb_docs")} · ${k.words || 0} ${t("kb_words")}</div>`;
      el.appendChild(c);
    });
  } catch (e) {}
}

let EDITAPP = "";

function gotoEdit(id) { EDITAPP = id; TAB = "edit"; location.hash = "edit"; renderShell(); }

function renderEdit() {
  if (EDITAPP) {
    const app = APPS.find(a => a.id === EDITAPP);
    // full-bleed editor: fills everything under the topbar, edge to edge
    $("#view").innerHTML = `
    <div class="fade" style="position:fixed;top:61px;left:0;right:0;bottom:var(--bnav,0px);z-index:30;display:flex;flex-direction:column;background:var(--bg)">
      <div style="display:flex;align-items:center;gap:12px;padding:8px 16px;border-bottom:1px solid var(--hairline-2);background:rgba(255,255,255,.85);backdrop-filter:blur(16px)">
        <button class="btn quiet sm" id="edback">← ${t("edit_h")}</button>
        <div style="font-weight:750">${esc(app ? app.name : "")}</div>
        <button class="btn sm" id="edtest" style="margin-inline-start:auto">${t("test")} →</button>
      </div>
      <iframe src="/app/${EDITAPP}/workflow" style="flex:1;width:100%;border:0;background:#fff" title="Editor"></iframe>
    </div>`;
    $("#edback").onclick = () => { EDITAPP = ""; renderEdit(); };
    $("#edtest").onclick = () => { TESTAPP = EDITAPP; TAB = "test"; location.hash = "test"; renderShell(); };
    return;
  }
  $("#view").innerHTML = `
  <div class="fade">
    <h1 class="view-title">${t("edit_h")}</h1><p class="view-sub">${t("edit_sub")}</p>
    <div class="grid" id="editlist"><div class="empty">…</div></div>
  </div>`;
  api("GET", "apps").then(d => {
    APPS = d.apps || [];
    const el = $("#editlist");
    el.innerHTML = APPS.length ? "" : `<div class="empty">—</div>`;
    APPS.forEach(a => {
      const c = document.createElement("div");
      c.className = "acard";
      c.innerHTML = `<div class="ic">${a.mode === "workflow" ? IC.flow : IC.chat}</div><div class="nm">${esc(a.name)}</div><div class="md">${a.mode} · ${t("created")} ${fmtDate(a.created_at)}</div>`;
      c.onclick = () => gotoEdit(a.id);
      el.appendChild(c);
    });
  });
}

function renderCommunity() {
  const src = `http://${location.hostname}:8081/`;
  // full-bleed: fills everything under the topbar, edge to edge
  $("#view").innerHTML = `
  <div class="fade" style="position:fixed;top:61px;left:0;right:0;bottom:var(--bnav,0px);z-index:30;display:flex;flex-direction:column;background:var(--bg)">
    <div style="display:flex;align-items:center;gap:12px;padding:8px 16px;border-bottom:1px solid var(--hairline-2);background:rgba(255,255,255,.85);backdrop-filter:blur(16px)">
      <div style="font-weight:750">${t("community_h")}</div>
      <div style="font-size:12.5px;color:var(--muted)">${t("community_sub")}</div>
      <a class="btn quiet sm" style="margin-inline-start:auto" href="https://champions.innoventures.ae" target="_blank">${t("open_ext")}</a>
    </div>
    <iframe src="${src}" style="flex:1;width:100%;border:0;background:#fff" title="Community"></iframe>
  </div>`;
}

function makeStepper() {
  const stages = [t("st_design"), t("st_deploy"), t("st_test"), t("st_ready")];
  const w = document.createElement("div");
  w.className = "stepper";
  w.innerHTML = stages.map((n, i) =>
    `<div class="step-i" data-s="${i}"><div class="dot">${i + 1}</div>${esc(n)}</div>${i < stages.length - 1 ? '<div class="step-line"></div>' : ""}`
  ).join("");
  $("#feed").appendChild(w); w.scrollIntoView({ behavior: "smooth", block: "end" });
  return {
    set(i, state) {
      const el = w.querySelector(`[data-s="${i}"]`); if (!el) return;
      el.className = "step-i " + state;
      const dot = el.querySelector(".dot");
      dot.innerHTML = state === "done" ? "✓" : state === "run" ? '<div class="spin"></div>' : state === "fail" ? "✕" : String(i + 1);
    },
  };
}

function evt(cls, icon, title, sub, right) {
  const d = document.createElement("div");
  d.className = "evt " + cls;
  d.innerHTML = `<div class="ic">${icon}</div><div><div class="tt">${esc(title)}</div>${sub ? `<div class="st">${esc(sub)}</div>` : ""}</div><div class="right">${right || ""}</div>`;
  $("#feed").appendChild(d); d.scrollIntoView({ behavior: "smooth", block: "end" });
  return d;
}

async function doBuild() {
  const ins = $("#ins").value.trim(); if (!ins) return;
  $("#feed").innerHTML = "";
  const me = document.createElement("div"); me.className = "bubble-me"; me.textContent = ins;
  $("#feed").appendChild(me);
  const plan = evt("run", '<div class="spin"></div>', t("planning"), "", "");
  $("#build").disabled = true;
  try {
    const g = await api("POST", "generate", { mode: "workflow", instruction: ins });
    plan.remove();
    if (!g.nodes.length) { evt("err", "⚠️", g.error || "Failed", ""); return; }
    LASTGRAPH = g.graph;
    evt("ok", "✓", t("built"), g.message || "");
    // steps pop one by one — live feel
    for (let i = 0; i < g.nodes.length; i++) {
      await new Promise(r => setTimeout(r, 260));
      evt("ok", String(i + 1), g.nodes[i].title || g.nodes[i].type, g.nodes[i].type, "");
    }
    const row = document.createElement("div");
    row.className = "deploy-row";
    row.innerHTML = `<input id="nm" value="${esc((g.message || ins).split(/[.\n]/)[0].slice(0, 40))}" placeholder="${esc(t("name_ph"))}"/><button class="btn" id="dep">${t("deploy_btn")} ↑</button>`;
    $("#feed").appendChild(row);
    $("#dep").onclick = async () => {
      $("#dep").disabled = true;
      const st = makeStepper();                 // Design ✓ → Deploy … → Test → Ready
      st.set(0, "done"); st.set(1, "run");
      try {
        const d = await api("POST", "deploy", { mode: "workflow", name: $("#nm").value.trim() || "Wakeel Agent", graph: LASTGRAPH });
        st.set(1, "done"); st.set(2, "run");
        TESTAPP = d.id;
        // automatic smoke test — run the agent once and judge the output
        let smokeOk = false, smokeNote = "";
        try {
          const r = await api("POST", "test-case", {
            app_id: d.id, input: ins.slice(0, 500),
            expected: "a coherent, professional output that correctly performs the described task",
          });
          smokeOk = !!r.pass; smokeNote = r.reason || "";
        } catch (e) { smokeNote = e.message; }
        st.set(2, smokeOk ? "done" : "fail"); st.set(3, smokeOk ? "done" : "idle");
        const s = document.createElement("div");
        s.className = "success-card";
        s.innerHTML = `${smokeOk ? "✅ " + t("smoke_ok") + ". " : "⚠️ " + t("smoke_fail") + ". "}` +
          `${t("deployed")} <a href="#" id="goEdit">${t("edit")} →</a> · <a href="#" id="goTest">${t("test")} →</a>` +
          (smokeNote ? `<div style="font-size:12px;color:#4c7a5e;margin-top:6px">${esc(smokeNote)}</div>` : "");
        $("#feed").appendChild(s); s.scrollIntoView({ behavior: "smooth", block: "end" });
        $("#goEdit").onclick = e => { e.preventDefault(); gotoEdit(d.id); };
        $("#goTest").onclick = e => { e.preventDefault(); TAB = "test"; location.hash = "test"; renderShell(); };
        loadAgents();
      } catch (e) { st.set(1, "fail"); evt("err", "⚠️", e.message, ""); $("#dep").disabled = false; }
    };
  } catch (e) { plan.remove(); evt("err", "⚠️", e.message, ""); }
  finally { $("#build").disabled = false; }
}

async function loadAgents() {
  try {
    const d = await api("GET", "apps");
    APPS = d.apps || [];
    const el = $("#agents"); if (!el) return;
    el.innerHTML = APPS.length ? "" : `<div class="empty">—</div>`;
    APPS.forEach(a => {
      const c = document.createElement("div");
      c.className = "acard";
      c.innerHTML = `<div class="ic">${a.mode === "workflow" ? IC.flow : IC.chat}</div><div class="nm">${esc(a.name)}</div><div class="md">${a.mode} · ${t("created")} ${fmtDate(a.created_at)}</div>`;
      c.onclick = () => gotoEdit(a.id);
      el.appendChild(c);
    });
  } catch (e) {}
}

/* ---------------- MARKETPLACE ---------------- */
function renderMarket() {
  const depts = [{ id: "all", en: t("all"), ar: t("all"), icn: "uae" }, ...DEPTS];
  $("#view").innerHTML = `
  <div class="fade">
    <h1 class="view-title">${t("market_h")}</h1><p class="view-sub">${t("market_sub")}</p>
    <div class="dept-row">${depts.map(d => `<button class="dept ${DEPT === d.id ? "active" : ""}" data-d="${d.id}">${IC[d.icn] || ""} ${LANG === "ar" ? d.ar : d.en}</button>`).join("")}</div>
    <div class="grid" id="tpls"></div>
  </div>`;
  document.querySelectorAll(".dept").forEach(b => b.onclick = () => { DEPT = b.dataset.d; renderMarket(); });
  const list = TPL.filter(x => DEPT === "all" || x.d === DEPT);
  const wrap = $("#tpls");
  list.forEach((x, idx) => {
    const dept = DEPTS.find(d => d.id === x.d);
    const key = x.d + "/" + x.en;
    const c = document.createElement("div");
    c.className = "tcard";
    c.innerHTML = `
      <span class="dept-tag">${IC[dept.icn] || ""} ${LANG === "ar" ? dept.ar : dept.en}</span>
      <div class="nm">${esc(LANG === "ar" ? x.ar : x.en)}<span class="ar">${esc(LANG === "ar" ? x.en : x.ar)}</span></div>
      <div class="ds">${esc(x.ds)}</div>
      <div class="foot"><span class="steps">3–5 ${t("steps")}</span>
      <button class="btn sm" data-k="${esc(key)}">${INSTALLED[key] ? "✓ " + t("installed") : t("install")}</button></div>`;
    const btn = c.querySelector("button");
    btn.onclick = async () => {
      if (INSTALLED[key]) { gotoEdit(INSTALLED[key].split("/app/")[1].split("/")[0]); return; }
      btn.disabled = true; btn.textContent = t("installing");
      try {
        const d = await api("POST", "install", { name: x.en, instruction: x.i, mode: "workflow", icon: dept.ic });
        INSTALLED[key] = d.url;
        btn.disabled = false; btn.textContent = "✓ " + t("installed");
      } catch (e) { btn.disabled = false; btn.textContent = t("install"); alert(e.message); }
    };
    wrap.appendChild(c);
  });
}

/* ---------------- TEST ---------------- */
function renderTest() {
  $("#view").innerHTML = `
  <div class="fade">
    <h1 class="view-title">${t("test_h")}</h1><p class="view-sub">${t("test_sub")}</p>
    <div class="split">
      <div class="panel">
        <select id="pick"><option value="">${t("pick")}</option></select>
        <div class="cases-wrap"><table class="cases"><thead><tr><th style="width:38%">${t("input")}</th><th style="width:34%">${t("expected")}</th><th>${t("status")}</th><th></th></tr></thead>
        <tbody id="rows"></tbody></table></div>
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
          <button class="btn quiet sm" id="genT">✨ ${t("gen_tests")}</button>
          <button class="btn quiet sm" id="addCase">${t("add_case")}</button>
          <button class="btn sm" id="runT">${t("run_tests")} ▶</button>
        </div>
        <div class="hint" id="genHint" style="margin-top:8px"></div>
        <div id="tfeed" class="feed" style="margin-top:18px"></div>
      </div>
      <div class="panel ring-wrap">
        <div class="ring">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" stroke="#ececf0" stroke-width="10"/>
          <circle id="arc" cx="60" cy="60" r="52" stroke="#00843D" stroke-width="10" stroke-dasharray="326.7" stroke-dashoffset="326.7" style="transition:stroke-dashoffset .8s cubic-bezier(.2,.8,.3,1)"/></svg>
          <div class="val"><div><span id="acc">—</span><small>${t("accuracy")}</small></div></div>
        </div>
        <div id="passline" style="font-size:13px;color:var(--muted);margin-top:8px">—</div>
        <div style="text-align:start;margin-top:14px">
          <div class="pp-sub" style="margin:0 0 6px">${t("fb_label")}</div>
          <textarea id="fbtext" placeholder="${esc(t("fb_ph"))}" style="width:100%;border:1px solid var(--hairline);border-radius:11px;padding:9px 11px;font-family:inherit;font-size:13px;min-height:64px;resize:vertical;outline:0"></textarea>
        </div>
        <div id="healbox"></div>
        <div class="heal-note">${IC.heal} ${t("heal_note")}</div>
      </div>
    </div>
  </div>`;
  api("GET", "apps").then(d => {
    APPS = d.apps || [];
    const sel = $("#pick");
    APPS.forEach(a => {
      const o = document.createElement("option");
      o.value = a.id; o.textContent = a.name;
      if (a.id === TESTAPP) o.selected = true;
      sel.appendChild(o);
    });
  });
  $("#pick").onchange = () => { TESTAPP = $("#pick").value; };
  $("#addCase").onclick = () => { CASES.push({ input: "", expected: "", status: "idle" }); drawCases(); };
  $("#runT").onclick = runTests;
  $("#genT").onclick = genTests;
  drawCases();
}

function drawCases() {
  const tb = $("#rows"); if (!tb) return;
  tb.innerHTML = "";
  CASES.forEach((c, i) => {
    const tr = document.createElement("tr");
    const st = c.status === "pass" ? `<span class="case-status pass">✓ ${t("pass")}</span>` :
               c.status === "fail" ? `<span class="case-status fail">✕ ${t("fail")}</span>` :
               c.status === "run" ? `<span class="case-status run">● ${t("running")}</span>` :
               `<span class="case-status idle">${t("idle")}</span>`;
    tr.innerHTML = `<td><textarea data-i="${i}" data-f="input">${esc(c.input)}</textarea></td>
      <td><textarea data-i="${i}" data-f="expected">${esc(c.expected)}</textarea></td>
      <td>${st}${c.reason && c.status === "fail" ? `<div class="outbox">${esc(c.reason)}\n${esc((c.output || "").slice(0, 300))}</div>` : ""}</td>
      <td><button class="xbtn" data-x="${i}">×</button></td>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll("textarea").forEach(a => a.oninput = () => { CASES[+a.dataset.i][a.dataset.f] = a.value; });
  tb.querySelectorAll(".xbtn").forEach(b => b.onclick = () => { CASES.splice(+b.dataset.x, 1); if (!CASES.length) CASES.push({ input: "", expected: "", status: "idle" }); drawCases(); });
}

function setRing(pct) {
  const C = 326.7;
  $("#arc").style.strokeDashoffset = String(C - (C * pct / 100));
  $("#arc").style.stroke = pct >= 80 ? "#00843D" : pct >= 50 ? "#b06f00" : "#CE1126";
  $("#acc").textContent = pct + "%";
}

async function genTests() {
  if (!TESTAPP) { alert(t("pick")); return; }
  const b = $("#genT");
  b.disabled = true; b.textContent = t("generating");
  try {
    const r = await api("POST", "gen-tests", { app_id: TESTAPP, count: 6 });
    const fresh = (r.cases || []).map(c => ({ input: c.input, expected: c.expected, status: "idle" }));
    CASES = CASES.filter(c => c.input.trim() || c.expected.trim()).concat(fresh);
    if (!CASES.length) CASES = [{ input: "", expected: "", status: "idle" }];
    drawCases();
    $("#genHint").textContent = "✨ " + t("gen_hint");
  } catch (e) { alert(e.message); }
  finally { b.disabled = false; b.textContent = "✨ " + t("gen_tests"); }
}

async function runTests(afterHeal) {
  if (!TESTAPP) { alert(t("pick")); return; }
  if (TESTBUSY) return;
  const active = CASES.filter(c => c.input.trim());
  if (!active.length) return;
  TESTBUSY = true; $("#runT").disabled = true; $("#runT").textContent = t("running");
  $("#tfeed").innerHTML = "";
  let passed = 0;
  for (const c of active) {
    c.status = "run"; drawCases();
    const feed = $("#tfeed");
    const d = document.createElement("div");
    d.className = "evt run";
    d.innerHTML = `<div class="ic"><div class="spin"></div></div><div><div class="tt">${esc(c.input.slice(0, 60))}</div><div class="st">${t("running")}</div></div>`;
    feed.appendChild(d);
    try {
      const r = await api("POST", "test-case", { app_id: TESTAPP, input: c.input, expected: c.expected });
      c.status = r.pass ? "pass" : "fail"; c.output = r.output; c.reason = r.reason;
      if (r.pass) passed++;
      d.className = "evt " + (r.pass ? "ok" : "err");
      d.innerHTML = `<div class="ic">${r.pass ? "✓" : "✕"}</div><div><div class="tt">${esc(c.input.slice(0, 60))}</div>
        <div class="st">${(r.events || []).map(e => esc(e.title)).join(" → ")}</div></div>
        <div class="right">${r.ms ? (r.ms / 1000).toFixed(1) + "s" : ""}</div>`;
    } catch (e) {
      c.status = "fail"; c.reason = e.message;
      d.className = "evt err"; d.innerHTML = `<div class="ic">✕</div><div><div class="tt">${esc(e.message)}</div></div>`;
    }
    drawCases();
  }
  const pct = Math.round(passed * 100 / active.length);
  setRing(pct);
  $("#passline").textContent = `${passed}/${active.length} ${t("passed")}`;
  const hb = $("#healbox"); hb.innerHTML = "";
  if (pct < 100 && !afterHeal) {
    const b = document.createElement("button");
    b.className = "btn danger sm"; b.style.marginTop = "12px"; b.innerHTML = IC.heal + " " + t("selfheal");
    b.onclick = () => doSelfHeal();
    hb.appendChild(b);
  }
  TESTBUSY = false; $("#runT").disabled = false; $("#runT").textContent = t("run_tests") + " ▶";
}

async function doSelfHeal() {
  const failures = CASES.filter(c => c.status === "fail").map(c => ({ input: c.input, expected: c.expected, output: c.output || "" }));
  if (!failures.length) return;
  const hb = $("#healbox");
  hb.innerHTML = `<div class="evt run" style="margin-top:12px"><div class="ic"><div class="spin"></div></div><div><div class="tt">${t("healing")}</div></div></div>`;
  try {
    await api("POST", "selfheal", { app_id: TESTAPP, failures, feedback: ($("#fbtext") ? $("#fbtext").value : "") });
    hb.innerHTML = `<div class="evt ok" style="margin-top:12px"><div class="ic">${IC.check}</div><div><div class="tt">${t("healed")}</div></div></div>`;
    await runTests(true);
  } catch (e) {
    hb.innerHTML = `<div class="evt err" style="margin-top:12px"><div class="ic">✕</div><div><div class="tt">${esc(e.message)}</div></div></div>`;
  }
}

/* ---------------- DEPLOY ---------------- */
function renderDeploy() {
  $("#view").innerHTML = `
  <div class="fade">
    <h1 class="view-title">${t("deploy_h")}</h1><p class="view-sub">${t("deploy_sub")}</p>
    <div class="panel" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <select id="dpick"><option value="">${t("pick")}</option></select>
      <button class="btn sm" id="pub">${t("publish")}</button>
      <button class="btn quiet sm" id="key">${t("get_key")}</button>
      <button class="btn quiet sm" id="exp">${t("export_dsl")}</button>
      <span id="dstat" style="font-size:13px;color:var(--green);font-weight:650"></span>
    </div>
    <div id="keybox"></div>
    <div class="dep-grid" id="targets"></div>
  </div>`;
  api("GET", "apps").then(d => {
    APPS = d.apps || [];
    const sel = $("#dpick");
    APPS.forEach(a => { const o = document.createElement("option"); o.value = a.id; o.textContent = a.name; if (a.id === TESTAPP) o.selected = true; sel.appendChild(o); });
    drawTargets();
  });
  $("#pub").onclick = async () => {
    const id = $("#dpick").value; if (!id) return;
    $("#pub").disabled = true;
    try { await api("POST", "publish", { app_id: id }); $("#dstat").textContent = "✓ " + t("published"); }
    catch (e) { $("#dstat").textContent = e.message; } finally { $("#pub").disabled = false; }
  };
  $("#key").onclick = async () => {
    const id = $("#dpick").value; if (!id) return;
    try {
      const r = await api("POST", "apikey", { app_id: id });
      $("#keybox").innerHTML = `<div class="code">curl -X POST '${location.origin}/v1/workflows/run' \\
  -H 'Authorization: Bearer ${esc(r.token)}' \\
  -H 'Content-Type: application/json' \\
  -d '{"inputs": {"input": "..."}, "response_mode": "blocking", "user": "wakeel"}'</div>`;
    } catch (e) { $("#keybox").innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  };
  $("#exp").onclick = async () => {
    const id = $("#dpick").value; if (!id) return;
    try {
      const r = await api("GET", "export?id=" + id);
      const blob = new Blob([r.data || JSON.stringify(r)], { type: "text/yaml" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "wakeel-package.yml"; a.click();
    } catch (e) { alert(e.message); }
  };
  function drawTargets() {
    $("#targets").innerHTML = `
    <div class="dep-card"><div class="hd"><div class="ic">${IC.api}</div><div class="nm">${t("api_card")}</div><span class="st live">${t("live")}</span></div>
      <p>${t("api_desc")}</p><div class="kv"><span>Endpoint</span><b>${location.origin}/v1</b></div><div class="kv"><span>Auth</span><b>Bearer key</b></div></div>
    <div class="dep-card"><div class="hd"><div class="ic">${IC.cloud}</div><div class="nm">${t("azure_card")}</div><span class="st guide">${t("guide")}</span></div>
      <p>${t("azure_desc")}</p>
      <div class="code">az group create -n wakeel -l uaenorth
az containerapp env create -n wakeel-env -g wakeel
# deploy the platform containers + import
# the exported wakeel-package.yml</div></div>
    <div class="dep-card"><div class="hd"><div class="ic">${IC.server}</div><div class="nm">${t("onprem_card")}</div><span class="st guide">${t("guide")}</span></div>
      <p>${t("onprem_desc")}</p><div class="code">docker compose up -d
# import wakeel-package.yml
# via the Studio → Import</div></div>
    <div class="dep-card"><div class="hd"><div class="ic">${IC.globe}</div><div class="nm">${t("web_card")}</div><span class="st live">${t("live")}</span></div>
      <p>${t("web_desc")}</p><div class="kv"><span>Web app</span><b>${location.origin}/app/…</b></div><div class="kv"><span>Embed</span><b>&lt;script&gt; widget</b></div></div>`;
  }
}



/* ---------------- settings: own API keys / providers / default model ---------------- */
async function openSettings() {
  if ($("#setModal")) return;
  const wrap = document.createElement("div");
  wrap.id = "setModal"; wrap.className = "modal-back";
  wrap.innerHTML = `<div class="modal fade">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="font-weight:800;font-size:18px">${t("settings")}</div><button class="xbtn" id="setX" style="font-size:22px">×</button></div>
    <div class="pp-sub" style="margin-top:0">${t("def_model")}</div>
    <div style="display:flex;gap:8px"><select id="defSel" style="flex:1;min-width:0"></select><button class="btn sm" id="defSave">${t("save")}</button></div>
    <div class="pp-sub">${t("providers")}</div>
    <div id="provList" class="prov-list"><div class="empty" style="padding:10px 0">…</div></div>
    <div class="pp-sub">${t("add_provider")}</div>
    <div class="chips" style="margin:0;justify-content:flex-start" id="provAdd"></div>
  </div>`;
  document.body.appendChild(wrap);
  wrap.onclick = e => { if (e.target === wrap) wrap.remove(); };
  $("#setX").onclick = () => wrap.remove();

  try {
    const [models, cur] = await Promise.all([api("GET", "models"), api("GET", "settings")]);
    const sel = $("#defSel");
    (models.providers || []).forEach(pr => {
      const g = document.createElement("optgroup"); g.label = pr.label;
      (pr.models || []).forEach(m => {
        const o = document.createElement("option");
        o.value = pr.provider + "|" + m; o.textContent = m;
        if (pr.provider === cur.provider && m === cur.model) o.selected = true;
        g.appendChild(o);
      });
      sel.appendChild(g);
    });
    $("#defSave").onclick = async () => {
      const [pv, md] = sel.value.split("|");
      $("#defSave").disabled = true;
      try { await api("POST", "settings", { provider: pv, model: md }); $("#defSave").textContent = "✓ " + t("saved"); }
      catch (e) { alert(e.message); }
      finally { setTimeout(() => { $("#defSave").disabled = false; $("#defSave").textContent = t("save"); }, 1500); }
    };
  } catch (e) {}
  loadProviders();

  const CURATED = [["Anthropic Claude", "anthropic"], ["Google Gemini", "gemini"], ["DeepSeek", "deepseek"], ["Groq", "groq"], ["Azure OpenAI", "azure_openai"]];
  const addBox = $("#provAdd");
  CURATED.forEach(([label, name]) => {
    const b = document.createElement("button");
    b.className = "chip"; b.textContent = "+ " + label;
    b.onclick = async () => {
      b.disabled = true; b.textContent = t("installing_p");
      try { await api("POST", "provider/install", { name }); b.textContent = "✓ " + label; loadProviders(); }
      catch (e) { b.textContent = "+ " + label; b.disabled = false; alert(e.message); }
    };
    addBox.appendChild(b);
  });
}

async function loadProviders() {
  const box = $("#provList"); if (!box) return;
  try {
    const d = await api("GET", "providers");
    box.innerHTML = (d.providers || []).length ? "" : `<div class="empty" style="padding:10px 0">—</div>`;
    (d.providers || []).forEach(pr => {
      const row = document.createElement("div");
      row.className = "prov-row";
      const ok = pr.status === "active";
      row.innerHTML = `<div style="font-weight:650;font-size:13.5px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${esc(pr.label)}</div>
        <span class="case-status ${ok ? "pass" : "idle"}">${ok ? "✓ " + t("active") : t("not_conf")}</span>
        <button class="btn quiet sm" style="flex:none">${t("configure")}</button>`;
      const btn = row.querySelector("button");
      btn.onclick = () => {
        const ex = row.nextElementSibling;
        if (ex && ex.className === "prov-form") { ex.remove(); return; }
        const f = document.createElement("div");
        f.className = "prov-form";
        f.innerHTML = pr.schemas.map(sc =>
          `<input data-v="${esc(sc.variable)}" type="${sc.secret ? "password" : "text"}" placeholder="${esc(sc.label)}${sc.required ? " *" : ""}"/>`
        ).join("") + `<button class="btn sm">${t("save")}</button>`;
        f.querySelector(".btn").onclick = async () => {
          const creds = {};
          f.querySelectorAll("input").forEach(i => { if (i.value.trim()) creds[i.dataset.v] = i.value.trim(); });
          f.querySelector(".btn").disabled = true;
          try { await api("POST", "provider/credentials", { provider: pr.provider, credentials: creds }); f.remove(); loadProviders(); }
          catch (e) { alert(e.message); f.querySelector(".btn").disabled = false; }
        };
        row.after(f);
      };
      box.appendChild(row);
    });
  } catch (e) { box.innerHTML = `<div class="empty">⚠️ ${esc(e.message)}</div>`; }
}

/* ---------------- profile menu: details + activity history + logout ---------------- */
async function toggleProfile() {
  const ex = $("#profilePanel");
  if (ex) { ex.remove(); return; }
  const d = document.createElement("div");
  d.id = "profilePanel";
  d.className = "profile-panel fade";
  d.innerHTML = `
    <div class="pp-head">
      <div class="avatar">${esc((ME.email || "U")[0].toUpperCase())}</div>
      <div style="min-width:0"><div style="font-weight:750;font-size:14px">${esc(ME.email.split("@")[0])}</div>
      <div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis">${esc(ME.email)}</div></div>
    </div>
    <div class="pp-sub">${t("activity")}</div>
    <div class="pp-acts" id="ppacts"><div class="empty" style="padding:14px 0">…</div></div>
    <button class="btn danger sm block" id="ppout" style="margin-top:10px;width:100%">${t("signout")}</button>`;
  document.body.appendChild(d);
  $("#ppout").onclick = async () => {
    try { await api("POST", "logout"); } catch (e) {}
    ME = null; d.remove(); renderLogin();
  };
  document.addEventListener("click", function close(e) {
    if (!d.contains(e.target) && e.target.id !== "avatar") { d.remove(); document.removeEventListener("click", close); }
  });
  try {
    const r = await api("GET", "activity");
    const box = $("#ppacts");
    if (!box) return;
    const acts = r.activity || [];
    box.innerHTML = acts.length ? "" : `<div class="empty" style="padding:14px 0">${t("no_activity")}</div>`;
    acts.forEach(a => {
      const row = document.createElement("div");
      row.className = "pp-row";
      row.innerHTML = `<span class="pp-dot"></span>
        <div style="min-width:0"><div class="pp-a">${esc(t("act_" + a.action))}</div>
        ${a.detail ? `<div class="pp-d">${esc(a.detail)}</div>` : ""}</div>
        <span class="pp-t">${timeAgo(a.ts)}</span>`;
      box.appendChild(row);
    });
  } catch (e) {}
}

/* ---------------- boot ---------------- */
async function boot() {
  // demo/automation: allow ?t=<token> to set the session cookie
  const q = location.search;
  const lm = q.match(/[?&]lang=(en|ar)/);
  if (lm) { LANG = lm[1]; localStorage.setItem("wakeel_lang", LANG); }
  const m = q.match(/[?&]t=([a-f0-9]{40})/);
  if (m) { document.cookie = `wakeel_t=${m[1]}; Path=/; Max-Age=86400; SameSite=Lax`; history.replaceState(null, "", location.pathname + location.hash); }
  const h = location.hash.replace("#", "");
  if (h.startsWith("build=")) { TAB = "build"; window.__prefill = decodeURIComponent(h.slice(6)); }
  else if (h.startsWith("edit=")) { TAB = "edit"; EDITAPP = h.slice(5); }
  else if (h === "profile") { TAB = "build"; window.__openProfile = true; }
  else if (h === "settings") { TAB = "build"; window.__openSettings = true; }
  else if (["build", "edit", "test", "deploy", "market", "community"].includes(h)) TAB = h;
  try { ME = await api("GET", "me"); } catch (e) { ME = null; }
  if (!ME) return renderLogin();
  try { await api("GET", "sso"); } catch (e) {}
  renderShell();
  if (window.__openProfile) { window.__openProfile = false; toggleProfile(); }
  if (window.__openSettings) { window.__openSettings = false; openSettings(); }
}
boot();
