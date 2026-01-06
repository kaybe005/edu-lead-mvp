// lib/email.js
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNotificationEmail({ subject, html }) {
  const to = process.env.NOTIFY_TO_EMAIL
  const from = process.env.EMAIL_FROM || "Lead Bot <onboarding@resend.dev>"

  if (!process.env.RESEND_API_KEY || !to) {
    throw new Error("Missing RESEND_API_KEY or NOTIFY_TO_EMAIL")
  }

  await resend.emails.send({
    from,
    to,
    subject,
    html,
  })
}
