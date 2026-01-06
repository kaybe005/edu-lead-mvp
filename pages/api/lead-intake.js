// pages/api/lead-intake.js
import { appendLeadRow } from "../../lib/sheets";
import { scoreLead, shouldShowBooking } from "../../lib/scoring";
import { FLOW_VERSION } from "../../lib/questions";
import { sendNotificationEmail } from "../../lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { answers, source } = req.body || {};
  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "Missing answers object" });
  }

  const leadType = scoreLead(answers);
  const showBooking = shouldShowBooking(leadType);
  const calendarUrl = process.env.CALENDLY_URL || "";

  const now = new Date().toISOString();
  const row = [
    now,
    answers.location_status || "",
    answers.country || "",
    answers.visa_expiry || "",
    answers.education_level || "",
    answers.course_interest_or_intent || "",
    answers.start_timeline || "",
    answers.budget_range || "",
    answers.previous_refusal || "",
    answers.full_name || "",
    answers.email || "",
    leadType,
  ];

  // Log to Sheets
  await appendLeadRow(row);

  // Email notify (you for now)
  const html = `
    <h2>New Lead (${leadType})</h2>
    <ul>
      <li><b>Location:</b> ${answers.location_status || ""}</li>
      <li><b>Country:</b> ${answers.country || "-"}</li>
      <li><b>Visa expiry:</b> ${answers.visa_expiry || "-"}</li>
      <li><b>Education:</b> ${answers.education_level || ""}</li>
      <li><b>Intent/Course:</b> ${answers.course_interest_or_intent || ""}</li>
      <li><b>Start timeline:</b> ${answers.start_timeline || "-"}</li>
      <li><b>Budget:</b> ${answers.budget_range || ""}</li>
      <li><b>Refusal:</b> ${answers.previous_refusal || ""}</li>
      <li><b>Name:</b> ${answers.full_name || ""}</li>
      <li><b>Email:</b> ${answers.email || ""}</li>
      <li><b>Source:</b> ${source || "unknown"}</li>
    </ul>
    <p><b>Booking link:</b> ${showBooking ? calendarUrl : "(not shown)"} </p>
    <p style="color:#666;">Flow version: ${FLOW_VERSION}</p>
  `;

  await sendNotificationEmail({
    subject: `New Student Lead: ${leadType} — ${answers.full_name || "Unknown"}`,
    html,
  });

  return res.status(200).json({
    lead_type: leadType,
    show_booking: showBooking,
    calendar_url: showBooking ? calendarUrl : "",
  });
}
