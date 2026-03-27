import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendEarlyAccessNotification } from "@/lib/email"
import { getPostHogClient } from "@/lib/posthog-server"
import { checkRateLimit } from "@/app/lib/rate-limit"

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"
  const { success: rateLimitOk, remaining } = await checkRateLimit({
    identifier: ip,
    endpoint: "early-access",
  })
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    )
  }

  const body = await req.json()
  const { email, name } = body as { email?: string; name?: string }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "אימייל לא תקין" }, { status: 400 })
  }

  // Save to DB
  try {
    const sql = neon(process.env.DATABASE_URL!)
    await sql`
      INSERT INTO early_access_signups (id, email, name, "createdAt")
      VALUES (${crypto.randomUUID()}, ${email}, ${name ?? null}, ${new Date()})
    `
  } catch (err) {
    console.error("[early-access] DB error:", err)
    // Don't fail the request if DB save fails — still send the email
  }

  // Send notification email
  try {
    await sendEarlyAccessNotification({ email, name })
  } catch (err) {
    console.error("[early-access] Email error:", err)
    // Still return success — the signup was saved to DB
  }

  try {
    getPostHogClient().capture({
      distinctId: email,
      event: "early_access_signup_received",
      properties: { email, name: name ?? undefined },
    });
  } catch (err) {
    console.error("[early-access] PostHog error:", err)
  }

  return NextResponse.json({ success: true, message: "הבקשה נשלחה בהצלחה" })
}
