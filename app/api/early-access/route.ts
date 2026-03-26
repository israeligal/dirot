import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendEarlyAccessNotification } from "@/lib/email"

export async function POST(req: Request) {
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

  return NextResponse.json({ success: true, message: "הבקשה נשלחה בהצלחה" })
}
