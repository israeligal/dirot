import { Resend } from "resend"

let _resend: Resend | null = null

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export async function sendEarlyAccessNotification({
  email,
  name,
}: {
  email: string
  name?: string
}) {
  const adminEmail =
    process.env.EARLY_ACCESS_NOTIFY_EMAIL || "israeligal2@gmail.com"
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev"

  await getResend().emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `בקשת גישה מוקדמת: ${email}`,
    html: `<div dir="rtl" style="font-family: sans-serif; padding: 20px;">
      <h2 style="color: #1a1a1a;">בקשת גישה מוקדמת חדשה לדירות</h2>
      <table style="border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold; color: #555;">שם:</td>
          <td style="padding: 8px 0;">${name || "לא צוין"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold; color: #555;">אימייל:</td>
          <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold; color: #555;">זמן:</td>
          <td style="padding: 8px 0;">${new Date().toLocaleString("he-IL")}</td>
        </tr>
      </table>
    </div>`,
  })
}
