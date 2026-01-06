// lib/email.js
import nodemailer from "nodemailer";

export async function sendNotificationEmail({ subject, html }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const to = process.env.NOTIFY_TO_EMAIL;
  if (!host || !user || !pass || !to) {
    throw new Error("Missing SMTP config or NOTIFY_TO_EMAIL");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Lead Bot" <${user}>`,
    to,
    subject,
    html,
  });
}
