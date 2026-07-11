/* Wakeel وكيل — Beam-style front-end on a live Dify backend */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- icons ---------- */
const I = (p) => `<svg viewBox="0 0 24 24">${p}</svg>`;
const IC = {
  home: I('<path d="M4 11l8-7 8 7M6 10v9h12v-9"/>'),
  skills: I('<path d="M6 3h9l3 3v15H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
  projects: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>'),
  inbox: I('<path d="M4 13l2-8h12l2 8"/><path d="M4 13v6h16v-6M4 13h5l1 2h4l1-2h5"/>'),
  tasks: I('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'),
  templates: I('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  integrations: I('<path d="M10 3v6M14 3v6M7 9h10v3a5 5 0 0 1-10 0zM12 17v4"/>'),
  views: I('<path d="M4 6h16M4 12h10M4 18h7"/>'),
  agent: I('<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/><path d="M9.3 13h.01M14.7 13h.01M9.5 16h5"/>'),
  flow: I('<rect x="8" y="3" width="8" height="5" rx="1.5"/><rect x="4" y="16" width="7" height="5" rx="1.5"/><rect x="13" y="16" width="7" height="5" rx="1.5"/><path d="M12 8v4M12 12H7.5v4M12 12h4.5v4"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  send: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  up: I('<path d="M12 19V6M6 12l6-6 6 6"/>'),
  upload: I('<path d="M12 15V4M8 8l4-4 4 4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>'),
  chat: I('<path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L4 21l1.5-4.6A8.5 8.5 0 1 1 21 12z"/>'),
  book: I('<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM8 3v18"/>'),
  check: I('<path d="M20 6L9 17l-5-5"/>'),
  spark: I('<path d="M12 3l1.8 4.6L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.4z"/>'),
  bolt: I('<path d="M13 3L4 14h7l-1 7 9-11h-7z"/>'),
  play: I('<path d="M6 4l14 8-14 8z"/>'),
  help: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4 2c0 1.5-2 2-2 3.2M12 17h.01"/>'),
  thumb: I('<path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM7 11l4-7a2 2 0 0 1 2 2v3h4.6a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 16.6 20H7"/>'),
};

/* ---------- gov templates ---------- */
const DEPTS = [
  ["chamber", "Abu Dhabi Chamber", "غرفة أبوظبي"], ["added", "Economic Development", "التنمية الاقتصادية"],
  ["tamm", "TAMM / Digital Gov", "تم"], ["dmt", "Municipalities & Transport", "البلديات والنقل"],
  ["doh", "Department of Health", "الصحة"], ["adek", "Education (ADEK)", "التعليم"],
  ["adjd", "Judicial Department", "القضاء"], ["police", "Abu Dhabi Police", "الشرطة"],
  ["fta", "Federal Tax Authority", "الضرائب"], ["icp", "Identity & Citizenship", "الهوية"],
];
const TPL = [
  ["added", "Trade License Reviewer", "مراجع الرخص التجارية", "Pre-screens trade license applications for completeness and drafts a decision.", "Take a trade license application summary, check activity, trade name, owner details and documents, output a completeness report and a draft approval or rejection letter."],
  ["added", "License Renewal Reminder", "تذكير تجديد الرخصة", "Drafts bilingual renewal reminders from license records.", "Take a license record with expiry date and company details, draft a professional renewal reminder in English and Arabic."],
  ["tamm", "Service Request Triage", "فرز طلبات الخدمة", "Classifies incoming service requests and routes them.", "Take a citizen service request, classify by category and urgency, output the routing decision with a short justification."],
  ["tamm", "Complaint Router", "موجّه الشكاوى", "Routes complaints to the right entity with a summary.", "Take a citizen complaint, identify the responsible entity, summarize in two sentences, draft an acknowledgment."],
  ["chamber", "Membership Renewal Assistant", "مساعد تجديد العضوية", "Reviews renewal requests and drafts the approval letter.", "Take a company membership renewal request, verify company name, license number and expiry, draft an approval letter or a list of missing items."],
  ["doh", "Patient Complaint Classifier", "مصنف شكاوى المرضى", "Classifies patient complaints by severity and type.", "Take a patient complaint, classify severity and type, draft an acknowledgment with next steps."],
  ["dmt", "Building Permit Pre-Check", "الفحص المسبق لرخص البناء", "Pre-validates permit applications before review.", "Take a building permit application summary, check plot, consultant, drawings and NOC references, output a pre-check report."],
  ["adek", "Scholarship Application Reviewer", "مراجع طلبات البعثات", "Screens scholarship applications against criteria.", "Take a scholarship application summary, evaluate against GPA, major and age criteria, output an eligibility assessment."],
  ["adjd", "Legal Document Summarizer", "ملخص المستندات القانونية", "Summarizes legal documents into plain language.", "Take a legal document text, produce a plain-language summary with key obligations and dates."],
  ["police", "Incident Report Classifier", "مصنف البلاغات", "Classifies incident reports by type and priority.", "Take an incident report, classify type and priority, output the classification with the recommended unit."],
  ["fta", "VAT Registration Screener", "فاحص تسجيل ضريبة القيمة المضافة", "Pre-screens VAT registration applications.", "Take a VAT registration application summary, check turnover threshold and documents, output an eligibility screen."],
  ["icp", "Golden Visa Eligibility Checker", "مدقق أهلية الإقامة الذهبية", "Checks golden visa eligibility categories.", "Take an applicant profile, evaluate against golden visa categories (investor, talent, student), output eligibility with the strongest category."],
];

const INTEG_CATS = [
  ["Microsoft 365", ["Microsoft Outlook", "Microsoft SharePoint", "Excel on SharePoint", "OneDrive", "Microsoft Teams", "Microsoft Word", "Power BI", "Power Automate", "Microsoft Entra ID", "Microsoft Graph"]],
  ["UAE Government", ["UAE Pass", "TAMM", "Abu Dhabi Gov Cloud", "MoHRE Systems", "ICP", "Federal Tax Authority", "Emirates Post"]],
  ["Google Workspace", ["Gmail", "Google Drive", "Google Sheets", "Google Calendar", "Google Docs"]],
  ["Communication", ["Slack", "Twilio SMS", "WhatsApp Business", "SendGrid", "Telegram"]],
  ["CRM & Support", ["Salesforce", "HubSpot", "Zendesk", "Freshdesk", "ServiceNow", "Intercom"]],
  ["Productivity", ["Notion", "Airtable", "Jira", "Confluence", "Asana", "ClickUp", "Trello", "Monday.com"]],
  ["Databases", ["PostgreSQL", "MySQL", "Microsoft SQL Server", "Oracle", "MongoDB", "Redis"]],
  ["Storage", ["Azure Blob Storage", "Amazon S3", "Dropbox", "Box"]],
  ["ERP & Finance", ["SAP", "Oracle ERP", "DocuSign", "Adobe PDF Services", "Stripe"]],
  ["Automation", ["Wakeel Automations", "Webhooks", "REST API", "Zapier", "Make"]],
  ["AI Models", ["Azure OpenAI", "OpenAI", "Anthropic Claude", "Google Gemini", "Ollama (local)", "vLLM"]],
];
// connectors that map to a real Dify plugin (installable natively in Wakeel)
const PLUGIN_MAP = { "Microsoft Outlook": "outlook", "OneDrive": "onedrive", "Microsoft SharePoint": "onedrive", "Excel on SharePoint": "onedrive", "Gmail": "gmail", "Google Drive": "google", "Slack": "slack", "Notion": "notion", "GitHub": "github" };
// connector name → Dify tool-provider path (for the Configure credential form)
const PROVIDER_MAP = { "Microsoft Outlook": "langgenius/outlook/outlook", "OneDrive": "langgenius/onedrive/microsoft_onedrive", "Microsoft SharePoint": "langgenius/onedrive/microsoft_onedrive", "Excel on SharePoint": "langgenius/onedrive/microsoft_onedrive" };
let TOOLS_INSTALLED = [];
function isConnected(name) { const pl = PLUGIN_MAP[name]; return pl && TOOLS_INSTALLED.some(x => x === "langgenius/" + pl); }

/* ---------- real brand logos (inline SVG) — replaces generic icons/emoji ---------- */
const L = {
  microsoft: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9" fill="#F25022"/><rect x="13" y="2" width="9" height="9" fill="#7FBA00"/><rect x="2" y="13" width="9" height="9" fill="#00A4EF"/><rect x="13" y="13" width="9" height="9" fill="#FFB900"/></svg>',
  outlook: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2.5" fill="#0F6CBD"/><path d="M4 8.2l8 5 8-5" fill="none" stroke="#fff" stroke-width="1.6"/><rect x="1" y="8" width="10" height="9" rx="2" fill="#0A4C86"/><text x="6" y="15" font-size="8" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="700">O</text></svg>',
  excel: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2.5" fill="#107C41"/><rect x="2" y="3" width="9" height="18" rx="2.5" fill="#0B5C30"/><path d="M4.5 8l4 8M8.5 8l-4 8" stroke="#fff" stroke-width="1.7"/></svg>',
  sharepoint: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="5.2" fill="#036C70"/><circle cx="15" cy="13" r="5" fill="#1A9BA1"/><circle cx="12" cy="18" r="4" fill="#37C6D0"/><text x="9" y="10.6" font-size="6.4" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="700">S</text></svg>',
  onedrive: '<svg viewBox="0 0 24 24"><path d="M8 18a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10-1.5A3.6 3.6 0 0 1 20 18z" fill="#0364B8"/><path d="M8 18a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 10 6.4 5.5 5.5 0 0 0 6 14a4 4 0 0 0 2 4z" fill="#0A2767" opacity=".25"/></svg>',
  teams: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="12" height="11" rx="2.5" fill="#5059C9"/><text x="10" y="15.5" font-size="8.5" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="700">T</text><circle cx="18" cy="7" r="3" fill="#7B83EB"/></svg>',
  word: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2.5" fill="#185ABD"/><rect x="2" y="3" width="9" height="18" rx="2.5" fill="#103F86"/><text x="12" y="16" font-size="10" fill="#fff" text-anchor="middle" font-family="Georgia" font-weight="700">W</text></svg>',
  powerbi: '<svg viewBox="0 0 24 24"><rect x="4" y="10" width="4" height="10" rx="1" fill="#F2C811"/><rect x="10" y="6" width="4" height="14" rx="1" fill="#E8A200"/><rect x="16" y="3" width="4" height="17" rx="1" fill="#C97F00"/></svg>',
  entra: '<svg viewBox="0 0 24 24"><path d="M12 3l8 16H4z" fill="none" stroke="#0F6CBD" stroke-width="1.8"/><path d="M12 3l8 16H12z" fill="#0F6CBD" opacity=".6"/></svg>',
  graph: '<svg viewBox="0 0 24 24"><circle cx="6" cy="7" r="2.4" fill="#0F6CBD"/><circle cx="18" cy="7" r="2.4" fill="#00A4EF"/><circle cx="12" cy="17" r="2.6" fill="#5059C9"/><path d="M7.8 8.4L11 15M16.2 8.4L13 15M8 7h8" stroke="#7A8CA8" stroke-width="1.3"/></svg>',
  google: '<svg viewBox="0 0 24 24"><path d="M21.6 12.2c0-.7-.06-1.2-.16-1.75H12v3.35h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.75 3-4.3 3-7.1z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.75-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853"/><path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z" fill="#FBBC05"/><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.85-2.85A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.75 9.4 6 12 6z" fill="#EA4335"/></svg>',
  gmail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#fff"/><path d="M4 6l8 6 8-6" fill="none" stroke="#EA4335" stroke-width="2"/><path d="M3 7v10a1.5 1.5 0 0 0 1.5 1.5H7V10z" fill="#4285F4"/><path d="M21 7v10a1.5 1.5 0 0 1-1.5 1.5H17V10z" fill="#34A853"/><path d="M7 10l5 3.5L17 10v-.2l-5 3.5L7 9.8z" fill="#C5221F"/></svg>',
  gdrive: '<svg viewBox="0 0 24 24"><path d="M8.6 4l6.8 12h-6.8L1.8 16z" fill="#0066DA" opacity=".01"/><path d="M9 3l6 10.4H3z" fill="#00AC47"/><path d="M15 3l6 10.4h-6L9 3z" fill="#FFBA00"/><path d="M3 13.4L6 19h12l3-5.6H9z" fill="#0066DA"/><path d="M3 13.4L9 3l3 5.2-3 5.2z" fill="#00832D" opacity=".2"/></svg>',
  gsheets: '<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" fill="#0F9D58"/><rect x="7" y="8" width="10" height="9" rx="1" fill="#fff"/><path d="M7 11.5h10M7 14.5h10M12 8v9" stroke="#0F9D58" stroke-width="1.1"/></svg>',
  slack: '<svg viewBox="0 0 24 24"><path d="M6 15a2 2 0 1 1-2-2h2zM7 15a2 2 0 0 1 4 0v5a2 2 0 1 1-4 0z" fill="#E01E5A"/><path d="M9 6a2 2 0 1 1 2 2H9zM9 7a2 2 0 0 1 0 4H4a2 2 0 1 1 0-4z" fill="#36C5F0"/><path d="M18 9a2 2 0 1 1 2 2h-2zM17 9a2 2 0 0 1-4 0V4a2 2 0 1 1 4 0z" fill="#2EB67D"/><path d="M15 18a2 2 0 1 1-2 2v-2zM15 17a2 2 0 0 1 0-4h5a2 2 0 1 1 0 4z" fill="#ECB22E"/></svg>',
  notion: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#fff" stroke="#111" stroke-width=".5"/><path d="M8 16.5v-9l8 9V7.5" stroke="#111" stroke-width="1.7" fill="none"/></svg>',
  wakeel: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="#00a862"/><rect x="2" y="2" width="4" height="20" fill="#CE1126"/><text x="13" y="16.5" font-size="12" fill="#fff" text-anchor="middle" font-family="Tahoma" font-weight="700">و</text></svg>',
  gemini: '<svg viewBox="0 0 24 24"><path d="M12 2c.4 5.2 4.4 9.2 10 10-5.6.8-9.6 4.8-10 10-.4-5.2-4.4-9.2-10-10 5.6-.8 9.6-4.8 10-10z" fill="#3186FF"/></svg>',
  openai: '<svg viewBox="0 0 24 24"><path d="M12 4a4 4 0 0 1 3.9 3.1A4 4 0 0 1 18 14a4 4 0 0 1-3.9 5A4 4 0 0 1 6 16.9 4 4 0 0 1 6 10a4 4 0 0 1 6-6z" fill="none" stroke="#10A37F" stroke-width="1.6"/><circle cx="12" cy="12" r="2" fill="#10A37F"/></svg>',
  anthropic: '<svg viewBox="0 0 24 24"><path d="M8.5 5L3 19h3l1.1-3h5.4l1.1 3h3L14.1 5zm-.3 8.4L10 8.6l1.8 4.8z" fill="#D97757"/></svg>',
  salesforce: '<svg viewBox="0 0 24 24"><path d="M6 17a4 4 0 0 1-.5-8 5 5 0 0 1 9-1.5A3.5 3.5 0 1 1 16 17z" fill="#00A1E0"/></svg>',
  hubspot: '<svg viewBox="0 0 24 24"><circle cx="9" cy="15" r="3.4" fill="none" stroke="#FF7A59" stroke-width="1.8"/><path d="M15 9V5M15 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM11.4 13.5L14 11" stroke="#FF7A59" stroke-width="1.6"/></svg>',
  zendesk: '<svg viewBox="0 0 24 24"><path d="M12 8v11L3 8z" fill="#03363D"/><path d="M12 16V5l9 11z" fill="#03363D"/></svg>',
  jira: '<svg viewBox="0 0 24 24"><path d="M12 2l9 9-9 9-3-3 6-6-6-6z" fill="#2684FF"/><path d="M12 8l3 3-3 3-3-3z" fill="#0052CC"/></svg>',
  sap: '<svg viewBox="0 0 24 24"><rect x="1" y="6" width="22" height="12" rx="1.5" fill="#0FAAFF"/><text x="12" y="15" font-size="7" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="800">SAP</text></svg>',
  stripe: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="3" fill="#635BFF"/><text x="12" y="16" font-size="11" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="800">S</text></svg>',
  twilio: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#F22F46"/><circle cx="9.5" cy="9.5" r="1.7" fill="#fff"/><circle cx="14.5" cy="9.5" r="1.7" fill="#fff"/><circle cx="9.5" cy="14.5" r="1.7" fill="#fff"/><circle cx="14.5" cy="14.5" r="1.7" fill="#fff"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24"><path d="M3 21l1.6-5A9 9 0 1 1 8 19.4z" fill="#25D366"/><path d="M8.5 8c-.3 0-.6.1-.8.4-.3.4-.9 1-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 3 4.5 4 .7.3 1.7.5 2.3.3.5-.1 1.3-.7 1.5-1.3.1-.4.1-.7 0-.8-.1-.1-1.3-.7-1.5-.7-.2-.1-.3-.1-.5.1s-.5.7-.6.8c-.1.1-.2.1-.4 0-.2-.1-1-.4-1.8-1.1-.7-.6-1.1-1.3-1.2-1.5-.1-.2 0-.3.1-.4l.3-.4c.1-.1.2-.2.2-.4s0-.3-.1-.4c0-.1-.5-1.4-.7-1.9-.2-.4-.4-.4-.6-.4z" fill="#fff"/></svg>',
  postgres: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="9" fill="none" stroke="#336791" stroke-width="1.8"/><path d="M9 20c-1-3-1-8 0-11M15 4c1 3 1 9 0 12" stroke="#336791" stroke-width="1.4" fill="none"/></svg>',
  mysql: '<svg viewBox="0 0 24 24"><path d="M3 16c3 0 6-1 8-4M4 12a12 12 0 0 1 10 6" fill="none" stroke="#00758F" stroke-width="1.6"/><path d="M16 15c2 2 4 2 5 3" stroke="#F29111" stroke-width="1.6" fill="none"/></svg>',
  mongodb: '<svg viewBox="0 0 24 24"><path d="M12 2c3 4 5 7 5 11a5 5 0 0 1-5 5 5 5 0 0 1-5-5c0-4 2-7 5-11z" fill="#4DB33D"/><path d="M12 4v17" stroke="#3F9B2E" stroke-width="1"/></svg>',
  github: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.4-1-1-1.3-1-1.3-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a4 4 0 0 1 1-2.7c-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7a4 4 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .3.3.6.9.6 1.8v2.6c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="#fff"/></svg>',
  uaepass: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2.5" fill="#000"/><rect x="2" y="4" width="5" height="16" fill="#ff0000"/><path d="M10 9h8M10 12h8M10 15h5" stroke="#fff" stroke-width="1.3"/><path d="M2 4h20v3H2z" fill="#00843D"/></svg>',
};
// name → logo key; plus brand color for monogram fallback
const LOGO_MAP = {
  "Microsoft Outlook": "outlook", "Microsoft SharePoint": "sharepoint", "Excel on SharePoint": "excel",
  "OneDrive": "onedrive", "Microsoft Teams": "teams", "Microsoft Word": "word", "Power BI": "powerbi",
  "Power Automate": "microsoft", "Microsoft Entra ID": "entra", "Microsoft Graph": "graph",
  "Gmail": "gmail", "Google Drive": "gdrive", "Google Sheets": "gsheets", "Google Calendar": "google",
  "Google Docs": "google", "Slack": "slack", "Notion": "notion", "Wakeel Automations": "wakeel", "Google Gemini": "gemini",
  "OpenAI": "openai", "Azure OpenAI": "openai", "Anthropic Claude": "anthropic", "Salesforce": "salesforce",
  "HubSpot": "hubspot", "Zendesk": "zendesk", "Jira": "jira", "Confluence": "jira", "SAP": "sap",
  "Oracle ERP": "sap", "Stripe": "stripe", "Twilio SMS": "twilio", "WhatsApp Business": "whatsapp",
  "PostgreSQL": "postgres", "MySQL": "mysql", "MongoDB": "mongodb", "GitHub": "github", "UAE Pass": "uaepass",
};
const BRAND_COLOR = {
  "MoHRE Systems": "#0a7d47", "TAMM": "#1a4f8b", "Abu Dhabi Gov Cloud": "#0a7d47", "ICP": "#8a1538",
  "Federal Tax Authority": "#0a5c8a", "Emirates Post": "#e2001a", "Microsoft SQL Server": "#a4262c",
  "Oracle": "#c74634", "Redis": "#d82c20", "Azure Blob Storage": "#0078d4", "Amazon S3": "#e2711d",
  "Dropbox": "#0061ff", "Box": "#0061d5", "DocuSign": "#d4341f", "Adobe PDF Services": "#fa0f00",
  "Airtable": "#fcb400", "Asana": "#f06a6a", "ClickUp": "#7b68ee", "Trello": "#0079bf", "Monday.com": "#ff3d57",
  "Freshdesk": "#25c16f", "ServiceNow": "#62d84e", "Intercom": "#1f8ded", "Telegram": "#2aabee",
  "SendGrid": "#1a82e2", "Webhooks": "#3b6", "REST API": "#3b6", "Zapier": "#ff4a00", "Make": "#6d00cc",
  "Ollama (local)": "#5a5a5a", "vLLM": "#6a3bd8", "Emirates Post": "#e2001a",
};
function monoColor(name) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffff; const hue = h % 360; return `hsl(${hue} 42% 42%)`; }
function brandLogo(name, size = 38) {
  const k = LOGO_MAP[name];
  if (k && L[k]) {
    const bg = (k === "notion" || k === "github" || k === "openai") ? "#0d1526" : "transparent";
    return `<span class="blogo" style="width:${size}px;height:${size}px;background:${bg}">${L[k]}</span>`;
  }
  const base = name.replace(/^(Microsoft |Google |Amazon |Oracle )/, "");
  const initials = base.split(/[ .]/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || base.slice(0, 2).toUpperCase();
  return `<span class="blogo mono" style="width:${size}px;height:${size}px;background:${BRAND_COLOR[name] || monoColor(name)}">${esc(initials)}</span>`;
}
/* pick a topical icon for an agent based on its name */
function agentIcon(name) {
  const n = (name || "").toLowerCase();
  if (/emirat|mohre|labou?r|workforce/.test(n)) return { ic: IC.agent, cl: "ag-green" };
  if (/complaint|citizen|route|triage/.test(n)) return { ic: IC.inbox, cl: "ag-amber" };
  if (/licen|trade|permit|renewal|membership/.test(n)) return { ic: IC.projects, cl: "ag-blue" };
  if (/incident|police|safety|road|emergency/.test(n)) return { ic: IC.bolt, cl: "ag-red" };
  if (/summar|legal|document|report|letter/.test(n)) return { ic: IC.book, cl: "ag-violet" };
  if (/health|patient|clinic|medical/.test(n)) return { ic: IC.help, cl: "ag-teal" };
  if (/tax|vat|finance|invoice|payment/.test(n)) return { ic: IC.templates, cl: "ag-gold" };
  return { ic: IC.spark, cl: "ag-slate" };
}

async function openToolConfig(name) {
  const provider = PROVIDER_MAP[name];
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:540px" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center"><h2 style="flex:1">Configure ${esc(name)}</h2><button class="x" id="tcx">×</button></div>
    <div id="tcBody"><div class="empty-mini"><span class="spin" style="display:inline-block;vertical-align:middle"></span> Loading credential fields…</div></div>
  </div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#tcx").onclick = () => d.remove();
  if (!provider) { $("#tcBody").innerHTML = `<div class="page-sub">No native credential form for this connector.</div>`; return; }
  try {
    const s = await api("GET", "tool-schema?provider=" + encodeURIComponent(provider));
    const fields = s.fields || [];
    $("#tcBody").innerHTML = `
      <div style="color:var(--muted);font-size:13px;margin:-6px 0 16px">Connect your Microsoft account. Get a Microsoft Graph token from your Entra ID app (permissions: Mail.Send, Files.ReadWrite, Sites.ReadWrite) or Microsoft Graph Explorer.</div>
      ${fields.length ? fields.map(f => `<div class="field"><label>${esc(f.label)}${f.required ? " *" : ""}</label><input class="input" data-f="${esc(f.name)}" type="${f.type === "secret-input" ? "password" : "text"}" placeholder="${esc(f.help || f.label)}"/></div>`).join("") : `<div class="field"><label>Access token</label><input class="input" data-f="access_token" type="password" placeholder="Microsoft Graph access token"/></div>`}
      <div style="display:flex;align-items:center;gap:12px;margin-top:8px"><button class="btn primary sm" id="tcSave">Connect</button><span class="page-sub" style="margin:0" id="tcMsg"></span></div>
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line-2);font-size:12px;color:var(--faint)">Tip: for production, register an Entra ID app once — Wakeel then reuses the token. This is a government data-residency step handled by your IT.</div>`;
    $("#tcSave").onclick = async () => {
      const creds = {}; d.querySelectorAll("input[data-f]").forEach(i => { if (i.value.trim()) creds[i.dataset.f] = i.value.trim(); });
      if (!Object.keys(creds).length) { $("#tcMsg").textContent = "Enter a token first"; return; }
      $("#tcSave").disabled = true; $("#tcMsg").textContent = "Connecting…";
      try { await api("POST", "tool-connect", { provider, credentials: creds, name: name, type: s.type }); $("#tcMsg").textContent = "✓ Connected"; setTimeout(() => d.remove(), 900); }
      catch (e) { $("#tcMsg").textContent = "⚠️ " + e.message; $("#tcSave").disabled = false; }
    };
  } catch (e) { $("#tcBody").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
}
const SKILLS = ["ai-product-strategy", "conducting-user-interviews", "giving-presentations", "writing-prds", "positioning-messaging", "pricing-strategy", "personas", "writing-north-star-metrics", "running-effective-1-1s", "having-difficult-conversations", "writing-job-descriptions"];

/* ---------- i18n ---------- */
const T = {
  // shell / nav
  "Home": "الرئيسية", "Skills": "المهارات", "Projects": "المشاريع", "Inbox": "الوارد",
  "Tasks": "المهام", "Agent templates": "قوالب الوكلاء", "Integrations": "التكاملات",
  "Automations": "الأتمتة", "Analytics": "التحليلات", "Your agents": "وكلاؤك",
  "New agent": "وكيل جديد", "Chat & support": "المحادثة والدعم", "Loading…": "جارٍ التحميل…",
  "No agents yet": "لا يوجد وكلاء بعد", "Wakeel AI": "وكيل الذكي", "Beta": "تجريبي",
  // agent tabs
  "Flow": "المخطط", "Triggers": "المشغّلات", "Memory": "الذاكرة",
  "Governance": "الحوكمة", "Instructions": "التعليمات", "Automation": "أوضاع الأتمتة", "Evaluate": "التقييم", "Records": "السجلات",
  // home
  "What do you want to work on?": "بماذا تريد أن تعمل؟",
  "Ask Wakeel to perform tasks, build an agent, or brainstorm ideas": "اطلب من وكيل تنفيذ المهام أو بناء وكيل أو طرح الأفكار",
  "Build agents": "بناء الوكلاء", "Recommended": "موصى به",
  "Review a trade license application": "مراجعة طلب رخصة تجارية",
  "Route a citizen complaint": "توجيه شكوى مواطن",
  "Draft a bilingual approval letter": "صياغة خطاب موافقة ثنائي اللغة",
  "Summarize a legal document": "تلخيص مستند قانوني",
  "Reply to Wakeel…": "الرد على وكيل…",
  "Reply with any changes, or press Build this agent…": "اكتب أي تعديلات أو اضغط «بناء هذا الوكيل»…",
  "Describe the changes you want…": "صِف التعديلات التي تريدها…",
  "Upload file": "رفع ملف", "Add skills": "إضافة مهارات", "Add integration": "إضافة تكامل",
  // design proposal
  "Flow architecture": "هيكل المخطط", "Nodes": "العقد", "Allowed statuses": "الحالات المسموحة",
  "Key design decisions": "قرارات التصميم الرئيسية", "Guardrails": "الضوابط",
  "Shall I go ahead and build this agent?": "هل أتابع وأبني هذا الوكيل؟",
  "Build this agent": "بناء هذا الوكيل", "Request changes": "طلب تعديلات",
  "Here's the full design for your": "إليك التصميم الكامل لـ",
  ". Review it and let me know if you'd like any changes before I build it.": "، راجعه وأخبرني إن رغبت بأي تعديلات قبل أن أبنيه.",
  // buttons / common
  "Create agent": "إنشاء وكيل", "Configure": "إعداد", "Install & connect": "تثبيت وربط",
  "Request": "طلب", "Installed": "مُثبّت", "Get URL": "الحصول على الرابط", "Choose": "اختيار",
  "Save schedule": "حفظ الجدولة", "Native plugin": "إضافة أصلية", "Publish": "نشر",
  "Connect Microsoft 365": "ربط Microsoft 365", "All": "الكل", "Active": "نشط", "Save": "حفظ",
  // triggers
  "How this agent starts. Multiple triggers can feed the same flow.": "كيف يبدأ هذا الوكيل. يمكن لعدة مشغّلات تغذية المخطط نفسه.",
  "Manual run": "تشغيل يدوي",
  "Run on demand from Test mode or the API. Always available.": "تشغيل عند الطلب من وضع الاختبار أو الواجهة البرمجية. متاح دائمًا.",
  "Schedule": "جدولة", "Run on a timer — hourly, daily, or a cron expression.": "تشغيل على مؤقّت — كل ساعة أو يوميًا أو بتعبير cron.",
  "Webhook / API": "Webhook / API",
  "Trigger from any government system via a secure URL with an API key.": "التشغيل من أي نظام حكومي عبر رابط آمن مع مفتاح واجهة برمجية.",
  "Integration event": "حدث تكامل",
  "New email (Outlook), file updated (SharePoint), row added (Excel)…": "بريد جديد (Outlook)، تحديث ملف (SharePoint)، إضافة صف (Excel)…",
  "Connect Outlook, SharePoint & Excel. Wakeel's built-in automation engine handles the Microsoft connectors and the schedule — the agent does the AI. One Microsoft sign-in, then it runs automatically on your timer.": "اربط Outlook وSharePoint وExcel. يتولى محرّك الأتمتة المدمج في وكيل موصّلات مايكروسوفت والجدولة — والوكيل يتولى الذكاء. تسجيل دخول واحد بمايكروسوفت، ثم يعمل تلقائيًا وفق مؤقّتك.",
  "Sign in with Microsoft": "تسجيل الدخول بمايكروسوفت",
  "Add automation to Wakeel": "إضافة الأتمتة إلى وكيل",
  // integrations
  "Choose integration": "اختر التكامل", "Search connectors by name…": "ابحث عن الموصّلات بالاسم…",
  // automations
  "Open Automations ↗": "فتح الأتمتة ↗", "Schedule & trigger": "الجدولة والتشغيل",
  "400+ connectors": "أكثر من 400 موصّل", "Calls your agents": "يستدعي وكلاءك",
  "Install & connect": "تثبيت وربط",
  // integrations / tasks / inbox / analytics page copy
  "Connect Wakeel agents to the systems your entity uses —": "اربط وكلاء وكيل بالأنظمة التي تستخدمها جهتك —",
  "connectors across Microsoft 365, UAE government, databases and more.": "موصّلًا عبر Microsoft 365 والحكومة الإماراتية وقواعد البيانات وغيرها.",
  "Every agent run — status, steps and duration. Click one to see the step-by-step log.": "كل تشغيل للوكيل — الحالة والخطوات والمدة. اضغط على أيٍّ منها لعرض السجل خطوة بخطوة.",
  "Agents draft; officers decide. Review each output and approve, reject, or edit before it's actioned.": "الوكلاء يصيغون، والموظفون يقرّرون. راجع كل مُخرَج واعتمده أو ارفضه أو عدّله قبل تنفيذه.",
  "How your agents are performing across all runs.": "كيف يؤدّي وكلاؤك عبر جميع عمليات التشغيل.",
  // automations
  "Connector & workflow engine": "محرّك الموصّلات وسير العمل",
  "Wakeel's built-in connector & scheduling engine —": "محرّك الموصّلات والجدولة المدمج في وكيل —",
  "bundled in this deployment": "مضمّن في هذا التثبيت",
  ". 400+ connectors including all of Microsoft 365, Google, databases and HTTP. Automations read/write across your systems and call your Wakeel agents for the AI.": ". أكثر من 400 موصّل تشمل كامل Microsoft 365 وGoogle وقواعد البيانات وHTTP. تقرأ الأتمتة وتكتب عبر أنظمتك وتستدعي وكلاءك للذكاء الاصطناعي.",
  "Runs in your stack for data residency · sign in:": "يعمل ضمن بنيتك لضمان سيادة البيانات · تسجيل الدخول:",
  "Daily/cron runs, webhooks, \"new email\" or \"row added\" events — the entry points your agents react to.": "تشغيل يومي/cron وWebhooks وأحداث «بريد جديد» أو «صف مضاف» — نقاط الدخول التي يتفاعل معها وكلاؤك.",
  "Outlook, SharePoint, Excel, Teams, Google, SAP, databases, HTTP — the connector layer Wakeel's agents act through.": "Outlook وSharePoint وExcel وTeams وGoogle وSAP وقواعد البيانات وHTTP — طبقة الموصّلات التي يعمل عبرها وكلاء وكيل.",
  "An automation step calls a Wakeel agent's API for the reasoning, then acts on the result (send, update, escalate).": "تستدعي خطوة الأتمتة واجهة الوكيل البرمجية للتفكير، ثم تنفّذ بناءً على النتيجة (إرسال، تحديث، تصعيد).",
  // profile
  "Build Assistant": "مساعد البناء", "Chat to edit": "تحرير بالمحادثة —",
  "Let's shape this agent together.": "لنُشكّل هذا الوكيل معًا.",
  "Tell me what to change and I'll update the flow — no diagrams needed.": "أخبرني بما تريد تغييره وسأحدّث المخطط — دون الحاجة إلى رسوم.",
  "Ask the assistant to edit this flow…": "اطلب من المساعد تعديل هذا المخطط…",
  "Add a follow-up step": "أضف خطوة متابعة",
  "Add a condition / branch": "أضف شرطًا / تفرّعًا",
  "Make the tone stricter and more formal": "اجعل النبرة أكثر صرامة ورسمية",
  "Add an Arabic translation step at the end": "أضف خطوة ترجمة عربية في النهاية",
  "Describe a task. Wakeel handles it.": "صِف مهمة، ووكيل يتولّاها.",
  "Edit this flow by chatting — add a step, change a prompt, add a condition.": "عدّل هذا المخطط بالمحادثة — أضف خطوة أو غيّر تعليمة أو أضف شرطًا.",
  "Ask Wakeel to edit this flow…": "اطلب من وكيل تعديل هذا المخطط…",
  "Sign out": "تسجيل الخروج", "Activity": "النشاط", "Government of Abu Dhabi": "حكومة أبوظبي",
};
function t(s) { return LANG === "ar" ? (T[s] || s) : s; }

/* ---------- state ---------- */
let ME = null, LANG = localStorage.getItem("wakeel_lang") || "en";
let VIEW = "home", BUILD = true, AGENT = null, ASUB = "flow", COPILOT = false;
let APPS = [], THREAD = [], LASTGRAPH = null, LASTDESIGN = null, DEPT = "all", CFGNODE = null;

async function api(method, path, body) {
  const r = await fetch("api/" + path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, credentials: "include" });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== "me") { ME = null; renderLogin(); throw new Error("session expired"); }
  if (!r.ok) throw new Error(d.error || r.status);
  return d;
}
function applyDir() { document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr"; document.documentElement.lang = LANG; }
function logo(cls = "") { return `<div class="logo ${cls}"><span>و</span></div>`; }

/* ---------- login ---------- */
function renderLogin() {
  applyDir();
  $("#root").innerHTML = `
  <div class="signin fade">
    <div class="signin-hero">
      <div class="wave"></div>
      <div class="hero-logo"><div class="logo" style="width:40px;height:40px;border-radius:12px"><span>وكيل</span></div><div style="font-size:22px;font-weight:800">Wakeel</div></div>
      <div class="hero-copy"><h2>The agentic platform for government.</h2><p>Any employee builds, tests and deploys AI agents — in Arabic or English. Describe the task, Wakeel does the rest.</p></div>
      <div class="hero-foot">🇦🇪 Government of Abu Dhabi · وكيل</div>
    </div>
    <div class="signin-form"><div class="signin-card">
      <h1>Sign in</h1><div class="sub">Use your entity account to continue.</div>
      <div class="field"><label>Email address</label><input class="input" id="em" type="email" autocomplete="username"/></div>
      <div class="field"><label>Password</label><input class="input" id="pw" type="password" autocomplete="current-password"/></div>
      <button class="btn primary block" id="go">Sign in</button>
      <div class="err" id="err"></div>
      <div style="margin-top:22px;color:var(--faint);font-size:12px">Government of Abu Dhabi · <span class="linky" id="lang">${LANG === "en" ? "العربية" : "English"}</span></div>
    </div></div>
  </div>`;
  $("#lang").onclick = () => { LANG = LANG === "en" ? "ar" : "en"; localStorage.setItem("wakeel_lang", LANG); renderLogin(); };
  const go = async () => {
    $("#go").disabled = true; $("#go").textContent = "Signing in…"; $("#err").textContent = "";
    try { await api("POST", "login", { email: $("#em").value.trim(), password: $("#pw").value }); await boot(); }
    catch (e) { $("#err").textContent = "Invalid credentials"; $("#go").disabled = false; $("#go").textContent = "Sign in"; }
  };
  $("#go").onclick = go; $("#pw").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
}

/* ---------- shell ---------- */
const NAV = [["home", "Home", IC.home], ["skills", "Skills", IC.skills], ["projects", "Projects", IC.projects], ["inbox", "Inbox", IC.inbox], ["tasks", "Tasks", IC.tasks], ["templates", "Agent templates", IC.templates], ["integrations", "Integrations", IC.integrations], ["automations", "Automations", IC.flow], ["views", "Analytics", IC.views]];

function renderShell() {
  applyDir();
  // Chat-first: the Build Assistant sits beside the Dify flow diagram and config tabs.
  const showCop = COPILOT && VIEW === "agent" && ASUB !== "config";
  $("#root").innerHTML = `
  <div class="app">
    <aside class="side">
      <div class="side-top">${logo()}<div class="nm">Wakeel</div><span class="beta">${t("Beta")}</span></div>
      <nav class="nav">${NAV.map(([id, label, ic]) => `<a class="${VIEW === id ? "active" : ""}" data-v="${id}">${ic}<span>${t(label)}</span></a>`).join("")}</nav>
      <div class="side-sub">${t("Your agents")}</div>
      <div class="agent-list" id="agentList"><div class="empty-mini">${t("Loading…")}</div></div>
      <div class="new-agent" id="newAgent">${IC.plus} ${t("New agent")}</div>
      <div class="side-foot">
        <div class="foot-row" id="supBtn">${IC.help}<span>${t("Chat & support")}</span></div>
        <div class="foot-row" id="userBtn"><div class="av">${esc((ME.email || "U")[0].toUpperCase())}</div><span>${esc(ME.email.split("@")[0])}</span></div>
      </div>
    </aside>
    <main class="main" id="mainCol"></main>
    ${showCop ? renderCopilot() : ""}
  </div>`;
  document.querySelectorAll(".nav a").forEach(a => a.onclick = () => { VIEW = a.dataset.v; AGENT = null; COPILOT = false; location.hash = a.dataset.v; renderShell(); });
  $("#newAgent").onclick = () => { VIEW = "home"; THREAD = []; renderShell(); };
  $("#userBtn").onclick = openProfile;
  $("#supBtn").onclick = openHelp;
  loadAgents();
  ({ home: viewHome, skills: viewSkills, projects: () => viewEmpty("Projects", "Group related agents, files and notes.", IC.projects), inbox: viewInbox, tasks: viewTasks, templates: viewTemplates, integrations: viewIntegrations, automations: viewAutomations, views: viewAnalytics, agent: viewAgent }[VIEW])();
  if (showCop) wireCopilot();
}

const SUBTABS = [["flow", "Flow", IC.flow], ["triggers", "Triggers", IC.integrations], ["automation", "Automation", IC.bolt], ["records", "Records", IC.projects], ["evaluate", "Evaluate", IC.check], ["memory", "Memory", IC.book], ["governance", "Governance", IC.check], ["instructions", "Instructions", IC.skills]];
async function loadAgents() {
  try {
    const d = await api("GET", "apps"); APPS = d.apps || [];
    const el = $("#agentList"); if (!el) return;
    if (!APPS.length) { el.innerHTML = `<div class="empty-mini">${t("No agents yet")}</div>`; return; }
    el.innerHTML = "";
    APPS.forEach(a => {
      const open = (a.id === AGENT && VIEW === "agent");
      const x = document.createElement("a");
      if (open) x.classList.add("open");
      const ai = agentIcon(a.name);
      x.innerHTML = `<span class="dot ${ai.cl}">${ai.ic}</span><span class="an">${esc(a.name)}</span><span class="caret">${open ? "▾" : "▸"}</span>`;
      x.onclick = () => open ? (VIEW = "agent") && renderShell() : openAgent(a.id, "flow");
      el.appendChild(x);
      if (open) {
        const tree = document.createElement("div"); tree.className = "agent-subtree";
        SUBTABS.forEach(([id, label, ic]) => {
          const s = document.createElement("a"); s.className = "sub-item" + ((ASUB === id || (id === "flow" && ASUB === "simple")) ? " active" : "");
          s.innerHTML = `${ic}<span>${t(label)}</span>`;
          s.onclick = (e) => { e.stopPropagation(); ASUB = id; CFGNODE = null; renderShell(); };
          tree.appendChild(s);
        });
        el.appendChild(tree);
      }
    });
  } catch (e) {}
}

/* ---------- HOME ---------- */
function viewHome() {
  $("#mainCol").innerHTML = `
    <div class="topbar"><div class="crumbs">${logo("")}<b>${t("Wakeel AI")}</b></div>
      <div class="top-actions"><button class="icn-btn" id="langBtn">${LANG === "en" ? "ع" : "EN"}</button></div></div>
    <div class="home" id="homeArea"></div>`;
  $("#langBtn").onclick = () => { LANG = LANG === "en" ? "ar" : "en"; localStorage.setItem("wakeel_lang", LANG); renderShell(); };
  THREAD.length ? drawThread() : drawComposerHome();
}

function drawComposerHome() {
  $("#homeArea").innerHTML = `
    <div class="home-inner fade">
      <h1>${t("What do you want to work on?")}</h1>
      <div class="composer">
        <textarea id="ins" rows="2" placeholder="${t("Ask Wakeel to perform tasks, build an agent, or brainstorm ideas")}"></textarea>
        <div class="composer-foot">
          <div class="toggle-pill ${BUILD ? "on" : ""}" id="buildToggle"><span class="lm">و</span> ${t("Build agents")}</div>
          <button class="plus-btn" id="plusBtn">${IC.plus}<div class="pop" id="plusPop" hidden>
            <a data-a="upload">${IC.upload} ${t("Upload file")}</a>
            <a data-a="skills">${IC.skills} ${t("Add skills")}</a>
            <a data-a="integration">${IC.integrations} ${t("Add integration")}</a>
          </div></button>
          <button class="send-btn" id="sendBtn">${IC.up}</button>
        </div>
      </div>
      <div class="recommend">
        <div class="rh">${IC.spark} ${t("Recommended")}</div>
        <div class="chips">
          <button class="chip">${t("Review a trade license application")}</button>
          <button class="chip">${t("Route a citizen complaint")}</button>
          <button class="chip">${t("Draft a bilingual approval letter")}</button>
          <button class="chip">${t("Summarize a legal document")}</button>
        </div>
      </div>
    </div>`;
  $("#buildToggle").onclick = () => { BUILD = !BUILD; $("#buildToggle").classList.toggle("on", BUILD); };
  $("#plusBtn").onclick = (e) => { e.stopPropagation(); const p = $("#plusPop"); p.hidden = !p.hidden; };
  document.querySelectorAll("#plusPop a").forEach(a => a.onclick = (e) => { e.stopPropagation(); plusAction(a.dataset.a); });
  document.querySelectorAll(".chip").forEach(c => c.onclick = () => { $("#ins").value = c.textContent; $("#ins").focus(); });
  $("#sendBtn").onclick = onSend;
  $("#ins").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } });
  $("#ins").focus();
}
function plusAction(a) { if (a === "integration") { VIEW = "integrations"; renderShell(); } else { VIEW = "skills"; renderShell(); } }

async function onSend() {
  const text = $("#ins") ? $("#ins").value.trim() : "";
  if (!text) return;
  THREAD.push({ role: "me", text });
  drawThread();
  const reason = document.createElement("div"); reason.className = "reason"; reason.innerHTML = `<div class="rt">Reasoning</div>`;
  $("#thread").insertBefore(reason, $("#thread").lastElementChild);
  const step = (label) => { const s = document.createElement("div"); s.className = "rstep"; s.innerHTML = `<span class="ri"><div class="spin"></div></span> ${esc(label)}`; reason.appendChild(s); s.scrollIntoView({ block: "end" }); return s; };
  const done = (s, label) => { s.className = "rstep done"; s.innerHTML = `<span class="ri">${IC.check}</span> ${esc(label)}`; };
  if (BUILD) {
    const refining = !!LASTDESIGN;
    const s1 = step(refining ? "Reading your requested changes" : "Understanding what you want to build");
    await sleep(refining ? 300 : 500);
    done(s1, refining ? "Got it" : "Understood the goal");
    const s2 = step(refining ? "Revising the design" : "Designing the agent architecture");
    if (!refining) { const t2 = step("Mapping the flow, data and guardrails"); await sleep(650); done(t2, "Mapped the flow, data and guardrails"); }
    try {
      const body = refining
        ? { instruction: LASTDESIGN.instruction, prior: LASTDESIGN.design, changes: text, lang: LANG }
        : { instruction: text, lang: LANG };
      const d = await api("POST", "design", body);
      if (!d.flow || !d.flow.length) { done(s2, "Could not design that"); THREAD.push({ role: "ai", text: "I couldn't design that — try describing the task more concretely." }); drawThread(); return; }
      done(s2, refining ? "Updated the design" : `Designed a ${d.flow.length}-step agent`);
      LASTDESIGN = { instruction: LASTDESIGN ? LASTDESIGN.instruction : text, design: d };
      THREAD.push({ role: "design", design: d });
      drawThread();
    } catch (e) { done(s2, "Error"); THREAD.push({ role: "ai", text: "⚠️ " + e.message }); drawThread(); }
  } else {
    const s1 = step("Thinking");
    try { const r = await api("POST", "chat", { message: text, history: THREAD.filter(m => m.role === "me" || m.role === "ai").map(m => ({ role: m.role === "me" ? "user" : "assistant", content: m.text })) }); done(s1, "Answered"); THREAD.push({ role: "ai", text: r.reply }); drawThread(); }
    catch (e) { done(s1, "Error"); THREAD.push({ role: "ai", text: "⚠️ " + e.message }); drawThread(); }
  }
}

function drawThread() {
  const area = $("#homeArea");
  area.innerHTML = `<div class="thread" id="thread"></div>`;
  const th = $("#thread");
  THREAD.forEach(m => {
    if (m.role === "me") { const d = document.createElement("div"); d.className = "bubble me"; d.textContent = m.text; th.appendChild(d); }
    else if (m.role === "ai") { const d = document.createElement("div"); d.className = "bubble ai"; d.textContent = m.text; th.appendChild(d); }
    else if (m.role === "plan") th.appendChild(planCard(m));
    else if (m.role === "design") th.appendChild(designCard(m));
  });
  const c = document.createElement("div"); c.className = "composer"; c.style.marginTop = "10px";
  c.innerHTML = `<textarea id="ins" rows="1" placeholder="${t(LASTDESIGN ? "Reply with any changes, or press Build this agent…" : "Reply to Wakeel…")}"></textarea>
    <div class="composer-foot"><div class="toggle-pill ${BUILD ? "on" : ""}" id="buildToggle"><span class="lm">و</span> ${t("Build agents")}</div><button class="send-btn" id="sendBtn">${IC.up}</button></div>`;
  th.appendChild(c);
  $("#buildToggle").onclick = () => { BUILD = !BUILD; $("#buildToggle").classList.toggle("on", BUILD); };
  $("#sendBtn").onclick = onSend;
  $("#ins").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } });
  area.scrollTop = area.scrollHeight; th.scrollTop = th.scrollHeight;
}

function planCard(m) {
  const d = document.createElement("div"); d.className = "result-card";
  d.innerHTML = `<div class="rc-h">${IC.flow} <span>Here's the workflow for “${esc(m.name)}”</span></div>
    <div class="rc-b">${m.nodes.map((n, i) => `<div class="mini-step"><span class="n">${i + 1}</span> ${esc(n.title || n.type)} <span class="k">${esc(n.type)}</span></div>`).join("")}</div>
    <div class="rc-actions"><input class="input" id="planName" style="flex:1" value="${esc(m.name)}"/><button class="btn primary sm" id="createAgent">${IC.bolt} Create agent</button></div>`;
  setTimeout(() => {
    $("#createAgent").onclick = async () => {
      const name = $("#planName").value.trim() || "Wakeel Agent";
      $("#createAgent").disabled = true; $("#createAgent").textContent = "Creating…";
      try { const r = await api("POST", "deploy", { mode: "agent", name, graph: LASTGRAPH }); THREAD = []; loadAgents(); openAgent(r.id, "flow"); }
      catch (e) { alert(e.message); $("#createAgent").disabled = false; }
    };
  }, 0);
  return d;
}

/* ---------- design proposal (Beam-style: propose → review → build) ---------- */
const KIND_ICON = { entry: IC.play, llm: IC.spark, cond: IC.flow, tool: IC.integrations, end: IC.check };
const KIND_CLS = { entry: "entry", cond: "cond", tool: "tool", end: "end" };
function designDiagram(flow) {
  // top-to-bottom flow; show branch labels on outgoing edges
  const byId = {}; flow.forEach(n => byId[n.id] = n);
  return `<div class="dg">${flow.map(n => {
    const outs = (n.next || []).filter(e => byId[e.to]);
    const branches = outs.length > 1;
    return `<div class="dg-node ${KIND_CLS[n.kind] || ""}">
        <span class="dg-ic">${KIND_ICON[n.kind] || IC.spark}</span>
        <div class="dg-txt"><b>${esc(n.title || "")}</b>${(n.model || n.integration) ? `<span>${esc([n.integration, n.model].filter(Boolean).join(" · "))}</span>` : ""}</div>
      </div>
      ${outs.length ? `<div class="dg-edges ${branches ? "branch" : ""}">${outs.map(e => `<div class="dg-edge">${e.label ? `<span class="dg-lbl">${esc(e.label)}</span>` : ""}<span class="dg-arr">↓</span></div>`).join("")}</div>` : ""}`;
  }).join("")}</div>`;
}
function designCard(m) {
  const d = m.design;
  const el = document.createElement("div"); el.className = "design-card";
  const table = (d.schema && d.schema.columns && d.schema.columns.length) ? `
    <div class="ds-sec"><div class="ds-h">${IC.projects} ${esc(d.schema.title || "Data record")}</div>
      <table class="ds-tbl"><tbody>${d.schema.columns.map(c => `<tr><td>${esc(c.name)}</td><td class="mut">${esc(c.type || "")}</td></tr>`).join("")}</tbody></table></div>` : "";
  const nodeTbl = `<div class="ds-sec"><div class="ds-h">${IC.flow} ${t("Nodes")}</div>
    <table class="ds-tbl"><thead><tr><th>#</th><th>Node</th><th>Model</th><th>Integration</th></tr></thead>
    <tbody>${d.flow.map((n, i) => `<tr><td class="mut">${i + 1}</td><td>${esc(n.title || "")}</td><td class="mut">${esc(n.model || "—")}</td><td class="mut">${esc(n.integration || "—")}</td></tr>`).join("")}</tbody></table></div>`;
  const chips = (arr) => arr.map(s => `<span class="ds-chip">${esc(s)}</span>`).join("");
  const list = (title, ic, arr) => (arr && arr.length) ? `<div class="ds-sec"><div class="ds-h">${ic} ${title}</div><ul class="ds-list">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
  el.innerHTML = `
    <div class="ds-intro">${t("Here's the full design for your")} <b>${esc(d.name)}</b>${t(". Review it and let me know if you'd like any changes before I build it.")}</div>
    <div class="ds-summary">${esc(d.summary || "")}</div>
    <div class="ds-sec"><div class="ds-h">${IC.flow} ${t("Flow architecture")}</div>${designDiagram(d.flow)}</div>
    ${nodeTbl}
    ${table}
    ${(d.statuses && d.statuses.length) ? `<div class="ds-sec"><div class="ds-h">${IC.tasks} ${t("Allowed statuses")}</div><div class="ds-chips">${chips(d.statuses)}</div></div>` : ""}
    ${list(t("Triggers"), IC.play, d.triggers)}
    ${list(t("Key design decisions"), IC.spark, d.decisions)}
    ${list(t("Guardrails"), IC.help, d.guardrails)}
    <div class="ds-foot">
      <div class="ds-ask">${t("Shall I go ahead and build this agent?")}</div>
      <div class="ds-actions"><button class="btn primary" id="dsBuild">${IC.bolt} ${t("Build this agent")}</button>
        <button class="btn" id="dsTweak">${t("Request changes")}</button></div>
    </div>`;
  setTimeout(() => {
    $("#dsBuild").onclick = () => buildFromDesign(d, $("#dsBuild"));
    $("#dsTweak").onclick = () => { const i = $("#ins"); if (i) { i.placeholder = t("Describe the changes you want…"); i.focus(); } };
  }, 0);
  return el;
}
async function buildFromDesign(d, btn) {
  btn.disabled = true; btn.innerHTML = `<div class="spin"></div> Building…`;
  const area = $("#homeArea"); const t = $("#thread");
  const reason = document.createElement("div"); reason.className = "reason"; reason.innerHTML = `<div class="rt">Building</div>`;
  t.insertBefore(reason, t.lastElementChild);
  const step = (l) => { const s = document.createElement("div"); s.className = "rstep"; s.innerHTML = `<span class="ri"><div class="spin"></div></span> ${esc(l)}`; reason.appendChild(s); s.scrollIntoView({ block: "end" }); return s; };
  const done = (s, l) => { s.className = "rstep done"; s.innerHTML = `<span class="ri">${IC.check}</span> ${esc(l)}`; };
  const s1 = step("Assembling the workflow from the approved design");
  try {
    const g = await api("POST", "generate", { mode: "agent", design: d });
    if (!g.nodes || !g.nodes.length) throw new Error(g.error || "generation failed");
    done(s1, `Assembled ${g.nodes.length} steps`);
    const s2 = step("Generating governance & guardrails"); await sleep(500); done(s2, "Governance ready");
    const s3 = step("Deploying to your workspace");
    const r = await api("POST", "deploy", { mode: "agent", name: d.name, graph: g.graph });
    done(s3, "Deployed");
    LASTDESIGN = null; THREAD = []; loadAgents(); openAgent(r.id, "flow");
  } catch (e) { const s = step("Error"); done(s, "Error"); btn.disabled = false; btn.innerHTML = `${IC.bolt} Build this agent`; alert(e.message); }
}

/* ---------- AGENT / FLOW ---------- */
function openAgent(id, sub) { LASTDESIGN = null; AGENT = id; ASUB = sub || "flow"; VIEW = "agent"; COPILOT = true; CFGNODE = null; location.hash = "agent/" + id; renderShell(); }

const ATABS = [["flow", "Flow"], ["triggers", "Triggers"], ["automation", "Automation"], ["records", "Records"], ["evaluate", "Evaluate"], ["memory", "Memory"], ["governance", "Governance"], ["instructions", "Instructions"]];
async function viewAgent() {
  const app = APPS.find(a => a.id === AGENT) || { name: "Agent" };
  const cur = ASUB === "config" ? "flow" : ASUB;
  $("#mainCol").innerHTML = `
    <div class="topbar"><div class="crumbs"><b>${esc(app.name)}</b></div>
      <div class="agent-tabs">${ATABS.map(([id, l]) => `<button class="${cur === id ? "active" : ""}" data-s="${id}">${t(l)}</button>`).join("")}</div>
      <div class="top-actions"><button class="icn-btn" id="copToggle" title="Copilot">${IC.chat}</button></div></div>
    <div class="flow-wrap" id="flowWrap"><div class="empty-state"><div class="spin" style="margin:0 auto"></div></div></div>`;
  document.querySelectorAll(".agent-tabs button").forEach(b => b.onclick = () => { ASUB = b.dataset.s; CFGNODE = null; viewAgent(); });
  $("#copToggle").onclick = () => { COPILOT = !COPILOT; renderShell(); };
  try {
    const info = await api("GET", "app-info?id=" + AGENT);
    window.__agentInfo = info;
    if (ASUB === "triggers") renderTriggers(info);
    else if (ASUB === "automation") renderAutomation(info);
    else if (ASUB === "records") renderRecords(info);
    else if (ASUB === "evaluate") renderEvaluate(info);
    else if (ASUB === "memory") renderMemory(info);
    else if (ASUB === "governance") renderGovernance(info);
    else if (ASUB === "instructions") renderInstructions(info);
    else if (ASUB === "simple") renderFlow(info); // simplified card view (alternative)
    else renderFlowStudio(info); // default "flow" = the real Dify diagram, cleaned, + chatbot
  } catch (e) { $("#flowWrap").innerHTML = `<div class="empty-state">⚠️ ${esc(e.message)}</div>`; }
}

function renderTriggers(info) {
  $("#flowWrap").innerHTML = `<div class="content"><div class="pad">
    <h1 class="page-h">${t("Triggers")}</h1><p class="page-sub">${t("How this agent starts. Multiple triggers can feed the same flow.")}</p>
    <div class="grid">
      <div class="gcard" style="cursor:default"><div class="ic">${IC.play}</div><h3>${t("Manual run")} <span class="st-pill ok">${t("Active")}</span></h3><p>${t("Run on demand from Test mode or the API. Always available.")}</p></div>
      <div class="gcard" id="trSchedule"><div class="ic">${IC.tasks}</div><h3>${t("Schedule")}</h3><p>${t("Run on a timer — hourly, daily, or a cron expression.")}</p><div class="foot"><span></span><button class="btn sm">${t("Configure")}</button></div></div>
      <div class="gcard" id="trWebhook"><div class="ic">${IC.integrations}</div><h3>${t("Webhook / API")}</h3><p>${t("Trigger from any government system via a secure URL with an API key.")}</p><div class="foot"><span></span><button class="btn sm">${t("Get URL")}</button></div></div>
      <div class="gcard" id="trIntegration"><div class="ic">${IC.inbox}</div><h3>${t("Integration event")}</h3><p>${t("New email (Outlook), file updated (SharePoint), row added (Excel)…")}</p><div class="foot"><span></span><button class="btn sm">${t("Choose")}</button></div></div>
      <div class="gcard" id="trM365" style="grid-column:span 2"><div style="display:flex;align-items:center;gap:12px;margin-bottom:2px">${brandLogo("Power Automate", 40)}<h3 style="margin:0">Microsoft 365 <span class="st-pill ok">${t("Recommended")}</span></h3></div><p>${t("Connect Outlook, SharePoint & Excel. Wakeel's built-in automation engine handles the Microsoft connectors and the schedule — the agent does the AI. One Microsoft sign-in, then it runs automatically on your timer.")}</p><div class="foot"><span></span><button class="btn primary sm">${t("Connect Microsoft 365")}</button></div></div>
    </div>
    <div id="trPanel" style="margin-top:20px"></div>
  </div></div>`;
  $("#trSchedule").querySelector("button").onclick = () => {
    $("#trPanel").innerHTML = `<div class="gcard" style="cursor:default;max-width:520px"><h3>Schedule</h3><div class="field" style="margin-top:12px"><label>Frequency</label><select class="input"><option>Every hour</option><option selected>Every day at 08:00</option><option>Every Monday 09:00</option><option>Custom cron…</option></select></div><button class="btn primary sm">Save schedule</button></div>`;
  };
  $("#trWebhook").querySelector("button").onclick = async () => {
    $("#trPanel").innerHTML = `<div class="gcard" style="cursor:default"><div class="spin"></div></div>`;
    try { const r = await api("POST", "apikey", { app_id: AGENT }); $("#trPanel").innerHTML = `<div class="gcard" style="cursor:default"><h3>Webhook endpoint</h3><div class="rl-out" style="background:var(--panel-2);color:var(--text);border-color:var(--line);margin-top:10px">POST ${location.origin}/v1/workflows/run
Authorization: Bearer ${esc(r.token)}
Content-Type: application/json

{"inputs": {...}, "response_mode": "blocking", "user": "gov"}</div></div>`; }
    catch (e) { $("#trPanel").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
  };
  $("#trIntegration").querySelector("button").onclick = () => { VIEW = "integrations"; renderShell(); };
  $("#trM365").querySelector("button").onclick = async () => {
    const app = APPS.find(a => a.id === AGENT) || {};
    $("#trPanel").innerHTML = `<div class="gcard" style="cursor:default;max-width:760px"><div style="display:flex;align-items:center;gap:10px"><div class="spin"></div><span style="color:var(--muted)">Connecting Microsoft 365…</span></div></div>`;
    let key = "";
    try { const r = await api("POST", "apikey", { app_id: AGENT }); key = r.token || ""; } catch (e) {}
    await sleep(650);
    $("#trPanel").innerHTML = `<div class="gcard" style="cursor:default;max-width:760px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">${brandLogo("Power Automate", 34)}<h3 style="margin:0">Microsoft 365 connection</h3></div>
      <p style="margin:0 0 18px">Wakeel's automation engine is already running in your workspace — no install needed. Two steps left, both one-time.</p>
      <div class="n8n-step done"><span class="n8n-n">${IC.check}</span><div><b>Automation engine ready</b><div style="color:var(--muted);font-size:13px;margin-top:3px">Running inside Wakeel — handles Microsoft connectors and the schedule for you.</div></div></div>
      <div class="n8n-step done"><span class="n8n-n">${IC.check}</span><div><b>Agent endpoint provisioned</b><div class="code" style="margin-top:8px">POST ${location.origin}/v1/workflows/run
Authorization: Bearer ${esc(key || "created for this agent")}</div></div></div>
      <div class="n8n-step"><span class="n8n-n">3</span><div><b>Add the Microsoft 365 automation</b><div style="color:var(--muted);font-size:13px;margin:4px 0 9px">Schedule → read Excel (SharePoint) → for each business → ask the agent → Outlook send / Excel update / escalate → daily summary.</div><div style="display:flex;gap:9px;flex-wrap:wrap"><button class="btn primary sm" id="dlM365">${IC.upload} Add automation to Wakeel</button><a class="btn sm" href="http://${location.hostname}:5679/" target="_blank">Open Automations ↗</a></div></div></div>
      <div class="n8n-step"><span class="n8n-n">4</span><div><b>Sign in with Microsoft</b><div style="color:var(--muted);font-size:13px;margin:4px 0 9px">Authorize Outlook &amp; Excel once with your MoHRE Microsoft 365 account, pick the registry workbook, and activate. Data stays in your tenant — deploy on Azure UAE North for residency.</div><button class="btn sm" id="msSignin">${brandLogo("Power Automate", 18)} Sign in with Microsoft</button></div></div>
    </div>`;
    $("#dlM365").onclick = () => downloadJSON("wakeel-" + (app.name || "agent").toLowerCase().replace(/\s+/g, "-") + "-microsoft365.json", buildN8n(key, app.name));
    $("#msSignin").onclick = () => { window.__autoconfig = "Microsoft Outlook"; VIEW = "integrations"; renderShell(); };
  };
  if (window.__autom365) { window.__autom365 = null; setTimeout(() => { const b = $("#trM365") && $("#trM365").querySelector("button"); if (b) b.click(); }, 250); }
}

function downloadJSON(name, obj) { const b = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; a.click(); }
function buildN8n(key, agentName) {
  const origin = location.origin, K = key || "YOUR_WAKEEL_API_KEY";
  const nodes = [
    { parameters: { rule: { interval: [{ field: "days", triggerAtHour: 8 }] } }, id: "n1", name: "Daily 08:00", type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2, position: [240, 320] },
    { parameters: { resource: "worksheet", operation: "getRows", comment: "Read the registry sheet from SharePoint" }, id: "n2", name: "Read Excel Registry (SharePoint)", type: "n8n-nodes-base.microsoftExcel", typeVersion: 2, position: [460, 320] },
    { parameters: { batchSize: 1 }, id: "n3", name: "Loop Businesses", type: "n8n-nodes-base.splitInBatches", typeVersion: 3, position: [680, 320] },
    { parameters: { method: "POST", url: origin + "/v1/workflows/run", sendHeaders: true, headerParameters: { parameters: [{ name: "Authorization", value: "Bearer " + K }, { name: "Content-Type", value: "application/json" }] }, sendBody: true, specifyBody: "json", jsonBody: '={\n  "inputs": { "registry_json": {{ JSON.stringify($json) }} },\n  "response_mode": "blocking",\n  "user": "n8n-mohre"\n}' }, id: "n4", name: "Wakeel Agent — AI review & draft", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [900, 320] },
    { parameters: { conditions: { conditions: [{ leftValue: "={{ $json.data.outputs.escalate }}", rightValue: "true", operator: { type: "string", operation: "equals" } }] } }, id: "n5", name: "Escalation required?", type: "n8n-nodes-base.if", typeVersion: 2, position: [1120, 320] },
    { parameters: { resource: "message", operation: "send", comment: "Escalation notice to assigned MoHRE officer" }, id: "n6", name: "Outlook — Escalate to officer", type: "n8n-nodes-base.microsoftOutlook", typeVersion: 2, position: [1340, 220] },
    { parameters: { resource: "message", operation: "send", comment: "Approved report-request / reminder email" }, id: "n7", name: "Outlook — Send outreach", type: "n8n-nodes-base.microsoftOutlook", typeVersion: 2, position: [1340, 440] },
    { parameters: { resource: "worksheet", operation: "updateRow", comment: "Write Compliance Status, dates, notes, next action" }, id: "n8", name: "Update Excel row", type: "n8n-nodes-base.microsoftExcel", typeVersion: 2, position: [1560, 320] },
    { parameters: { resource: "message", operation: "send", comment: "End-of-run summary to MoHRE officers" }, id: "n9", name: "Outlook — Daily summary", type: "n8n-nodes-base.microsoftOutlook", typeVersion: 2, position: [900, 560] },
  ];
  const C = (n) => ({ node: n, type: "main", index: 0 });
  const connections = {
    "Daily 08:00": { main: [[C("Read Excel Registry (SharePoint)")]] },
    "Read Excel Registry (SharePoint)": { main: [[C("Loop Businesses")]] },
    "Loop Businesses": { main: [[C("Wakeel Agent — AI review & draft")], [C("Outlook — Daily summary")]] },
    "Wakeel Agent — AI review & draft": { main: [[C("Escalation required?")]] },
    "Escalation required?": { main: [[C("Outlook — Escalate to officer")], [C("Outlook — Send outreach")]] },
    "Outlook — Escalate to officer": { main: [[C("Update Excel row")]] },
    "Outlook — Send outreach": { main: [[C("Update Excel row")]] },
    "Update Excel row": { main: [[C("Loop Businesses")]] },
  };
  return { name: "Wakeel · " + (agentName || "Agent") + " (Microsoft 365)", nodes, connections, active: false, settings: { executionOrder: "v1" }, meta: {}, tags: [] };
}

/* ---------- Automation Modes (Beam-style HITL: Copilot vs Autopilot per step) ---------- */
async function renderAutomation(info) {
  $("#flowWrap").innerHTML = `<div class="content"><div class="pad" id="autoPad"><div class="empty-state"><div class="spin" style="margin:0 auto"></div></div></div></div>`;
  let a; try { a = await api("GET", "automation?id=" + AGENT); } catch (e) { $("#autoPad").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; return; }
  const modeCard = (val, onpick) => `
    <div class="mode-seg">
      <button class="mode-opt ${val === "copilot" ? "on" : ""}" data-m="copilot">${IC.chat}<div><b>Copilot</b><span>Agent drafts · an officer approves before it acts</span></div></button>
      <button class="mode-opt ${val === "autopilot" ? "on" : ""}" data-m="autopilot">${IC.bolt}<div><b>Autopilot</b><span>Runs end-to-end automatically, no approval</span></div></button>
    </div>`;
  const rows = a.nodes.map(n => `
    <div class="auto-row" data-id="${esc(n.id)}">
      <div class="ar-info"><div class="dot ${n.mode === "autopilot" ? "ag-green" : "ag-amber"}">${nodeGlyph(n.type)}</div>
        <div><div class="ar-t">${esc(n.title)}</div><div class="ar-d">${esc(stepKind(n.type))}</div></div></div>
      <div class="ar-toggle"><button class="pill-toggle ${n.mode === "copilot" ? "on" : ""}" data-v="copilot">${IC.chat} Copilot</button><button class="pill-toggle ${n.mode === "autopilot" ? "on" : ""}" data-v="autopilot">${IC.bolt} Autopilot</button></div>
    </div>`).join("");
  $("#autoPad").innerHTML = `
    <div style="display:flex;align-items:center;gap:12px"><h1 class="page-h" style="margin:0">${t("Automation")}</h1><span class="st-pill ${a.agent_mode === "autopilot" ? "ok" : "idle"}">${a.agent_mode === "autopilot" ? "Autopilot" : "Human-in-the-loop"}</span></div>
    <p class="page-sub">Choose how much the agent does on its own. <b>Copilot</b> pauses for an officer's approval in the Inbox; <b>Autopilot</b> runs without stopping.</p>
    <div class="gcard" style="cursor:default;max-width:640px"><h3 style="margin-bottom:4px">Default automation mode</h3><p style="margin:0 0 14px;color:var(--muted);font-size:13px">Applies to every step unless overridden below.</p>${modeCard(a.agent_mode)}</div>
    <div class="side-sub" style="padding-inline:0;margin-top:22px">Per-step checkpoints</div>
    <div class="auto-list">${rows || `<div class="empty-mini">No configurable steps.</div>`}</div>
    <div style="display:flex;gap:10px;align-items:center;margin-top:20px"><button class="btn primary" id="autoSave">${IC.check} Save automation</button><span id="autoMsg" style="color:var(--wakeel);font-size:13px"></span></div>`;
  const state = { agent_mode: a.agent_mode, nodes: {} };
  a.nodes.forEach(n => state.nodes[n.id] = n.mode);
  // agent-level default
  $("#autoPad").querySelectorAll(".mode-opt").forEach(b => b.onclick = () => {
    state.agent_mode = b.dataset.m;
    $("#autoPad").querySelectorAll(".mode-opt").forEach(x => x.classList.toggle("on", x.dataset.m === state.agent_mode));
    $("#autoPad").querySelector(".st-pill").className = "st-pill " + (state.agent_mode === "autopilot" ? "ok" : "idle");
    $("#autoPad").querySelector(".st-pill").textContent = state.agent_mode === "autopilot" ? "Autopilot" : "Human-in-the-loop";
  });
  // per-node
  $("#autoPad").querySelectorAll(".auto-row").forEach(row => {
    const id = row.dataset.id;
    row.querySelectorAll(".pill-toggle").forEach(b => b.onclick = () => {
      state.nodes[id] = b.dataset.v;
      row.querySelectorAll(".pill-toggle").forEach(x => x.classList.toggle("on", x.dataset.v === state.nodes[id]));
      const dot = row.querySelector(".dot"); dot.className = "dot " + (state.nodes[id] === "autopilot" ? "ag-green" : "ag-amber");
    });
  });
  $("#autoSave").onclick = async () => {
    $("#autoSave").disabled = true; $("#autoMsg").textContent = "Saving…";
    try { await api("POST", "automation", { app_id: AGENT, agent_mode: state.agent_mode, nodes: state.nodes }); $("#autoMsg").textContent = "✓ Saved"; }
    catch (e) { $("#autoMsg").textContent = "⚠️ " + e.message; }
    finally { $("#autoSave").disabled = false; setTimeout(() => $("#autoMsg").textContent = "", 2000); }
  };
}
function nodeGlyph(tp) { return ({ llm: IC.spark, tool: IC.integrations, agent: IC.agent, "http-request": IC.integrations, code: IC.skills, "question-classifier": IC.flow }[tp]) || IC.spark; }
function stepKind(tp) { return ({ llm: "AI reasoning step", tool: "Tool / connector action", agent: "Calls another agent", "http-request": "HTTP request", code: "Code step", "question-classifier": "Classifier / routing" }[tp]) || "Step"; }

/* ---------- Records / Views (Beam 'Agent Views') ---------- */
let RECVIEW = null;
const STATUS_TONE = { "completed": "ok", "compliant": "ok", "response received": "ok", "pending outreach": "idle", "report requested": "info", "under review": "info", "follow-up sent": "warn", "incomplete submission": "warn", "escalation required": "bad", "escalated to officer": "bad", "non-compliant (proposed)": "bad" };
function statusChip(v) { const tone = STATUS_TONE[(v || "").toLowerCase()] || "idle"; return `<span class="st-pill ${tone}">${esc(v)}</span>`; }
async function renderRecords(info) {
  $("#flowWrap").innerHTML = `<div class="content"><div class="pad" id="recPad" style="max-width:100%"><div class="empty-state"><div class="spin" style="margin:0 auto"></div></div></div></div>`;
  try { RECVIEW = await api("GET", "records?id=" + AGENT); } catch (e) { $("#recPad").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; return; }
  drawRecords();
}
function drawRecords(q = "") {
  const v = RECVIEW; const cols = v.columns || [];
  const rows = (v.rows || []).filter(r => !q || cols.some(c => String(r[c.name] || "").toLowerCase().includes(q.toLowerCase())));
  const cell = (c, r) => c.type === "status" ? statusChip(r[c.name]) : `<span>${esc(String(r[c.name] ?? "—"))}</span>`;
  $("#recPad").innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><h1 class="page-h" style="margin:0">${esc(v.view)}</h1><span class="st-pill idle">${(v.rows || []).length} records</span>
      <div style="margin-inline-start:auto;display:flex;gap:9px"><div class="searchbar" style="margin:0;width:220px"><input id="recSearch" placeholder="Search records…" value="${esc(q)}"/></div><button class="btn primary sm" id="recAdd">${IC.plus} New record</button></div></div>
    <p class="page-sub">The live data this agent reads and writes — a native view of the connected registry.</p>
    <div class="rec-wrap"><table class="rec-tbl"><thead><tr>${cols.map(c => `<th>${esc(c.name)}</th>`).join("")}<th style="width:34px"></th></tr></thead>
      <tbody>${rows.length ? rows.map((r, i) => `<tr data-i="${(v.rows || []).indexOf(r)}">${cols.map(c => `<td>${cell(c, r)}</td>`).join("")}<td><button class="icn-btn rec-del" title="Delete">✕</button></td></tr>`).join("") : `<tr><td colspan="${cols.length + 1}" style="text-align:center;color:var(--faint);padding:30px">No records${q ? " match your search" : " yet"}.</td></tr>`}</tbody></table></div>`;
  $("#recSearch").addEventListener("input", e => drawRecords(e.target.value));
  const save = () => api("POST", "records-save", { app_id: AGENT, view: v.view, columns: v.columns, rows: v.rows }).catch(() => {});
  $("#recAdd").onclick = () => {
    const d = document.createElement("div"); d.className = "modal-back";
    d.innerHTML = `<div class="modal fade" style="width:520px" onclick="event.stopPropagation()"><div style="display:flex"><h2 style="flex:1">New record</h2><button class="x" id="rx">×</button></div>
      ${cols.map((c, i) => c.type === "status"
        ? `<div class="field"><label>${esc(c.name)}</label><select class="input" id="rf${i}">${["Pending Outreach", "Report Requested", "Response Received", "Incomplete Submission", "Under Review", "Follow-up Sent", "Escalation Required", "Completed"].map(s => `<option>${s}</option>`).join("")}</select></div>`
        : `<div class="field"><label>${esc(c.name)}</label><input class="input" id="rf${i}"/></div>`).join("")}
      <button class="btn primary block" id="rok">Add record</button></div>`;
    document.body.appendChild(d); d.onclick = () => d.remove(); $("#rx").onclick = () => d.remove();
    $("#rok").onclick = async () => { const row = {}; cols.forEach((c, i) => row[c.name] = $("#rf" + i).value.trim() || "—"); v.rows.unshift(row); await save(); d.remove(); drawRecords(); };
  };
  $("#recPad").querySelectorAll(".rec-del").forEach(el => el.onclick = async (e) => { const i = +e.target.closest("tr").dataset.i; v.rows.splice(i, 1); await save(); drawRecords($("#recSearch").value); });
}

/* ---------- Evaluation (Beam: Test Datasets + Evaluation Framework + Optimize) ---------- */
let EVAL_CASES = [];
async function renderEvaluate(info) {
  $("#flowWrap").innerHTML = `<div class="content"><div class="pad" id="evPad"><div class="empty-state"><div class="spin" style="margin:0 auto"></div></div></div></div>`;
  try { const d = await api("GET", "eval?id=" + AGENT); EVAL_CASES = d.cases || []; } catch (e) { EVAL_CASES = []; }
  drawEval();
}
function evalScore() {
  const run = EVAL_CASES.filter(c => c.last);
  if (!run.length) return null;
  return Math.round(run.filter(c => c.last.pass).length * 100 / run.length);
}
function drawEval() {
  const score = evalScore();
  const passed = EVAL_CASES.filter(c => c.last && c.last.pass).length;
  const failed = EVAL_CASES.filter(c => c.last && !c.last.pass).length;
  const rows = EVAL_CASES.map((c, i) => `
    <div class="ev-case" data-i="${i}">
      <div class="ev-main">
        <div class="ev-verdict">${c.last ? (c.last.pass ? `<span class="st-pill ok">Pass</span>` : `<span class="st-pill bad">Fail</span>`) : `<span class="st-pill idle">Not run</span>`}</div>
        <div class="ev-txt"><div class="ev-in">${esc(c.input)}</div><div class="ev-exp"><b>Expected:</b> ${esc(c.expected)}</div>${c.last && c.last.reason ? `<div class="ev-reason">${c.last.pass ? "✓" : "✕"} ${esc(c.last.reason)}</div>` : ""}</div>
      </div>
      <div class="ev-actions"><button class="btn sm ev-run" data-i="${i}">${IC.play} Run</button><button class="icn-btn ev-del" data-i="${i}" title="Remove">✕</button></div>
    </div>`).join("");
  $("#evPad").innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <h1 class="page-h" style="margin:0">Evaluate</h1>
      ${score != null ? `<span class="ev-badge ${score >= 80 ? "g" : score >= 50 ? "y" : "r"}">Evaluation score ${score}%</span>` : ""}
      ${EVAL_CASES.length ? `<span class="page-sub" style="margin:0">${passed} passed · ${failed} failed · ${EVAL_CASES.length} cases</span>` : ""}
    </div>
    <p class="page-sub">Build a test dataset, run it against the agent, and score the outputs. When cases fail, Wakeel can optimise the prompts to fix them.</p>
    <div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:18px">
      <button class="btn primary sm" id="evRunAll" ${EVAL_CASES.length ? "" : "disabled"}>${IC.play} Run all</button>
      <button class="btn sm" id="evGen">${IC.spark} Generate test cases</button>
      <button class="btn sm" id="evAdd">${IC.plus} Add case</button>
      ${failed ? `<button class="btn sm" id="evHeal" style="margin-inline-start:auto;border-color:#0b7a48;color:var(--wakeel)">${IC.bolt} Optimise to fix ${failed} failing</button>` : ""}
    </div>
    <div class="ev-list">${rows || `<div class="empty-state" style="padding:40px 0"><div class="big">${IC.check}</div><h3>No test cases yet</h3><div>Generate a dataset or add a case to start evaluating this agent.</div></div>`}</div>
    <div id="evMsg" style="margin-top:14px;color:var(--muted);font-size:13px"></div>`;
  const save = () => api("POST", "eval-save", { app_id: AGENT, cases: EVAL_CASES }).catch(() => {});
  const runOne = async (i, btn) => {
    const c = EVAL_CASES[i]; if (!c) return;
    if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin"></span>`; }
    try { const r = await api("POST", "test-case", { app_id: AGENT, input: c.input, expected: c.expected });
      c.last = { pass: r.pass, reason: r.reason || "", output: (r.output || "").slice(0, 800), ts: Date.now() / 1000 | 0 };
    } catch (e) { c.last = { pass: false, reason: e.message }; }
  };
  $("#evGen").onclick = async () => {
    const b = $("#evGen"); b.disabled = true; b.innerHTML = `<span class="spin"></span> Generating…`;
    try { const r = await api("POST", "gen-tests", { app_id: AGENT, count: 6 }); EVAL_CASES = (r.cases || []).map(c => ({ input: c.input, expected: c.expected })).concat(EVAL_CASES); await save(); drawEval(); }
    catch (e) { $("#evMsg").textContent = "⚠️ " + e.message; b.disabled = false; b.innerHTML = `${IC.spark} Generate test cases`; }
  };
  $("#evAdd").onclick = () => {
    const d = document.createElement("div"); d.className = "modal-back";
    d.innerHTML = `<div class="modal fade" style="width:520px" onclick="event.stopPropagation()"><div style="display:flex"><h2 style="flex:1">Add test case</h2><button class="x" id="ex">×</button></div>
      <div class="field"><label>Input</label><textarea class="input" id="evi" rows="3" placeholder="A realistic input for the agent…"></textarea></div>
      <div class="field"><label>Expected outcome</label><textarea class="input" id="eve" rows="2" placeholder="What a correct output must contain / do…"></textarea></div>
      <button class="btn primary block" id="evok">Add case</button></div>`;
    document.body.appendChild(d); d.onclick = () => d.remove(); $("#ex").onclick = () => d.remove(); $("#evi").focus();
    $("#evok").onclick = async () => { const inp = $("#evi").value.trim(); if (!inp) return; EVAL_CASES.unshift({ input: inp, expected: $("#eve").value.trim() }); await save(); d.remove(); drawEval(); };
  };
  $("#evRunAll") && ($("#evRunAll").onclick = async () => {
    const b = $("#evRunAll"); b.disabled = true; b.innerHTML = `<span class="spin"></span> Running…`;
    for (let i = 0; i < EVAL_CASES.length; i++) { $("#evMsg").textContent = `Running case ${i + 1}/${EVAL_CASES.length}…`; await runOne(i); }
    await save(); drawEval();
  });
  $("#evHeal") && ($("#evHeal").onclick = async () => {
    const b = $("#evHeal"); b.disabled = true; b.innerHTML = `<span class="spin"></span> Optimising…`;
    const failures = EVAL_CASES.filter(c => c.last && !c.last.pass).map(c => ({ input: c.input, expected: c.expected, output: c.last.output }));
    try { await api("POST", "selfheal", { app_id: AGENT, failures }); $("#evMsg").textContent = "✓ Prompts optimised. Re-run to verify."; b.disabled = false; b.innerHTML = `${IC.check} Re-run to verify`; }
    catch (e) { $("#evMsg").textContent = "⚠️ " + e.message; b.disabled = false; }
  });
  $("#evPad").querySelectorAll(".ev-run").forEach(el => el.onclick = async () => { await runOne(+el.dataset.i, el); await save(); drawEval(); });
  $("#evPad").querySelectorAll(".ev-del").forEach(el => el.onclick = async () => { EVAL_CASES.splice(+el.dataset.i, 1); await save(); drawEval(); });
}

function renderMemory(info) {
  $("#flowWrap").innerHTML = `<div class="content"><div class="pad">
    <h1 class="page-h">Memory</h1><p class="page-sub">Documents the agent can read — policies, SOPs, templates, guidelines.</p>
    <div class="gcard" style="cursor:default;max-width:640px;margin-bottom:20px">
      <div class="field"><label>Name</label><input class="input" id="kbn" placeholder="e.g. Trade License Policies"/></div>
      <div class="field"><label>Content</label><textarea class="input" id="kbt" rows="5" placeholder="Paste policies, procedures, FAQs…"></textarea></div>
      <div style="display:flex;align-items:center;gap:12px"><button class="btn primary sm" id="kbAdd">${IC.upload} Add to memory</button><span class="page-sub" style="margin:0" id="kbMsg"></span></div>
    </div>
    <div class="side-sub" style="padding-inline:0">Existing memory</div>
    <div class="rowlist" id="kbList"><div class="empty-mini" style="padding:14px">Loading…</div></div>
  </div></div>`;
  $("#kbAdd").onclick = async () => {
    const name = $("#kbn").value.trim(), text = $("#kbt").value.trim(); if (!name || !text) return;
    $("#kbAdd").disabled = true; $("#kbMsg").textContent = "Adding…";
    try { await api("POST", "knowledge", { name, text }); $("#kbMsg").textContent = "✓ Added"; $("#kbn").value = ""; $("#kbt").value = ""; loadKb(); }
    catch (e) { $("#kbMsg").textContent = "⚠️ " + e.message; } finally { $("#kbAdd").disabled = false; }
  };
  const loadKb = async () => { try { const d = await api("GET", "knowledge"); const el = $("#kbList"); el.innerHTML = (d.knowledge || []).length ? "" : `<div class="lrow"><div class="info"><div class="d">No documents yet.</div></div></div>`; (d.knowledge || []).forEach(k => { const r = document.createElement("div"); r.className = "lrow"; r.innerHTML = `<div class="ic">${IC.book}</div><div class="info"><div class="t">${esc(k.name)}</div><div class="d">${k.docs || 0} documents · ${k.words || 0} words</div></div>`; el.appendChild(r); }); } catch (e) {} };
  loadKb();
}

function renderGovernance(info) {
  $("#flowWrap").innerHTML = `<div class="content"><div class="pad">
    <div style="display:flex;align-items:center;gap:12px"><h1 class="page-h" style="margin:0">Governance &amp; guardrails</h1><span class="st-pill ok">Government-grade</span><button class="btn sm" id="govRegen" style="margin-inline-start:auto">↻ Regenerate</button></div>
    <p class="page-sub">Auto-generated policy layer for this agent — reviewed and enforced by Wakeel.</p>
    <div id="govBody"><div class="empty-mini">Generating governance package…</div></div>
  </div></div>`;
  const load = (force) => {
    $("#govBody").innerHTML = `<div class="empty-mini"><span class="spin" style="display:inline-block;vertical-align:middle"></span> Generating governance package…</div>`;
    api("GET", "governance?id=" + AGENT + (force ? "&force=1" : "")).then(g => renderGovBody(g)).catch(e => { $("#govBody").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; });
  };
  $("#govRegen").onclick = () => load(true);
  load(false);
}
function govList(title, ic, items, tone) {
  return `<div class="gov-card"><div class="gov-h">${ic} ${title}</div><ul class="gov-ul ${tone || ""}">${(items || []).map(x => `<li>${esc(typeof x === "string" ? x : (x.role ? x.role + " — " + x.can : JSON.stringify(x)))}</li>`).join("")}</ul></div>`;
}
function govText(title, ic, text, tone) {
  return `<div class="gov-card ${tone || ""}"><div class="gov-h">${ic} ${title}</div><div class="gov-text">${esc(text || "—")}</div></div>`;
}
function renderGovBody(g) {
  $("#govBody").innerHTML = `
    <div class="gov-boundary">${IC.check} <div><div class="gb-h">Decision boundary</div><div>${esc(g.decision_boundary || "Reviews and recommends only; the officer decides.")}</div></div></div>
    <div class="gov-grid">
      ${govList("Guardrails", IC.check, g.guardrails, "warn")}
      ${govList("Human-in-the-loop", IC.inbox, g.human_in_loop)}
      ${govList("Allowed statuses", IC.tasks, g.allowed_statuses)}
      ${govText("Escalation policy", IC.agent, g.escalation_policy)}
      ${govList("Integration scope", IC.integrations, g.integration_scope)}
      ${govList("Audit — logged every run", IC.book, g.audit)}
      ${govList("Access control (RBAC)", IC.skills, g.rbac)}
      ${govList("Run modes", IC.play, g.run_modes)}
      ${govText("Data classification", IC.book, g.data_classification)}
      ${govText("Data residency", IC.home, g.data_residency)}
      ${govText("PII handling", IC.check, g.pii_handling)}
      ${govText("Model policy", IC.spark, g.model_policy)}
      ${govList("Compliance alignment", IC.check, g.compliance)}
    </div>`;
}

function renderInstructions(info) {
  $("#flowWrap").innerHTML = `<div class="content"><div class="pad cfg">
    <h1 class="page-h">Instructions</h1><p class="page-sub">The agent's goals, constraints and tone.</p>
    <div class="field"><label>Goals</label><textarea class="input" rows="3" placeholder="What should this agent achieve…">Review and act on ${esc(info.name || "requests")}, keeping officer decision authority.</textarea></div>
    <div class="field"><label>Constraints (guardrails)</label><textarea class="input" rows="3" placeholder="What it must not do…">Must not make final legal or enforcement decisions. Reviews, recommends, and escalates to an officer.</textarea></div>
    <div class="field"><label>Tone</label><select class="input"><option>Professional</option><option>Formal</option><option>Empathetic</option><option>Concise &amp; direct</option></select></div>
    <button class="btn primary sm">Save instructions</button>
  </div></div>`;
}

function nodeClass(t) { return t === "start" ? "entry" : t === "end" ? "end" : (t === "if-else" || t === "question-classifier") ? "cond" : ""; }
function nodeChip(n) {
  const map = { start: "Trigger — manual run", llm: "AI reasoning", "if-else": "Condition", end: "Output", tool: "Tool", "knowledge-retrieval": "Knowledge", "question-classifier": "Classifier", answer: "Answer", code: "Code", "http-request": "HTTP request", "template-transform": "Template", "parameter-extractor": "Extract" };
  return map[n.type] || (n.type || "Step");
}

/* ---------- graph editing ---------- */
const MODEL_ID = { provider: "langgenius/openai/openai", name: "gpt-5.1", mode: "chat", completion_params: {} };
function nid() { return "n" + Math.random().toString(36).slice(2, 9); }
function edge(s, t) { return { id: s + "-" + t + "-" + Math.random().toString(36).slice(2, 5), source: s, target: t, sourceHandle: "source", targetHandle: "target", type: "custom", data: { sourceType: "", targetType: "" } }; }
function newLLM(title, prompt) {
  const id = nid();
  return { id, type: "custom", position: { x: 0, y: 0 }, positionAbsolute: { x: 0, y: 0 }, width: 244, height: 98,
    data: { type: "llm", title: title || "New step", model: MODEL_ID,
      prompt_template: [{ role: "user", text: prompt || title || "", edition_type: "basic", id: id + "-m" }],
      context: { enabled: false, variable_selector: [] }, vision: { enabled: false }, memory: null, selected: false } };
}
function graphFind(g, id) { return (g.nodes || []).find(n => n.id === id); }
function graphInsertAfter(g, afterId, node) {
  g.edges = g.edges || [];
  const outs = g.edges.filter(e => e.source === afterId);
  outs.forEach(e => { e.source = node.id; });
  g.edges.push(edge(afterId, node.id));
  g.nodes.push(node);
}
function graphRemove(g, id) {
  const ins = (g.edges || []).filter(e => e.target === id).map(e => e.source);
  const outs = (g.edges || []).filter(e => e.source === id).map(e => e.target);
  g.edges = (g.edges || []).filter(e => e.source !== id && e.target !== id);
  ins.forEach(s => outs.forEach(t => g.edges.push(edge(s, t))));
  g.nodes = (g.nodes || []).filter(n => n.id !== id);
}
async function saveGraph() { await api("POST", "save-draft", { app_id: AGENT, graph: window.__graph }); }

function renderFlowStudio(info) {
  window.__flowInfo = info;
  window.__graph = info.graph || { nodes: [], edges: [] };
  $("#flowWrap").innerHTML = `
    <div class="flow-head">
      <div><h1>Flow</h1><p>${esc(info.name || "Your agent")} · ${(info.nodes || []).length} steps · <span style="color:var(--wakeel)">edit it by chatting with the assistant →</span></p></div>
      <div class="ctrls">
        <button class="draft-btn ghost" id="simpleBtn" title="Simplified card view">${IC.views} Simple view</button>
      </div>
    </div>
    <div class="studio-embed"><iframe id="studioFrame" src="/app/${AGENT}/workflow?embed=wakeel" title="Flow"></iframe></div>`;
  $("#simpleBtn").onclick = () => { ASUB = "simple"; viewAgent(); };
}
function orderedNodes(info) {
  const g = info.graph || {}; const edges = g.edges || [];
  const byId = {}; (info.nodes || []).forEach(n => { byId[n.id] = n; });
  const start = (info.nodes || []).find(n => n.type === "start") || (info.nodes || [])[0];
  if (!start || !start.id) return info.nodes || [];
  const seen = new Set(); const order = [];
  const visit = (id) => { if (seen.has(id) || !byId[id]) return; seen.add(id); order.push(byId[id]); edges.filter(e => e.source === id).forEach(e => visit(e.target)); };
  visit(start.id);
  (info.nodes || []).forEach(n => { if (!seen.has(n.id)) { order.push(n); seen.add(n.id); } });
  return order;
}
function renderFlow(info) {
  window.__flowInfo = info;
  window.__graph = info.graph || { nodes: [], edges: [] };
  const nodes = orderedNodes(info);
  $("#flowWrap").innerHTML = `
    <div class="flow-head">
      <div><h1>Flow</h1><p>${esc(info.name || "Your agent")} · ${nodes.length} steps · <span style="color:var(--wakeel)">edit it by chatting with the assistant →</span></p></div>
      <div class="ctrls">
        <button class="draft-btn run" id="runBtn">${IC.play} Run</button>
        <div class="tmode"><div class="switch" id="tmode"></div> Test mode</div>
        <button class="draft-btn ghost" id="studioBtn" title="Advanced node canvas">${IC.flow} Advanced</button>
      </div>
    </div>
    <div class="flow-split">
      <div class="canvas" id="canvas">
        <div class="publish-bar"><span>ⓘ This flow has not yet been published</span><button class="btn primary sm" id="pubBtn">Publish</button></div>
        <div class="vflow" id="vflow"></div>
        <div class="zoom"><button id="zi">+</button><button id="zo">−</button></div>
        <div class="runlog" id="runlog" hidden></div>
      </div>
      <div class="node-panel" id="nodePanel" hidden></div>
    </div>`;
  const vf = $("#vflow");
  const addBtn = (afterId) => {
    const w = document.createElement("div"); w.className = "insert-wrap";
    w.innerHTML = `<div class="connector"></div><button class="insert-btn" title="Add">${IC.plus}<div class="ins-pop" hidden><a data-a="step">${IC.bolt} Insert step</a><a data-a="branch">${IC.flow} Add branch</a></div></button><div class="connector"></div>`;
    const pop = w.querySelector(".ins-pop");
    w.querySelector(".insert-btn").onclick = (e) => { e.stopPropagation(); document.querySelectorAll(".ins-pop").forEach(p => { if (p !== pop) p.hidden = true; }); pop.hidden = !pop.hidden; };
    w.querySelectorAll(".ins-pop a").forEach(a => a.onclick = (e) => { e.stopPropagation(); pop.hidden = true; a.dataset.a === "branch" ? openAddBranch(afterId) : openAddStep(afterId); });
    return w;
  };
  nodes.forEach((n, i) => {
    const card = document.createElement("div");
    card.className = "cnode " + nodeClass(n.type);
    card.id = "node-" + i;
    card.dataset.title = (n.title || n.type);
    card.dataset.nid = n.id || "";
    card.innerHTML = `<div class="top"><span class="idx">${i + 1}</span><span class="ttl">${esc(n.title || n.type)}</span><span class="dots">⋯</span><span class="tick"></span></div>
      <div class="chip2"><span class="sq">${IC.bolt}</span> ${esc(nodeChip(n))}</div>`;
    card.onclick = () => openNodePanel(info, n, card);
    vf.appendChild(card);
    if (i < nodes.length - 1) vf.appendChild(addBtn(n.id));
  });
  let scale = 1;
  $("#zi").onclick = () => { scale = Math.min(1.3, scale + .1); vf.style.transform = `scale(${scale})`; };
  $("#zo").onclick = () => { scale = Math.max(.6, scale - .1); vf.style.transform = `scale(${scale})`; };
  $("#tmode").onclick = () => $("#tmode").classList.toggle("on");
  $("#pubBtn").onclick = async () => { $("#pubBtn").textContent = "Publishing…"; try { await api("POST", "publish", { app_id: AGENT }); $("#pubBtn").textContent = "✓ Published"; } catch (e) { alert(e.message); $("#pubBtn").textContent = "Publish"; } };
  $("#runBtn").onclick = () => openRunModal(info);
  if ($("#studioBtn")) $("#studioBtn").onclick = () => { ASUB = "studio"; viewAgent(); };
  if (window.__autorun) { const tx = window.__autorun; window.__autorun = null; $("#tmode").classList.add("on"); setTimeout(() => runFlow(tx), 700); }
  if (window.__autonode != null) { const idx = window.__autonode; window.__autonode = null; const c = $("#node-" + idx); if (c && nodes[idx]) openNodePanel(info, nodes[idx], c); }
  if (window.__autotool != null) { const idx = window.__autotool; window.__autotool = null; if (nodes[idx]) openConfigTool(info, nodes[idx]); }
}

/* ---------- live run (task execution over the flow) ---------- */
function openRunModal(info) {
  const v = (info.vars || [])[0];
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:520px" onclick="event.stopPropagation()">
    <h2>${IC.play} Run this agent <button class="x" id="rx">×</button></h2>
    <div style="color:var(--muted);font-size:13px;margin:-8px 0 16px">Provide a test input. Watch each step light up as it runs.</div>
    <div class="field"><label>${v ? esc(v.label || v.name) : "Input"}</label><textarea class="input" id="runIn" rows="4" placeholder="e.g. a citizen complaint, an application summary, an email…"></textarea></div>
    <button class="btn primary block" id="runGo">${IC.play} Execute flow</button>
  </div>`;
  document.body.appendChild(d);
  d.onclick = () => d.remove(); $("#rx").onclick = () => d.remove();
  $("#runIn").focus();
  $("#runGo").onclick = () => { const input = $("#runIn").value.trim(); if (!input) return; d.remove(); runFlow(input); };
}

async function runFlow(input) {
  // reset node states
  document.querySelectorAll(".cnode").forEach(c => c.classList.remove("running", "done", "failed"));
  const log = $("#runlog"); log.hidden = false;
  log.innerHTML = `<div class="rl-h"><span>${IC.play} Live run</span><button class="x" id="rlx" style="font-size:18px">×</button></div><div class="rl-body" id="rlBody"></div>`;
  $("#rlx").onclick = () => { log.hidden = true; };
  const body = $("#rlBody");
  const used = new Set();
  const findCard = (title) => {
    const cards = [...document.querySelectorAll(".cnode")];
    let c = cards.find(x => x.dataset.title === title && !used.has(x.id));
    if (!c) c = cards.find(x => x.dataset.title === title);
    return c;
  };
  const rlRow = (title) => { const r = document.createElement("div"); r.className = "rl-row running"; r.innerHTML = `<span class="rl-ic"><div class="spin"></div></span><span class="rl-t">${esc(title)}</span><span class="rl-k"></span>`; body.appendChild(r); body.scrollTop = body.scrollHeight; return r; };
  const rowByTitle = {};
  try {
    const resp = await fetch("api/run", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ app_id: AGENT, input }) });
    const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = "";
    let answer = "";
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n\n"); buf = parts.pop();
      for (const part of parts) {
        const line = part.trim(); if (!line.startsWith("data:")) continue;
        let ev; try { ev = JSON.parse(line.slice(5).trim()); } catch (e) { continue; }
        const d = ev.data || {};
        if (ev.event === "node_started") {
          const card = findCard(d.title); if (card) { used.add(card.id); card.classList.add("running"); card.scrollIntoView({ behavior: "smooth", block: "center" }); }
          rowByTitle[d.title] = rlRow(d.title || "step");
        } else if (ev.event === "node_finished") {
          const card = findCard(d.title); if (card) { card.classList.remove("running"); card.classList.add(d.status === "failed" ? "failed" : "done"); }
          const r = rowByTitle[d.title]; if (r) { r.className = "rl-row " + (d.status === "failed" ? "failed" : "done"); r.querySelector(".rl-ic").innerHTML = d.status === "failed" ? "✕" : "✓"; r.querySelector(".rl-k").textContent = d.elapsed_time ? (d.elapsed_time).toFixed(1) + "s" : ""; }
        } else if (ev.event === "message" || ev.event === "agent_message") {
          answer += ev.answer || "";
        } else if (ev.event === "workflow_finished") {
          const outs = d.outputs || {}; answer = Object.values(outs).map(v => typeof v === "string" ? v : JSON.stringify(v)).join("\n");
        } else if (ev.event === "error") {
          const r = document.createElement("div"); r.className = "rl-row failed"; r.innerHTML = `<span class="rl-ic">✕</span><span class="rl-t">${esc(ev.message || "error")}</span>`; body.appendChild(r);
        }
      }
    }
    if (answer) { const o = document.createElement("div"); o.className = "rl-out"; o.innerHTML = `<div class="rl-out-h">Output</div>${esc(answer).slice(0, 4000)}`; body.appendChild(o); body.scrollTop = body.scrollHeight; }
  } catch (e) { const r = document.createElement("div"); r.className = "rl-row failed"; r.innerHTML = `<span class="rl-ic">✕</span><span class="rl-t">${esc(e.message)}</span>`; body.appendChild(r); }
}

function openNodePanel(info, n, card) {
  document.querySelectorAll(".cnode.selected").forEach(c => c.classList.remove("selected"));
  if (card) card.classList.add("selected");
  const isLLM = n.type === "llm";
  const canDelete = n.type !== "start" && n.type !== "end";
  const p = $("#nodePanel"); if (!p) return; p.hidden = false;
  document.querySelector(".copilot")?.classList.add("cop-tuck"); // give the node panel room
  p.innerHTML = `
    <div class="np-head"><input class="np-title" id="npTitle" value="${esc(n.title || n.type)}"/><button class="x" id="npClose">×</button></div>
    <div class="np-body">
      <div class="np-sec">
        <div class="np-label">Tool</div>
        <div class="np-tool"><span class="np-tool-ic">${IC.bolt}</span> ${esc(nodeChip(n))}</div>
        ${isLLM ? `<div class="np-btns"><button class="btn sm" id="npEdit">Edit prompt</button><button class="btn sm" id="npGen">Generate new</button></div>` : ""}
      </div>
      ${isLLM ? `<div class="np-sec" id="npPromptSec" hidden><div class="np-label">Instruction / prompt</div><textarea class="input" id="npPrompt" rows="6">${esc(n.prompt || "")}</textarea></div>` : ""}
      <div class="np-sec">
        <div class="np-label collapse">Tool mode <span>⌄</span></div>
        <div class="consent" style="margin:0"><div class="np-consent-ic">${IC.check}</div><div class="info"><div class="t">Consent required</div><div class="d">Task pauses at this step and waits for officer approval before proceeding.</div></div><div class="switch" id="npConsent"></div></div>
        <div class="consent" style="margin:12px 0 0"><div class="np-consent-ic">${IC.check}</div><div class="info"><div class="t">Output evaluation</div><div class="d">Automatically assess this step's output against expected standards.</div></div><div class="switch" id="npEval"></div></div>
      </div>
      <div class="np-sec">
        <div class="np-label collapse">Variables <span>⌄</span></div>
        <div class="np-var"><div class="np-var-row"><span class="np-var-name">Input</span><span class="np-fill">${info.mode === "workflow" ? "Linked fill" : "Prompt fill"} ⌄</span></div><div class="np-var-sel">${IC.bolt} ${esc((info.vars[0] && info.vars[0].name) || "task_query")}</div></div>
      </div>
    </div>
    <div class="np-foot">${canDelete ? `<button class="btn sm" id="npDel" style="border-color:#5a1e26;color:#ff9ba3">Delete</button>` : "<span></span>"}<button class="btn primary sm" id="npSave">Save</button><span class="np-msg" id="npMsg"></span></div>`;
  $("#npClose").onclick = () => { p.hidden = true; document.querySelector(".copilot")?.classList.remove("cop-tuck"); document.querySelectorAll(".cnode.selected").forEach(c => c.classList.remove("selected")); };
  document.querySelectorAll(".np-label.collapse").forEach(l => l.onclick = () => l.nextElementSibling && l.classList.toggle("closed"));
  if ($("#npEdit")) $("#npEdit").onclick = () => openConfigTool(info, n);
  if ($("#npGen")) $("#npGen").onclick = () => openConfigTool(info, n);
  if ($("#npConsent")) $("#npConsent").onclick = () => $("#npConsent").classList.toggle("on");
  if ($("#npEval")) $("#npEval").onclick = () => $("#npEval").classList.toggle("on");
  $("#npSave").onclick = async () => {
    const node = graphFind(window.__graph, n.id); if (!node) return;
    node.data.title = $("#npTitle").value.trim() || node.data.title;
    if (isLLM && $("#npPrompt")) {
      const txt = $("#npPrompt").value;
      if (Array.isArray(node.data.prompt_template) && node.data.prompt_template.length) node.data.prompt_template[0].text = txt;
      else node.data.prompt_template = [{ role: "user", text: txt, edition_type: "basic", id: n.id + "-m" }];
    }
    $("#npSave").disabled = true; $("#npMsg").textContent = "Saving…";
    try { await saveGraph(); $("#npMsg").textContent = "✓ Saved"; viewAgent(); } catch (e) { $("#npMsg").textContent = "⚠️ " + e.message; $("#npSave").disabled = false; }
  };
  if ($("#npDel")) $("#npDel").onclick = async () => {
    graphRemove(window.__graph, n.id); $("#npDel").disabled = true;
    try { await saveGraph(); viewAgent(); } catch (e) { alert(e.message); }
  };
}

function newIfElse(title, varNodeId, keyword, caseId) {
  const id = nid();
  return { id, type: "custom", position: { x: 0, y: 0 }, positionAbsolute: { x: 0, y: 0 }, width: 244, height: 130,
    data: { type: "if-else", title, logical_operator: "and", selected: false,
      cases: [{ case_id: caseId, logical_operator: "and", conditions: [{ id: "c" + Math.random().toString(36).slice(2, 5), variable_selector: [varNodeId, "text"], comparison_operator: "contains", value: keyword }] }] } };
}
function nearestLLM(g, afterId) {
  const n = graphFind(g, afterId);
  if (n && n.data.type === "llm") return afterId;
  const llm = (g.nodes || []).find(x => x.data.type === "llm");
  return llm ? llm.id : afterId;
}
function openAddBranch(afterId) {
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:520px" onclick="event.stopPropagation()">
    <h2>${IC.flow} Add a branch <button class="x" id="bx">×</button></h2>
    <div style="color:var(--muted);font-size:13px;margin:-8px 0 16px">Split the flow on a condition. If it matches, continue; otherwise an exception step handles it, then rejoins.</div>
    <div class="field"><label>Branch name</label><input class="input" id="brName" placeholder="e.g. Urgent complaints"/></div>
    <div class="field"><label>Condition — when the previous step's result <b>contains</b></label><input class="input" id="brKey" placeholder="e.g. urgent"/></div>
    <div class="field"><label>Exception step (runs when it does NOT match)</label><input class="input" id="brExc" placeholder="e.g. Route to standard queue"/></div>
    <button class="btn primary block" id="brGo">Add branch</button>
  </div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#bx").onclick = () => d.remove();
  $("#brName").focus();
  $("#brGo").onclick = async () => {
    const name = $("#brName").value.trim(), key = $("#brKey").value.trim(); if (!name || !key) return;
    const g = window.__graph;
    const caseId = "match" + Math.random().toString(36).slice(2, 5);
    const ie = newIfElse("Branch: " + name, nearestLLM(g, afterId), key, caseId);
    const exc = newLLM("Exception: " + ($("#brExc").value.trim() || name), $("#brExc").value.trim() || ("Handle the case where it does not match " + key));
    const targets = (g.edges || []).filter(e => e.source === afterId).map(e => e.target);
    g.edges = (g.edges || []).filter(e => e.source !== afterId);
    g.edges.push(edge(afterId, ie.id));
    targets.forEach(t => { const e1 = edge(ie.id, t); e1.sourceHandle = caseId; g.edges.push(e1); });          // true → continue
    const efalse = edge(ie.id, exc.id); efalse.sourceHandle = "false"; g.edges.push(efalse);                    // false → exception
    targets.forEach(t => g.edges.push(edge(exc.id, t)));                                                        // exception → rejoin (merge)
    g.nodes.push(ie); g.nodes.push(exc);
    $("#brGo").disabled = true; $("#brGo").textContent = "Adding…";
    try { await saveGraph(); d.remove(); viewAgent(); } catch (e) { alert(e.message); $("#brGo").disabled = false; $("#brGo").textContent = "Add branch"; }
  };
}

async function openConfigTool(info, n) {
  const node = graphFind(window.__graph, n.id);
  const prompt = n.prompt || "";
  $("#flowWrap").innerHTML = `
    <div class="ct-head">
      <button class="btn sm" id="ctBack">← Flow</button>
      <div class="ct-title"><span class="np-tool-ic">${IC.bolt}</span> Configure tool</div>
      <div style="margin-inline-start:auto;display:flex;gap:10px;align-items:center"><span class="ct-msg" id="ctMsg"></span><button class="btn sm" id="ctOpt">${IC.spark} Optimise</button><button class="btn primary sm" id="ctSave">Save</button></div>
    </div>
    <div class="ct-body">
      <div class="ct-left">
        <div class="ct-block"><div class="ct-block-h">Step goal</div><input class="input" id="ctGoal" value="${esc(n.title || "")}"/></div>
        <div class="ct-block"><div class="ct-block-h">Model &amp; prompt <span class="ct-badge">Used by AI</span></div>
          <div class="ct-lbl">LLM</div><select class="input" id="ctModel"><option>${esc((node && node.data.model && node.data.model.name) || "gpt-5.1")}</option></select>
          <div class="ct-lbl" style="margin-top:14px">Prompt <span style="color:var(--faint);font-weight:400">— reference inputs with {{#node.field#}}</span></div>
          <textarea class="input ct-prompt" id="ctPrompt" rows="16">${esc(prompt)}</textarea></div>
        <div class="ct-block"><div class="ct-block-h">Variables <span class="ct-badge">Variable fill</span></div>
          <div class="page-sub" style="font-size:12px;margin:0 0 9px">Click a variable to insert it into the prompt — the step fills it at run time.</div>
          <div class="var-chips" id="ctVars"></div>
          <div id="ctInputs" class="ct-vars" style="margin-top:10px"></div></div>
        <div class="ct-block"><div class="ct-block-h">Structured output <span class="ct-badge">Schema</span></div>
          <div class="page-sub" style="font-size:12px;margin:0 0 9px">Define the fields this step must return, so downstream steps can rely on a fixed shape.</div>
          <div id="ctSchema" class="sch-list"></div>
          <button class="btn sm" id="ctAddField" style="margin-top:8px">${IC.plus} Add field</button></div>
      </div>
      <div class="ct-right">
        <div class="ct-block-h">Test output</div>
        <div class="page-sub" style="font-size:12px;margin:0 0 12px">Run this tool with a sample input to see the result.</div>
        <div class="ct-lbl">Sample input</div>
        <textarea class="input" id="ctSample" rows="5" placeholder="e.g. a citizen complaint, an application summary…"></textarea>
        <button class="btn primary sm" id="ctRun" style="margin-top:12px">${IC.play} Execute tool</button>
        <div id="ctOut" class="ct-out" hidden></div>
      </div>
    </div>`;
  $("#ctBack").onclick = () => { CFGNODE = null; viewAgent(); };
  // populate model selector
  try { const m = await api("GET", "models"); const sel = $("#ctModel"); sel.innerHTML = ""; const cur = (node && node.data.model && node.data.model.name); (m.providers || []).forEach(pr => { const g = document.createElement("optgroup"); g.label = pr.label; (pr.models || []).forEach(md => { const o = document.createElement("option"); o.value = pr.provider + "|" + md; o.textContent = md; if (md === cur) o.selected = true; g.appendChild(o); }); sel.appendChild(g); }); } catch (e) {}
  // parse input variables from prompt
  const vars = [...new Set((prompt.match(/{{#([^#}]+)#}}/g) || []).map(s => s.replace(/[{}#]/g, "")))];
  $("#ctInputs").innerHTML = vars.length ? vars.map(v => `<div class="ct-var-row"><span class="ct-var-nm">${esc(v.split(".").pop())}</span><span class="np-fill">Linked fill · ${esc(v)}</span></div>`).join("") : `<div class="page-sub" style="font-size:12px;margin:0">This step reads the task input directly.</div>`;
  // --- Variable Fill: insertable variable chips (task input + upstream steps) ---
  const order = orderedNodes(info) || info.nodes || [];
  const meIdx = order.findIndex(x => x.id === n.id);
  const avail = [{ label: "Task input", v: "sys.query" }].concat(
    order.filter((x, i) => x.id !== n.id && (meIdx < 0 || i < meIdx) && ["llm", "tool", "code", "question-classifier", "http-request"].includes(x.type))
      .map(x => ({ label: x.title || x.type, v: (x.id || "") + ".text" })));
  $("#ctVars").innerHTML = avail.map(a => `<button class="vchip" data-v="${esc(a.v)}">${IC.bolt}<span>${esc(a.label)}</span></button>`).join("");
  const insertVar = (token) => { const ta = $("#ctPrompt"); const s = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, s) + token + ta.value.slice(ta.selectionEnd ?? s); ta.focus(); ta.selectionStart = ta.selectionEnd = s + token.length; };
  $("#ctVars").querySelectorAll(".vchip").forEach(b => b.onclick = () => insertVar("{{#" + b.dataset.v + "#}}"));
  // --- Structured Output: field schema editor ---
  let schema = (node && node.data && Array.isArray(node.data.__wakeel_schema)) ? node.data.__wakeel_schema.slice() : [];
  const drawSchema = () => {
    $("#ctSchema").innerHTML = schema.length ? schema.map((f, i) => `
      <div class="sch-row" data-i="${i}"><input class="input sch-name" placeholder="field_name" value="${esc(f.name || "")}"/>
      <select class="input sch-type">${["string", "number", "boolean", "date", "array", "object"].map(tp => `<option ${f.type === tp ? "selected" : ""}>${tp}</option>`).join("")}</select>
      <button class="icn-btn sch-del" title="Remove">✕</button></div>`).join("") : `<div class="page-sub" style="font-size:12px;margin:0">No schema — the step returns free text.</div>`;
    $("#ctSchema").querySelectorAll(".sch-row").forEach(row => {
      const i = +row.dataset.i;
      row.querySelector(".sch-name").oninput = e => schema[i].name = e.target.value;
      row.querySelector(".sch-type").onchange = e => schema[i].type = e.target.value;
      row.querySelector(".sch-del").onclick = () => { schema.splice(i, 1); drawSchema(); };
    });
  };
  drawSchema();
  $("#ctAddField").onclick = () => { schema.push({ name: "", type: "string" }); drawSchema(); };
  $("#ctSave").onclick = async () => {
    if (!node) return;
    node.data.title = $("#ctGoal").value.trim() || node.data.title;
    let txt = $("#ctPrompt").value;
    const fields = schema.filter(f => (f.name || "").trim());
    node.data.__wakeel_schema = fields;
    if (fields.length) {
      const spec = fields.map(f => `"${f.name}" (${f.type})`).join(", ");
      const instr = `\n\nReturn ONLY a JSON object with these fields: ${spec}.`;
      txt = txt.replace(/\n\nReturn ONLY a JSON object with these fields:.*$/s, "") + instr;
    }
    if (Array.isArray(node.data.prompt_template) && node.data.prompt_template.length) node.data.prompt_template[0].text = txt;
    else node.data.prompt_template = [{ role: "user", text: txt, edition_type: "basic", id: n.id + "-m" }];
    const mv = $("#ctModel").value; if (mv && mv.includes("|")) { const [pv, md] = mv.split("|"); node.data.model = { provider: pv, name: md, mode: "chat", completion_params: {} }; }
    $("#ctSave").disabled = true; $("#ctMsg").textContent = "Saving…";
    try { await saveGraph(); $("#ctMsg").textContent = "✓ Saved"; setTimeout(() => { $("#ctSave").disabled = false; $("#ctMsg").textContent = ""; }, 1500); } catch (e) { $("#ctMsg").textContent = "⚠️ " + e.message; $("#ctSave").disabled = false; }
  };
  $("#ctOpt").onclick = async () => {
    $("#ctOpt").disabled = true; $("#ctOpt").innerHTML = `<span class="spin"></span> Optimising…`;
    try { const r = await api("POST", "chat", { message: "Rewrite and improve this AI step prompt to be clearer and more reliable for a government workflow. Return ONLY the improved prompt, no preamble:\n\n" + $("#ctPrompt").value, history: [] }); $("#ctPrompt").value = r.reply.trim(); } catch (e) { alert(e.message); }
    finally { $("#ctOpt").disabled = false; $("#ctOpt").innerHTML = `${IC.spark} Optimise`; }
  };
  $("#ctRun").onclick = async () => {
    const sample = $("#ctSample").value.trim(); if (!sample) return;
    $("#ctRun").disabled = true; $("#ctRun").innerHTML = `<span class="spin"></span> Running…`;
    const o = $("#ctOut"); o.hidden = false; o.innerHTML = `<div class="page-sub" style="margin:0">Executing…</div>`;
    try { const r = await api("POST", "test-tool", { prompt: $("#ctPrompt").value, input: sample }); o.innerHTML = `<div class="ct-out-h">Output</div>${esc(r.output).slice(0, 4000)}`; } catch (e) { o.innerHTML = `<div class="ct-out-h">Error</div>${esc(e.message)}`; }
    finally { $("#ctRun").disabled = false; $("#ctRun").innerHTML = `${IC.play} Execute tool`; }
  };
}

function openAddStep(afterId) {
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:520px" onclick="event.stopPropagation()">
    <h2>${IC.plus} Add a step <button class="x" id="ax">×</button></h2>
    <div style="color:var(--muted);font-size:13px;margin:-8px 0 16px">Insert an AI step after the selected one.</div>
    <div class="field"><label>Objective (title)</label><input class="input" id="asTitle" placeholder="e.g. Translate the reply to Arabic"/></div>
    <div class="field"><label>Instruction / prompt</label><textarea class="input" id="asPrompt" rows="4" placeholder="What should this step do…"></textarea></div>
    <button class="btn primary block" id="asGo">Add step</button>
  </div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#ax").onclick = () => d.remove();
  $("#asTitle").focus();
  $("#asGo").onclick = async () => {
    const title = $("#asTitle").value.trim(); if (!title) return;
    graphInsertAfter(window.__graph, afterId, newLLM(title, $("#asPrompt").value.trim() || title));
    $("#asGo").disabled = true; $("#asGo").textContent = "Adding…";
    try { await saveGraph(); d.remove(); viewAgent(); } catch (e) { alert(e.message); $("#asGo").disabled = false; $("#asGo").textContent = "Add step"; }
  };
}

/* ---------- copilot ---------- */
const COP_CHIPS = ["Add a follow-up step", "Add a condition / branch", "Make the tone stricter and more formal", "Add an Arabic translation step at the end"];
function renderCopilot() {
  const app = APPS.find(a => a.id === AGENT) || {};
  return `<aside class="copilot">
    <div class="cop-h">${logo("")}<div style="flex:1"><div class="nm">${t("Build Assistant")}</div><div class="cop-sub">${t("Chat to edit")} ${esc((app.name || "this agent").slice(0, 26))}</div></div></div>
    <div class="cop-body" id="copBody">
      <div class="cop-hero">${logo("")}<h3>${t("Let's shape this agent together.")}</h3><p>${t("Tell me what to change and I'll update the flow — no diagrams needed.")}</p>
        <div class="cop-chips">${COP_CHIPS.map(c => `<button class="cop-chip">${t(c)}</button>`).join("")}</div>
      </div>
    </div>
    <div class="cop-foot"><input id="copIn" placeholder="${t("Ask the assistant to edit this flow…")}"/><button id="copSend">${IC.send}</button></div>
  </aside>`;
}
function wireCopilot() {
  document.querySelectorAll(".cop-chip").forEach(b => b.onclick = () => { $("#copIn").value = b.textContent; send(); });
  const send = async () => {
    const t = $("#copIn").value.trim(); if (!t) return; $("#copIn").value = "";
    const body = $("#copBody");
    const hero = body.querySelector(".cop-hero"); if (hero) hero.remove();
    const m = document.createElement("div"); m.className = "cop-msg me"; m.textContent = t; body.appendChild(m);
    const w = document.createElement("div"); w.className = "cop-msg ai"; w.innerHTML = `<span class="spin"></span> Editing the flow…`; body.appendChild(w); body.scrollTop = body.scrollHeight;
    $("#copSend").disabled = true; $("#copIn").disabled = true;
    try {
      // 1. current graph  2. refine with AI  3. save to draft  4. refresh canvas
      const info = await api("GET", "app-info?id=" + AGENT);
      const genMode = info.mode === "workflow" ? "workflow" : "agent";
      const res = await api("POST", "generate", { mode: genMode, instruction: t, current_graph: info.graph });
      if (!res.graph || !(res.graph.nodes || []).length) { w.innerHTML = "⚠️ " + esc(res.error || "Couldn't apply that edit."); return; }
      window.__graph = res.graph;
      await api("POST", "save-draft", { app_id: AGENT, graph: res.graph });
      w.innerHTML = `✓ Done — ${(res.graph.nodes || []).length} steps. ${res.message ? esc(res.message.slice(0, 120)) : "Flow updated."}`;
      ASUB = "flow"; CFGNODE = null;
      viewAgent();
    } catch (e) { w.innerHTML = "⚠️ " + esc(e.message); }
    finally { $("#copSend").disabled = false; $("#copIn").disabled = false; $("#copIn").focus(); }
  };
  $("#copSend").onclick = send;
  $("#copIn").addEventListener("keydown", e => { if (e.key === "Enter") send(); });
}

/* ---------- templates ---------- */
function viewTemplates() {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>Agent templates</b></div></div>
    <div class="content"><div class="pad">
      <h1 class="page-h">Agent templates</h1><p class="page-sub">Government-ready agents. Pick one, create it, and it opens as an editable flow.</p>
      <div class="dept-row" id="deptRow"></div><div class="grid" id="tplGrid"></div>
    </div></div>`;
  const depts = [["all", "All departments", "الكل"], ...DEPTS];
  $("#deptRow").innerHTML = depts.map(([id, en, ar]) => `<div class="dept ${DEPT === id ? "active" : ""}" data-d="${id}">${IC.templates} ${LANG === "ar" ? ar : en}</div>`).join("");
  document.querySelectorAll(".dept").forEach(b => b.onclick = () => { DEPT = b.dataset.d; viewTemplates(); });
  const grid = $("#tplGrid"); grid.innerHTML = "";
  TPL.filter(t => DEPT === "all" || t[0] === DEPT).forEach(t => {
    const dept = DEPTS.find(d => d[0] === t[0]);
    const c = document.createElement("div"); c.className = "gcard";
    c.innerHTML = `<div class="ic">${IC.agent}</div><h3>${esc(LANG === "ar" ? t[2] : t[1])}</h3><div class="ar">${esc(LANG === "ar" ? t[1] : t[2])}</div><p>${esc(t[3])}</p><div class="foot"><span class="pill-tag">${esc(dept[1])}</span><button class="btn primary sm">${IC.bolt} Create agent</button></div>`;
    c.querySelector("button").onclick = async (e) => {
      e.stopPropagation(); const btn = e.currentTarget; btn.disabled = true; btn.textContent = "Creating…";
      try { const g = await api("POST", "generate", { mode: "workflow", instruction: t[4] }); if (!g.nodes.length) throw new Error(g.error || "failed"); LASTGRAPH = g.graph; const r = await api("POST", "deploy", { mode: "workflow", name: t[1], graph: g.graph }); loadAgents(); openAgent(r.id, "flow"); }
      catch (err) { alert(err.message); btn.disabled = false; btn.textContent = "Create agent"; }
    };
    grid.appendChild(c);
  });
}

/* ---------- integrations ---------- */
let INTCAT = "all";
function viewIntegrations() {
  const total = INTEG_CATS.reduce((s, c) => s + c[1].length, 0);
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>${t("Integrations")}</b></div></div>
    <div class="content"><div class="pad">
      <h1 class="page-h">${t("Choose integration")}</h1><p class="page-sub">${t("Connect Wakeel agents to the systems your entity uses —")} ${total}+ ${t("connectors across Microsoft 365, UAE government, databases and more.")}</p>
      <div class="searchbar">${IC.search}<input id="isearch" placeholder="${t("Search connectors by name…")}"/></div>
      <div class="dept-row" id="catRow"></div>
      <div id="intBody"></div>
    </div></div>`;
  const cats = [["all", "All"], ...INTEG_CATS.map(c => [c[0], c[0]])];
  $("#catRow").innerHTML = cats.map(([id, l]) => `<div class="dept ${INTCAT === id ? "active" : ""}" data-c="${esc(id)}">${esc(l)}</div>`).join("");
  document.querySelectorAll(".dept").forEach(b => b.onclick = () => { INTCAT = b.dataset.c; viewIntegrations(); });
  const draw = (q = "") => {
    const body = $("#intBody"); body.innerHTML = "";
    INTEG_CATS.filter(c => INTCAT === "all" || c[0] === INTCAT).forEach(([cat, items]) => {
      const matched = items.filter(n => n.toLowerCase().includes(q.toLowerCase()));
      if (!matched.length) return;
      const h = document.createElement("div"); h.className = "side-sub"; h.style.paddingInline = "0"; h.textContent = cat; body.appendChild(h);
      const grid = document.createElement("div"); grid.className = "grid"; body.appendChild(grid);
      matched.forEach(n => {
        const on = isConnected(n);
        const native = !!PLUGIN_MAP[n];
        const c = document.createElement("div"); c.className = "gcard"; c.style.cursor = "default";
        c.innerHTML = `<div style="display:flex;align-items:center;gap:12px">${brandLogo(n)}<div style="flex:1;min-width:0"><h3 style="font-size:14px">${esc(n)}</h3>${native && !on ? `<div style="font-size:11px;color:var(--wakeel)">Native plugin</div>` : ""}</div>${on ? `<span class="st-pill ok">Installed</span>` : ""}</div>
          <div class="foot" style="margin-top:14px"><span></span><button class="btn sm ${on ? "" : "primary"}">${on ? t("Configure") : native ? t("Install & connect") : t("Request")}</button></div>`;
        const btn = c.querySelector("button");
        btn.onclick = async (e) => {
          e.stopPropagation();
          if (on) { openToolConfig(n); return; }
          if (!native) { btn.textContent = "Requested"; return; }
          btn.disabled = true; btn.innerHTML = `<span class="spin"></span> Installing…`;
          try { await api("POST", "provider/install", { name: PLUGIN_MAP[n] }); const t = await api("GET", "tools"); TOOLS_INSTALLED = t.installed || []; draw($("#isearch").value); }
          catch (err) { btn.disabled = false; btn.textContent = "Not available yet"; }
        };
        grid.appendChild(c);
      });
    });
    if (!body.children.length) body.innerHTML = `<div class="empty-mini">No connectors match “${esc(q)}”.</div>`;
  };
  api("GET", "tools").then(t => { TOOLS_INSTALLED = t.installed || []; draw($("#isearch") ? $("#isearch").value : ""); if (window.__autoconfig) { const c = window.__autoconfig; window.__autoconfig = null; setTimeout(() => openToolConfig(c), 200); } }).catch(() => draw());
  $("#isearch").addEventListener("input", e => draw(e.target.value));
}

/* ---------- skills ---------- */
function viewSkills() {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>Skills</b></div></div>
    <div class="content"><div class="pad">
      <h1 class="page-h">Skills</h1><p class="page-sub">Reusable capabilities Wakeel uses to get work done.</p>
      <div class="tabs"><button class="active">All skills</button><button>Active</button></div>
      <div class="searchbar">${IC.search}<input id="ssearch" placeholder="Search skills by name…"/></div>
      <div class="rowlist" id="skillList"></div>
    </div></div>`;
  const draw = (q = "") => {
    const el = $("#skillList"); el.innerHTML = "";
    SKILLS.filter(s => s.includes(q.toLowerCase())).forEach(s => {
      const r = document.createElement("div"); r.className = "lrow";
      r.innerHTML = `<div class="ic">${IC.book}</div><div class="info"><div class="t">${esc(s)} <span class="sys-tag">System skill</span></div><div class="d">Capability available to your agents and chat.</div></div><button class="btn sm">Try in chat</button>`;
      r.querySelector("button").onclick = () => { VIEW = "home"; THREAD = []; BUILD = false; renderShell(); setTimeout(() => { const i = $("#ins"); if (i) { i.value = "Use the " + s + " skill to help me with "; i.focus(); } }, 50); };
      el.appendChild(r);
    });
  };
  draw(); $("#ssearch").addEventListener("input", e => draw(e.target.value));
}

/* ---------- Tasks (run history) ---------- */
function statusPill(s) { const m = { succeeded: "ok", completed: "ok", running: "run", failed: "bad", planned: "idle" }; return `<span class="st-pill ${m[s] || "idle"}">${esc(s || "—")}</span>`; }
function viewTasks() {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>${t("Tasks")}</b></div></div>
    <div class="content"><div class="pad">
      <h1 class="page-h">${t("Tasks")}</h1><p class="page-sub">${t("Every agent run — status, steps and duration. Click one to see the step-by-step log.")}</p>
      <div class="tabs"><button class="active">All</button><button>Completed</button><button>Failed</button></div>
      <div class="rowlist" id="taskList"><div class="empty-mini" style="padding:16px">Loading…</div></div>
    </div></div>`;
  api("GET", "tasks").then(d => {
    const el = $("#taskList"); const tasks = d.tasks || [];
    if (!tasks.length) { el.innerHTML = `<div class="lrow"><div class="info"><div class="d">No runs yet. Open an agent, turn on Test mode, and Run it.</div></div></div>`; return; }
    el.innerHTML = "";
    tasks.forEach(t => {
      const dur = t.ended && t.started ? (t.ended - t.started) + "s" : "";
      const r = document.createElement("div"); r.className = "lrow";
      r.innerHTML = `<div class="ic">${IC.play}</div><div class="info"><div class="t">${esc(t.app_name || "Agent")} ${statusPill(t.status)}</div><div class="d">${esc(t.input || "")}</div></div>
        <div style="text-align:right;flex:none"><div style="font-size:12px;color:var(--muted)">${t.steps} steps${dur ? " · " + dur : ""}</div><div style="font-size:11px;color:var(--faint)">${timeAgo(t.started)}</div></div>`;
      r.style.cursor = "pointer";
      r.onclick = () => openTask(t.id);
      el.appendChild(r);
    });
  }).catch(e => { const el = $("#taskList"); if (el) el.innerHTML = `<div class="lrow"><div class="info"><div class="d">⚠️ ${esc(e.message)}</div></div></div>`; });
}

async function openTask(id) {
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" onclick="event.stopPropagation()"><div style="display:flex"><h2 style="flex:1">Task run</h2><button class="x" id="tx">×</button></div><div id="tBody"><div class="empty-mini">…</div></div></div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#tx").onclick = () => d.remove();
  try {
    const t = await api("GET", "task?id=" + id);
    const dur = t.ended && t.started ? (t.ended - t.started) + "s" : "";
    const isFail = t.status === "failed";
    $("#tBody").innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px">${statusPill(t.status)}<b>${esc(t.app_name || "Agent")}</b>
        <div style="margin-inline-start:auto;display:flex;gap:8px;align-items:center"><span style="color:var(--muted);font-size:12px">${dur}</span>
        ${t.app_id ? `<button class="btn sm" id="rerunBtn">${isFail ? "↻ Retry execution" : "↻ Rerun"}</button>` : ""}</div></div>
      <div style="color:var(--muted);font-size:13px;margin-bottom:16px">${esc(t.input || "")}</div>
      <div class="side-sub" style="padding-inline:0">Steps</div>
      <div class="rowlist" style="border-radius:12px">${(t.nodes || []).map((n, i) => `<div class="lrow" style="padding:11px 14px"><div class="ic" style="width:26px;height:26px">${i + 1}</div><div class="info"><div class="t" style="font-size:13.5px">${esc(n.title || "step")}</div></div>${statusPill(n.status)}<span style="font-size:11px;color:var(--faint);margin-inline-start:10px">${n.ms ? (n.ms / 1000).toFixed(1) + "s" : ""}</span></div>`).join("")}</div>
      ${t.output ? `<div style="display:flex;align-items:center;gap:10px"><div class="side-sub" style="padding-inline:0;flex:1">Output</div><div class="rate" id="rate"><span class="rate-l">Rate this output</span><button class="rbtn up" data-r="up" title="Good">${IC.thumb}</button><button class="rbtn down" data-r="down" title="Needs work">${IC.thumb}</button></div></div><div class="rl-out" style="background:var(--panel-2);color:var(--text);border-color:var(--line)">${esc(t.output).slice(0, 3000)}</div>` : ""}`;
    if ($("#rerunBtn")) $("#rerunBtn").onclick = () => { window.__autorun = t.input || ""; d.remove(); openAgent(t.app_id, "simple"); };
    if (t.output) {
      const rateEl = $("#rate");
      rateEl.querySelectorAll(".rbtn").forEach(b => b.onclick = async () => {
        rateEl.querySelectorAll(".rbtn").forEach(x => x.classList.remove("sel"));
        b.classList.add("sel");
        try { await api("POST", "rate", { task_id: id, rating: b.dataset.r }); rateEl.querySelector(".rate-l").textContent = "Thanks — feedback saved"; } catch (e) {}
      });
    }
  } catch (e) { $("#tBody").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
}

/* ---------- Inbox (approval queue §11) ---------- */
function viewInbox() {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>${t("Inbox")}</b></div></div>
    <div class="content"><div class="pad">
      <h1 class="page-h">${t("Inbox")}</h1><p class="page-sub">${t("Agents draft; officers decide. Review each output and approve, reject, or edit before it's actioned.")}</p>
      <div id="inboxList"><div class="empty-mini">Loading…</div></div>
    </div></div>`;
  api("GET", "inbox").then(d => {
    const el = $("#inboxList"); const items = d.items || [];
    if (!items.length) { el.innerHTML = `<div class="empty-state"><div class="big">${IC.inbox}</div><h3>All clear</h3><div>Nothing awaiting your decision. Run an agent and its output arrives here for approval.</div></div>`; return; }
    el.innerHTML = "";
    items.forEach(it => {
      const c = document.createElement("div"); c.className = "gcard"; c.style.cursor = "default"; c.style.marginBottom = "12px";
      c.innerHTML = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><div class="ic" style="width:34px;height:34px;margin:0">${IC.agent}</div><div><div style="font-weight:700;font-size:14px">${esc(it.app_name || "Agent")} <span class="st-pill idle">Awaiting approval</span></div><div style="font-size:12px;color:var(--muted)">${esc(it.input || "")}</div></div><span style="margin-inline-start:auto;font-size:11px;color:var(--faint)">${timeAgo(it.started)}</span></div>
        <div class="rl-out" style="background:var(--panel-2);color:var(--text);border-color:var(--line)" id="out-${it.id}">${esc(it.output).slice(0, 1600)}</div>
        <div class="foot" style="margin-top:12px;gap:8px"><button class="btn sm" data-a="edit">Edit</button><button class="btn sm" data-a="reject" style="border-color:#5a1e26;color:#ff9ba3">Reject</button><button class="btn primary sm" data-a="approve">${IC.check} Approve</button></div>`;
      const decide = async (decision, note) => { try { await api("POST", "decide", { task_id: it.id, decision, note: note || "" }); c.style.transition = ".25s"; c.style.opacity = ".4"; setTimeout(() => { c.remove(); if (!$("#inboxList").querySelector(".gcard")) viewInbox(); }, 250); } catch (e) { alert(e.message); } };
      c.querySelector('[data-a="approve"]').onclick = () => decide("approved", $("#out-" + it.id).isContentEditable ? $("#out-" + it.id).textContent : "");
      c.querySelector('[data-a="reject"]').onclick = () => decide("rejected");
      c.querySelector('[data-a="edit"]').onclick = (e) => { const o = $("#out-" + it.id); o.contentEditable = "true"; o.style.outline = "2px solid var(--wakeel)"; o.focus(); e.currentTarget.textContent = "Editing…"; };
      el.appendChild(c);
    });
  }).catch(e => { $("#inboxList").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; });
}

/* ---------- Analytics (Beam-style Overview Analytics) ---------- */
let AN_RANGE = 30;
const AN_RANGES = [[7, "Last 7 days"], [30, "Last 30 days"], [90, "Last 3 months"]];
function viewAnalytics() {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>${t("Analytics")}</b></div>
      <div class="top-actions"><div class="seg" id="anRange">${AN_RANGES.map(([d, l]) => `<button class="${AN_RANGE === d ? "on" : ""}" data-d="${d}">${l}</button>`).join("")}</div></div></div>
    <div class="content"><div class="pad">
      <h1 class="page-h">${t("Analytics")}</h1><p class="page-sub">${t("How your agents are performing across all runs.")}</p>
      <div id="anBody"><div class="empty-mini">${t("Loading…")}</div></div>
    </div></div>`;
  $("#anRange").querySelectorAll("button").forEach(b => b.onclick = () => { AN_RANGE = +b.dataset.d; viewAnalytics(); });
  const chg = (v) => v == null ? "" : `<span class="chgpill ${v > 0 ? "up" : v < 0 ? "down" : ""}">${v > 0 ? "▲" : v < 0 ? "▼" : "•"} ${Math.abs(v)}%</span>`;
  const ring = (pct, tone) => `<svg viewBox="0 0 42 42" class="ring ${tone}"><circle class="rbg" cx="21" cy="21" r="15.9"/><circle class="rfg" cx="21" cy="21" r="15.9" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="25"/><text x="21" y="24" class="rtx">${pct}%</text></svg>`;
  api("GET", "analytics?range=" + AN_RANGE).then(a => {
    const maxDay = Math.max(1, ...(a.days || [1]));
    const fb = a.feedback_score == null ? "—" : a.feedback_score + "%";
    $("#anBody").innerHTML = `
      <div class="metric-row m4">
        ${metric("Tasks completed", a.ok, chg(a.ok_change), "ok")}
        ${metric("Tasks failed", a.failed, chg(a.failed_change), a.failed ? "bad" : "")}
        ${metric("Approval rate", a.approval_rate + "%", "", a.approval_rate >= 80 ? "ok" : "")}
        ${metric("Feedback score", fb, "", a.feedback_score != null && a.feedback_score >= 80 ? "ok" : "")}
      </div>
      <div class="an-grid2">
        <div class="gcard gauge" style="cursor:default"><div class="gh">Completion rate</div>${ring(a.success_rate, a.success_rate >= 80 ? "g" : a.success_rate >= 50 ? "y" : "r")}<div class="gsub">${a.ok}/${a.total} tasks</div></div>
        <div class="gcard gauge" style="cursor:default"><div class="gh">Avg evaluation</div>${ring(a.eval_score, a.eval_score >= 80 ? "g" : a.eval_score >= 50 ? "y" : "r")}<div class="gsub">across evaluated steps</div></div>
        <div class="gcard kpi" style="cursor:default"><div class="gh">Avg runtime / task</div><div class="kv-big">${a.avg}<span>s</span></div><div class="gsub">mean per execution</div></div>
        <div class="gcard kpi" style="cursor:default"><div class="gh">Total runtime</div><div class="kv-big">${a.total_runtime}<span>h</span></div><div class="gsub">across all tasks</div></div>
      </div>
      <div class="an-grid">
        <div class="gcard" style="cursor:default"><h3 style="margin-bottom:14px">Task runs · ${AN_RANGES.find(r => r[0] === AN_RANGE)[1].toLowerCase()}</h3>
          <div class="bars">${(a.days || []).map(v => `<div class="bar-col"><div class="bar" style="height:${Math.round(v / maxDay * 100)}%" title="${v}"></div></div>`).join("")}</div>
        </div>
        <div class="gcard" style="cursor:default"><h3 style="margin-bottom:14px">Approvals (HITL)</h3>
          <div class="kv"><span>Approved</span><b style="color:var(--green)">${a.approvals.approved}</b></div>
          <div class="kv"><span>Rejected</span><b style="color:#ff8b8b">${a.approvals.rejected}</b></div>
          <div class="kv"><span>Pending</span><b>${a.approvals.pending}</b></div>
        </div>
      </div>
      <div class="side-sub" style="padding-inline:0">Per agent</div>
      <div class="rowlist">${(a.agents || []).map(g => { const rate = g.runs ? Math.round(g.ok * 100 / g.runs) : 0; return `<div class="lrow"><div class="ic">${IC.agent}</div><div class="info"><div class="t">${esc(g.name)}</div><div class="d">${g.runs} runs</div></div><div style="width:120px;flex:none"><div class="prog"><div class="prog-in" style="width:${rate}%"></div></div></div><span class="st-pill ${rate >= 80 ? "ok" : "idle"}" style="margin-inline-start:12px">${rate}%</span></div>`; }).join("") || `<div class="lrow"><div class="info"><div class="d">No runs yet.</div></div></div>`}</div>`;
  }).catch(e => { $("#anBody").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; });
}
function metric(label, val, change, tone) { return `<div class="metric ${tone || ""}"><div class="mv">${val} ${change || ""}</div><div class="ml">${label}</div></div>`; }

/* ---------- Automations (Wakeel's bundled engine — embedded same-origin, auto-signed-in) ---------- */
const AUTO_CREDS = { user: "admin@wakeel.local", pass: "Wakeel12345" };
function viewAutomations() {
  $("#mainCol").innerHTML = `
    <div class="topbar"><div class="crumbs"><b>${t("Automations")}</b><span class="sep">·</span><span style="color:var(--muted)">${t("Connector & workflow engine")}</span></div>
      <div class="top-actions"><a class="btn sm" href="/automations/" target="_blank" title="Open in a new tab">⤢</a></div></div>
    <div class="studio-embed" style="margin:0"><iframe id="autoFrame" src="/automations/" title="Wakeel Automations" allow="clipboard-read; clipboard-write"></iframe></div>`;
  const f = $("#autoFrame");
  f.addEventListener("load", () => autoSignInN8n(f));
  setTimeout(() => autoSignInN8n(f), 700); // SPA may not refire load on route change
}
function autoSignInN8n(f) {
  const W = f.contentWindow;
  let n = 0;
  const tick = () => {
    n++;
    let doc, path;
    try { doc = W.document; path = W.location.pathname; } catch (e) { return; } // cross-origin guard
    // Phase 1 — sign in on the n8n login form
    if (/signin|signup|setup/.test(path)) {
      const email = doc.querySelector('input[name="emailOrLdapLoginId"], input[type="email"]');
      const pass = doc.querySelector('input[name="password"], input[type="password"]');
      const btn = doc.querySelector('button[data-test-id="form-submit-button"]');
      if (email && pass && btn && !f.__signedIn) {
        const setVal = (el, val) => {
          const d = Object.getOwnPropertyDescriptor(W.HTMLInputElement.prototype, "value");
          d.set.call(el, val);
          el.dispatchEvent(new W.Event("input", { bubbles: true }));
          el.dispatchEvent(new W.Event("change", { bubbles: true }));
        };
        setVal(email, AUTO_CREDS.user); setVal(pass, AUTO_CREDS.pass);
        f.__signedIn = true;
        setTimeout(() => { try { btn.click(); } catch (e) {} }, 160);
      }
    } else if (!f.__routed) {
      // Phase 2 — logged in. n8n's subpath deep-link can land on its 404; recover by
      // clicking n8n's own home nav (client-side routing resolves correctly).
      const body = doc.body ? doc.body.innerText : "";
      const lost = /couldn.?t find|404/i.test(body.slice(0, 400));
      const home = doc.querySelector('a[href$="/automations/home"], a[href$="/home"], a[href*="/workflow"]');
      if (lost && home) { home.click(); }        // route via n8n itself
      else if (!lost && body.length > 40) { f.__routed = true; return; } // real view rendered
    }
    if (n < 40) setTimeout(tick, 250);
  };
  setTimeout(tick, 300);
}

function viewEmpty(title, sub, ic) {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>${title}</b></div></div>
    <div class="content"><div class="pad"><h1 class="page-h">${title}</h1><p class="page-sub">${sub}</p>
    <div class="empty-state"><div class="big">${ic}</div><h3>Nothing here yet</h3><div>${sub}</div></div></div></div>`;
}

/* ---------- profile ---------- */
/* ---------- Getting Started / Core Concepts (Beam-style help) ---------- */
const CONCEPTS = [
  ["agent", "Agents", "An autonomous worker you build by describing the job. Wakeel proposes a design, you approve, it builds."],
  ["flow", "Flow &amp; Triggers", "The step-by-step workflow and how it starts — manual, on a schedule, by webhook, or a Microsoft 365 event."],
  ["bolt", "Automation Modes", "Per-step Copilot (an officer approves) or Autopilot (runs on its own) — human-in-the-loop where it matters."],
  ["check", "Evaluate", "Build a test dataset, run it, score the outputs, and let Wakeel optimise the prompts to fix failures."],
  ["projects", "Records &amp; Views", "The live data the agent reads and writes — the registry as a native, searchable table."],
  ["book", "Memory &amp; Governance", "Reference documents the agent can use, and an auto-generated policy layer with guardrails."],
  ["integrations", "Integrations &amp; Automations", "400+ connectors incl. Microsoft 365, run through Wakeel's built-in automation engine."],
  ["views", "Analytics &amp; Inbox", "Completion, approval and feedback scores over time — and the approval queue where officers decide."],
];
function openHelp() {
  if ($("#hm")) { $("#hm").remove(); return; }
  const d = document.createElement("div"); d.id = "hm"; d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:720px;max-width:94vw" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center;gap:12px">${logo("")}<div style="flex:1"><h2 style="margin:0">Getting started with Wakeel</h2><div style="color:var(--muted);font-size:13px">Build, test and deploy government AI agents — in Arabic or English.</div></div><button class="x" id="hx">×</button></div>
    <div class="help-grid">${CONCEPTS.map(([ic, t, d]) => `<div class="help-card"><div class="hc-ic">${IC[ic] || IC.spark}</div><div><b>${t}</b><p>${d}</p></div></div>`).join("")}</div>
    <div class="help-cta"><div><b>Build your first agent</b><span>Describe the task in plain language — Wakeel designs it, you review, it deploys.</span></div><button class="btn primary" id="hcBuild">${IC.bolt} Build an agent</button></div>
    <div style="text-align:center;margin-top:14px"><a class="linky" href="https://champions.innoventures.ae" target="_blank">Community &amp; champions ↗</a></div>
  </div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#hx").onclick = () => d.remove();
  $("#hcBuild").onclick = () => { d.remove(); VIEW = "home"; THREAD = []; BUILD = true; renderShell(); };
}

async function openProfile() {
  if ($("#pm")) { $("#pm").remove(); return; }
  const d = document.createElement("div"); d.id = "pm"; d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:380px" onclick="event.stopPropagation()">
    <h2>${esc(ME.email.split("@")[0])} <button class="x" id="pmx">×</button></h2>
    <div style="color:var(--muted);font-size:13px;margin:-8px 0 16px">${esc(ME.email)}</div>
    <div class="side-sub" style="padding-inline:0">Activity</div>
    <div id="pmActs" style="max-height:280px;overflow:auto"><div class="empty-mini">…</div></div>
    <button class="btn block" style="margin-top:14px;border-color:#5a1e26;color:#ff9ba3" id="pmOut">Sign out</button>
  </div>`;
  document.body.appendChild(d);
  d.onclick = () => d.remove(); $("#pmx").onclick = () => d.remove();
  $("#pmOut").onclick = async () => { try { await api("POST", "logout"); } catch (e) {} ME = null; d.remove(); renderLogin(); };
  try {
    const r = await api("GET", "activity");
    const map = { login: "Signed in", build: "Built an agent", install: "Installed a template", test: "Ran a test", heal: "Self-healed an agent", data: "Added knowledge", chat: "Chat", publish: "Published", provider: "Configured a provider", gen_tests: "Generated test cases" };
    $("#pmActs").innerHTML = (r.activity || []).map(a => `<div class="lrow" style="border-radius:0;padding:10px 2px;background:transparent"><div class="info"><div class="t" style="font-size:13px">${esc(map[a.action] || a.action)}</div>${a.detail ? `<div class="d">${esc(a.detail)}</div>` : ""}</div><span class="sys-tag" style="border:0">${timeAgo(a.ts)}</span></div>`).join("") || `<div class="empty-mini">No activity yet</div>`;
  } catch (e) {}
}
function timeAgo(ts) { const s = Math.max(1, Math.floor(Date.now() / 1000 - ts)); const u = [[86400, "d"], [3600, "h"], [60, "m"]]; for (const [k, l] of u) if (s >= k) return Math.floor(s / k) + l; return s + "s"; }

/* ---------- boot ---------- */
async function boot() {
  const q = location.search;
  const lm = q.match(/[?&]lang=(en|ar)/); if (lm) { LANG = lm[1]; localStorage.setItem("wakeel_lang", LANG); }
  const m = q.match(/[?&]t=([a-f0-9]{40})/);
  if (m) { document.cookie = `wakeel_t=${m[1]}; Path=/; Max-Age=86400; SameSite=Lax`; }
  const rn = q.match(/[?&]run=([^&]+)/); if (rn) window.__autorun = decodeURIComponent(rn[1]);
  const nd = q.match(/[?&]node=(\d+)/); if (nd) window.__autonode = parseInt(nd[1]);
  const tl = q.match(/[?&]tool=(\d+)/); if (tl) window.__autotool = parseInt(tl[1]);
  const sb = q.match(/[?&]sub=(triggers|automation|records|evaluate|memory|governance|instructions|simple)/); if (sb) window.__autosub = sb[1];
  if (q.match(/[?&]m365=1/)) { window.__autom365 = true; window.__autosub = "triggers"; }
  const cf = q.match(/[?&]config=([^&]+)/); if (cf) { window.__autoconfig = decodeURIComponent(cf[1]); VIEW = "integrations"; }
  if (m) history.replaceState(null, "", location.pathname + location.hash);
  const h = location.hash.replace("#", "");
  if (h.startsWith("agent/")) { AGENT = h.split("/")[1]; VIEW = "agent"; COPILOT = true; if (window.__autosub) { ASUB = window.__autosub; window.__autosub = null; } }
  else if (["home", "skills", "projects", "inbox", "tasks", "templates", "integrations", "automations", "views"].includes(h)) VIEW = h;
  try { ME = await api("GET", "me"); } catch (e) { ME = null; }
  if (!ME) return renderLogin();
  try { await api("GET", "sso"); } catch (e) {}
  renderShell();
}
boot();
