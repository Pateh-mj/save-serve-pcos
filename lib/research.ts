// Canonical facts from the project report ("Design and Development of a Patient Centric
// Orchestration System…", P. Tembo, ICU 2026). Public pages read from here so the website
// cannot drift from the document. Objectives and research questions are quoted verbatim.

export const RESEARCH = {
  title:
    "Design and Development of a Patient Centric Orchestration System for Healthcare Resource Equity Using Robin Hood Subsidization and Multi-Channel Access",
  system: "Patient-Centric Orchestration System (PCOS)",
  prototypeName: "SaveServe",
  author: "Patson Tembo",
  advisor: "Mr Billy Munyenyembe",
  degree: "Bachelor of Information and Communications Technology",
  school: "School of Engineering",
  university: "Information and Communications University",
  universityShort: "ICU",
  location: "Lusaka, Zambia",
  year: 2026,
  email: "tembopatson5@gmail.com",
} as const;

/** "Bachelor of ICT Final Year Project · Information and Communications University (ICU)" */
export const PROJECT_LINE = `Bachelor of ICT Final Year Project · ${RESEARCH.university} (${RESEARCH.universityShort})`;

export const ABSTRACT = [
  "As healthcare systems globally shift toward digital-first models, a growing “digital and economic divide” threatens to leave vulnerable populations behind. This research proposes the development of a Patient-Centric Orchestration System (PCOS) that bridges the gap between high-end private consultation and subsidized community care.",
  "The system leverages a “Robin Hood” Economic Model, where premium-tier subscriptions fund the infrastructure for low-resource users. Uniquely, the project addresses physical accessibility through a medium-agnostic architecture, integrating Offline-First synchronization for remote areas and USSD/SMS gateways for non-smartphone users.",
  "By implementing an automated Hospital Policy Engine, the system ensures that clinical standards and hospital interests are maintained across all socioeconomic tiers. The result is a scalable, financially sustainable hospital management framework that transforms operational efficiency into social equity.",
];

export const GENERAL_OBJECTIVE =
  "To design, develop, and evaluate a Patient-Centric Orchestration System (PCOS) that connects feature phone USSD channels and modern web applications to enable equitable healthcare delivery and automated cross-subsidization.";

export const SPECIFIC_OBJECTIVES = [
  "To identify the operational and technical requirements for a multi-channel (USSD and web) healthcare management platform in low-connectivity settings.",
  "To design and implement an automated “Policy Guardian” middleware to enforce billing policies, cross-subsidization rules, and system logic in real time.",
  "To develop an integrated interface (USSD Gateway and Web Dashboard) that synchronizes feature phone interactions with a centralized database.",
  "To evaluate the performance, system responsiveness, data synchronization accuracy, and user satisfaction of the developed platform.",
];

export const RESEARCH_QUESTIONS = [
  "What are the key operational and technical requirements for delivering a multi-channel healthcare platform in low-connectivity settings?",
  "How can an automated “Policy Guardian” middleware be designed and implemented to enforce real-time cross-subsidization and policy rules?",
  "How effectively can offline USSD interactions and web dashboard workflows be synchronized with a centralized health database?",
  "How well does the PCOS platform perform in terms of system response time, synchronization accuracy, and overall usability?",
];

/** Theoretical framework (report §2.3.3): the two integrated theories. */
export const THEORIES = [
  {
    title: "Robin Hood Business Model",
    citation: "Prahalad & Hart, 2002; Honavar, 2022",
    body: "Revenue from premium, market-priced services is used to subsidise, or fully finance, essential services for people who cannot pay — as in the Aravind Eye Care System — reducing dependence on unpredictable donor funding.",
    inPcos: "The economic foundation: the Policy Guardian redistributes premium-tier revenue to fund community-tier care.",
  },
  {
    title: "Diffusion of Innovations",
    citation: "Rogers, 1962; Kaiser et al., 2025",
    body: "Adoption depends on relative advantage, compatibility, complexity, trialability and observability: innovations that fit users' existing practices and are simple to use spread faster.",
    inPcos: "The technological foundation: two access gateways sized to users' devices — USSD for feature phones, a web dashboard for healthcare staff.",
  },
];

/** Guiding principles named in the Chapter 1 theoretical anchors (§1.12.1). */
export const GUIDING_PRINCIPLES = {
  title: "Health Equity & Digital Health Scaling Principles",
  citation: "WHO, 2025; JMIR, 2025; Farantos et al., 2025",
  body: "mHealth interventions must prioritise multi-channel accessibility across feature phones and smart devices to prevent digital exclusion and ensure equitable care.",
};

/** Problem statement (report §1.6). */
export const PROBLEMS = [
  {
    title: "Web-only health software shuts people out",
    body: "Only around a third of Zambians are active internet users, and more than half of the rural population remains digitally excluded — so systems built only as websites or smartphone apps cannot reach them.",
    citation: "Bbenkele et al., 2025",
  },
  {
    title: "Mobile health tools are not linked to clinic records",
    body: "Health USSD services are mostly one-off reminders or standalone menus, not extensions of the facility's records system — leaving staff to reconcile two disconnected systems.",
    citation: "JMIR, 2024",
  },
  {
    title: "Cross-subsidisation is managed by hand",
    body: "Most facilities run fee-for-service with no automated way to redirect revenue from patients who can pay more to those who cannot; waivers and discounts rely on slow, error-prone paperwork.",
    citation: "Karamagi et al., 2023",
  },
];

/** Significance (report §1.4). */
export const SIGNIFICANCE = [
  {
    title: "Patients & Communities",
    body: "Equitable access to scheduling, triage and record management regardless of smartphone ownership or internet access; low-income users benefit from automated subsidization.",
  },
  {
    title: "Healthcare Administrators & Service Providers",
    body: "A unified platform that syncs USSD interactions with patient records in real time, while the Policy Guardian simplifies billing and subsidy enforcement and reduces financial leakage.",
  },
  {
    title: "Software Developers & Researchers",
    body: "A practical reference architecture for multi-channel applications in resource-constrained environments, integrating USSD with modern databases and automated policy engines.",
  },
];

/** Existing systems compared in report Table 1. */
export const EXISTING_SYSTEMS = [
  {
    name: "M-TIBA (Kenya)",
    features: "Mobile health wallet, USSD integration, donor/insurer top-ups, micro-payments.",
    strengths: "High financial inclusion, ubiquitous USSD accessibility, proven mobile subsidy routing.",
    limitations: "Functions primarily as a financial gateway; lacks integrated clinical workflows and automated triage.",
  },
  {
    name: "Ayushman Bharat Digital Mission (India)",
    features: "National health IDs, standardized APIs, tiered public health coverage integration.",
    strengths: "Massive national scalability, robust interoperability, complex subsidy management.",
    limitations: "High reliance on internet connectivity and smartphone/web infrastructure, excluding offline users.",
  },
  {
    name: "SmartCare (Zambia)",
    features: "National EHR system, clinic-facing smartcard chip technology, facility deployment (~1000 sites).",
    strengths: "Strong institutional data centralization, long-term PEPFAR/CDC backing, public health tracking.",
    limitations: "Facility-bound architecture; lacks patient-facing USSD access and automated billing/orchestration.",
  },
];

/** Design Science Research lifecycle (report §3.2, Hevner et al., 2004). */
export const DSR_STEPS = [
  "Problem identification",
  "Objectives definition",
  "Design and development",
  "Demonstration",
  "Evaluation",
];

/** In-browser simulator disclaimer (report §1.9: testing uses simulated environments). */
export const USSD_PROTOTYPE_NOTE =
  "In this prototype, *384# runs in the in-browser USSD simulator using the Africa's Talking protocol; a live short code requires telecom provisioning.";
