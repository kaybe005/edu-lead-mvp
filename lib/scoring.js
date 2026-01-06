// lib/scoring.js

export function scoreLead(answers) {
  const location = answers.location_status; // Onshore/Offshore
  const refusal = answers.previous_refusal === "Yes";
  const budget = answers.budget_range || "";
  const budgetOK = budget.includes("$15,000–$25,000") || budget.includes("$25,000+");

  // If refusal + low budget often becomes cold for MVP.
  if (refusal && !budgetOK) return "COLD";

  if (location === "Onshore") {
    const expiry = (answers.visa_expiry || "").toLowerCase();
    const urgent = expiry.includes("less") || expiry.includes("3–6") || expiry.includes("3-6");
    const hasIntent = !!(answers.course_interest_or_intent && answers.course_interest_or_intent !== "Just advice");

    if (urgent && budgetOK && !refusal && hasIntent) return "HOT";
    if (budgetOK && !refusal) return "WARM";
    return "COLD";
  }

  // Offshore
  const timeline = (answers.start_timeline || "").toLowerCase();
  const fast = timeline.includes("next intake") || timeline.includes("≤") || timeline.includes("6 months");
  const exploring = timeline.includes("explor");

  if (fast && budgetOK && !refusal) return "HOT";
  if (!exploring && budgetOK && !refusal) return "WARM";
  return "COLD";
}

export function shouldShowBooking(leadType) {
  return leadType === "HOT";
}
