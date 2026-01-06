// lib/questions.js

export const FLOW_VERSION = "student-v1";

export const QUESTIONS = {
  // Step 0 (branch)
  location_status: {
    key: "location_status",
    prompt: "Are you currently in Australia on a student visa? (Yes/No)",
    options: ["Yes", "No"],
    normalize: (v) => (v?.toLowerCase().includes("y") ? "Onshore" : "Offshore"),
  },

  // Onshore flow
  visa_expiry: {
    key: "visa_expiry",
    prompt:
      "When does your current student visa expire? (Less than 3 months / 3–6 months / More than 6 months)",
    options: ["Less than 3 months", "3–6 months", "More than 6 months"],
  },
  education_level_onshore: {
    key: "education_level",
    prompt: "What is your highest completed education? (Diploma / Bachelor / Master)",
    options: ["Diploma", "Bachelor", "Master"],
  },
  intent_onshore: {
    key: "course_interest_or_intent",
    prompt:
      "What are you looking to do next? (Course extension / Course change / New qualification / Just advice)",
    options: ["Course extension", "Course change", "New qualification", "Just advice"],
  },

  // Offshore flow
  country: {
    key: "country",
    prompt: "Which country are you currently in?",
  },
  education_level_offshore: {
    key: "education_level",
    prompt:
      "What is your highest completed education? (Year 12 / Diploma / Bachelor / Master)",
    options: ["Year 12", "Diploma", "Bachelor", "Master"],
  },
  course_interest: {
    key: "course_interest_or_intent",
    prompt: "What course level are you interested in? (Diploma / Bachelor / Master / VET)",
    options: ["Diploma", "Bachelor", "Master", "VET"],
  },
  start_timeline: {
    key: "start_timeline",
    prompt:
      "When do you want to start studying in Australia? (Next intake ≤ 6 months / 6–12 months / Just exploring)",
    options: ["Next intake (≤ 6 months)", "6–12 months", "Just exploring"],
    normalize: (v) => {
      const t = (v || "").toLowerCase();
      if (t.includes("explor")) return "Just exploring";
      if (t.includes("6–12") || t.includes("6-12") || t.includes("12")) return "6–12 months";
      return "Next intake (≤ 6 months)";
    },
  },

  // Shared
  budget_range: {
    key: "budget_range",
    prompt: "What is your approximate budget per year (AUD)? (Under $15,000 / $15,000–$25,000 / $25,000+)",
    options: ["Under $15,000", "$15,000–$25,000", "$25,000+"],
    normalize: (v) => {
  const raw = String(v || "").trim().toLowerCase();

  // 1) Exact label matches (handles en-dash vs hyphen)
  if (raw.includes("under")) return "Under $15,000";
  if (raw.includes("$25,000+") || raw.includes("25000+")) return "$25,000+";
  if (raw.includes("$15,000") && raw.includes("$25,000")) return "$15,000–$25,000";
  if (raw.includes("15,000") && raw.includes("25,000")) return "$15,000–$25,000";

  // 2) Range input like "15000-25000" or "15000–25000"
  const cleaned = raw.replace(/,/g, "");
  const rangeMatch = cleaned.match(/(\d{4,6})\s*[-–]\s*(\d{4,6})/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[2], 10);
    const max = Math.max(a, b);
    if (max < 15000) return "Under $15,000";
    if (max <= 25000) return "$15,000–$25,000";
    return "$25,000+";
  }

  // 3) Single number input like "20000"
  const numMatch = cleaned.match(/(\d{4,6})/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n < 15000) return "Under $15,000";
    if (n <= 25000) return "$15,000–$25,000";
    return "$25,000+";
  }

  // 4) Fallback to safest middle bucket
  return "$15,000–$25,000";
},

  },
  previous_refusal: {
    key: "previous_refusal",
    prompt: "Have you had any visa refusals before? (Yes/No)",
    options: ["Yes", "No"],
    normalize: (v) => (v?.toLowerCase().includes("y") ? "Yes" : "No"),
  },
  contact: {
    key: "contact",
    prompt: "Please share your full name and best contact email (e.g., John Smith, john@email.com).",
  },
};

// Ordered steps
export const ON_SHORE_STEPS = [
  "location_status",
  "visa_expiry",
  "education_level_onshore",
  "intent_onshore",
  "budget_range",
  "previous_refusal",
  "contact",
];

export const OFF_SHORE_STEPS = [
  "location_status",
  "country",
  "education_level_offshore",
  "course_interest",
  "start_timeline",
  "budget_range",
  "previous_refusal",
  "contact",
];

// Helpers
export function getStepsFor(locationStatus) {
  return locationStatus === "Onshore" ? ON_SHORE_STEPS : OFF_SHORE_STEPS;
}

export function safePickOption(input, options) {
  if (!options || options.length === 0) return input?.trim() || "";
  const t = (input || "").toLowerCase();
  // simple fuzzy pick
  const found = options.find((o) => t.includes(o.toLowerCase().replace(/[^a-z0-9]+/g, "")) || t.includes(o.toLowerCase()));
  return found || input?.trim() || "";
}

export function parseContact(text) {
  const raw = (text || "").trim();
  const emailMatch = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0] : "";
  // name = remove email and separators
  const name = raw
    .replace(email, "")
    .replace(/[,|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { full_name: name || "", email: email || "" };
}
