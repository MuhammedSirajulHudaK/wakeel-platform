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
  trophy: I('<path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0zM6 6H3v1a4 4 0 0 0 3 3.9M18 6h3v1a4 4 0 0 1-3 3.9"/>'),
  team: I('<circle cx="12" cy="6" r="2.6"/><circle cx="5" cy="17.5" r="2.6"/><circle cx="19" cy="17.5" r="2.6"/><path d="M11 8.2l-4.4 6.6M13 8.2l4.4 6.6"/>'),
  shield: I('<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><path d="M9.2 12l2 2 3.6-3.8"/>'),
  download: I('<path d="M12 4v11M8 11l4 4 4-4M4 19h16"/>'),
  lock: I('<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><circle cx="12" cy="15.5" r="1.3"/>'),
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
    const isMs = /microsoft|outlook|onedrive|sharepoint|teams|excel|office|graph|365/i.test(name + " " + provider);
    const intro = isMs
      ? `Connect via Microsoft Graph. Use the token from your Entra ID app (scopes: Mail.Send, Files.ReadWrite, Sites.ReadWrite) — the same app you register under <b>Security → Single sign-on</b>.`
      : `Connect ${esc(name)} with the API credential from its admin console. Wakeel stores it encrypted and uses it only for this connector.`;
    const tokenPh = isMs ? "Microsoft Graph access token" : "API key / access token";
    $("#tcBody").innerHTML = `
      <div style="color:var(--muted);font-size:13px;margin:-6px 0 16px">${intro}</div>
      ${fields.length ? fields.map(f => `<div class="field"><label>${esc(f.label)}${f.required ? " *" : ""}</label><input class="input" data-f="${esc(f.name)}" type="${f.type === "secret-input" ? "password" : "text"}" placeholder="${esc(f.help || f.label)}"/></div>`).join("") : `<div class="field"><label>Access token</label><input class="input" data-f="access_token" type="password" placeholder="${tokenPh}"/></div>`}
      <div style="display:flex;align-items:center;gap:12px;margin-top:8px"><button class="btn primary sm" id="tcSave">Connect</button><span class="page-sub" style="margin:0" id="tcMsg"></span></div>
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line-2);font-size:12px;color:var(--faint)">${isMs ? "For production, register the Entra ID app once — Wakeel reuses the token via SSO. A data-residency step handled by your IT." : "Credentials are workspace-scoped and never leave your in-country environment."}</div>`;
    $("#tcSave").onclick = async () => {
      const creds = {}; d.querySelectorAll("input[data-f]").forEach(i => { if (i.value.trim()) creds[i.dataset.f] = i.value.trim(); });
      if (!Object.keys(creds).length) { $("#tcMsg").textContent = "Enter a token first"; return; }
      $("#tcSave").disabled = true; $("#tcMsg").textContent = "Connecting…";
      try { await api("POST", "tool-connect", { provider, credentials: creds, name: name, type: s.type }); $("#tcMsg").textContent = "✓ Connected"; setTimeout(() => d.remove(), 900); }
      catch (e) { $("#tcMsg").textContent = "⚠️ " + e.message; $("#tcSave").disabled = false; }
    };
  } catch (e) { $("#tcBody").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
}
/* Skills = ready-made AI capabilities the user can run in chat. Each has a system
   instruction so it actually performs the task. */
const SKILLS = [
  { id: "draft-letter", name: "Draft a bilingual letter", ic: "book", desc: "Turn your notes into a formal government letter in English and Arabic.", ph: "Paste your notes / what the letter should say…", prompt: "You are a UAE government correspondence officer. Draft a formal, professional letter from the user's notes. Provide it in BOTH English and Arabic, with a subject line, salutation, body and official closing, in a MoHRE / Abu Dhabi government tone." },
  { id: "summarize-doc", name: "Summarize a document", ic: "book", desc: "Turn a long legal or policy document into plain-language key points.", ph: "Paste the document text…", prompt: "You summarize legal and policy documents for UAE government officers. Produce a plain-language summary: purpose, key points, obligations, dates/deadlines and any risks. Be concise and accurate. If the text is Arabic, summarize in Arabic." },
  { id: "classify-complaint", name: "Classify & route a complaint", ic: "inbox", desc: "Categorize a citizen complaint and recommend the responsible entity.", ph: "Paste the citizen complaint…", prompt: "You triage citizen complaints for Abu Dhabi government. For the complaint, output: category, urgency (Low/Medium/High), the responsible entity, a 2-sentence summary and a recommended next action. Do not make final legal decisions." },
  { id: "translate", name: "Translate (Arabic ⇄ English)", ic: "skills", desc: "Accurately translate government text, preserving formal tone.", ph: "Paste the text to translate…", prompt: "You are a professional Arabic⇄English translator for UAE government documents. Detect the source language and translate to the other, preserving formal tone and official terminology." },
  { id: "extract-data", name: "Extract data to a table", ic: "projects", desc: "Pull key fields from an application or document into a clean table.", ph: "Paste the application / document…", prompt: "You extract structured data from government application text. Return a clean markdown table of the key fields (name, ID, dates, amounts, status…) found, plus a short note of anything missing or unclear." },
  { id: "pre-check", name: "Pre-check an application", ic: "check", desc: "Screen an application for completeness before officer review.", ph: "Paste the application summary…", prompt: "You pre-screen government service applications. Check the summary for completeness, list what's present and what's missing/unclear, give a verdict (Complete / Incomplete) and recommend next steps. Do not approve or reject." },
  { id: "draft-decision", name: "Draft an approval / rejection", ic: "book", desc: "Draft a decision letter with a clear, respectful justification.", ph: "Describe the case and the decision…", prompt: "You draft government decision letters. Draft an approval or rejection with a clear, respectful justification and the applicant's next steps. Note that a human officer must confirm the final decision." },
  { id: "answer-policy", name: "Answer a service question", ic: "help", desc: "Answer a citizen or officer question about a government service.", ph: "Ask a question about a government service…", prompt: "You answer questions about UAE government services and procedures clearly and helpfully, in the language asked. If unsure, say so and suggest where to verify." },
];

/* ---------- i18n ---------- */
const T = {
  // shell / nav
  "Home": "الرئيسية", "Skills": "المهارات", "Projects": "المشاريع", "Inbox": "الوارد",
  "Ready-made AI helpers. Pick one and it runs in chat — paste your text and get the result.": "مساعدات ذكاء جاهزة. اختر واحدة لتعمل في المحادثة — الصق نصّك واحصل على النتيجة.",
  "Search skills…": "ابحث عن المهارات…", "Use in chat": "استخدمها في المحادثة",
  "Tasks": "المهام", "Agent templates": "قوالب الوكلاء", "Integrations": "التكاملات", "Teams": "الفِرق",
  "Automations": "الأتمتة", "Analytics": "التحليلات", "Your agents": "وكلاؤك",
  "New agent": "وكيل جديد", "Chat & support": "المحادثة والدعم", "Loading…": "جارٍ التحميل…",
  "No agents yet": "لا يوجد وكلاء بعد", "Wakeel AI": "وكيل الذكي", "Beta": "تجريبي",
  // agent tabs
  "Flow": "المخطط", "Triggers": "المشغّلات", "Memory": "الذاكرة",
  "Governance": "الحوكمة", "Security": "الأمن", "Instructions": "التعليمات", "Automation": "أوضاع الأتمتة", "Evaluate": "التقييم", "Records": "السجلات",
  // home
  "What do you want to work on?": "بماذا تريد أن تعمل؟",
  "Ask Wakeel to perform tasks, build an agent, or brainstorm ideas": "اطلب من وكيل تنفيذ المهام أو بناء وكيل أو طرح الأفكار",
  "Build agents": "بناء الوكلاء", "Recommended": "موصى به",
  "Talk to build an agent": "تحدّث لبناء وكيل", "No typing — just speak": "بلا كتابة — فقط تحدّث",
  "Talk to build": "تحدّث لتبني", "Just speak — I'll build your assistant as we talk.": "تحدّث فقط — سأبني مساعدك بينما نتكلم.",
  "Tap and speak": "اضغط وتحدّث", "Type here instead…": "اكتب هنا بدلاً من ذلك…",
  "Listening…": "أستمع…", "Thinking…": "أفكّر…", "Building your assistant…": "أبني مساعدك…",
  "Tap the mic to talk": "اضغط الميكروفون للتحدث", "Tap the mic and speak": "اضغط الميكروفون وتحدّث",
  "Building your assistant… (about a minute)": "أبني مساعدك… (حوالي دقيقة)",
  "Tap the mic and reply": "اضغط الميكروفون وأجب", "Type your answer below": "اكتب إجابتك بالأسفل",
  "Your assistant": "مساعدك", "ready": "جاهز", "Ready": "جاهز", "Open it": "افتحه",
  "Speak, and I'll sketch it live": "تحدّث، وسأرسمه أمامك مباشرة", "Your agent will appear here as you talk": "سيظهر وكيلك هنا أثناء حديثك",
  "Connecting…": "جارٍ الاتصال…", "Listening — just talk": "أستمع — تحدّث فقط", "Tap the mic to start": "اضغط الميكروفون للبدء", "Tap the mic to start talking": "اضغط الميكروفون لبدء التحدث",
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
  "Here's what I'll do for you": "إليك ما سأقوم به من أجلك",
  "Here's what I'll set up for your": "إليك ما سأجهّزه لـ",
  ". Have a look, and tell me if you'd like anything changed before I build it.": "، ألقِ نظرة وأخبرني إن رغبت بتغيير أي شيء قبل أن أبنيه.",
  "See the technical details": "عرض التفاصيل التقنية",
  "Reading what you need": "أقرأ ما تحتاجه", "Reading your changes": "أقرأ تعديلاتك",
  "Understood what you need": "فهمت ما تحتاجه", "Got it": "تمام",
  "Planning how your assistant will work": "أخطّط لكيفية عمل مساعدك", "Updating the plan": "أُحدّث الخطة",
  "Working out the steps and the safety rules": "أُحدّد الخطوات وقواعد الأمان",
  "Worked out the steps and the safety rules": "حدّدت الخطوات وقواعد الأمان",
  "Ready — here's my plan": "جاهز — إليك خطتي", "Updated the plan": "حدّثت الخطة",
  "Couldn't plan that": "تعذّر التخطيط لذلك",
  "I couldn't plan that — try describing the task in a bit more detail.": "تعذّر عليّ التخطيط لذلك — حاول وصف المهمة بمزيد من التفصيل.",
  // buttons / common
  "Create agent": "إنشاء وكيل", "Configure": "إعداد", "Install & connect": "تثبيت وربط",
  "Request": "طلب", "Request access": "طلب التفعيل", "Champions": "الأبطال",
  "Installed": "مُثبّت", "Get URL": "الحصول على الرابط", "Choose": "اختيار",
  "Save schedule": "حفظ الجدولة", "Native plugin": "إضافة أصلية", "Publish": "نشر",
  "Connect Microsoft 365": "ربط Microsoft 365", "All": "الكل", "Active": "نشط", "Save": "حفظ",
  // triggers
  "How this agent starts. Multiple triggers can feed the same flow.": "كيف يبدأ هذا الوكيل. يمكن لعدة مشغّلات تغذية المخطط نفسه.",
  "Run & triggers": "التشغيل والمشغّلات",
  "Run the agent yourself now — or set it to run automatically.": "شغّل الوكيل بنفسك الآن — أو اضبطه ليعمل تلقائيًا.",
  "Run it now": "شغّله الآن", "Run now": "شغّل الآن", "Run automatically": "التشغيل التلقائي",
  "Give the agent an input and watch it work — the simplest way to use it.": "أعطِ الوكيل مُدخلًا وشاهده يعمل — أبسط طريقة لاستخدامه.",
  "When a new email or row arrives, or on a daily schedule. One Microsoft sign-in and it runs itself.": "عند وصول بريد أو صف جديد، أو وفق جدول يومي. تسجيل دخول واحد بمايكروسوفت ويعمل من تلقاء نفسه.",
  "On a schedule": "وفق جدول", "Run every day at 08:00 — or your own timer.": "يعمل يوميًا الساعة 08:00 — أو وفق مؤقّتك.",
  "Describe an automation and Wakeel builds it — it runs across your connectors (Microsoft 365, Google, HTTP…) and can call your agents. No diagrams to draw.": "صِف أتمتة وسيبنيها وكيل — تعمل عبر موصّلاتك (Microsoft 365 وGoogle وHTTP…) ويمكنها استدعاء وكلائك. دون رسم أي مخططات.",
  "Describe an automation… e.g. every morning read the registry, ask the compliance agent who needs outreach, email them, and send officers a summary": "صِف أتمتة… مثل: كل صباح اقرأ السجل، اسأل وكيل الامتثال من يحتاج تواصلًا، راسلهم، وأرسل للموظفين ملخصًا",
  "Runs on your connectors": "يعمل على موصّلاتك", "Your automations": "أتمتتك",
  "Set schedule": "ضبط الجدول", "From another system": "من نظام آخر",
  "Trigger from any system with a secure URL and key.": "التشغيل من أي نظام عبر رابط آمن ومفتاح.",
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
let VIEW = "home", BUILD = true, AGENT = null, ASUB = "flow", COPILOT = false, COP_HIDDEN = false;
let APPS = [], THREAD = [], LASTGRAPH = null, LASTDESIGN = null, DEPT = "all", CFGNODE = null, ACTIVE_SKILL = null;
const TOUR_URL = "/wakeel/tour.html";

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
const PLOGO = {
  inno: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4.5 12a3 3 0 1 1 6 0 3 3 0 1 0 6 0 3 3 0 1 1-6 0 3 3 0 1 0-6 0z"/></svg>',
  takalam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 5h14v9H9l-4 4z"/><path d="M9 9h6M9 11.5h3" stroke-linecap="round"/></svg>',
  notension: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="11" width="3.2" height="8" rx="1"/><rect x="10.4" y="6" width="3.2" height="13" rx="1"/><rect x="16.8" y="13" width="3.2" height="6" rx="1"/></svg>',
};
const GOOGLE_G = '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7C21.7 18.9 23 15.9 23 12.3z"/><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.8H1.8v3C3.7 21.3 7.5 24 12 24z"/><path fill="#FBBC05" d="M5.6 14.6a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.7 2.7 1.8 6.6l3.8 3c.9-2.8 3.4-4.8 6.4-4.8z"/></svg>';

function renderLogin() {
  applyDir();
  const partners = [["Innoventures", PLOGO.inno], ["Takalam", PLOGO.takalam], ["notension.ai", PLOGO.notension]];
  $("#root").innerHTML = `
  <div class="signin fade">
    <div class="signin-hero">
      <div class="wave"></div>
      <div class="hero-logo"><div class="logo" style="width:34px;height:34px;border-radius:10px"><span>و</span></div><div style="font-size:20px;font-weight:800">Wakeel</div></div>
      <div class="hero-copy">
        <h2>Build <span class="wk-accent">وكيل</span> agents for Arabic-first government work</h2>
        <p>Design flows, run tasks, and keep approvals moving across English and Arabic operating surfaces.</p>
        <p class="hero-ar" dir="rtl">وكلاء ذكاء اصطناعي يفهمون السياق الحكومي ويعملون بالعربية والإنجليزية</p>
        <div class="built">
          <div class="built-lab">Built with</div>
          <div class="built-row">${partners.map(([n, lg]) => `<div class="built-card"><span class="plg">${lg}</span><span>${n}</span></div>`).join("")}</div>
          <div class="hero-pills"><span class="hpill">Arabic-first</span><span class="hpill">Self-hosted</span><span class="hpill">Government-ready</span></div>
        </div>
      </div>
    </div>
    <div class="signin-form">
      <div class="form-top"><span class="linky" id="lang">${LANG === "en" ? "العربية" : "English"}</span></div>
      <div class="signin-card" id="authCard">
        <h1>Sign in</h1><div class="sub">Sign in with your entity account, a magic link or single sign-on.</div>
        <div class="field"><input class="input" id="em" type="email" placeholder="Enter your email address" autocomplete="username"/></div>
        <div class="field" id="pwField" hidden><input class="input" id="pw" type="password" placeholder="Password" autocomplete="current-password"/></div>
        <button class="btn primary block" id="go">Continue</button>
        <button class="btn block ghost" id="magic">Get magic link</button>
        <div class="or"><span>Or continue with</span></div>
        <button class="btn block" id="google">${GOOGLE_G} Sign in with Google</button>
        <button class="btn block" id="sso">${IC.lock} Sign in with SSO</button>
        <div class="err" id="err"></div>
      </div>
    </div>
  </div>`;
  $("#lang").onclick = () => { LANG = LANG === "en" ? "ar" : "en"; localStorage.setItem("wakeel_lang", LANG); renderLogin(); };
  const errEl = () => $("#err");
  const setErr = (msg, info) => { const e = errEl(); if (e) { e.textContent = msg; e.className = "err" + (info ? " info" : ""); } };

  const doLogin = async () => {
    $("#go").disabled = true; $("#go").textContent = "Signing in…"; setErr("");
    try { await api("POST", "login", { email: $("#em").value.trim(), password: $("#pw").value }); await boot(); }
    catch (e) { setErr("Invalid email or password."); $("#go").disabled = false; $("#go").textContent = "Sign in"; }
  };
  const onContinue = () => {
    const email = $("#em").value.trim();
    if (!email || !email.includes("@")) { setErr("Enter a valid email address."); $("#em").focus(); return; }
    if ($("#pwField").hidden) { $("#pwField").hidden = false; $("#go").textContent = "Sign in"; $("#pw").focus(); return; }
    doLogin();
  };
  $("#go").onclick = onContinue;
  $("#em").addEventListener("keydown", e => { if (e.key === "Enter") onContinue(); });
  $("#pw") && $("#pw").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });

  $("#magic").onclick = async () => {
    const email = $("#em").value.trim();
    if (!email || !email.includes("@")) { setErr("Enter your email first — we'll send the link there."); $("#em").focus(); return; }
    $("#magic").disabled = true; $("#magic").textContent = "Sending…"; setErr("");
    try {
      const r = await api("POST", "magic-request", { email });
      if (r.error) throw new Error(r.error);
      renderMagicSent(r);
    } catch (e) { setErr(e.message); $("#magic").disabled = false; $("#magic").textContent = "Get magic link"; }
  };
  $("#google").onclick = () => setErr("Google Workspace sign-in is enabled per workspace by your admin.", true);
  $("#sso").onclick = () => setErr("Single sign-on activates once IT completes the Entra ID / SAML handshake.", true);
}

function renderMagicSent(r) {
  const token = (r.link || "").split("magic=")[1] || "";
  const card = $("#authCard");
  card.innerHTML = `
    <div class="magic-ic">${IC.send}</div>
    <h1>Check your email</h1>
    <div class="sub">We sent a one-time sign-in link to <b>${esc(r.email)}</b>. It expires in 10 minutes.</div>
    ${r.provisioned
      ? `<button class="btn primary block" id="mgo">Continue as ${esc(r.email)}</button>
         <div class="magic-note">Pilot: email delivery is configured by IT — for now, use the button above to open your link.</div>`
      : `<div class="magic-note warn">This account isn't provisioned for passwordless sign-in yet. Sign in with your password, or ask IT to enable magic link / SSO for it.</div>`}
    <button class="btn block ghost" id="mback">Use a different email</button>
    <div class="err" id="err"></div>`;
  if ($("#mgo")) $("#mgo").onclick = async () => {
    $("#mgo").disabled = true; $("#mgo").textContent = "Signing in…";
    try { await api("POST", "magic-consume", { token }); await boot(); }
    catch (e) { $("#err").textContent = e.message; $("#mgo").disabled = false; $("#mgo").textContent = "Continue"; }
  };
  $("#mback").onclick = () => renderLogin();
}

/* ---------- shell ---------- */
const NAV = [["home", "Home", IC.home], ["skills", "Skills", IC.skills], ["templates", "Agent templates", IC.templates], ["teams", "Teams", IC.team], ["inbox", "Inbox", IC.inbox], ["tasks", "Tasks", IC.tasks], ["integrations", "Integrations", IC.integrations], ["automations", "Automations", IC.flow], ["governance", "Governance", IC.shield], ["security", "Security", IC.lock], ["views", "Analytics", IC.views]];

function renderShell() {
  applyDir();
  // Chat-first: the Build Assistant sits beside every editable tab (flow/triggers/…),
  // hidden only on Overview/Config or when the user explicitly closes it with the toggle.
  const showCop = VIEW === "agent" && ASUB !== "overview" && ASUB !== "config" && !COP_HIDDEN;
  $("#root").innerHTML = `
  <div class="app">
    <aside class="side">
      <div class="side-top">${logo()}<div class="nm">Wakeel</div><span class="beta">${t("Beta")}</span></div>
      <nav class="nav">${NAV.map(([id, label, ic]) => `<a class="${VIEW === id ? "active" : ""}" data-v="${id}">${ic}<span>${t(label)}</span></a>`).join("")}</nav>
      <div class="side-sub">${t("Your agents")}</div>
      <div class="agent-list" id="agentList"><div class="empty-mini">${t("Loading…")}</div></div>
      <div class="new-agent" id="newAgent">${IC.plus} ${t("New agent")}</div>
      <div class="side-foot">
        <div class="foot-row" id="supBtn">${IC.trophy}<span>${t("Champions")}</span></div>
        <div class="foot-row" id="userBtn"><div class="av">${esc((ME.email || "U")[0].toUpperCase())}</div><span>${esc(ME.email.split("@")[0])}</span></div>
      </div>
    </aside>
    <main class="main" id="mainCol"></main>
    ${showCop ? renderCopilot() : ""}
  </div>`;
  document.querySelectorAll(".nav a").forEach(a => a.onclick = () => { VIEW = a.dataset.v; AGENT = null; COPILOT = false; if (a.dataset.v !== "home") ACTIVE_SKILL = null; location.hash = a.dataset.v; renderShell(); });
  $("#newAgent").onclick = () => { VIEW = "home"; THREAD = []; renderShell(); };
  $("#userBtn").onclick = openProfile;
  $("#supBtn").onclick = () => window.open("https://champions.innoventures.ae/", "_blank", "noopener");
  loadAgents();
  ({ home: viewHome, skills: viewSkills, teams: viewTeams, governance: viewGovernance, security: viewSecurity, projects: () => viewEmpty("Projects", "Group related agents, files and notes.", IC.projects), inbox: viewInbox, tasks: viewTasks, templates: viewTemplates, integrations: viewIntegrations, automations: viewAutomations, views: viewAnalytics, developers: viewDevelopers, agent: viewAgent }[VIEW])();
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
  $("#homeArea").classList.remove("has-thread");
  $("#homeArea").innerHTML = `
    <div class="home-inner fade">
      <h1>${ACTIVE_SKILL ? esc(ACTIVE_SKILL.name) : t("What do you want to work on?")}</h1>
      ${ACTIVE_SKILL ? `<p class="skill-hint">${esc(ACTIVE_SKILL.desc)}</p>` : ""}
      <div class="composer home-composer">
        <textarea id="ins" rows="5" placeholder="${ACTIVE_SKILL ? esc(ACTIVE_SKILL.ph) : t("Ask Wakeel to perform tasks, build an agent, or brainstorm ideas")}"></textarea>
        <div class="composer-foot">
          ${ACTIVE_SKILL ? skillChip() : `<div class="toggle-pill ${BUILD ? "on" : ""}" id="buildToggle"><span class="lm">و</span> ${t("Build agents")}</div>`}
          <button class="plus-btn" id="plusBtn">${IC.plus}<div class="pop" id="plusPop" hidden>
            <a data-a="upload">${IC.upload} ${t("Upload file")}</a>
            <a data-a="skills">${IC.skills} ${t("Add skills")}</a>
            <a data-a="integration">${IC.integrations} ${t("Add integration")}</a>
          </div></button>
          <button class="send-btn" id="sendBtn">${IC.up}</button>
        </div>
      </div>
      <button class="talk-launch" id="talkLaunch"><span class="tl-mic">🎤</span> ${t("Talk to build an agent")}<span class="tl-hint">${t("No typing — just speak")}</span></button>
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
  if ($("#buildToggle")) $("#buildToggle").onclick = () => { BUILD = !BUILD; $("#buildToggle").classList.toggle("on", BUILD); };
  wireSkillChip();
  $("#plusBtn").onclick = (e) => { e.stopPropagation(); const p = $("#plusPop"); p.hidden = !p.hidden; };
  document.querySelectorAll("#plusPop a").forEach(a => a.onclick = (e) => { e.stopPropagation(); plusAction(a.dataset.a); });
  document.querySelectorAll(".chip").forEach(c => c.onclick = () => { $("#ins").value = c.textContent; autoGrow($("#ins")); $("#ins").focus(); });
  $("#sendBtn").onclick = onSend;
  if ($("#talkLaunch")) $("#talkLaunch").onclick = openTalk;
  $("#ins").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } });
  $("#ins").addEventListener("input", e => autoGrow(e.target));
  $("#ins").focus();
}

/* ---------- Voice: talk to build an agent (browser Web Speech API) ---------- */
let TALK = null;
const TK_KIND = {
  trigger: { ic: "📥", c: "#3ee08a", label: "Trigger" },
  agent: { ic: "🤖", c: "#2ee59a", label: "Assistant" },
  knowledge: { ic: "📚", c: "#63a0e6", label: "Knowledge" },
  tool: { ic: "🔧", c: "#5f9be0", label: "Action" },
  decision: { ic: "🔀", c: "#e6b02e", label: "Decision" },
  guardrail: { ic: "🛡️", c: "#e0a33a", label: "Guardrail" },
  approval: { ic: "✋", c: "#ec6a6a", label: "Approval" },
  output: { ic: "✅", c: "#12b76a", label: "Result" },
};
// client-side staged reveal (mirrors the server) — used by the realtime tool calls
const TK_PROG_KINDS = {
  1: ["trigger", "agent", "output"], 2: ["trigger", "agent", "decision", "output"],
  3: ["trigger", "agent", "knowledge", "decision", "tool", "output"],
  4: ["trigger", "agent", "knowledge", "decision", "guardrail", "approval", "tool", "output"],
};
const TK_PROG_EDGES = {
  1: [["trigger", "agent"], ["agent", "output"]],
  2: [["trigger", "agent"], ["agent", "decision"], ["decision", "output"]],
  3: [["trigger", "agent"], ["knowledge", "agent", "grounds"], ["agent", "decision"], ["decision", "tool", "acts"], ["tool", "output"]],
  4: [["trigger", "agent"], ["knowledge", "agent", "grounds"], ["agent", "decision"], ["guardrail", "decision", "checks"], ["decision", "approval", "if sensitive"], ["decision", "tool", "acts"], ["approval", "output"], ["tool", "output"]],
};
const TK_KIND_DEF = { trigger: "When it starts", agent: "Understand the request", knowledge: "Rules & SOP", tool: "Take the action", decision: "Check the rules", guardrail: "Safety limits", approval: "Officer approves", output: "Record the result" };
function stagedSketch(blocks, stage) {
  stage = Math.max(1, Math.min(4, stage || 1));
  const by = {}; (blocks || []).forEach(b => { if (b && b.kind) by[b.kind] = { title: b.title, desc: b.desc }; });
  const kinds = TK_PROG_KINDS[stage];
  const nodes = kinds.map(k => ({ id: k, kind: k, title: (by[k] && by[k].title) || TK_KIND_DEF[k], desc: (by[k] && by[k].desc) || "" }));
  const edges = TK_PROG_EDGES[stage].filter(e => kinds.includes(e[0]) && kinds.includes(e[1])).map(e => ({ source: e[0], target: e[1], label: e[2] || "" }));
  return { nodes, edges };
}
const VL_LABEL = { trigger: "It starts", agent: "Wakeel reads & understands", knowledge: "It uses trusted context", decision: "It checks", tool: "It takes action", guardrail: "It stays safe", approval: "A person reviews", output: "You get" };
const VL_LABEL_AR = { trigger: "تبدأ", agent: "وكيل يقرأ ويفهم", knowledge: "تستخدم سياقاً موثوقاً", decision: "تتحقق", tool: "تتخذ إجراءً", guardrail: "تبقى آمنة", approval: "شخص يراجع", output: "تحصل على" };
const VL_ICON = { trigger: "⏰", agent: "🤖", knowledge: "📚", decision: "🔀", tool: "⚡", guardrail: "🛡️", approval: "🙋", output: "✅" };
function openTalk() {
  const ar = LANG === "ar";
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SR;
  const L = (en, arr) => ar ? arr : en;
  const ov = document.createElement("div"); ov.className = "talk-ov"; ov.id = "talkOv";
  if (ar) ov.setAttribute("dir", "rtl");
  ov.innerHTML = `
    <div class="tf-shell">
      <div class="flow-head tf-head">
        <div><h1>${L("Build by voice", "بناء بالصوت")}</h1>
          <p id="tfSub">${L("Just talk — I'll build the flow for you, step by step.", "تحدّث فقط — سأبني المخطط لك خطوة بخطوة.")}</p></div>
        <div class="ctrls">
          <span class="tf-badge" id="tfBadge">🟢 ${L("Natural voice", "صوت طبيعي")}</span>
          <button class="draft-btn ghost" id="tfReset">↺ ${L("Start over", "ابدأ من جديد")}</button>
          <button class="btn primary sm" id="tfOpen" hidden>${L("Open agent", "افتح الوكيل")}</button>
          <button class="draft-btn ghost" id="tfClose">✕</button>
        </div>
      </div>
      <div class="tf-body">
        <div class="rf-stage" id="tfStage">
          <div class="rf-world" id="tfWorld"><svg class="rf-wires" id="tfWires"></svg></div>
          <div class="tf-empty" id="tfEmpty">🎙️ ${L("Your flow will build itself as you talk", "سيُبنى مخططك أثناء حديثك")}</div>
          <div class="tf-building" id="tfBuilding" hidden><div class="spin"></div><div class="tfb-t">${L("Building your real agent…", "أبني وكيلك الحقيقي…")}</div><div class="tfb-s">${L("Wiring it up in the backend — about a minute", "أوصله في الخلفية — حوالي دقيقة")}</div></div>
          <div class="rf-ctrls" id="tfCtrls"><button id="tfZi" title="Zoom in">${SVGI.plus}</button><button id="tfZo" title="Zoom out">${SVGI.minus}</button><button id="tfZf" title="Fit">${SVGI.expand}</button></div>
        </div>
        <aside class="tf-voice">
          <audio id="tkAudio" autoplay class="sr-only"></audio>
          <div class="tf-v-top">
            <span class="tf-orb">✨</span>
            <div style="flex:1"><div class="tf-nm">Wakeel</div><div class="tf-st" id="tfState">${L("Ready when you are", "جاهز متى شئت")}</div></div>
            <span class="tf-prog"><b id="tfPct">0%</b><i><em id="tfBar" style="width:0%"></em></i></span>
          </div>
          <div class="tf-now-label" id="tfNowLabel">${L("Wakeel says", "يقول وكيل")}</div>
          <div class="tf-now" id="tfNow">…</div>
          <div class="tf-note" id="tfNote" hidden>📝 <span><small>${L("Just noted", "سجّلت للتو")}</small><b id="tfNoteT"></b></span></div>
          <div class="tf-step" id="tfStep">${L("Step 1 of 5", "الخطوة 1 من 5")}</div>
          <div class="tf-mic-wrap"><button class="tf-mic idle" id="tfMic" title="${L("Tap and speak", "اضغط وتحدّث")}">🎤</button>
            <span class="tf-wave" id="tfWave"><i></i><i></i><i></i><i></i><i></i></span></div>
          <div class="tf-status" id="tfStatus"></div>
          <div class="tf-fallback"><input id="tfInput" placeholder="${L("or type your answer…", "أو اكتب إجابتك…")}"/><button id="tfSend">➤</button></div>
          <div class="tf-foot">🛡️ ${L("Nothing runs until you open & publish it.", "لا شيء يعمل حتى تفتحه وتنشره.")}</div>
        </aside>
      </div>
    </div>`;
  document.body.appendChild(ov);
  TALK = { state: {}, lang: ar ? "ar" : "en", recog: null, busy: false, speaking: false, built: false, ctl: null };
  const $$ = (id) => ov.querySelector("#" + id);
  const audio = $$("tkAudio");
  const setStatus = (s) => { $$("tfStatus").textContent = s || ""; };
  const setState = (s, label) => { if (label != null) $$("tfState").textContent = label; $$("tfMic").className = "tf-mic " + s; };
  const updateNow = (reply, conf) => { $$("tfNow").textContent = reply; $$("tfNowLabel").textContent = L("Wakeel says", "يقول وكيل"); if (conf != null) { $$("tfPct").textContent = Math.round(conf) + "%"; $$("tfBar").style.width = Math.round(conf) + "%"; } };
  const showNote = (txt) => { if (!txt) return; $$("tfNote").hidden = false; $$("tfNoteT").textContent = txt; };
  const STEP = (st) => (st >= 5 ? L("Refine together", "لنحسّنها معاً") : L("Step " + (st + 1) + " of 5", "الخطوة " + (st + 1) + " من 5"));
  // convert the voice "sketch" to the same graph shape the Flow tab renders
  const sketchGraph = (sk) => ({
    nodes: (sk.nodes || []).map(n => ({ id: n.id, data: { type: n.kind, title: n.title, desc: n.desc }, position: { x: 0, y: 0 } })),
    edges: (sk.edges || []).map((e, i) => ({ id: "e" + i, source: e.source, target: e.target, sourceHandle: e.label || "source" })),
  });
  const wireZoom = () => { const c = TALK.ctl; if (!c) return; $$("tfZi").onclick = () => c.zoom(1.2); $$("tfZo").onclick = () => c.zoom(1 / 1.2); $$("tfZf").onclick = () => c.fit(); };
  const renderFlow = (sk) => {
    if (!sk || !(sk.nodes || []).length) return;
    $$("tfEmpty").style.display = "none";
    TALK.ctl = buildRailwayFlow("tfStage", "tfWorld", "tfWires", sketchGraph(sk));
    wireZoom();
    $$("tfCtrls").addEventListener("mousedown", e => e.stopPropagation());
  };
  // natural voice (OpenAI TTS) with browser fallback
  const speakBrowser = (text) => new Promise(res => { try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = ar ? "ar-SA" : "en-US"; u.rate = 0.98; u.pitch = 1.03; u.onend = res; u.onerror = res; TALK.speaking = true; window.speechSynthesis.speak(u); } catch (e) { res(); } }).then(() => { TALK.speaking = false; });
  const speak = async (text) => {
    if (!text || !TALK) return;
    try {
      const r = await fetch("api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voice: "nova" }), credentials: "include" });
      if (!r.ok) throw new Error("tts");
      const url = URL.createObjectURL(await r.blob());
      TALK.speaking = true;
      await new Promise((res) => { audio.srcObject = null; audio.src = url; audio.onended = res; audio.onerror = res; const p = audio.play(); if (p && p.catch) p.catch(() => res()); });
      TALK.speaking = false; URL.revokeObjectURL(url);
    } catch (e) { await speakBrowser(text); }
  };
  const doBuild = async (brief) => {
    if (!TALK || TALK.built) return; TALK.built = true;
    try { stopRealtime(); } catch (e) {} TALK.cont = false;
    setState("thinking", L("Building the real agent…", "أبني الوكيل الحقيقي…")); setStatus(L("Building your agent… (about a minute)", "أبني وكيلك… (حوالي دقيقة)"));
    $$("tfSub").textContent = L("Building the real agent…", "أبني الوكيل الحقيقي…");
    $$("tfEmpty").style.display = "none"; $$("tfBuilding").hidden = false;
    const ob0 = $$("tfOpen"); ob0.hidden = false; ob0.disabled = true; ob0.textContent = L("Building…", "أبني…");
    try {
      const bd = await api("POST", "talk-build", { brief: brief || TALK.brief || "", name: TALK.name || "", lang: TALK.lang });
      if (!TALK) return;
      $$("tfBuilding").hidden = true; ob0.disabled = false;
      if (bd.done && bd.agent_id) {
        // swap the voice sketch for the REAL backend graph — identical to a chat build
        try {
          const info = await api("GET", "app-info?id=" + bd.agent_id);
          if (info && info.graph && (info.graph.nodes || []).length) { $$("tfEmpty").style.display = "none"; TALK.ctl = buildRailwayFlow("tfStage", "tfWorld", "tfWires", info.graph); wireZoom(); $$("tfCtrls").addEventListener("mousedown", e => e.stopPropagation()); }
        } catch (e) {}
        updateNow((ar ? "تم! " : "Done! ") + (bd.name || "Your agent") + (ar ? " جاهز — هذا هو المخطط الحقيقي." : " is ready — this is the real agent."), 100); await speak((ar ? "تم بناء " : "I've built ") + (bd.name || "your agent") + (ar ? "." : "."));
        $$("tfSub").textContent = (bd.name || "Your agent") + " — " + L("real agent, ready", "وكيل حقيقي، جاهز");
        const ob = $$("tfOpen"); ob.hidden = false; ob.dataset.mode = "open"; ob.textContent = L("Open agent", "افتح الوكيل"); ob.onclick = () => { closeTalk(); openAgent(bd.agent_id, "flow"); };
        setState("idle", L("Ready", "جاهز")); setStatus("");
      } else { TALK.built = false; ob0.textContent = L("Build agent", "ابنِ الوكيل"); setState("idle"); setStatus((L("Couldn't build that: ", "تعذّر البناء: ")) + (bd.error || "try again")); }
    } catch (e) { if (TALK) { TALK.built = false; $$("tfBuilding").hidden = true; const o = $$("tfOpen"); o.disabled = false; o.textContent = L("Build agent", "ابنِ الوكيل"); setState("idle"); setStatus(L("Build failed — tap Build agent to retry", "فشل البناء — اضغط ابنِ الوكيل للمحاولة")); } }
  };
  const showBuildBtn = () => { const ob = $$("tfOpen"); if (TALK.built || ob.dataset.mode === "open") return; ob.hidden = false; ob.dataset.mode = "build"; ob.textContent = L("Build agent", "ابنِ الوكيل"); ob.onclick = () => doBuild(TALK.brief || ""); };
  // ---- OpenAI Realtime: true speech-to-speech (S2S) ----
  const rtSend = (o) => { try { if (TALK && TALK.dc && TALK.dc.readyState === "open") TALK.dc.send(JSON.stringify(o)); } catch (e) {} };
  const CONF = [10, 26, 45, 64, 82, 96];
  const recordStep = async (a, callId) => {
    const stage = Math.max(0, Math.min(5, a.stage || 0));
    if (a.notepad) showNote(a.notepad);
    $$("tfStep").textContent = STEP(stage);
    TALK.stage = stage; if ((a.brief || "").trim()) TALK.brief = a.brief;
    let explanation = "Noted.";
    try {
      if ((a.brief || "").trim() && stage >= 1) {
        const bp = await api("POST", "blueprint", { brief: a.brief, stage, lang: TALK.lang });
        TALK.name = bp.name || TALK.name;
        if (bp.sketch && (bp.sketch.nodes || []).length) renderFlow(bp.sketch);
        const c = CONF[Math.min(stage, 5)]; $$("tfPct").textContent = c + "%"; $$("tfBar").style.width = c + "%";
        explanation = bp.explanation || explanation;
        if (stage >= 4) showBuildBtn();
      }
    } catch (e) {}
    rtSend({ type: "conversation.item.create", item: { type: "function_call_output", call_id: callId, output: JSON.stringify({ explanation }) } });
    rtSend({ type: "response.create" });
  };
  const handleRt = (data) => {
    let ev; try { ev = JSON.parse(data); } catch (e) { return; }
    const t = ev.type || "";
    if (t === "response.function_call_arguments.done") {
      let a = {}; try { a = JSON.parse(ev.arguments || "{}"); } catch (e) {}
      if (ev.name === "record_interview_step") recordStep(a, ev.call_id);
      else { rtSend({ type: "conversation.item.create", item: { type: "function_call_output", call_id: ev.call_id, output: "{}" } }); rtSend({ type: "response.create" }); }
    } else if (t === "response.audio_transcript.done") { if (ev.transcript) updateNow(ev.transcript.trim()); }
  };
  const stopRealtime = () => { try { if (TALK && TALK.stream) TALK.stream.getTracks().forEach(x => x.stop()); } catch (e) {} try { if (TALK && TALK.pc) TALK.pc.close(); } catch (e) {} if (TALK) { TALK.rtLive = false; TALK.pc = null; TALK.dc = null; TALK.stream = null; } $$("tfMic").classList.remove("live"); };
  const startRealtime = async () => {
    if (!TALK || TALK.rtLive || TALK.rtConnecting) return true;
    TALK.rtConnecting = true; setState("thinking", L("Connecting…", "جارٍ الاتصال…")); setStatus(L("Connecting to live voice…", "جارٍ الاتصال بالصوت المباشر…")); $$("tfMic").classList.add("live");
    try {
      // ephemeral session (instructions + tool + voice baked in server-side); browser connects direct to OpenAI
      const s = await api("POST", "realtime-session", {});
      if (!s || !s.value) throw new Error("no session token");
      const pc = new RTCPeerConnection(); TALK.pc = pc;
      pc.ontrack = (e) => { audio.srcObject = e.streams[0]; const p = audio.play && audio.play(); if (p && p.catch) p.catch(() => {}); };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      TALK.stream = stream; stream.getTracks().forEach(tr => pc.addTrack(tr, stream));
      const dc = pc.createDataChannel("oai-events"); TALK.dc = dc;
      dc.onopen = () => rtSend({ type: "response.create", response: { instructions: s.warmup } });  // just the warm-up; config is in the session
      dc.onmessage = (e) => handleRt(e.data);
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const resp = await fetch("https://api.openai.com/v1/realtime/calls?model=" + encodeURIComponent(s.model || "gpt-realtime"), {
        method: "POST", headers: { "Authorization": "Bearer " + s.value, "Content-Type": "application/sdp" }, body: offer.sdp });
      if (!resp.ok) throw new Error("handshake " + resp.status);
      await pc.setRemoteDescription({ type: "answer", sdp: await resp.text() });
      TALK.rtLive = true; TALK.rtConnecting = false;
      setState("live", L("Live — just talk", "مباشر — تحدّث فقط")); setStatus(L("Live voice on — just talk, I'm listening the whole time", "الصوت المباشر يعمل — تحدّث، أنا أستمع طوال الوقت"));
      $$("tfSub").textContent = L("Live conversation — speak naturally", "محادثة مباشرة — تحدّث بطبيعية");
      return true;
    } catch (e) { try { console.error("[realtime]", e); } catch (x) {} TALK.rtConnecting = false; TALK.rt = false; stopRealtime(); return false; }
  };
  const send = async (text) => {
    if (!text || !TALK || TALK.busy) return;
    TALK.busy = true; $$("tfInput").value = ""; setState("thinking", L("Wakeel is thinking…", "وكيل يفكّر…")); $$("tfNowLabel").textContent = L("Wakeel is thinking", "وكيل يفكّر");
    try {
      const r = await api("POST", "talk", { text, state: TALK.state, lang: TALK.lang });
      if (!TALK) return;
      TALK.state = r.state || TALK.state; TALK.phase = r.phase;
      if (r.sketch && (r.sketch.nodes || []).length) renderFlow(r.sketch);
      if (r.notepad) showNote(r.notepad);
      if (typeof r.stage === "number") $$("tfStep").textContent = STEP(r.stage);
      updateNow(r.reply, r.confidence);
      setState("idle", L("Ready when you are", "جاهز متى شئت")); setStatus(supported ? L("Tap the mic and reply", "اضغط الميكروفون وأجب") : L("Type your answer below", "اكتب إجابتك بالأسفل"));
      await speak(r.reply);
      if (!TALK) return;
      if (r.phase === "building" && r.brief) { TALK.cont = false; $$("tfMic").classList.remove("live"); doBuild(r.brief); }
      else if (TALK.cont) setTimeout(() => { if (TALK && TALK.cont && !TALK.busy && !TALK.speaking) listen(); }, 250);
    } catch (e) { updateNow("⚠️ " + (e.message || "error")); setState("idle"); }
    finally { if (TALK) TALK.busy = false; }
  };
  const listen = () => {
    if (!supported || !TALK || TALK.busy || TALK.speaking) return;
    const rec = new SR(); TALK.recog = rec; rec.lang = ar ? "ar-AE" : "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => { setState("listening", L("Listening…", "أستمع…")); setStatus(TALK.cont ? L("Just talk — I'm listening", "تحدّث فقط — أنا أستمع") : L("Listening… speak now", "أستمع… تحدّث الآن")); };
    rec.onresult = (e) => { setState("idle"); send(e.results[0][0].transcript); };
    rec.onerror = () => { if (TALK && TALK.cont && !TALK.busy && !TALK.speaking) setTimeout(() => { if (TALK && TALK.cont && !TALK.busy && !TALK.speaking) listen(); }, 500); else setState("idle"); };
    rec.onend = () => { if (!TALK) return; if (TALK.cont && !TALK.busy && !TALK.speaking) setTimeout(() => { if (TALK && TALK.cont && !TALK.busy && !TALK.speaking) listen(); }, 350); else if (!TALK.cont && $$("tfMic").classList.contains("listening")) setState("idle"); };
    try { rec.start(); } catch (e) {}
  };
  // continuous, hands-free conversation (no tapping per turn)
  const stopCont = () => { if (!TALK) return; TALK.cont = false; try { TALK.recog && TALK.recog.abort(); } catch (e) {} try { audio.pause(); window.speechSynthesis.cancel(); } catch (e) {} TALK.speaking = false; $$("tfMic").classList.remove("live"); setState("idle", L("Paused", "متوقّف")); setStatus(L("Tap the mic to talk again", "اضغط الميكروفون للتحدث مجدداً")); };
  const startCont = async () => {
    if (!TALK) return; TALK.cont = true; $$("tfMic").classList.add("live");
    setStatus(L("Just talk — I'm listening the whole time", "تحدّث فقط — أنا أستمع طوال الوقت"));
    if (!TALK.greeted) { TALK.greeted = true; setState("thinking", L("Speaking…", "أتحدّث…")); await speak(greet); if (!TALK || !TALK.cont) return; }
    listen();
  };
  const toggleMic = async () => {
    if (!TALK) return;
    if (TALK.rtLive) { stopRealtime(); setState("idle", L("Paused", "متوقّف")); setStatus(L("Tap the mic to talk again", "اضغط الميكروفون للتحدث مجدداً")); return; }
    if (TALK.cont) { stopCont(); return; }
    // primary: true speech-to-speech realtime; fall back to continuous voice if it can't connect
    const ok = await startRealtime();
    if (!ok && TALK) { setStatus(L("Live voice unavailable — using continuous voice", "الصوت المباشر غير متاح — أستخدم الصوت المتواصل")); startCont(); }
  };
  $$("tfMic").onclick = toggleMic;
  $$("tfSend").onclick = () => { const v = $$("tfInput").value.trim(); if (v) send(v); };
  $$("tfInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); const v = $$("tfInput").value.trim(); if (v) send(v); } });
  $$("tfClose").onclick = closeTalk;
  $$("tfReset").onclick = () => { closeTalk(); openTalk(); };
  const greet = ar ? "مرحباً، أنا وكيل. خذ نفساً — لا شيء تقني لإعداده. سأرافقك خلال يوم عمل عادي. بماذا أناديك، ودور من نتقمّص اليوم؟" : "Hi, I'm Wakeel. Take a breath—there's nothing technical to set up. I'll simply follow you through a normal workday. What should I call you, and whose role should we step into today?";
  // No auto-greeting sound. Show the text; the voice starts on the first mic press (a real
  // user gesture, so it plays cleanly), then the conversation is continuous — no more tapping.
  updateNow(greet, 0);
  setStatus(supported ? L("Tap the mic once, then just talk — hands-free", "اضغط الميكروفون مرة ثم تحدّث بحرّية — بلا نقر") : L("Type your answer below", "اكتب إجابتك بالأسفل"));
}
function closeTalk() { try { window.speechSynthesis.cancel(); if (TALK && TALK.recog) TALK.recog.abort(); } catch (e) {} const o = document.getElementById("talkOv"); if (o) o.remove(); TALK = null; }
// grow the composer to fit its content (up to a max), then scroll — so long prompts stay readable
function autoGrow(el) {
  if (!el) return;
  el.style.height = "auto";
  const max = Math.round(window.innerHeight * 0.5);
  el.style.height = Math.min(el.scrollHeight, max) + "px";
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
    const s1 = step(refining ? t("Reading your changes") : t("Reading what you need"));
    await sleep(refining ? 300 : 500);
    done(s1, refining ? t("Got it") : t("Understood what you need"));
    const s2 = step(refining ? t("Updating the plan") : t("Planning how your assistant will work"));
    if (!refining) { const t2 = step(t("Working out the steps and the safety rules")); await sleep(650); done(t2, t("Worked out the steps and the safety rules")); }
    try {
      const body = refining
        ? { instruction: LASTDESIGN.instruction, prior: LASTDESIGN.design, changes: text, lang: LANG }
        : { instruction: text, lang: LANG };
      const d = await api("POST", "design", body);
      if (!d.flow || !d.flow.length) { done(s2, t("Couldn't plan that")); THREAD.push({ role: "ai", text: t("I couldn't plan that — try describing the task in a bit more detail.") }); drawThread(); return; }
      done(s2, refining ? t("Updated the plan") : t("Ready — here's my plan"));
      LASTDESIGN = { instruction: LASTDESIGN ? LASTDESIGN.instruction : text, design: d };
      THREAD.push({ role: "design", design: d });
      drawThread();
    } catch (e) { done(s2, "Error"); THREAD.push({ role: "ai", text: "⚠️ " + e.message }); drawThread(); }
  } else {
    const s1 = step(ACTIVE_SKILL ? ACTIVE_SKILL.name : "Thinking");
    try { const r = await api("POST", "chat", { message: text, system: ACTIVE_SKILL ? ACTIVE_SKILL.prompt : "", history: THREAD.filter(m => m.role === "me" || m.role === "ai").map(m => ({ role: m.role === "me" ? "user" : "assistant", content: m.text })) }); done(s1, "Answered"); THREAD.push({ role: "ai", text: r.reply }); drawThread(); }
    catch (e) { done(s1, "Error"); THREAD.push({ role: "ai", text: "⚠️ " + e.message }); drawThread(); }
  }
}

function drawThread() {
  const area = $("#homeArea");
  area.classList.add("has-thread"); // top-align so long proposals are scrollable from the top
  area.innerHTML = `<div class="thread" id="thread"></div>`;
  const th = $("#thread");
  let lastDesignEl = null;
  THREAD.forEach(m => {
    if (m.role === "me") { const d = document.createElement("div"); d.className = "bubble me"; d.textContent = m.text; th.appendChild(d); }
    else if (m.role === "ai") { const d = document.createElement("div"); d.className = "bubble ai"; d.textContent = m.text; th.appendChild(d); }
    else if (m.role === "plan") th.appendChild(planCard(m));
    else if (m.role === "design") { lastDesignEl = designCard(m); th.appendChild(lastDesignEl); }
  });
  const c = document.createElement("div"); c.className = "composer"; c.style.marginTop = "10px";
  c.innerHTML = `<textarea id="ins" rows="1" placeholder="${ACTIVE_SKILL ? esc(ACTIVE_SKILL.ph) : t(LASTDESIGN ? "Reply with any changes, or press Build this agent…" : "Reply to Wakeel…")}"></textarea>
    <div class="composer-foot">${ACTIVE_SKILL ? skillChip() : `<div class="toggle-pill ${BUILD ? "on" : ""}" id="buildToggle"><span class="lm">و</span> ${t("Build agents")}</div>`}<button class="send-btn" id="sendBtn">${IC.up}</button></div>`;
  th.appendChild(c);
  if ($("#buildToggle")) $("#buildToggle").onclick = () => { BUILD = !BUILD; $("#buildToggle").classList.toggle("on", BUILD); };
  wireSkillChip();
  $("#sendBtn").onclick = onSend;
  $("#ins").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } });
  // When the newest item is a design proposal (the approval window), show it from its
  // TOP so it reads top-to-bottom; otherwise follow the conversation to the bottom.
  const last = THREAD[THREAD.length - 1];
  if (last && last.role === "design" && lastDesignEl) {
    requestAnimationFrame(() => {
      const top = lastDesignEl.getBoundingClientRect().top - area.getBoundingClientRect().top + area.scrollTop;
      area.scrollTop = Math.max(0, top - 14);
    });
  } else {
    area.scrollTop = area.scrollHeight; th.scrollTop = th.scrollHeight;
  }
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
  // plain-language "here's what I'll do for you" + INLINE connect (no popup):
  // an expandable connect summary at the top, and a Connect button under each step.
  const pl = d.plain || {};
  const need = neededServices(d);
  const isConn = (s) => CONNECTED.has(s);
  const svcForStep = (text) => { // the service mentioned earliest in the step
    let best = null, at = 1e9;
    need.forEach(s => { const m = (text || "").match(SVC_KEYWORDS[s] || /(?!)/); if (m && m.index < at) { at = m.index; best = s; } });
    return best;
  };
  // one specific button per service — "Connect Google Sheets", "Connect Gmail", …
  const svcBtn = (s) => isConn(s)
    ? `<span class="cn-tag ok">${IC.check} ${esc(s)} ${t("connected")}</span>`
    : `<button class="btn xs cn-inline" data-connect="${esc(s)}"><span class="cn-glg">${L[LOGO_MAP[s]] || IC.plus}</span> ${t("Connect")} ${esc(s)}</button>`;
  // steps that check responses against rules/SOPs also let you UPLOAD the SOP itself
  const DOC_SVCS = new Set(["Google Drive", "Google Docs", "Microsoft SharePoint", "OneDrive"]);
  const isSopStep = (text, svc) => DOC_SVCS.has(svc) || /\bsop\b|policy|policies|\brule|checklist|guideline|instruction/i.test(text || "");
  const sopBtn = () => (d.sop && d.sop.text)
    ? `<span class="cn-tag ok" data-sopview="1" style="cursor:pointer">${IC.check} ${t("Rules uploaded")}: ${esc((d.sop.name || "SOP").slice(0, 28))}</span>`
    : `<button class="btn xs sop-btn" data-sop="1">${IC.upload} ${t("Upload SOP & rules")}</button>`;
  // once a spreadsheet service is connected, point it at the SPECIFIC sheet (paste the link)
  const SHEET_SVCS = new Set(["Google Sheets", "Excel on SharePoint"]);
  const sheetBtn = (s) => !isConn(s) ? "" : ((d.sheet && d.sheet.url)
    ? `<span class="cn-tag ok" data-sheetview="1" style="cursor:pointer">${IC.projects} ${t("Sheet")}: ${esc((d.sheet.title || "linked").slice(0, 24))}</span>`
    : `<button class="btn xs sop-btn" data-sheet="1">${IC.projects} ${t("Link your sheet")}</button>`);
  function connectSummary() {
    if (!need.length && !(d.sop && d.sop.text)) return "";
    const n = need.filter(isConn).length, all = need.length ? n === need.length : true;
    let rows = need.map(s => `<div class="cn-sumrow"><span class="cn-schip ${isConn(s) ? "on" : ""}">${brandLogo(s, 18)}${esc(s)}</span>${svcBtn(s)}</div>`).join("");
    rows += `<div class="cn-sumrow"><span class="cn-schip ${d.sop && d.sop.text ? "on" : ""}">${IC.book} ${t("SOP & rules")}</span>${sopBtn()}</div>`;
    return `<details class="cn-summary" ${all && d.sop && d.sop.text ? "" : "open"}><summary><span class="cn-plug">${IC.integrations}</span>${t("Connect your services")}<span class="cn-count ${all ? "ok" : ""}">${n}/${need.length}</span></summary><div class="cn-sumlist">${rows}</div></details>`;
  }
  function syncPlain() {
    const host = el.querySelector(".ds-plain-host"); if (!host) return;
    host.innerHTML = (pl.steps && pl.steps.length) ? `
      <div class="ds-plain">
        <div class="ds-plain-h"><span class="dpl-badge">${IC.spark}</span><div><div class="dpl-t">${t("Here's what I'll do for you")}</div>${pl.intro ? `<div class="dpl-intro">${esc(pl.intro)}</div>` : ""}</div></div>
        ${connectSummary()}
        <div class="dpl-steps">${pl.steps.map((s, i) => { const svc = svcForStep(s.text); const sop = isSopStep(s.text, svc); const sheet = svc && SHEET_SVCS.has(svc); return `<div class="dpl-step"><span class="dpl-ico">${esc(s.icon || "•")}</span><span class="dpl-n">${i + 1}</span><div class="dpl-body"><span class="dpl-x">${esc(s.text || "")}</span>${(svc || sop) ? `<div class="dpl-cn">${svc ? svcBtn(svc) : ""}${sheet ? sheetBtn(svc) : ""}${sop ? sopBtn() : ""}</div>` : ""}</div></div>`; }).join("")}</div>
        ${pl.reassurance ? `<div class="dpl-safe">${IC.shield} ${esc(pl.reassurance)}</div>` : ""}
      </div>` : "";
    host.querySelectorAll("[data-connect]").forEach(b => b.onclick = () => connectSvc(b.dataset.connect, () => syncPlain()));
    host.querySelectorAll("[data-sop]").forEach(b => b.onclick = () => openSopUpload(d, () => syncPlain()));
    host.querySelectorAll("[data-sopview]").forEach(b => b.onclick = () => openSopUpload(d, () => syncPlain()));
    host.querySelectorAll("[data-sheet],[data-sheetview]").forEach(b => b.onclick = () => openSheetLink(d, () => syncPlain()));
  }
  el.innerHTML = `
    <div class="ds-intro">${t("Here's what I'll set up for your")} <b>${esc(d.name)}</b>${t(". Have a look, and tell me if you'd like anything changed before I build it.")}</div>
    <div class="ds-plain-host"></div>
    <details class="ds-tech"><summary>${IC.flow} ${t("See the technical details")}</summary>
    <div class="ds-summary">${esc(d.summary || "")}</div>
    <div class="ds-sec"><div class="ds-h">${IC.flow} ${t("Flow architecture")}</div>${designDiagram(d.flow)}</div>
    ${nodeTbl}
    ${table}
    ${(d.statuses && d.statuses.length) ? `<div class="ds-sec"><div class="ds-h">${IC.tasks} ${t("Allowed statuses")}</div><div class="ds-chips">${chips(d.statuses)}</div></div>` : ""}
    ${list(t("Triggers"), IC.play, d.triggers)}
    ${list(t("Key design decisions"), IC.spark, d.decisions)}
    ${list(t("Guardrails"), IC.help, d.guardrails)}
    </details>
    <div class="ds-foot">
      <div class="ds-ask">${t("Shall I go ahead and build this agent?")}</div>
      <div class="ds-actions"><button class="btn primary" id="dsBuild">${IC.bolt} ${t("Build this agent")}</button>
        <button class="btn" id="dsTweak">${t("Request changes")}</button></div>
    </div>`;
  syncPlain();
  (async () => { await refreshServices(); syncPlain(); })();
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
    LASTDESIGN = null; THREAD = []; loadAgents();
    // services are connected inline in the proposal (and via the agent-page banner) — no popup
    openAgent(r.id, "flow");
  } catch (e) { const s = step("Error"); done(s, "Error"); btn.disabled = false; btn.innerHTML = `${IC.bolt} Build this agent`; alert(e.message); }
}

/* ---------- Connect your services (one-tap "wow" moment) ---------- */
const SVC_PROVIDER = {
  "Gmail": "google", "Google Sheets": "google", "Google Drive": "google", "Google Docs": "google", "Google Calendar": "google",
  "Microsoft Outlook": "microsoft", "Excel on SharePoint": "microsoft", "Microsoft SharePoint": "microsoft",
  "OneDrive": "microsoft", "Microsoft Teams": "microsoft", "Microsoft Word": "microsoft",
};
const PROVIDER_META = {
  google: { name: "Google", logo: "google", btn: "Continue with Google" },
  microsoft: { name: "Microsoft", logo: "microsoft", btn: "Continue with Microsoft" },
};
const SVC_PURPOSE = {
  "Gmail": "Send outreach emails & read replies", "Google Sheets": "Read & update your registry",
  "Google Drive": "Read your SOPs, policies & templates", "Google Docs": "Read your documents",
  "Google Calendar": "Schedule the daily checks", "Microsoft Outlook": "Send outreach emails & read replies",
  "Excel on SharePoint": "Read & update your registry", "Microsoft SharePoint": "Read your SOPs & templates",
  "OneDrive": "Read your files", "Microsoft Teams": "Post updates for your team", "Slack": "Post updates for your team",
  "Notion": "Read & write pages", "Salesforce": "Read & update records",
};
// keywords that tie a plain-language step to the service it uses
const SVC_KEYWORDS = {
  "Gmail": /gmail|e-?mail|inbox|\brepl(y|ies)|outreach|remind/i,
  "Google Sheets": /sheet|spreadsheet|registry|tracking/i,
  "Google Drive": /drive|\bsop\b|policy|policies|template|instruction|document|checklist|\brule/i,
  "Google Docs": /google doc|\bdoc\b/i,
  "Google Calendar": /calendar/i,
  "Microsoft Outlook": /outlook|e-?mail|inbox|\brepl(y|ies)|outreach|remind/i,
  "Excel on SharePoint": /excel|sheet|spreadsheet|registry|tracking/i,
  "Microsoft SharePoint": /sharepoint|\bsop\b|policy|policies|template|instruction|document|checklist/i,
  "OneDrive": /onedrive/i,
  "Slack": /slack|channel|notify/i,
};
let CONNECTED = new Set();
const GOOGLE_SVCS = new Set(["Gmail", "Google Sheets", "Google Drive", "Google Docs", "Google Calendar"]);
let GOOGLE_CONFIGURED = false;
async function refreshServices() {
  try { const r = await api("GET", "services"); CONNECTED = new Set(r.connected || []); GOOGLE_CONFIGURED = !!r.google_configured; return r; }
  catch (e) { return {}; }
}
// connect ONE specific service. Google services do a REAL OAuth consent (popup);
// others record the link until their real OAuth is wired.
async function connectSvc(service, onDone) {
  const mark = (html) => [...document.querySelectorAll("[data-connect]")].filter(b => b.dataset.connect === service).forEach(b => { b.disabled = true; b.innerHTML = html; });
  if (GOOGLE_SVCS.has(service)) {
    let r; try { r = await api("GET", "oauth/google/start?service=" + encodeURIComponent(service)); } catch (e) { toast(e.message, true); return; }
    if (r.error === "not_configured") { openGoogleSetup(() => connectSvc(service, onDone)); return; }
    if (!r.url) { toast("Couldn't start Google sign-in", true); return; }
    mark(`<span class="spin"></span> ${t("Waiting for Google…")}`);
    const w = window.open(r.url, "wkoauth", "width=520,height=680");
    await waitForConnect(service, w);
    await refreshServices(); onDone && onDone();
    // if Google blocked it (403 not-verified, closed window, etc.), guide the user in plain language
    if (!CONNECTED.has(service)) openConnectHelp(service, () => connectSvc(service, onDone));
  } else {
    mark(`<span class="spin"></span>`);
    await sleep(600); try { await api("POST", "service-connect", { service }); } catch (e) {} CONNECTED.add(service); onDone && onDone();
  }
}
function waitForConnect(service, w) {
  return new Promise(res => {
    let done = false;
    const finish = () => { if (done) return; done = true; window.removeEventListener("message", onMsg); clearInterval(iv); res(); };
    const onMsg = (e) => { if (e.data && e.data.wakeel_oauth) finish(); };
    window.addEventListener("message", onMsg);
    const iv = setInterval(async () => {
      try { const r = await api("GET", "services"); if ((r.connected || []).includes(service)) { CONNECTED = new Set(r.connected || []); finish(); } } catch (e) {}
      if (w && w.closed) setTimeout(finish, 700);
    }, 1500);
    setTimeout(finish, 120000);
  });
}
// one-time in-app Google OAuth setup — a guided step-by-step wizard with deep links
function openGoogleSetup(onSaved) {
  const redirect = location.origin + "/wakeel/api/oauth/google/callback";
  const link = (href, label) => `<a href="${href}" target="_blank" rel="noopener" class="btn xs gs-open">${label} ↗</a>`;
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade gs-modal" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center"><h2 style="flex:1">${IC.lock} Connect your Google — one-time setup</h2><button class="x" id="gsx">×</button></div>
    <p class="page-sub" style="margin-top:-4px"><b>You only do this once.</b> It registers Wakeel with Google (the same one-time step Claude &amp; ChatGPT did for their connectors). After you save it, you and every officer just click <b>Connect → sign in with Google</b> — no setup ever again. Each button below opens the exact Google page.</p>
    <ol class="gs-steps">
      <li><div class="gs-h"><span class="gs-num">1</span><b>Create a project</b></div>
        <div class="gs-d">Name it “Wakeel” and Create.</div>${link("https://console.cloud.google.com/projectcreate", "Open project setup")}</li>
      <li><div class="gs-h"><span class="gs-num">2</span><b>Turn on the 3 APIs</b></div>
        <div class="gs-d">Click each and press <b>Enable</b>:</div>
        <div class="gs-links">${link("https://console.cloud.google.com/apis/library/gmail.googleapis.com", "Enable Gmail")}${link("https://console.cloud.google.com/apis/library/sheets.googleapis.com", "Enable Sheets")}${link("https://console.cloud.google.com/apis/library/drive.googleapis.com", "Enable Drive")}</div></li>
      <li><div class="gs-h"><span class="gs-num">3</span><b>OAuth consent screen</b></div>
        <div class="gs-d">Choose <b>External</b> → fill app name + your email → under <b>Test users</b> add the <b>exact Gmail you'll click “Sign in with Google” with</b> (skip this and Google blocks you with a 403 “not a tester” error), in <b>this same project</b> as your client → Save. <b>Easier:</b> click <b>Publish app</b> here to skip the test-user list entirely (any account works, with a one-time “unverified app → Advanced → Continue” screen).</div>${link("https://console.cloud.google.com/auth/audience", "Open consent screen / Publish")}</li>
      <li><div class="gs-h"><span class="gs-num">4</span><b>Create the OAuth client</b></div>
        <div class="gs-d"><b>Create credentials → OAuth client ID → Web application</b>. Under <b>Authorized redirect URIs</b> add this exact line:</div>
        <div class="gs-copy"><input class="input" id="gsRedir" readonly value="${esc(redirect)}"><button class="btn xs" id="gsCopy">Copy</button></div>
        ${link("https://console.cloud.google.com/apis/credentials", "Open Credentials")}</li>
      <li><div class="gs-h"><span class="gs-num">5</span><b>Paste the two generated values</b></div>
        <div class="gs-d">After Create, Google shows them. The ID ends in <code>.apps.googleusercontent.com</code>; the secret starts with <code>GOCSPX-</code>.</div>
        <div class="field"><label>Client ID</label><input class="input" id="gsCid" placeholder="123…-abc.apps.googleusercontent.com"></div>
        <div class="field"><label>Client secret</label><input class="input" id="gsSec" type="password" placeholder="GOCSPX-…"></div></li>
    </ol>
    <button class="btn primary block" id="gsSave">${IC.check} Save &amp; connect</button>
    <div class="err" id="gsErr"></div></div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#gsx").onclick = () => d.remove();
  const copyRedir = () => { const i = $("#gsRedir"); i.select(); try { document.execCommand("copy"); } catch (e) {} toast("Redirect URI copied"); };
  $("#gsCopy").onclick = copyRedir; $("#gsRedir").onclick = copyRedir;
  $("#gsSave").onclick = async () => {
    const cid = $("#gsCid").value.trim(), sec = $("#gsSec").value.trim();
    if (!cid) { $("#gsErr").textContent = "Paste the Client ID from step 5."; return; }
    if (cid.includes("@") || !cid.endsWith(".apps.googleusercontent.com")) {
      $("#gsErr").textContent = "That's not a Client ID. It must end with .apps.googleusercontent.com (generated in step 4 — not your email).";
      return;
    }
    if (sec && !/^GOCSPX-/.test(sec)) { $("#gsErr").textContent = "The Client secret usually starts with GOCSPX- — check you copied the secret, not the ID."; return; }
    $("#gsSave").disabled = true; $("#gsErr").textContent = "";
    try { await api("POST", "oauth/config", { client_id: cid, client_secret: sec }); await refreshServices(); d.remove(); toast("Google setup saved — signing in…"); onSaved && onSaved(); }
    catch (e) { $("#gsErr").textContent = e.message; $("#gsSave").disabled = false; }
  };
}
// plain-language help when Google blocks the sign-in — for non-technical users
function openConnectHelp(service, retry) {
  const gopen = (label) => `<a class="btn xs gs-open" href="https://console.cloud.google.com/auth/audience" target="_blank" rel="noopener">${label} ↗</a>`;
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:520px" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center"><h2 style="flex:1">${IC.help} ${t("Google didn't finish connecting")}</h2><button class="x" id="chx">×</button></div>
    <p class="page-sub" style="margin-top:-4px">${t("No problem — this is almost always a one-time Google setting, not a Wakeel issue. Pick what you saw on the Google screen:")}</p>
    <div class="ch-list">
      <div class="ch-item"><div class="ch-t">🔒 ${t("“App isn’t verified” or “you’re not a tester”")} <span class="ch-code">Error 403</span></div>
        <div class="ch-d">${t("Google is only letting approved people in. The easiest fix: open your Google settings and click")} <b>${t("Publish app")}</b> ${t("— then anyone can sign in. (Or add your email under")} <b>${t("Test users")}</b>${t(".)")}</div>
        ${gopen(t("Open Google settings"))}</div>
      <div class="ch-item"><div class="ch-t">⚠️ ${t("“invalid_client” or “missing project id”")}</div>
        <div class="ch-d">${t("The Client ID or secret was wrong. Re-enter them from Google → Credentials.")}</div>
        <button class="btn xs" id="chReenter">${t("Re-enter credentials")}</button></div>
      <div class="ch-item"><div class="ch-t">🔁 ${t("“500. That’s an error” (a Google hiccup)")}</div>
        <div class="ch-d">${t("Usually temporary — often right after publishing. Wait a minute and press Try again. If it keeps happening, set your app back to")} <b>${t("Testing")}</b> ${t("and add your email under")} <b>${t("Test users")}</b> ${t("— that’s the most reliable setup for Gmail/Drive access.")}</div>
        ${gopen(t("Open Google settings"))}</div>
      <div class="ch-item"><div class="ch-t">↩️ ${t("I closed the window by mistake")}</div>
        <div class="ch-d">${t("Nothing’s wrong — just try again below.")}</div></div>
    </div>
    <button class="btn primary block" id="chRetry">${IC.play} ${t("Try connecting again")}</button></div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#chx").onclick = () => d.remove();
  $("#chReenter").onclick = () => { d.remove(); openGoogleSetup(() => retry && retry()); };
  $("#chRetry").onclick = () => { d.remove(); retry && retry(); };
}

// upload the SOP / rules the agent must evaluate responses against (real policy text)
function openSopUpload(d, onDone) {
  const cur = d.sop || {};
  const back = document.createElement("div"); back.className = "modal-back";
  back.innerHTML = `<div class="modal fade" style="width:560px" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center"><h2 style="flex:1">${IC.book} ${t("Upload SOP & rules")}</h2><button class="x" id="spx">×</button></div>
    <p class="page-sub" style="margin-top:-4px">${t("Give the agent the actual policy it must check responses against — upload a file or paste the rules. The agent will quote these exact rules when it flags a gap.")}</p>
    <div class="sop-drop" id="spDrop">${IC.upload}<div><b>${t("Choose a file")}</b> <span style="color:var(--muted-2)">${t("or drag it here")}</span><div class="sop-hint">${t(".txt, .md, .csv — or just paste below")}</div></div></div>
    <input type="file" id="spFile" accept=".txt,.md,.markdown,.csv,.json,.text" hidden>
    <div class="field"><label>${t("SOP name")}</label><input class="input" id="spName" value="${esc(cur.name || "Emiratization SOP & rules")}"></div>
    <div class="field"><label>${t("Rules / SOP text")}</label><textarea class="input" id="spText" rows="9" placeholder="${t("Paste the SOP or the checklist of rules the agent must evaluate against…")}">${esc(cur.text || "")}</textarea></div>
    <button class="btn primary block" id="spSave">${IC.check} ${t("Save rules")}</button>
    <div class="err" id="spErr"></div></div>`;
  document.body.appendChild(back); back.onclick = () => back.remove(); $("#spx").onclick = () => back.remove();
  const drop = $("#spDrop"), file = $("#spFile");
  const readFile = (f) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { $("#spErr").textContent = "File too large (max 2 MB) — paste the text instead."; return; }
    const r = new FileReader();
    r.onload = () => { $("#spText").value = String(r.result || "").slice(0, 20000); if (!$("#spName").value.trim()) $("#spName").value = f.name.replace(/\.[^.]+$/, ""); $("#spErr").textContent = ""; };
    r.readAsText(f);
  };
  drop.onclick = () => file.click();
  file.onchange = () => readFile(file.files[0]);
  ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) readFile(f); });
  $("#spSave").onclick = async () => {
    const name = $("#spName").value.trim() || "SOP & rules", text = $("#spText").value.trim();
    if (!text) { $("#spErr").textContent = "Paste or upload the SOP text first."; return; }
    $("#spSave").disabled = true;
    d.sop = { name, text };
    try { await api("POST", "sop-save", { key: d.name || name, name, text }); } catch (e) {}
    back.remove(); toast("Rules saved — the agent will evaluate against them"); onDone && onDone();
  };
}

// point the agent at the SPECIFIC Google Sheet and read it LIVE (real rows)
function openSheetLink(d, onDone) {
  const cur = d.sheet || {};
  const back = document.createElement("div"); back.className = "modal-back";
  back.innerHTML = `<div class="modal fade" style="width:620px" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center"><h2 style="flex:1">${IC.projects} ${t("Link your registry sheet")}</h2><button class="x" id="shx">×</button></div>
    <p class="page-sub" style="margin-top:-4px">${t("Paste the link to your Google Sheet (the business registry). Wakeel reads it live with the Google access you connected — no upload, no copy.")}</p>
    <div class="field"><label>${t("Google Sheet link")}</label>
      <div class="gs-copy"><input class="input" id="shUrl" value="${esc(cur.url || "")}" placeholder="https://docs.google.com/spreadsheets/d/…"><button class="btn" id="shRead">${IC.search} ${t("Read it")}</button></div></div>
    <div id="shPreview"></div>
    <div class="err" id="shErr"></div></div>`;
  document.body.appendChild(back); back.onclick = () => back.remove(); $("#shx").onclick = () => back.remove();
  const doRead = async () => {
    const url = $("#shUrl").value.trim(); if (!url) { $("#shErr").textContent = "Paste your Google Sheet link first."; return; }
    $("#shErr").textContent = ""; $("#shRead").disabled = true; $("#shRead").innerHTML = `<span class="spin"></span> ${t("Reading…")}`;
    $("#shPreview").innerHTML = `<div class="empty-mini" style="padding:14px">${t("Opening your sheet…")}</div>`;
    try {
      const r = await api("POST", "sheets-read", { url });
      $("#shRead").disabled = false; $("#shRead").innerHTML = `${IC.search} ${t("Read it")}`;
      if (!r.ok) { $("#shPreview").innerHTML = ""; $("#shErr").textContent = r.error || "Couldn't read that sheet."; return; }
      const cols = r.columns || [], rows = r.rows || [];
      $("#shPreview").innerHTML = `
        <div class="sh-head">${IC.check} <b>${esc(r.sheet_title || "Sheet")}</b> <span>· ${t("tab")} ${esc(r.tab || "")} · <b>${r.total}</b> ${t("rows")}</span></div>
        <div class="sh-tblwrap"><table class="sh-tbl"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map(row => `<tr>${cols.map((_, i) => `<td>${esc((row[i] != null ? String(row[i]) : "")).slice(0, 40)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <div class="sh-note">${t("Showing the first")} ${rows.length} ${t("of")} ${r.total} ${t("rows — read live from your Google account.")}</div>
        <button class="btn primary block" id="shUse" style="margin-top:12px">${IC.check} ${t("Use this sheet")}</button>`;
      $("#shUse").onclick = () => { d.sheet = { url: r.url, title: r.sheet_title, tab: r.tab, columns: cols }; back.remove(); toast("Registry sheet linked"); onDone && onDone(); };
    } catch (e) { $("#shRead").disabled = false; $("#shRead").innerHTML = `${IC.search} ${t("Read it")}`; $("#shErr").textContent = e.message; $("#shPreview").innerHTML = ""; }
  };
  $("#shRead").onclick = doRead;
  $("#shUrl").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); doRead(); } });
  setTimeout(() => $("#shUrl").focus(), 60);
}

// figure out exactly which real services an agent design needs (skip AI models)
function neededServices(d) {
  const known = Object.keys(LOGO_MAP);
  const models = new Set(["OpenAI", "Azure OpenAI", "Anthropic Claude", "Google Gemini", "Ollama (local)", "vLLM", "Microsoft Graph", "Microsoft Entra ID"]);
  const found = [];
  (d.flow || []).forEach(n => { const s = (n.integration || "").trim(); if (known.includes(s) && !models.has(s) && !found.includes(s)) found.push(s); });
  const txt = JSON.stringify(d);
  known.forEach(s => { if (models.has(s) || found.includes(s)) return; if (txt.includes('"' + s + '"') || txt.includes(s)) found.push(s); });
  return found;
}
// detect services a BUILT agent needs by scanning its node titles/prompts/graph
function neededServicesFromInfo(info) {
  const models = new Set(["OpenAI", "Azure OpenAI", "Anthropic Claude", "Google Gemini", "Ollama (local)", "vLLM", "Microsoft Graph", "Microsoft Entra ID"]);
  const txt = JSON.stringify(info || {});
  const found = [];
  Object.keys(LOGO_MAP).forEach(s => {
    if (models.has(s) || found.includes(s)) return;
    const re = new RegExp("\\b" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (re.test(txt)) found.push(s);
  });
  return found;
}
// persistent, discoverable connect prompt on an agent's page
async function maybeShowConnectBanner(info, agentName) {
  const need = neededServicesFromInfo(info);
  if (!need.length) return;
  let connected = []; try { const r = await api("GET", "services"); connected = r.connected || []; } catch (e) {}
  const missing = need.filter(s => !connected.includes(s));
  const wrap = $("#flowWrap"); if (!wrap) return;
  const done = !missing.length;
  const bar = document.createElement("div"); bar.className = "connect-banner" + (done ? " done" : "");
  bar.innerHTML = `<div class="cb-l">${done ? IC.check : IC.integrations}<div><b>${done ? t("All services connected") : t("Connect this agent to its services")}</b><span>${done ? t("This agent can reach everything it needs.") : t("It needs") + " " + need.map(esc).join(", ") + " " + t("to run.")}</span></div></div>
    <div class="cb-logos">${need.map(s => `<span class="cb-lg ${connected.includes(s) ? "on" : ""}">${brandLogo(s, 24)}</span>`).join("")}</div>
    ${done ? "" : `<button class="btn primary sm" id="cbConnect">${IC.play} ${t("Connect")}</button>`}`;
  wrap.parentNode.insertBefore(bar, wrap);
  if (!done) $("#cbConnect").onclick = async () => {
    const btn = $("#cbConnect"); btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${t("Signing in")}…`;
    for (const s of missing) { await connectSvc(s, () => {}); }
    viewAgent();
  };
}
async function openConnectServices(services, agentName, onDone) {
  services = Array.from(new Set(services || []));
  if (!services.length) { onDone && onDone(); return; }
  try { const r = await api("GET", "services"); CONNECTED = new Set(r.connected || []); } catch (e) { CONNECTED = new Set(); }
  const groups = {}, standalone = [];
  services.forEach(s => { const p = SVC_PROVIDER[s]; if (p) (groups[p] = groups[p] || []).push(s); else standalone.push(s); });
  const allOn = () => services.every(s => CONNECTED.has(s));
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade connect-modal" onclick="event.stopPropagation()">
    <button class="x" id="cnx">×</button>
    <div class="cn-hero" id="cnHero"></div>
    <div class="cn-body" id="cnBody"></div>
    <div class="cn-foot"><button class="btn ghost sm" id="cnSkip">${t("Skip for now")}</button>
      <button class="btn primary" id="cnStart" disabled>${IC.play} ${t("Start using")} ${esc(agentName)}</button></div>
  </div>`;
  document.body.appendChild(d);
  const close = (cb) => { d.remove(); if (cb) onDone && onDone(); };
  $("#cnx").onclick = () => close(true);
  $("#cnSkip").onclick = () => close(true);
  $("#cnStart").onclick = () => close(true);

  function render() {
    const on = allOn();
    $("#cnHero").innerHTML = on
      ? `<div class="cn-badge ok">${IC.check}</div><div class="cn-h">${t("You're all set! 🎉")}</div><div class="cn-sub">${esc(agentName)} ${t("can now reach everything it needs — switch it on.")}</div>`
      : `<div class="cn-badge">✨</div><div class="cn-h">${t("One tap and it's live")}</div><div class="cn-sub">${esc(agentName)} ${t("just needs to reach these services. Sign in once and you're connected.")}</div>`;
    let html = "";
    Object.keys(groups).forEach(p => {
      const meta = PROVIDER_META[p], svcs = groups[p], gdone = svcs.every(s => CONNECTED.has(s));
      html += `<div class="cn-group">
        <div class="cn-svcs">${svcs.map(s => cnRow(s)).join("")}</div>
        ${gdone ? `<div class="cn-connected">${IC.check} ${t("Connected with")} ${meta.name}</div>`
          : `<button class="btn cn-oauth" data-grp="${p}"><span class="cn-glogo">${L[meta.logo]}</span> ${t(meta.btn)}</button>`}
      </div>`;
    });
    standalone.forEach(s => {
      html += `<div class="cn-group"><div class="cn-svcs">${cnRow(s, true)}</div></div>`;
    });
    html += `<div class="cn-note">${IC.lock} ${t("Secure sign-in — Wakeel only gets the access this assistant needs, and you can disconnect anytime.")}</div>`;
    $("#cnBody").innerHTML = html;
    $("#cnBody").querySelectorAll("[data-grp]").forEach(b => b.onclick = () => connectGroup(b.dataset.grp, b));
    $("#cnBody").querySelectorAll("[data-one]").forEach(b => b.onclick = () => connectOne(b.dataset.one, b));
    $("#cnStart").disabled = !on;
    if (on) { $("#cnStart").classList.add("pulse"); d.querySelector(".connect-modal").classList.add("celebrate"); }
  }
  function cnRow(s, withBtn) {
    const done = CONNECTED.has(s);
    return `<div class="cn-svc ${done ? "done" : ""}" data-svc="${esc(s)}">
      ${brandLogo(s, 34)}<div class="cn-si"><div class="cn-sn">${esc(s)}</div><div class="cn-sp">${esc(SVC_PURPOSE[s] || t("Connect this service"))}</div></div>
      ${done ? `<span class="cn-check">${IC.check}</span>`
        : withBtn ? `<button class="btn sm" data-one="${esc(s)}">${t("Connect")}</button>` : `<span class="cn-check pend"></span>`}</div>`;
  }
  async function connectGroup(p, btn) {
    const meta = PROVIDER_META[p];
    btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${t("Signing in to")} ${meta.name}…`;
    await sleep(1000); // the (simulated) single consent screen
    for (const s of groups[p]) {
      try { await api("POST", "service-connect", { service: s }); } catch (e) {}
      CONNECTED.add(s);
      const row = [...$("#cnBody").querySelectorAll(".cn-svc")].find(r => r.dataset.svc === s);
      if (row) { row.classList.add("done"); const c = row.querySelector(".cn-check"); if (c) { c.classList.remove("pend"); c.innerHTML = IC.check; } }
      await sleep(320);
    }
    render();
  }
  async function connectOne(s, btn) {
    btn.disabled = true; btn.innerHTML = `<span class="spin"></span>`;
    await sleep(700);
    try { await api("POST", "service-connect", { service: s }); } catch (e) {}
    CONNECTED.add(s); render();
  }
  render();
}

/* ---------- AGENT / FLOW ---------- */
function openAgent(id, sub) { LASTDESIGN = null; AGENT = id; ASUB = sub || "overview"; VIEW = "agent"; COPILOT = (sub && sub !== "overview"); CFGNODE = null; location.hash = "agent/" + id; renderShell(); }

const ATABS = [["overview", "Overview"], ["flow", "Flow"], ["triggers", "Triggers"], ["automation", "Automation"], ["records", "Records"], ["evaluate", "Evaluate"], ["memory", "Memory"], ["governance", "Governance"], ["instructions", "Instructions"]];
async function viewAgent() {
  const app = APPS.find(a => a.id === AGENT) || { name: "Agent" };
  const cur = ASUB === "config" ? "flow" : ASUB;
  $("#mainCol").innerHTML = `
    <div class="topbar"><div class="crumbs"><b>${esc(app.name)}</b></div>
      <div class="agent-tabs">${ATABS.map(([id, l]) => `<button class="${cur === id ? "active" : ""}" data-s="${id}">${t(l)}</button>`).join("")}</div>
      <div class="top-actions"><button class="icn-btn" id="copToggle" title="Copilot">${IC.chat}</button></div></div>
    <div class="flow-wrap" id="flowWrap"><div class="empty-state"><div class="spin" style="margin:0 auto"></div></div></div>`;
  // Switching tabs re-renders the shell so the Build Assistant panel shows beside
  // editable tabs (flow/triggers/…) and hides on Overview. renderShell() re-runs viewAgent().
  document.querySelectorAll(".agent-tabs button").forEach(b => b.onclick = () => { ASUB = b.dataset.s; CFGNODE = null; renderShell(); });
  $("#copToggle").onclick = () => { COP_HIDDEN = !COP_HIDDEN; renderShell(); };
  try {
    const info = await api("GET", "app-info?id=" + AGENT);
    window.__agentInfo = info;
    if (ASUB === "overview") renderOverview(info);
    else if (ASUB === "triggers") renderTriggers(info);
    else if (ASUB === "automation") renderAutomation(info);
    else if (ASUB === "records") renderRecords(info);
    else if (ASUB === "evaluate") renderEvaluate(info);
    else if (ASUB === "memory") renderMemory(info);
    else if (ASUB === "governance") renderGovernance(info);
    else if (ASUB === "instructions") renderInstructions(info);
    else if (ASUB === "simple") renderFlowStudio(info); // legacy alias → the (already simple) Railway flow
    else renderFlowStudio(info); // default "flow" = the real Dify diagram, cleaned, + chatbot
    // show a persistent "connect your services" prompt on the flow view
    if (ASUB === "flow" || ASUB === "config" || ASUB === "simple") maybeShowConnectBanner(info, app.name);
  } catch (e) { $("#flowWrap").innerHTML = `<div class="empty-state">⚠️ ${esc(e.message)}</div>`; }
}

function renderTriggers(info) {
  $("#flowWrap").innerHTML = `<div class="content"><div class="pad">
    <h1 class="page-h">${t("Run & triggers")}</h1><p class="page-sub">${t("Run the agent yourself now — or set it to run automatically.")}</p>
    <div class="run-hero">
      <div class="rh-ic">${IC.play}</div>
      <div style="flex:1;min-width:0"><h2>${t("Run it now")}</h2><p>${t("Give the agent an input and watch it work — the simplest way to use it.")}</p></div>
      <button class="btn primary" id="trRunNow">${IC.play} ${t("Run now")}</button>
    </div>
    <div class="side-sub" style="padding-inline:0;margin-top:26px">${t("Run automatically")}</div>
    <div class="grid">
      <div class="gcard" id="trM365"><div style="display:flex;align-items:center;gap:11px;margin-bottom:2px">${brandLogo("Power Automate", 36)}<h3 style="margin:0">Microsoft 365 <span class="st-pill ok">${t("Recommended")}</span></h3></div><p>${t("When a new email or row arrives, or on a daily schedule. One Microsoft sign-in and it runs itself.")}</p><div class="foot"><span></span><button class="btn primary sm">${t("Connect Microsoft 365")}</button></div></div>
      <div class="gcard" id="trSchedule"><div class="ic">${IC.tasks}</div><h3>${t("On a schedule")}</h3><p>${t("Run every day at 08:00 — or your own timer.")}</p><div class="foot"><span></span><button class="btn sm">${t("Set schedule")}</button></div></div>
      <div class="gcard" id="trWebhook"><div class="ic">${IC.integrations}</div><h3>${t("From another system")}</h3><p>${t("Trigger from any system with a secure URL and key.")}</p><div class="foot"><span></span><button class="btn sm">${t("Get URL")}</button></div></div>
    </div>
    <div id="trPanel" style="margin-top:20px"></div>
  </div></div>`;
  $("#trRunNow").onclick = () => runNowModal(info);
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

/* Overview = the plain-language agent dashboard: what it can access, what it did
   today, what's planned, and what needs the officer's approval. */
function renderOverview(info) {
  const url = localStorage.getItem("wk_sheet_" + AGENT) || "";
  $("#flowWrap").innerHTML = `<div class="content"><div class="pad" style="max-width:920px">
    <h1 class="page-h">${esc(info.name || "Your assistant")}</h1>
    <p class="page-sub">${t("A simple picture of what this assistant can touch, what it has done, and what it needs from you.")}</p>
    <div id="ovBody"><div class="empty-mini" style="padding:20px">${t("Loading…")}</div></div>
  </div></div>`;
  const sec = (icon, title, sub) => `<div class="ov-sec-h">${icon}<div><div class="ov-t">${title}</div>${sub ? `<div class="ov-sub">${sub}</div>` : ""}</div></div>`;
  api("POST", "agent-overview", { app_id: AGENT, url }).then(d => {
    const a = d.access || { services: [], files: [] };
    const list = (arr, cls) => arr.map(x => `<div class="ov-item ${cls || ""}"><span class="ov-ic">${x.icon}</span><div class="ov-x"><div class="ov-lab">${esc(x.label || x.text)}${x.count != null ? ` <span class="ov-badge">${x.count}</span>` : ""}</div>${x.examples && x.examples.length ? `<div class="ov-ex">${x.examples.map(esc).join(" · ")}</div>` : ""}</div></div>`).join("");
    $("#ovBody").innerHTML = `
      <div class="ov-card access">
        ${sec(IC.lock, t("1 · What it can access"), t("These are the only things this assistant can reach — nothing else."))}
        <div class="ov-chips">${a.services.map(s => `<span class="ov-chip on">${IC.check} ${esc(s)}</span>`).join("") || `<span class="ov-chip">${t("Not connected yet")}</span>`}</div>
        ${a.files && a.files.length ? `<div class="ov-files">${a.files.map(f => `<div class="ov-file"><span class="ov-fic">${f.icon}</span><div><div class="ov-fn">${esc(f.name)}</div><div class="ov-fd">${esc(f.detail || "")}</div></div></div>`).join("")}</div>` : ""}
      </div>

      ${d.needs_sheet ? `<div class="ov-card"><div class="ov-linkrow">${IC.projects} <div style="flex:1"><b>${t("Link your registry sheet")}</b><div class="ov-sub">${t("So it can show what it did, what's planned and what needs your approval.")}</div></div><button class="btn primary sm" id="ovLink">${t("Link sheet")}</button></div></div>` : `
      <div class="ov-grid">
        <div class="ov-card">
          ${sec(IC.check, t("2 · What it did today"))}
          <div class="ov-items">${d.did_today && d.did_today.length ? list(d.did_today) : `<div class="ov-empty">${t("Nothing yet today.")}</div>`}</div>
          ${d.done_count ? `<div class="ov-done">${IC.check} ${d.done_count} ${t("businesses fully completed")}</div>` : ""}
        </div>
        <div class="ov-card">
          ${sec(IC.tasks, t("3 · What's planned"))}
          <div class="ov-items">${d.planned && d.planned.length ? list(d.planned) : `<div class="ov-empty">${t("Nothing waiting right now.")}</div>`}</div>
        </div>
      </div>

      <div class="ov-card approvals">
        ${sec(IC.thumb, t("4 · Approvals you need to give"), t("The assistant prepared these and is waiting for your OK before it acts."))}
        <div class="ov-items">${d.approvals && d.approvals.length ? list(d.approvals, "appr") : `<div class="ov-empty">${t("Nothing needs your approval right now. 🎉")}</div>`}</div>
        ${d.approvals && d.approvals.length ? `<div class="ov-cta"><button class="btn primary" id="ovReview">${IC.play} ${t("Review & approve")}</button><span class="ov-note">${t("Opens each item so you can send or update with one tap.")}</span></div>` : ""}
      </div>`}`;
    if ($("#ovReview")) $("#ovReview").onclick = () => openReviewQueue(info);
    if ($("#ovLink")) $("#ovLink").onclick = () => { const ph = { name: info.name }; openSheetLink(ph, () => { if (ph.sheet && ph.sheet.url) localStorage.setItem("wk_sheet_" + AGENT, ph.sheet.url); renderOverview(info); }); };
  }).catch(e => { $("#ovBody").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; });
}

// map a Dify node type/data to a Wakeel display node (Beam-like)
const NODE_KIND = {
  start: { icon: "📥", acc: "green", type: "Trigger" },
  "question-classifier": { icon: "🔀", acc: "gold", type: "Router" },
  "if-else": { icon: "🔀", acc: "gold", type: "Decision" },
  llm: { icon: "🤖", acc: "purple", type: "AI step" },
  agent: { icon: "🤖", acc: "purple", type: "AI agent" },
  tool: { icon: "🔧", acc: "blue", type: "Tool" },
  "http-request": { icon: "🌐", acc: "blue", type: "Request" },
  code: { icon: "💻", acc: "amber", type: "Code" },
  "knowledge-retrieval": { icon: "📚", acc: "blue", type: "Knowledge" },
  "template-transform": { icon: "🧩", acc: "amber", type: "Format" },
  "variable-assigner": { icon: "🔗", acc: "amber", type: "Variables" },
  "variable-aggregator": { icon: "🔗", acc: "amber", type: "Variables" },
  "parameter-extractor": { icon: "🔍", acc: "blue", type: "Extract" },
  iteration: { icon: "🔁", acc: "purple", type: "Loop" },
  loop: { icon: "🔁", acc: "purple", type: "Loop" },
  "answer": { icon: "✅", acc: "green", type: "Reply" },
  "end": { icon: "✅", acc: "green", type: "End" },
  // voice "kinds" (so the same Flow diagram renders the live sketch during Talk)
  trigger: { icon: "📥", acc: "green", type: "Trigger" },
  knowledge: { icon: "📚", acc: "blue", type: "Knowledge" },
  decision: { icon: "🔀", acc: "gold", type: "Decision" },
  guardrail: { icon: "🛡️", acc: "amber", type: "Guardrail" },
  approval: { icon: "🙋", acc: "red", type: "Approval" },
  output: { icon: "✅", acc: "green", type: "Result" },
};
function dfKind(t) { return NODE_KIND[t] || { icon: "●", acc: "blue", type: (t || "Step").replace(/-/g, " ") }; }
// Railway-style card colors per accent
const ACC_COLOR = { green: "#3ee08a", gold: "#e6b02e", purple: "#a78bfa", blue: "#63a0e6", amber: "#e0a33a", red: "#ec6a6a", teal: "#19c07d" };
function rfStatus(meta, d) {
  let sc = "green";
  if (meta.acc === "red") sc = "red"; else if (meta.acc === "gold" || meta.acc === "amber") sc = "amber";
  const txt = (d.desc || "").trim();
  return { sc, txt: txt ? (txt.length > 46 ? txt.slice(0, 44) + "…" : txt) : meta.type };
}
// canvas control icons (stroke, inherit color)
const SVGI = {
  plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  target: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  expand: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
};
// Railway-style flow: our own SVG/CSS renderer (no library). Draws the agent's
// real graph as service cards + dashed connectors on a dot-grid, with pan/zoom.
const RF_W = 238;
function buildRailwayFlow(stageId, worldId, wiresId, graph) {
  const stage = document.getElementById(stageId), world = document.getElementById(worldId), wires = document.getElementById(wiresId);
  if (!stage || !world || !wires) return { fit() {}, zoom() {} };
  Array.from(world.querySelectorAll(".rf-node,.rf-wlabel")).forEach(n => n.remove());
  wires.innerHTML = "";
  const isNested = (n) => { const d = n.data || {}; return !!(n.parentId || d.isInIteration || d.isInLoop || d.iteration_id || d.loop_id); };
  const nodes = (graph.nodes || []).filter(n => !isNested(n));
  const idset = new Set(nodes.map(n => n.id));
  const edges = (graph.edges || []).filter(e => idset.has(e.source) && idset.has(e.target));
  // layered (longest-path) layout — guarantees no overlap, clean left-to-right tree
  const rank = {}; nodes.forEach(n => rank[n.id] = 0);
  let ch = true, guard = 0;
  while (ch && guard++ < 400) { ch = false; edges.forEach(e => { if (rank[e.target] < rank[e.source] + 1) { rank[e.target] = rank[e.source] + 1; ch = true; } }); }
  const cols = {}; nodes.forEach(n => { (cols[rank[n.id]] = cols[rank[n.id]] || []).push(n); });
  const COLW = 300, ROWH = 152, PADX = 48, PADY = 56;
  const maxRows = Math.max(1, ...Object.values(cols).map(a => a.length));
  const pos = {};
  Object.keys(cols).forEach(r => {
    const arr = cols[r]; const off = PADY + (maxRows * ROWH - arr.length * ROWH) / 2;
    arr.forEach((n, i) => { pos[n.id] = { x: PADX + r * COLW, y: off + i * ROWH }; });
  });
  const nodeH = {};
  nodes.forEach(n => {
    const d = n.data || {}; const meta = dfKind(d.type || "");
    const title = d.title || d.type || "Step"; const s = rfStatus(meta, d);
    const dotAcc = s.sc === "red" ? "red" : s.sc === "amber" ? "gold" : "green";
    const el = document.createElement("div"); el.className = "rf-node";
    el.style.left = pos[n.id].x + "px"; el.style.top = pos[n.id].y + "px";
    el.innerHTML = `<span class="accent" style="background:${ACC_COLOR[meta.acc] || "#63a0e6"}"></span>
      <div class="body"><div class="type">${esc(meta.type)}</div>
      <div class="title"><span class="ic">${meta.icon}</span>${esc(title)}</div>
      <div class="status"><span class="dot" style="background:${ACC_COLOR[dotAcc]}"></span>${esc(s.txt)}</div></div>`;
    world.appendChild(el); nodeH[n.id] = el.offsetHeight || 84;
  });
  const NS = "http://www.w3.org/2000/svg";
  function pathd(s, t) {
    const sx = pos[s].x + RF_W, sy = pos[s].y + nodeH[s] / 2, tx = pos[t].x, ty = pos[t].y + nodeH[t] / 2;
    if (tx <= sx) { const my = (sy + ty) / 2; return `M ${sx} ${sy} L ${sx + 18} ${sy} L ${sx + 18} ${my} L ${tx - 18} ${my} L ${tx - 18} ${ty} L ${tx} ${ty}`; }
    const r = 13, mx = Math.round((sx + tx) / 2), vd = ty > sy ? 1 : -1;
    if (Math.abs(ty - sy) < 2) return `M ${sx} ${sy} L ${tx} ${ty}`;
    return `M ${sx} ${sy} L ${mx - r} ${sy} Q ${mx} ${sy} ${mx} ${sy + vd * r} L ${mx} ${ty - vd * r} Q ${mx} ${ty} ${mx + r} ${ty} L ${tx} ${ty}`;
  }
  function elabel(h) { if (!h) return ""; const m = String(h).toLowerCase(); if (m === "true" || m === "yes") return "Yes"; if (m === "false" || m === "no") return "No"; if (/^[a-z0-9 _-]{1,14}$/i.test(h) && !/^[0-9a-f]{8}/i.test(h)) return h; return ""; }
  edges.forEach(e => {
    const p = document.createElementNS(NS, "path"); p.setAttribute("d", pathd(e.source, e.target)); p.setAttribute("class", "rf-wire flow"); wires.appendChild(p);
    const lab = elabel(e.sourceHandle);
    if (lab) {
      const sx = pos[e.source].x + RF_W, tx = pos[e.target].x, mx = (sx + tx) / 2, my = (pos[e.source].y + nodeH[e.source] / 2 + pos[e.target].y + nodeH[e.target] / 2) / 2;
      const el = document.createElement("div"); el.className = "rf-wlabel"; el.textContent = lab; el.style.left = mx + "px"; el.style.top = my + "px"; world.appendChild(el);
    }
  });
  let scale = .8, tx = 0, ty = 0;
  const apply = () => { world.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`; };
  function fit() {
    if (!nodes.length) return;
    let a = 1e9, b = 1e9, c = -1e9, dd = -1e9;
    nodes.forEach(n => { a = Math.min(a, pos[n.id].x); b = Math.min(b, pos[n.id].y); c = Math.max(c, pos[n.id].x + RF_W); dd = Math.max(dd, pos[n.id].y + nodeH[n.id]); });
    a -= 44; b -= 50; c += 44; dd += 40;
    const vw = stage.clientWidth, vh = stage.clientHeight;
    scale = Math.max(.3, Math.min(vw / (c - a), vh / (dd - b), 1.1));
    tx = (vw - (c - a) * scale) / 2 - a * scale; ty = (vh - (dd - b) * scale) / 2 - b * scale; apply();
  }
  // start zoomed in on the first column (readable), left-aligned & vertically centered
  function initial() {
    if (!nodes.length) return;
    scale = 1.1;
    const first = cols[Object.keys(cols).map(Number).sort((a, b) => a - b)[0]] || nodes;
    let cy0 = 1e9, cy1 = -1e9;
    first.forEach(n => { cy0 = Math.min(cy0, pos[n.id].y); cy1 = Math.max(cy1, pos[n.id].y + nodeH[n.id]); });
    const cy = (cy0 + cy1) / 2, minx = PADX;
    tx = 44 - minx * scale;
    ty = stage.clientHeight / 2 - cy * scale;
    apply();
  }
  let drag = false, px, py;
  stage.onmousedown = (e) => { drag = true; px = e.clientX; py = e.clientY; stage.classList.add("drag"); };
  stage.onmousemove = (e) => { if (!drag) return; tx += e.clientX - px; ty += e.clientY - py; px = e.clientX; py = e.clientY; apply(); };
  const up = () => { drag = false; stage.classList.remove("drag"); };
  stage.onmouseup = up; stage.onmouseleave = up;
  stage.onwheel = (e) => { e.preventDefault(); const f = e.deltaY < 0 ? 1.1 : 1 / 1.1; const ns = Math.max(.3, Math.min(1.6, scale * f)); const rc = stage.getBoundingClientRect(); const rx = e.clientX - rc.left, ry = e.clientY - rc.top; tx = rx - (rx - tx) * (ns / scale); ty = ry - (ry - ty) * (ns / scale); scale = ns; apply(); };
  setTimeout(initial, 30);
  return { fit, initial, zoom: (f) => { scale = Math.max(.3, Math.min(1.8, scale * f)); apply(); } };
}
function renderFlowStudio(info) {
  window.__flowInfo = info;
  window.__graph = info.graph || { nodes: [], edges: [] };
  $("#flowWrap").innerHTML = `
    <div class="flow-head">
      <div><h1>Flow</h1><p>${esc(info.name || "Your agent")} · ${(info.nodes || []).length} steps · <span style="color:var(--wakeel)">edit it by chatting with the assistant →</span></p></div>
      <div class="ctrls">
        <button class="draft-btn ghost" id="tidyBtn" title="Lay it out left-to-right, spread apart, with plain-language steps">${IC.flow} Tidy diagram</button>
        <button class="draft-btn ghost" id="studioRun" title="Test the flow logic">${IC.play} Test run</button>
        <button class="draft-btn run" id="studioLive" title="Run on your real Google Sheet — read rows, draft emails, send & update on your approval">${IC.bolt} Run live</button>
        <button class="btn primary sm" id="studioPub">Publish</button>
      </div>
    </div>
    <div class="rf-stage" id="rfStage">
      <div class="rf-world" id="rfWorld"><svg class="rf-wires" id="rfWires"></svg></div>
      <div class="rf-ctrls" id="rfCtrls">
        <button id="dfzi" title="Zoom in">${SVGI.plus}</button>
        <button id="dfzo" title="Zoom out">${SVGI.minus}</button>
        <button id="dfzc" title="Recenter on the start">${SVGI.target}</button>
        <button id="dfzf" title="Fit whole flow">${SVGI.expand}</button>
      </div>
    </div>`;
  let ctl = buildRailwayFlow("rfStage", "rfWorld", "rfWires", window.__graph);
  window.__rfCtl = ctl;
  const wireZoom = () => {
    $("#rfCtrls").addEventListener("mousedown", e => e.stopPropagation()); // don't start a pan when clicking a control
    $("#dfzi").onclick = () => ctl.zoom(1.2); $("#dfzo").onclick = () => ctl.zoom(1 / 1.2);
    $("#dfzc").onclick = () => ctl.initial(); $("#dfzf").onclick = () => ctl.fit();
  };
  wireZoom();
  $("#studioRun").onclick = () => openRunModal(info);
  $("#studioLive").onclick = () => openRunLive(info);
  $("#studioPub").onclick = () => publishAgent($("#studioPub"));
  $("#tidyBtn").onclick = async () => {
    const b = $("#tidyBtn"); b.disabled = true; b.innerHTML = `<span class="spin"></span> Tidying…`;
    try { await api("POST", "relayout", { app_id: AGENT }); const fresh = await api("GET", "app-info?id=" + AGENT); window.__graph = fresh.graph || window.__graph; ctl = buildRailwayFlow("rfStage", "rfWorld", "rfWires", window.__graph); window.__rfCtl = ctl; wireZoom(); toast("Diagram tidied — plain-language steps"); }
    catch (e) { toast(e.message, true); }
    finally { b.disabled = false; b.innerHTML = `${IC.flow} Tidy diagram`; }
  };
}
/* Publish = make the current draft the live version (Beam-style "publish/deploy"),
   so triggers, the API and the automation engine all run this version. */
async function publishAgent(btn) {
  const orig = btn.textContent; btn.disabled = true; btn.textContent = "Publishing…";
  try {
    await api("POST", "publish", { app_id: AGENT });
    btn.textContent = "✓ Published";
    toast("Agent published — it's now live. Triggers, the API and automations run this version.");
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2600);
  } catch (e) { toast("⚠️ " + e.message, true); btn.textContent = orig; btn.disabled = false; }
}
function toast(msg, bad) {
  const t = document.createElement("div"); t.className = "wk-toast" + (bad ? " bad" : "");
  t.innerHTML = `${bad ? "" : IC.check} <span>${esc(msg)}</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("in"));
  setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 3200);
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
  $("#pubBtn").onclick = () => publishAgent($("#pubBtn"));
  $("#runBtn").onclick = () => openRunModal(info);
  if ($("#studioBtn")) $("#studioBtn").onclick = () => { ASUB = "studio"; viewAgent(); };
  if (window.__autorun) { const tx = window.__autorun; window.__autorun = null; $("#tmode").classList.add("on"); setTimeout(() => runFlow(tx), 700); }
  if (window.__autonode != null) { const idx = window.__autonode; window.__autonode = null; const c = $("#node-" + idx); if (c && nodes[idx]) openNodePanel(info, nodes[idx], c); }
  if (window.__autotool != null) { const idx = window.__autotool; window.__autotool = null; if (nodes[idx]) openConfigTool(info, nodes[idx]); }
}

/* ---------- live run (task execution over the flow) ---------- */
/* Guided review queue — the simple path: gather everything that needs approval,
   then walk the officer through it ONE item at a time (approve / skip), with an
   "always do this automatically" option. Escalations never auto-approve. */
async function execAction(url, a) {
  try { await api("POST", "sheet-update", { url, row: a.row, updates: a.updates || {} }); } catch (e) {}
  if (a.body) { try { await api("POST", "gmail-send", { to: a.to, subject: a.subject, body: a.body }); } catch (e) {} }
}
async function openReviewQueue(info) {
  const url = localStorage.getItem("wk_sheet_" + AGENT) || "";
  if (!url) { openRunLive(info); return; }
  let sop = ""; try { const s = await api("GET", "sop?key=" + encodeURIComponent(info.name || "")); sop = (s && s.text) || ""; } catch (e) {}
  const back = document.createElement("div"); back.className = "modal-back";
  back.innerHTML = `<div class="modal fade rq-modal" onclick="event.stopPropagation()"><div class="rq-load"><span class="spin"></span> ${t("Gathering everything that needs your approval…")}</div></div>`;
  document.body.appendChild(back); back.onclick = () => back.remove();
  const card = back.firstElementChild;
  let actions = [];
  try {
    const [o, r] = await Promise.all([
      api("POST", "run-live-plan", { url, sop }).catch(() => ({})),
      api("POST", "gmail-check-replies", { url, sop }).catch(() => ({})),
    ]);
    const byRow = {};
    (o.actions || []).forEach(a => { byRow[a.row] = a; });
    (r.actions || []).forEach(a => { byRow[a.row] = a; }); // a real reply overrides a status guess
    actions = Object.values(byRow);
  } catch (e) { card.innerHTML = `<button class="x" id="rqx">×</button><div class="empty-mini" style="padding:24px">⚠️ ${esc(e.message)}</div>`; back.querySelector("#rqx").onclick = () => back.remove(); return; }

  const prefKey = "wk_autoapprove_" + AGENT;
  let prefs = []; try { prefs = JSON.parse(localStorage.getItem(prefKey) || "[]"); } catch (e) {}
  const auto = actions.filter(a => !a.escalate && prefs.includes(a.action));
  const review = actions.filter(a => a.escalate || !prefs.includes(a.action));
  let autoDone = 0;
  for (const a of auto) { await execAction(url, a); autoDone++; }

  let idx = 0, approved = 0, skipped = 0;
  function finish() {
    card.innerHTML = `<button class="x" id="rqx">×</button>
      <div class="rq-fin"><div class="rq-badge">${IC.check}</div>
        <h2>${t("All caught up!")} 🎉</h2>
        <p>${approved} ${t("approved & done")}${skipped ? `, ${skipped} ${t("skipped")}` : ""}${autoDone ? `, ${autoDone} ${t("auto-approved")}` : ""}.</p>
        <button class="btn primary block" id="rqClose">${t("Back to overview")}</button></div>`;
    const close = () => { back.remove(); renderOverview(info); };
    back.querySelector("#rqx").onclick = close; back.querySelector("#rqClose").onclick = close;
  }
  function render() {
    if (idx >= review.length) { finish(); return; }
    const a = review[idx];
    card.innerHTML = `<button class="x" id="rqx">×</button>
      <div class="rq-prog"><div class="rq-bar"><i style="width:${Math.round(idx / review.length * 100)}%"></i></div><span>${t("Item")} ${idx + 1} ${t("of")} ${review.length}</span></div>
      <div class="rq-h"><span class="rq-ic">${a.escalate ? "🚩" : (a.body ? "✉️" : "📝")}</span><div><div class="rq-biz">${esc(a.business || ("Row " + a.row))}</div><div class="rq-act">${esc(a.action || "")}</div></div></div>
      ${a.why ? `<div class="rq-why">${IC.help}<span><b>${t("Why:")}</b> ${esc(a.why)}${a.sop_ref ? ` <span class="sop-ref">${t("SOP")} ${esc(a.sop_ref)}</span>` : ""}</span></div>` : ""}
      ${a.summary ? `<div class="rq-summary">↩ ${esc(a.summary)}</div>` : ""}
      ${a.body ? `<div class="rq-email">
        <div class="rl-row"><span class="rl-lab">${t("To")}</span><input class="input sm" id="rqTo" value="${esc(a.to || "")}"></div>
        <div class="rl-row"><span class="rl-lab">${t("Subject")}</span><input class="input sm" id="rqSubj" value="${esc(a.subject || "")}"></div>
        <textarea class="input" id="rqBody" rows="6">${esc(a.body || "")}</textarea></div>` : `<div class="rq-noemail">${t("No email — this just updates the sheet.")}</div>`}
      <div class="rq-status">${t("New status")}: <b>${esc(a.new_status || "")}</b>${a.note ? ` · ${esc(a.note)}` : ""}</div>
      ${a.escalate ? `<div class="rq-esc">${IC.help} ${t("This is an escalation — it always needs your review, never automatic.")}</div>`
        : `<label class="rq-auto"><input type="checkbox" id="rqRemember"><span>${t("From now on, do")} “${esc(a.action || "this")}” ${t("automatically (no need to ask me)")}</span></label>`}
      <div class="rq-btns">
        <button class="btn" id="rqSkip">${t("Skip")}</button>
        <button class="btn primary" id="rqOk">${IC.check} ${a.body ? t("Approve & send") : t("Approve & update")}</button>
      </div>`;
    back.querySelector("#rqx").onclick = () => { back.remove(); renderOverview(info); };
    back.querySelector("#rqSkip").onclick = () => { skipped++; idx++; render(); };
    back.querySelector("#rqOk").onclick = async () => {
      const ok = back.querySelector("#rqOk"); ok.disabled = true; ok.innerHTML = `<span class="spin"></span> ${t("Doing it…")}`;
      if (a.body) { a.to = back.querySelector("#rqTo").value; a.subject = back.querySelector("#rqSubj").value; a.body = back.querySelector("#rqBody").value; }
      const rem = back.querySelector("#rqRemember");
      if (rem && rem.checked && !prefs.includes(a.action)) { prefs.push(a.action); localStorage.setItem(prefKey, JSON.stringify(prefs)); }
      await execAction(url, a);
      approved++; idx++; render();
    };
  }
  if (!review.length) finish(); else render();
}

/* Run live = the REAL compliance cycle on the user's Google Sheet: read rows →
   draft emails & recommend statuses against the SOP → officer approves each
   send / sheet update (real Gmail + real Sheets writes). */
async function openRunLive(info) {
  let sop = "";
  try { const s = await api("GET", "sop?key=" + encodeURIComponent(info.name || "")); sop = (s && s.text) || ""; } catch (e) {}
  const prefill = localStorage.getItem("wk_sheet_" + AGENT) || "";
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:720px;max-width:95vw" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center"><h2 style="flex:1">${IC.bolt} ${t("Run live on your Google Sheet")}</h2><button class="x" id="rlx">×</button></div>
    <p class="page-sub" style="margin-top:-4px">${t("Reads your real rows, drafts the MoHRE emails and recommends the next status against your SOP. Nothing is sent or changed until you approve each action.")}</p>
    <div class="gs-copy"><input class="input" id="rlUrl" value="${esc(prefill)}" placeholder="https://docs.google.com/spreadsheets/d/…"></div>
    <div class="rl-btns"><button class="btn primary" id="rlGo">${IC.send} ${t("Plan outreach")}</button><button class="btn" id="rlReplies">${IC.inbox} ${t("Check replies")}</button></div>
    <label class="rl-auto"><input type="checkbox" id="rlAuto"><span class="rl-autolab">${IC.bolt} ${t("Fully automatic")}</span><span class="rl-autohint">${t("— send emails & update the sheet on its own, no approvals")}</span></label>
    <div class="rl-autowarn" id="rlAutoWarn" hidden>${IC.help} ${t("Heads up: in this mode the assistant acts by itself — real emails are sent and rows updated immediately, without asking you first. Escalations are still flagged.")}</div>
    ${sop ? `<div class="rl-sopok">${IC.check} ${t("Using your uploaded SOP")}</div>` : `<div class="rl-sopwarn">${IC.help} ${t("No SOP uploaded — it will use general rules. Upload one on the build screen for exact evaluation.")}</div>`}
    <div id="rlOut"></div><div class="err" id="rlErr"></div></div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#rlx").onclick = () => d.remove();
  const today = new Date().toISOString().slice(0, 10);
  const renderActions = (r, acts, emptyMsg) => {
    $("#rlOut").innerHTML = `<div class="rl-head">${IC.check} <b>${esc(r.sheet_title || "Your sheet")}</b> · ${r.total || "?"} ${t("businesses")} · <b>${acts.length}</b> ${r.replies_found != null ? t("replies to action") : t("need action")}</div>` +
      (acts.length ? acts.map((a, i) => `
      <div class="rl-card" data-i="${i}">
        <div class="rl-ch"><b>${esc(a.business || ("Row " + a.row))}</b><span class="st-pill ${a.escalate ? "bad" : "run"}">${esc(a.action || "")}</span></div>
        ${a.why ? `<div class="rl-why">${IC.help}<span><b>${t("Why:")}</b> ${esc(a.why)}${a.sop_ref ? ` <span class="sop-ref">${t("SOP")} ${esc(a.sop_ref)}</span>` : ""}</span></div>` : ""}
        ${a.summary ? `<div class="rl-note">↩ ${esc(a.summary)}</div>` : ""}
        ${a.body ? `<div class="rl-email">
          <div class="rl-row"><span class="rl-lab">${t("To")}</span><input class="input sm" data-f="to" value="${esc(a.to || "")}"></div>
          <div class="rl-row"><span class="rl-lab">${t("Subject")}</span><input class="input sm" data-f="subject" value="${esc(a.subject || "")}"></div>
          <textarea class="input" data-f="body" rows="5">${esc(a.body || "")}</textarea></div>` : `<div class="rl-note">${t("No email needed for this one.")}</div>`}
        <div class="rl-status">${t("Proposed status")}: <b>${esc(a.new_status || "")}</b>${a.note ? ` · ${esc(a.note)}` : ""}</div>
        <div class="rl-acts">
          <button class="btn sm primary" data-a="approve">${IC.check} ${a.body ? t("Approve — update & send") : t("Approve — update sheet")}</button>
          ${a.body ? `<button class="btn sm" data-a="send">${t("Send only")}</button>` : ""}
          <button class="btn sm" data-a="update">${t("Update only")}</button>
          <span class="rl-msg"></span>
        </div>
      </div>`).join("") : `<div class="empty-mini" style="padding:14px">${emptyMsg}</div>`);
    wireCards(r, acts);
  };
  const runAction = async (btn, endpoint, working, empty) => {
    const url = $("#rlUrl").value.trim(); if (!url) { $("#rlErr").textContent = "Paste your Google Sheet link."; return; }
    localStorage.setItem("wk_sheet_" + AGENT, url);
    const orig = btn.innerHTML; $("#rlErr").textContent = ""; btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${working}`;
    $("#rlOut").innerHTML = `<div class="empty-mini" style="padding:16px">${working}</div>`;
    try {
      const r = await api("POST", endpoint, { url, sop });
      if (!r.ok) { $("#rlOut").innerHTML = ""; $("#rlErr").textContent = r.error || "Something went wrong."; return; }
      const acts = r.actions || [];
      if ($("#rlAuto") && $("#rlAuto").checked && acts.length) await autoExecute(r, acts);
      else renderActions(r, acts, r.note || empty);
    } catch (e) { $("#rlErr").textContent = e.message; }
    finally { btn.disabled = false; btn.innerHTML = orig; }
  };
  async function autoExecute(r, acts) {
    $("#rlOut").innerHTML = `<div class="rl-head">${IC.bolt} <b>${t("Running automatically…")}</b></div><div class="rl-auto-log" id="rlLog"></div>`;
    const log = $("#rlLog"); let sent = 0, updated = 0, fail = 0;
    for (const a of acts) {
      const row = document.createElement("div"); row.className = "rl-logrow";
      row.innerHTML = `<span class="spin"></span> ${esc(a.business || ("Row " + a.row))} — ${esc(a.action || "")}`;
      log.appendChild(row);
      let ok = true; const errs = [];
      try { const u = await api("POST", "sheet-update", { url: r.url, row: a.row, updates: a.updates || {} }); if (u.ok) updated++; else { ok = false; errs.push(u.error); } } catch (e) { ok = false; errs.push(e.message); }
      if (a.body) { try { const s = await api("POST", "gmail-send", { to: a.to, subject: a.subject, body: a.body }); if (s.ok) sent++; else { ok = false; errs.push(s.error); } } catch (e) { ok = false; errs.push(e.message); } }
      if (!ok) fail++;
      row.innerHTML = `<span class="rl-tick ${ok ? "ok" : "bad"}">${ok ? IC.check : "✕"}</span> ${esc(a.business || ("Row " + a.row))} — ${esc(a.action || "")}${ok ? "" : ` <span style="color:#ff8b8b">${esc(errs.join("; "))}</span>`}`;
    }
    const s = document.createElement("div"); s.className = "rl-autosum";
    s.innerHTML = `${IC.check} <b>${t("Done")}</b> — ${sent} ${t("emails sent")}, ${updated} ${t("rows updated")}${fail ? `, <span style="color:#ff8b8b">${fail} ${t("failed")}</span>` : ""}.`;
    log.appendChild(s);
  }
  const plan = () => runAction($("#rlGo"), "run-live-plan", t("Reading your sheet and drafting actions…"), t("Nothing needs outreach right now — all businesses are up to date."));
  const checkReplies = () => runAction($("#rlReplies"), "gmail-check-replies", t("Checking Gmail for business replies…"), t("No new replies from your businesses were found in the inbox."));
  function wireCards(r, acts) {
    $("#rlOut").querySelectorAll(".rl-card").forEach(card => {
      const i = +card.dataset.i, a = acts[i];
      const val = (f) => { const el = card.querySelector(`[data-f="${f}"]`); return el ? el.value : ""; };
      const msg = card.querySelector(".rl-msg");
      const upd = () => a.updates || { "Compliance Status": a.new_status || "", "Notes": a.note || "", "Next Action": a.action || "", "Last Outreach Date": today };
      // one-click: update the sheet AND send the email (the full "reply → update + acknowledge" step)
      const approveBtn = card.querySelector('[data-a="approve"]');
      if (approveBtn) approveBtn.onclick = async () => {
        approveBtn.disabled = true; approveBtn.innerHTML = `<span class="spin"></span> ${t("Working…")}`;
        const errs = [];
        try { const u = await api("POST", "sheet-update", { url: r.url, row: a.row, updates: upd() }); if (!u.ok) errs.push(u.error); } catch (e) { errs.push(e.message); }
        if (a.body) { try { const s = await api("POST", "gmail-send", { to: val("to"), subject: val("subject"), body: val("body") }); if (!s.ok) errs.push(s.error); } catch (e) { errs.push(e.message); } }
        msg.innerHTML = errs.length ? `<span style="color:#ff8b8b">${esc(errs.join("; "))}</span>` : `<span class="cn-tag ok">${IC.check} ${a.body ? t("Sheet updated & email sent") : t("Sheet updated")}</span>`;
        approveBtn.disabled = errs.length ? false : true; approveBtn.innerHTML = errs.length ? `${IC.check} ${t("Retry")}` : `${IC.check} ${t("Done")}`;
      };
      const sendBtn = card.querySelector('[data-a="send"]');
      if (sendBtn) sendBtn.onclick = async () => {
        sendBtn.disabled = true; sendBtn.innerHTML = `<span class="spin"></span>`;
        try { const res = await api("POST", "gmail-send", { to: val("to"), subject: val("subject"), body: val("body") });
          msg.innerHTML = res.ok ? `<span class="cn-tag ok">${IC.check} ${t("Email sent")}</span>` : `<span style="color:#ff8b8b">${esc(res.error)}</span>`;
        } catch (e) { msg.textContent = e.message; }
        sendBtn.disabled = false; sendBtn.innerHTML = `${IC.send} ${t("Send email")}`;
      };
      const upBtn = card.querySelector('[data-a="update"]');
      if (upBtn) upBtn.onclick = async () => {
        upBtn.disabled = true; upBtn.innerHTML = `<span class="spin"></span>`;
        const updates = a.updates || { "Compliance Status": a.new_status || "", "Notes": a.note || "", "Next Action": a.action || "", "Last Outreach Date": today };
        try { const res = await api("POST", "sheet-update", { url: r.url, row: a.row, updates });
          msg.innerHTML = res.ok ? `<span class="cn-tag ok">${IC.check} ${t("Sheet updated")}</span>` : `<span style="color:#ff8b8b">${esc(res.error)}</span>`;
        } catch (e) { msg.textContent = e.message; }
        upBtn.disabled = false; upBtn.innerHTML = `${IC.check} ${t("Update sheet")}`;
      };
    });
  }
  $("#rlGo").onclick = plan;
  $("#rlReplies").onclick = checkReplies;
  $("#rlAuto").onchange = () => { $("#rlAutoWarn").hidden = !$("#rlAuto").checked; $("#rlGo").innerHTML = $("#rlAuto").checked ? `${IC.bolt} ${t("Run outreach automatically")}` : `${IC.send} ${t("Plan outreach")}`; $("#rlReplies").innerHTML = $("#rlAuto").checked ? `${IC.bolt} ${t("Handle replies automatically")}` : `${IC.inbox} ${t("Check replies")}`; };
  $("#rlUrl").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); plan(); } });
  setTimeout(() => $("#rlUrl").focus(), 60);
}

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

/* Self-contained "Run now" (used from Triggers) — input → live steps → result,
   no flow canvas needed. */
function runNowModal(info) {
  const v = (info.vars || [])[0];
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:640px;max-width:94vw" onclick="event.stopPropagation()">
    <h2>${IC.play} Run ${esc((info.name || "agent").slice(0, 40))} <button class="x" id="rx">×</button></h2>
    <div style="color:var(--muted);font-size:13px;margin:-8px 0 14px">Type an input and press Run. You'll see each step and the result — just like when a trigger fires.</div>
    <div class="field"><label>${v ? esc(v.label || v.name) : "Input"}</label><textarea class="input" id="rnIn" rows="3" placeholder="e.g. a citizen complaint, an application summary, an email…"></textarea></div>
    <button class="btn primary block" id="rnGo">${IC.play} Run</button>
    <div id="rnSteps" class="rn-steps" hidden></div>
    <div id="rnOut" class="rn-out" hidden></div>
  </div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#rx").onclick = () => d.remove(); $("#rnIn").focus();
  $("#rnGo").onclick = async () => {
    const input = $("#rnIn").value.trim(); if (!input) return;
    $("#rnGo").disabled = true; $("#rnGo").innerHTML = `<span class="spin"></span> Running…`;
    const steps = $("#rnSteps"); steps.hidden = false; steps.innerHTML = ""; const out = $("#rnOut"); out.hidden = true;
    const rows = {}; let answer = "";
    try {
      const resp = await fetch("api/run", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ app_id: AGENT, input }) });
      const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n"); buf = parts.pop();
        for (const part of parts) {
          const line = part.trim(); if (!line.startsWith("data:")) continue;
          let ev; try { ev = JSON.parse(line.slice(5).trim()); } catch (e) { continue; }
          const dd = ev.data || {};
          if (ev.event === "node_started") { const r = document.createElement("div"); r.className = "rn-step run"; r.innerHTML = `<span class="spin"></span> ${esc(dd.title || "Step")}`; steps.appendChild(r); rows[dd.title] = r; steps.scrollTop = steps.scrollHeight; }
          else if (ev.event === "node_finished") { const r = rows[dd.title]; if (r) { const ok = dd.status !== "failed"; r.className = "rn-step " + (ok ? "ok" : "bad"); r.innerHTML = `<span class="rn-tick">${ok ? IC.check : "✕"}</span> ${esc(dd.title || "Step")}`; } }
          else if (ev.event === "message" || ev.event === "agent_message") { answer += ev.answer || ""; }
          else if (ev.event === "workflow_finished") { const o = dd.outputs; if (!answer && o && typeof o === "object") answer = Object.values(o).join("\n"); }
          else if (ev.event === "error") { if (!answer) answer = "⚠️ " + (ev.message || "Run failed"); }
        }
      }
      out.hidden = false; out.innerHTML = `<div class="rn-out-h">${IC.check} Result</div><div class="rn-out-b">${esc((answer || "(no output)").trim()).slice(0, 5000)}</div>`;
    } catch (e) { out.hidden = false; out.innerHTML = `<div class="rn-out-h">Error</div><div class="rn-out-b">${esc(e.message)}</div>`; }
    finally { $("#rnGo").disabled = false; $("#rnGo").innerHTML = `${IC.play} Run again`; }
  };
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
        const sub = on ? "" : native ? `<div style="font-size:11px;color:var(--wakeel)">Native · one-click connect</div>` : `<div style="font-size:11px;color:var(--muted-2)">Request to enable for your workspace</div>`;
        c.innerHTML = `<div style="display:flex;align-items:center;gap:12px">${brandLogo(n)}<div style="flex:1;min-width:0"><h3 style="font-size:14px">${esc(n)}</h3>${sub}</div>${on ? `<span class="st-pill ok">Installed</span>` : ""}</div>
          <div class="foot" style="margin-top:14px"><span></span><button class="btn sm ${on ? "" : "primary"}" title="${on ? "Configure this connector" : native ? "Install and connect now" : "Ask the Wakeel team to enable this connector"}">${on ? t("Configure") : native ? t("Install & connect") : t("Request access")}</button></div>`;
        const btn = c.querySelector("button");
        btn.onclick = async (e) => {
          e.stopPropagation();
          if (on) { openToolConfig(n); return; }
          if (!native) { toast("Requested — the Wakeel team will enable “" + n + "” for your workspace."); btn.textContent = "✓ Requested"; btn.disabled = true; return; }
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
function useSkill(s) { ACTIVE_SKILL = s; VIEW = "home"; THREAD = []; BUILD = false; location.hash = "home"; renderShell(); setTimeout(() => { const i = $("#ins"); if (i) i.focus(); }, 60); }
function viewSkills() {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>${t("Skills")}</b></div></div>
    <div class="content"><div class="pad">
      <h1 class="page-h">${t("Skills")}</h1><p class="page-sub">${t("Ready-made AI helpers. Pick one and it runs in chat — paste your text and get the result.")}</p>
      <div class="searchbar">${IC.search}<input id="ssearch" placeholder="${t("Search skills…")}"/></div>
      <div class="grid" id="skillList"></div>
    </div></div>`;
  const draw = (q = "") => {
    const el = $("#skillList"); el.innerHTML = "";
    SKILLS.filter(s => (s.name + " " + s.desc).toLowerCase().includes(q.toLowerCase())).forEach(s => {
      const c = document.createElement("div"); c.className = "gcard";
      c.innerHTML = `<div class="ic">${IC[s.ic] || IC.book}</div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p><div class="foot"><span></span><button class="btn primary sm">${IC.chat} ${t("Use in chat")}</button></div>`;
      c.querySelector("button").onclick = () => useSkill(s);
      el.appendChild(c);
    });
    if (!el.children.length) el.innerHTML = `<div class="empty-mini">No skills match “${esc(q)}”.</div>`;
  };
  draw(); $("#ssearch").addEventListener("input", e => draw(e.target.value));
}
/* a compact skill chip shown in the chat composer when a skill is active */
function skillChip() {
  if (!ACTIVE_SKILL) return "";
  return `<div class="skill-chip" id="skillChip">${IC[ACTIVE_SKILL.ic] || IC.book}<span>${esc(ACTIVE_SKILL.name)}</span><button class="skx" title="Remove skill">×</button></div>`;
}
function wireSkillChip() {
  const x = document.querySelector("#skillChip .skx");
  if (x) x.onclick = (e) => { e.stopPropagation(); ACTIVE_SKILL = null; renderShell(); };
}

/* ---------- Teams (multi-agent collaboration) ---------- */
let TEAMS = [];
function viewTeams() {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>${t("Teams")}</b><span class="sep">·</span><span style="color:var(--muted)">Multi-agent collaboration</span></div>
      <div class="top-actions"><button class="btn primary sm" id="teamNew">${IC.plus} New team</button></div></div>
    <div class="content"><div class="pad" style="max-width:900px">
      <h1 class="page-h">${t("Teams")}</h1>
      <p class="page-sub">A team is a <b>supervisor</b> that routes a request to your specialist agents, runs them, and combines the result — one request, many agents working together.</p>
      <div id="teamList"><div class="empty-mini">Loading…</div></div>
    </div></div>`;
  $("#teamNew").onclick = () => openTeamBuilder();
  loadTeams();
}
async function loadTeams() {
  const el = $("#teamList"); if (!el) return;
  try {
    if (!APPS.length) { try { const ad = await api("GET", "apps"); APPS = ad.apps || []; } catch (e) {} }
    const d = await api("GET", "teams"); TEAMS = d.teams || [];
    if (!TEAMS.length) { el.innerHTML = `<div class="empty-state" style="padding:38px 0"><div class="big">${IC.team}</div><h3>No teams yet</h3><div>Create a team of agents that work together on one request.</div></div>`; return; }
    el.innerHTML = "";
    TEAMS.forEach(tm => {
      const c = document.createElement("div"); c.className = "gcard auto-card"; c.style.cursor = "default";
      const memNames = (tm.members || []).map(id => { const a = APPS.find(x => x.id === id); return a ? a.name : "Agent"; });
      const memCount = (tm.members || []).length;
      c.innerHTML = `<div style="display:flex;align-items:center;gap:11px;margin-bottom:10px">
          <div class="dot ag-violet">${IC.team}</div>
          <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:15px">${esc(tm.name)}</div><div style="font-size:12px;color:var(--muted-2)">${memCount} agents${tm.goal ? " · " + esc(tm.goal) : ""}</div></div>
          <button class="btn primary sm" data-a="run">${IC.play} Run</button>
          <button class="btn sm" data-a="edit">Edit</button>
          <button class="icn-btn" data-a="del" title="Delete">✕</button></div>
        <div class="auto-steps">${memCount ? memNames.map((n, i) => `${i ? `<span class="astep-arr">+</span>` : ""}<span class="astep ag-violet">${esc(n)}</span>`).join("") : `<span style="color:var(--faint);font-size:12.5px">No agents — edit to add members.</span>`}</div>`;
      c.querySelector('[data-a="run"]').onclick = () => openTeamRun(tm);
      c.querySelector('[data-a="edit"]').onclick = () => openTeamBuilder(tm);
      c.querySelector('[data-a="del"]').onclick = async () => { if (!confirm("Delete this team?")) return; try { await api("POST", "team-delete", { id: tm.id }); loadTeams(); } catch (e) { alert(e.message); } };
      el.appendChild(c);
    });
  } catch (e) { el.innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
}
function openTeamBuilder(tm) {
  const editing = !!tm; tm = tm || { name: "", goal: "", members: [] };
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:560px" onclick="event.stopPropagation()"><div style="display:flex"><h2 style="flex:1">${editing ? "Edit team" : "New team"}</h2><button class="x" id="tbx">×</button></div>
    <div class="field"><label>Team name</label><input class="input" id="tbName" value="${esc(tm.name)}" placeholder="e.g. Citizen Services Desk"/></div>
    <div class="field"><label>Goal</label><input class="input" id="tbGoal" value="${esc(tm.goal)}" placeholder="What this team handles"/></div>
    <div class="field"><label>Member agents — the supervisor decides who to use per request</label><div class="team-members" id="tbMembers"></div></div>
    <button class="btn primary block" id="tbSave">${editing ? "Save team" : "Create team"}</button></div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#tbx").onclick = () => d.remove();
  const sel = new Set(tm.members || []);
  $("#tbMembers").innerHTML = APPS.map(a => `<label class="team-mem"><input type="checkbox" data-id="${a.id}" ${sel.has(a.id) ? "checked" : ""}><span>${esc(a.name)}</span></label>`).join("") || `<div class="empty-mini">No agents yet — build one first.</div>`;
  $("#tbMembers").querySelectorAll("input").forEach(i => i.onchange = () => { i.checked ? sel.add(i.dataset.id) : sel.delete(i.dataset.id); });
  $("#tbSave").onclick = async () => {
    const name = $("#tbName").value.trim(); if (!name) return;
    $("#tbSave").disabled = true;
    try { await api("POST", "team-save", { team: { id: tm.id, name, goal: $("#tbGoal").value.trim(), members: [...sel] } }); d.remove(); loadTeams(); }
    catch (e) { alert(e.message); $("#tbSave").disabled = false; }
  };
}
function openTeamRun(tm) {
  const d = document.createElement("div"); d.className = "modal-back";
  d.innerHTML = `<div class="modal fade" style="width:680px;max-width:94vw" onclick="event.stopPropagation()"><div style="display:flex"><h2 style="flex:1">${IC.team} Run ${esc(tm.name)}</h2><button class="x" id="trx">×</button></div>
    <div style="color:var(--muted);font-size:13px;margin:-8px 0 14px">The supervisor routes your request to the right agents, runs them, and combines the result.</div>
    <div class="field"><label>Request</label><textarea class="input" id="trIn" rows="3" placeholder="Describe what needs handling — the supervisor picks the agents…"></textarea></div>
    <button class="btn primary block" id="trGo">${IC.play} Run team</button>
    <div id="trOut" hidden style="margin-top:16px"></div></div>`;
  document.body.appendChild(d); d.onclick = () => d.remove(); $("#trx").onclick = () => d.remove(); $("#trIn").focus();
  $("#trGo").onclick = async () => {
    const input = $("#trIn").value.trim(); if (!input) return;
    $("#trGo").disabled = true; $("#trGo").innerHTML = `<span class="spin"></span> Orchestrating…`;
    const out = $("#trOut"); out.hidden = false; out.innerHTML = `<div class="empty-mini">The supervisor is planning, then running each agent…</div>`;
    try {
      const r = await api("POST", "team-run", { id: tm.id, input });
      out.innerHTML = `<div class="team-plan"><b>${IC.team} Supervisor plan</b><p>${esc(r.plan || "")}</p></div>
        <div class="rn-steps">${(r.steps || []).map(s => `<div class="rn-step ${s.status === "failed" ? "bad" : "ok"}"><span class="rn-tick">${s.status === "failed" ? "✕" : IC.check}</span> ${esc(s.agent)}</div>`).join("")}</div>
        <div class="rn-out"><div class="rn-out-h">${IC.check} Combined result</div><div class="rn-out-b">${esc(r.final || "").slice(0, 6000)}</div></div>`;
    } catch (e) { out.innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
    finally { $("#trGo").disabled = false; $("#trGo").innerHTML = `${IC.play} Run again`; }
  };
}

/* ---------- Governance & Audit center (workspace-level) ---------- */
let GOV_CAT = "all";
function viewGovernance() {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>${t("Governance")}</b><span class="sep">·</span><span style="color:var(--muted)">Audit &amp; compliance</span></div>
      <div class="top-actions"><button class="btn sm" id="govExport">${IC.download} Export audit log</button></div></div>
    <div class="content"><div class="pad" style="max-width:1000px">
      <h1 class="page-h">${t("Governance")}</h1>
      <p class="page-sub">Every action across your workspace — who did what, when — plus the compliance posture your agents operate under. This is the accountable record for auditors.</p>
      <div id="govBody"><div class="empty-mini">Loading…</div></div>
    </div></div>`;
  $("#govExport").onclick = () => { const u = "/wakeel/api/audit-export"; window.open(u, "_blank"); };
  loadGovernance();
}
async function loadGovernance() {
  const el = $("#govBody"); if (!el) return;
  try {
    const d = await api("GET", "audit?category=" + encodeURIComponent(GOV_CAT));
    const s = d.summary || {};
    const ap = s.approvals || { approved: 0, rejected: 0, pending: 0 };
    const chips = (arr) => (arr || []).map(x => `<span class="gv-chip">${esc(x)}</span>`).join("");
    const sevDot = { ok: "g", warn: "y", info: "b" };
    el.innerHTML = `
      <div class="metric-row m4">
        ${metric("Audit events", s.total_events || 0, "", "")}
        ${metric("Agents governed", s.agents_governed || 0, "", s.agents_governed ? "ok" : "")}
        ${metric("Approval rate", (s.approval_rate || 0) + "%", "", (s.approval_rate || 0) >= 80 ? "ok" : "")}
        ${metric("Pending approvals", ap.pending || 0, "", ap.pending ? "bad" : "")}
      </div>
      <div class="gov-posture">
        <div class="gcard" style="cursor:default"><div class="gv-h">${IC.shield} Data residency</div><div class="gv-chips">${chips(s.data_residency)}</div></div>
        <div class="gcard" style="cursor:default"><div class="gv-h">${IC.check} Compliance standards</div><div class="gv-chips">${chips(s.compliance)}</div></div>
        <div class="gcard" style="cursor:default"><div class="gv-h">${IC.spark} Model &amp; data policy</div><div class="gv-chips">${chips(s.model_policy)}</div></div>
        <div class="gcard" style="cursor:default"><div class="gv-h">${IC.thumb} Human decisions</div>
          <div class="kv"><span>Approved</span><b style="color:var(--green)">${ap.approved}</b></div>
          <div class="kv"><span>Rejected</span><b style="color:#ff8b8b">${ap.rejected}</b></div>
          <div class="kv"><span>Pending review</span><b>${ap.pending}</b></div></div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin:22px 0 10px">
        <div class="side-sub" style="padding-inline:0;flex:1">Audit trail</div>
        <div class="seg" id="govCats">${(d.categories || ["all"]).map(c => `<button class="${GOV_CAT === c ? "on" : ""}" data-c="${c}">${c === "all" ? "All" : c}</button>`).join("")}</div>
      </div>
      <div class="audit-list">${(d.events || []).length ? (d.events || []).map(e => `
        <div class="audit-row"><span class="au-dot ${sevDot[e.severity] || "b"}"></span>
          <div class="au-main"><div class="au-t"><b>${esc(e.label)}</b>${e.detail ? `<span class="au-det"> — ${esc(e.detail)}</span>` : ""}</div>
            <div class="au-meta">${esc(e.category)} · ${esc(e.actor)}</div></div>
          <div class="au-time">${timeAgo(e.ts)}</div></div>`).join("") : `<div class="empty-mini" style="padding:16px">No audit events yet in this category.</div>`}</div>`;
    $("#govCats").querySelectorAll("button").forEach(b => b.onclick = () => { GOV_CAT = b.dataset.c; loadGovernance(); });
  } catch (e) { el.innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
}

/* ---------- Security & Access (RBAC + SSO) ---------- */
let SEC = null;
const ROLE_BADGE = { admin: "r-admin", officer: "r-officer", viewer: "r-viewer" };
function viewSecurity() {
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>${t("Security")}</b><span class="sep">·</span><span style="color:var(--muted)">Access &amp; identity</span></div></div>
    <div class="content"><div class="pad" style="max-width:1000px">
      <h1 class="page-h">${t("Security")} &amp; access</h1>
      <p class="page-sub">Role-based access, single sign-on and the session policy your workspace runs under — the identity controls an enterprise government deployment requires.</p>
      <div id="secBody"><div class="empty-mini">Loading…</div></div>
    </div></div>`;
  loadSecurity();
}
async function loadSecurity() {
  const el = $("#secBody"); if (!el) return;
  try {
    SEC = await api("GET", "security");
    const isAdmin = SEC.my_role === "admin";
    const sso = SEC.sso || { provider: "off" };
    const pol = SEC.policy || {};
    const roleName = { admin: "Administrator", officer: "Officer", viewer: "Viewer" };
    const ssoName = (SEC.sso_providers.find(p => p.id === sso.provider) || {}).name;
    const ai = SEC.ai || { name: "OpenAI API", region: "Global", in_country: false, policy: "" };
    el.innerHTML = `
      <div class="ai-residency ${ai.in_country ? "on" : "warn"}">
        <div class="air-ic">${ai.in_country ? IC.shield : IC.help}</div>
        <div class="air-main"><div class="air-t">AI data residency — <b>${esc(ai.name)} · ${esc(ai.region)}</b></div>
          <div class="air-d">${ai.in_country ? "Inference runs in-country; no prompt or output leaves the UAE." : "Running on the global OpenAI API. Set AZURE_OPENAI_* to route inference to Azure OpenAI (UAE North)."}</div></div>
        <span class="air-pill ${ai.in_country ? "ok" : "idle"}">${ai.in_country ? "In-country" : "Global"}</span>
      </div>
      <div class="side-sub" style="padding-inline:0">Roles &amp; permissions (RBAC)</div>
      <div class="role-grid">${SEC.roles.map(r => `
        <div class="gcard role-card" style="cursor:default">
          <div class="rc-h"><span class="rbadge ${ROLE_BADGE[r.id]}">${roleName[r.id]}</span></div>
          <div class="rc-desc">${esc(r.desc)}</div>
          <ul class="rc-can">${r.can.map(c => `<li class="yes">${IC.check} ${esc(c)}</li>`).join("")}${(r.cannot || []).map(c => `<li class="no">✕ ${esc(c)}</li>`).join("")}</ul>
        </div>`).join("")}</div>

      <div class="side-sub" style="padding-inline:0;margin-top:24px">Members</div>
      <div class="gcard" style="cursor:default;padding:6px 4px">
        <div class="mem-tbl">${SEC.members.map(m => `
          <div class="mem-row">
            <div class="av">${esc((m.name || "U")[0].toUpperCase())}</div>
            <div class="mem-info"><div class="mem-n">${esc(m.name)} ${m.email === ME.email ? '<span class="you">you</span>' : ""}</div><div class="mem-e">${esc(m.email)}</div></div>
            <div class="mem-last">${m.last_active ? "active " + timeAgo(m.last_active) : ""}</div>
            ${isAdmin
        ? `<select class="input sm role-sel" data-email="${esc(m.email)}" style="width:150px;min-height:36px">${["admin", "officer", "viewer"].map(rid => `<option value="${rid}" ${m.role === rid ? "selected" : ""}>${roleName[rid]}</option>`).join("")}</select>`
        : `<span class="rbadge ${ROLE_BADGE[m.role]}">${roleName[m.role]}</span>`}
          </div>`).join("")}</div>
      </div>

      <div class="sec-grid">
        <div class="gcard" style="cursor:default">
          <div class="gv-h">${IC.lock} Single sign-on (SSO)</div>
          <div class="sso-state ${sso.provider !== "off" ? "on" : ""}">${sso.provider !== "off" ? `${IC.check} ${esc(ssoName)} — configured` : "Not configured — using Wakeel accounts"}</div>
          <div class="field" style="margin-top:12px"><label>Identity provider</label>
            <select class="input" id="ssoProv" ${isAdmin ? "" : "disabled"}>
              <option value="off" ${sso.provider === "off" ? "selected" : ""}>Off — Wakeel accounts</option>
              ${SEC.sso_providers.map(p => `<option value="${p.id}" ${sso.provider === p.id ? "selected" : ""}>${esc(p.name)} · ${esc(p.proto)}</option>`).join("")}
            </select></div>
          <div id="ssoFields"></div>
          ${isAdmin ? `<button class="btn primary block" id="ssoSave" style="margin-top:6px">Save SSO configuration</button>
          <div class="sso-note">Federation activates once your IT team completes the handshake with the identity provider.</div>` : ""}
        </div>

        <div class="gcard" style="cursor:default">
          <div class="gv-h">${IC.shield} Session &amp; access policy</div>
          <div class="field"><label>Session timeout (minutes)</label><input class="input" id="polTimeout" type="number" min="5" max="480" value="${pol.session_timeout_min || 30}" ${isAdmin ? "" : "disabled"}></div>
          <label class="pol-check"><input type="checkbox" id="polMfa" ${pol.mfa_required ? "checked" : ""} ${isAdmin ? "" : "disabled"}><span>Require multi-factor authentication (MFA)</span></label>
          <div class="field"><label>Allowed email domains</label><input class="input" id="polDomains" value="${esc(pol.allowed_domains || "")}" placeholder="gov.ae, abudhabi.ae" ${isAdmin ? "" : "disabled"}></div>
          <div class="field"><label>IP allowlist (optional)</label><input class="input" id="polIp" value="${esc(pol.ip_allowlist || "")}" placeholder="e.g. 194.170.0.0/16" ${isAdmin ? "" : "disabled"}></div>
          ${isAdmin ? `<button class="btn primary block" id="polSave">Save policy</button>` : `<div class="sso-note">Only an Administrator can change the security policy.</div>`}
        </div>
      </div>`;

    // role change
    el.querySelectorAll(".role-sel").forEach(s => s.onchange = async () => {
      try { await api("POST", "security-role", { email: s.dataset.email, role: s.value }); toast("Role updated"); }
      catch (e) { toast(e.message, true); }
    });
    // SSO provider fields
    const renderSsoFields = () => {
      const pid = $("#ssoProv").value;
      const prov = SEC.sso_providers.find(p => p.id === pid);
      const cfg = (SEC.sso && SEC.sso.config) || {};
      const labelize = (k) => ({ tenant_id: "Directory (tenant) ID", client_id: "Application (client) ID", metadata_url: "Federation metadata URL", entity_id: "Entity ID / Issuer", acs_url: "Assertion Consumer Service (ACS) URL" }[k] || k);
      $("#ssoFields").innerHTML = prov ? prov.fields.map(f => `<div class="field"><label>${labelize(f)}</label><input class="input sso-f" data-k="${f}" value="${esc(cfg[f] || "")}" ${isAdmin ? "" : "disabled"}></div>`).join("") : "";
    };
    if ($("#ssoProv")) { $("#ssoProv").onchange = renderSsoFields; renderSsoFields(); }
    if ($("#ssoSave")) $("#ssoSave").onclick = async () => {
      const provider = $("#ssoProv").value;
      const config = {}; el.querySelectorAll(".sso-f").forEach(i => config[i.dataset.k] = i.value.trim());
      try { const r = await api("POST", "security-sso", { sso: { provider, config } }); SEC.sso = r.sso; toast("SSO configuration saved"); loadSecurity(); }
      catch (e) { toast(e.message, true); }
    };
    if ($("#polSave")) $("#polSave").onclick = async () => {
      const policy = { session_timeout_min: $("#polTimeout").value, mfa_required: $("#polMfa").checked, allowed_domains: $("#polDomains").value, ip_allowlist: $("#polIp").value };
      try { await api("POST", "security-policy", { policy }); toast("Security policy saved"); }
      catch (e) { toast(e.message, true); }
    };
  } catch (e) { el.innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
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
    if ($("#rerunBtn")) $("#rerunBtn").onclick = () => { window.__autorun = t.input || ""; d.remove(); openAgent(t.app_id, "flow"); };
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

/* ---------- Developers / API (Beam-compatible) ---------- */
function viewDevelopers() {
  const base = `${location.origin}/wakeel/beam`;
  const codeblock = (title, body) => `<div class="code-card"><div class="cc-h"><span>${title}</span><button class="btn sm cc-copy">Copy</button></div><pre>${esc(body)}</pre></div>`;
  const exCreate = `curl -X POST ${base}/agent-tasks \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"agentId":"<AGENT_ID>","input":"A resident reports a broken street light."}'`;
  const exList = `curl ${base}/agents -H "x-api-key: YOUR_KEY"`;
  const exGet = `curl ${base}/agent-tasks/<TASK_ID> -H "x-api-key: YOUR_KEY"`;
  const exActs = `# approve / reject / rate / retry a task
curl -X POST ${base}/agent-tasks/<TASK_ID>/approve -H "x-api-key: YOUR_KEY"
curl -X POST ${base}/agent-tasks/<TASK_ID>/rate -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json" -d '{"rating":"up"}'`;
  $("#mainCol").innerHTML = `<div class="topbar"><div class="crumbs"><b>Developers</b><span class="sep">·</span><span style="color:var(--muted)">Beam-compatible API</span></div></div>
    <div class="content"><div class="pad" style="max-width:860px">
      <h1 class="page-h">Developers &amp; API</h1>
      <p class="page-sub">Call your agents from any system with a Beam-compatible REST API. Wakeel translates it to Dify &amp; the bundled automation engine underneath.</p>

      <div class="side-sub" style="padding-inline:0">API keys</div>
      <div class="gcard" style="cursor:default">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="input" id="keyLabel" placeholder="Key label (e.g. MoHRE portal)" style="flex:1;min-width:200px"/><button class="btn primary" id="keyGen">${IC.plus} Create API key</button></div>
        <div id="keyNew"></div>
        <div id="keyList" style="margin-top:14px"><div class="empty-mini">Loading…</div></div>
      </div>

      <div class="side-sub" style="padding-inline:0;margin-top:24px">Base URL &amp; auth</div>
      <div class="acard" style="max-width:100%"><div class="lab">BASE URL</div><div style="font-family:var(--mono);font-size:14px;color:var(--text);margin:5px 0 7px;word-break:break-all">${base}</div><div style="font-size:13px;color:var(--muted)">Send <code>x-api-key: YOUR_KEY</code> on every request. JSON in, JSON out.</div></div>

      <div class="side-sub" style="padding-inline:0;margin-top:24px">Examples</div>
      ${codeblock("Create a task (run an agent)", exCreate)}
      ${codeblock("List agents", exList)}
      ${codeblock("Get a task", exGet)}
      ${codeblock("Approve / rate a task", exActs)}

      <div class="side-sub" style="padding-inline:0;margin-top:24px">Endpoints</div>
      <div class="rec-wrap"><table class="rec-tbl"><thead><tr><th>Method</th><th>Path</th><th>Purpose</th></tr></thead><tbody>
        ${[["GET", "/agents", "List agents"], ["GET", "/agent-graphs/{id}", "Agent graph"], ["POST", "/agent-tasks", "Create task (run) {agentId, input}"], ["GET", "/agent-tasks", "List tasks"], ["GET", "/agent-tasks/{id}", "Task details"], ["GET", "/agent-tasks/analytics", "Analytics"], ["POST", "/agent-tasks/{id}/approve", "Approve"], ["POST", "/agent-tasks/{id}/reject", "Reject"], ["POST", "/agent-tasks/{id}/rate", "Rate output {rating}"], ["POST", "/agent-tasks/{id}/retry", "Retry"], ["GET", "/users/current", "Current user"]].map(([m, p, d]) => `<tr><td><span class="st-pill ${m === "GET" ? "info" : "ok"}">${m}</span></td><td style="font-family:var(--mono)">${esc(p)}</td><td class="mut">${esc(d)}</td></tr>`).join("")}
      </tbody></table></div>
    </div></div>`;
  document.querySelectorAll(".cc-copy").forEach(b => b.onclick = () => { const pre = b.closest(".code-card").querySelector("pre"); navigator.clipboard && navigator.clipboard.writeText(pre.textContent); b.textContent = "Copied ✓"; setTimeout(() => b.textContent = "Copy", 1500); });
  const loadKeys = async () => {
    try { const d = await api("GET", "beam-keys"); const el = $("#keyList");
      el.innerHTML = (d.keys || []).length ? (d.keys || []).map(k => `<div class="lrow" style="padding:9px 2px"><div class="ic">${IC.skills}</div><div class="info"><div class="t" style="font-size:13.5px">${esc(k.label)}</div><div class="d" style="font-family:var(--mono)">${esc(k.preview)}</div></div><span class="sys-tag" style="border:0">${timeAgo(k.created)}</span></div>`).join("") : `<div class="empty-mini">No keys yet. Create one to call the API.</div>`;
    } catch (e) { $("#keyList").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
  };
  $("#keyGen").onclick = async () => {
    $("#keyGen").disabled = true;
    try { const r = await api("POST", "beam-key", { label: $("#keyLabel").value.trim() });
      $("#keyNew").innerHTML = `<div class="key-reveal">${IC.check} <div><b>New key — copy it now, it won't be shown again</b><div class="key-val" id="kv">${esc(r.key)}</div></div><button class="btn sm" id="kvCopy">Copy</button></div>`;
      $("#kvCopy").onclick = () => { navigator.clipboard && navigator.clipboard.writeText(r.key); $("#kvCopy").textContent = "Copied ✓"; };
      $("#keyLabel").value = ""; loadKeys();
    } catch (e) { $("#keyNew").innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
    finally { $("#keyGen").disabled = false; }
  };
  loadKeys();
}

/* ---------- Automations (chat-first; the engine is fully hidden) ---------- */
let AUTOS = [];
const AUTO_KIND = { trigger: "ag-blue", tool: "ag-green", agent: "ag-violet", cond: "ag-amber", end: "ag-teal" };
function autoStepChip(s) { return `<span class="astep ${AUTO_KIND[s.kind] || "ag-slate"}">${esc(s.title)}</span>`; }
function viewAutomations() {
  $("#mainCol").innerHTML = `
    <div class="topbar"><div class="crumbs"><b>${t("Automations")}</b></div></div>
    <div class="content"><div class="pad" style="max-width:900px">
      <h1 class="page-h">${t("Automations")}</h1>
      <p class="page-sub">${t("Describe an automation and Wakeel builds it — it runs across your connectors (Microsoft 365, Google, HTTP…) and can call your agents. No diagrams to draw.")}</p>
      <div class="composer" style="max-width:100%">
        <textarea id="autoIns" rows="2" placeholder="${t("Describe an automation… e.g. every morning read the registry, ask the compliance agent who needs outreach, email them, and send officers a summary")}"></textarea>
        <div class="composer-foot"><span style="color:var(--faint);font-size:12px">${IC.integrations} ${t("Runs on your connectors")}</span><button class="send-btn" id="autoBuild">${IC.up}</button></div>
      </div>
      <div id="autoReason"></div>
      <div class="side-sub" style="padding-inline:0;margin-top:8px">${t("Your automations")}</div>
      <div id="autoList"><div class="empty-mini">${t("Loading…")}</div></div>
    </div></div>`;
  const build = async () => {
    const desc = $("#autoIns").value.trim(); if (!desc) return;
    $("#autoIns").value = "";
    const r = $("#autoReason"); r.innerHTML = `<div class="reason"><div class="rt">Building</div><div class="rstep"><span class="ri"><div class="spin"></div></span> ${esc("Designing the automation from your description")}</div></div>`;
    try {
      const a = await api("POST", "automation-build", { description: desc });
      r.innerHTML = `<div class="reason"><div class="rstep done"><span class="ri">${IC.check}</span> Built “${esc(a.name)}” · ${a.steps.length} steps</div></div>`;
      setTimeout(() => r.innerHTML = "", 3000);
      loadAutos();
    } catch (e) { r.innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
  };
  $("#autoBuild").onclick = build;
  $("#autoIns").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); build(); } });
  $("#autoIns").focus();
  loadAutos();
}
async function loadAutos() {
  const el = $("#autoList"); if (!el) return;
  try {
    const d = await api("GET", "automations"); AUTOS = d.automations || [];
    if (d.error) { el.innerHTML = `<div class="empty-mini">⚠️ ${esc(d.error)}</div>`; return; }
    if (!AUTOS.length) { el.innerHTML = `<div class="empty-state" style="padding:36px 0"><div class="big">${IC.integrations}</div><h3>No automations yet</h3><div>Describe one above and Wakeel will build it in your connectors.</div></div>`; return; }
    el.innerHTML = "";
    AUTOS.forEach(a => {
      const c = document.createElement("div"); c.className = "gcard auto-card"; c.style.cursor = "default";
      c.innerHTML = `<div style="display:flex;align-items:center;gap:11px;margin-bottom:10px">
          <div class="dot ${a.active ? "ag-green" : "ag-slate"}">${IC.bolt}</div>
          <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:15px">${esc(a.name)}</div><div style="font-size:12px;color:var(--muted-2)">Trigger · ${esc(a.trigger)}</div></div>
          <button class="btn sm" data-a="run" title="Run this automation now">${IC.play} Run</button>
          <label class="sw2" title="${a.active ? "Active" : "Paused"}"><input type="checkbox" ${a.active ? "checked" : ""} data-a="toggle"><span></span></label>
          <button class="icn-btn" data-a="del" title="Delete">✕</button></div>
        <div class="auto-steps">${a.steps.map((s, i) => `${i ? `<span class="astep-arr">→</span>` : ""}${autoStepChip(s)}`).join("")}</div>`;
      c.querySelector('[data-a="run"]').onclick = async (ev) => {
        const b = ev.currentTarget; b.disabled = true; b.innerHTML = `<span class="spin"></span>`;
        try { const r = await api("POST", "automation-run", { id: a.id });
          if (r.ok) toast("Automation ran — check the results in your connectors.");
          else toast(r.message || "Run failed", !r.needs_connector);
        } catch (e) { toast("⚠️ " + e.message, true); }
        finally { b.disabled = false; b.innerHTML = `${IC.play} Run`; }
      };
      c.querySelector('[data-a="toggle"]').onchange = async (e) => { try { await api("POST", "automation-toggle", { id: a.id, active: e.target.checked }); } catch (err) { alert(err.message); e.target.checked = !e.target.checked; } };
      c.querySelector('[data-a="del"]').onclick = async () => { if (!confirm("Delete this automation?")) return; try { await api("POST", "automation-delete", { id: a.id }); loadAutos(); } catch (err) { alert(err.message); } };
      el.appendChild(c);
    });
  } catch (e) { el.innerHTML = `<div class="empty-mini">⚠️ ${esc(e.message)}</div>`; }
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
    <div class="help-cta"><div><b>See it end to end</b><span>Take the 12-step product tour — one full cycle, with real screens.</span></div><a class="btn primary" href="${TOUR_URL}" target="_blank">${IC.play} Product tour ↗</a></div>
    <div style="text-align:center;margin-top:14px"><span class="linky" id="hcBuild">Build your first agent</span> · <a class="linky" href="https://champions.innoventures.ae" target="_blank">Champions ↗</a></div>
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
    <button class="btn block primary" id="pmTour" style="margin-bottom:10px">${IC.play} Take the product tour</button>
    <button class="btn block" id="pmHelp" style="margin-bottom:12px">${IC.help} Getting started</button>
    <div class="side-sub" style="padding-inline:0">Activity</div>
    <div id="pmActs" style="max-height:250px;overflow:auto"><div class="empty-mini">…</div></div>
    <button class="btn block" style="margin-top:14px;border-color:#5a1e26;color:#ff9ba3" id="pmOut">Sign out</button>
  </div>`;
  document.body.appendChild(d);
  d.onclick = () => d.remove(); $("#pmx").onclick = () => d.remove();
  $("#pmTour").onclick = () => window.open(TOUR_URL, "_blank", "noopener");
  $("#pmHelp").onclick = () => { d.remove(); openHelp(); };
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
  const mg = q.match(/[?&]magic=([A-Za-z0-9_-]+)/);
  if (mg) {
    history.replaceState(null, "", location.pathname + location.hash);
    try { const r = await api("POST", "magic-consume", { token: mg[1] }); if (r && r.token) document.cookie = `wakeel_t=${r.token}; Path=/; Max-Age=86400; SameSite=Lax`; }
    catch (e) { ME = null; renderLogin(); setTimeout(() => { const el = document.getElementById("err"); if (el) el.textContent = "This sign-in link has expired. Request a new one."; }, 30); return; }
  }
  const rn = q.match(/[?&]run=([^&]+)/); if (rn) window.__autorun = decodeURIComponent(rn[1]);
  const nd = q.match(/[?&]node=(\d+)/); if (nd) window.__autonode = parseInt(nd[1]);
  const tl = q.match(/[?&]tool=(\d+)/); if (tl) window.__autotool = parseInt(tl[1]);
  const sb = q.match(/[?&]sub=(overview|flow|triggers|automation|records|evaluate|memory|governance|instructions|simple)/); if (sb) window.__autosub = sb[1];
  if (q.match(/[?&]m365=1/)) { window.__autom365 = true; window.__autosub = "triggers"; }
  const cf = q.match(/[?&]config=([^&]+)/); if (cf) { window.__autoconfig = decodeURIComponent(cf[1]); VIEW = "integrations"; }
  if (q.match(/[?&]talk=1/) || location.hash === "#talk") { window.__autotalk = true; VIEW = "home"; }
  if (m) history.replaceState(null, "", location.pathname + location.hash);
  const h = location.hash.replace("#", "");
  if (h.startsWith("agent/")) { AGENT = h.split("/")[1]; VIEW = "agent"; ASUB = window.__autosub || "overview"; COPILOT = ASUB !== "overview"; window.__autosub = null; }
  else if (["home", "skills", "teams", "governance", "security", "projects", "inbox", "tasks", "templates", "integrations", "automations", "views", "developers"].includes(h)) VIEW = h;
  try { ME = await api("GET", "me"); } catch (e) { ME = null; }
  if (!ME) return renderLogin();
  try { await api("GET", "sso"); } catch (e) {}
  renderShell();
  if (window.__autotalk) { window.__autotalk = null; setTimeout(openTalk, 350); }
  startVersionWatch();
}
// detect when a newer build is deployed and prompt a reload (fixes stale-cache confusion)
let __updBar = false;
function startVersionWatch() {
  const check = async () => {
    try {
      const h = await api("GET", "health");
      if (h && h.asset_v && window.__WV && String(h.asset_v) !== String(window.__WV) && !__updBar) {
        __updBar = true;
        const b = document.createElement("div"); b.className = "upd-bar";
        b.innerHTML = `${IC.spark} <span>${t("Wakeel was updated — reload to get the latest.")}</span><button class="btn sm" id="updReload">${t("Reload")}</button>`;
        document.body.appendChild(b);
        $("#updReload").onclick = () => location.reload(true);
      }
    } catch (e) {}
  };
  setInterval(check, 45000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
}
boot();
