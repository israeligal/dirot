import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

const ALLOWED_FIELDS = new Set([
  "investorType",
  "investmentHorizon",
  "riskTolerance",
  "budgetRange",
  "experienceLevel",
  "areasOfInterest",
  "responseStyle",
  "customInstructions",
])

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sql = neon(process.env.DATABASE_URL!)
  const userId = session.user.id

  const rows = await sql`
    SELECT "investorType", "investmentHorizon", "riskTolerance",
           "budgetRange", "experienceLevel", "areasOfInterest",
           "responseStyle", "customInstructions"
    FROM user_preferences WHERE "userId" = ${userId}
  `

  return NextResponse.json({ profile: rows[0] ?? null })
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { field, value } = body as { field?: string; value?: string | null }

  if (!field || !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 })
  }

  const sql = neon(process.env.DATABASE_URL!)
  const userId = session.user.id
  const now = new Date()

  // Ensure the row exists
  await sql`
    INSERT INTO user_preferences (id, "userId", "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${userId}, ${now}, ${now})
    ON CONFLICT ("userId") DO NOTHING
  `

  // Update the specific field
  const v = value ?? null
  if (field === "investorType") {
    await sql`UPDATE user_preferences SET "investorType" = ${v}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "investmentHorizon") {
    await sql`UPDATE user_preferences SET "investmentHorizon" = ${v}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "riskTolerance") {
    await sql`UPDATE user_preferences SET "riskTolerance" = ${v}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "budgetRange") {
    await sql`UPDATE user_preferences SET "budgetRange" = ${v}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "experienceLevel") {
    await sql`UPDATE user_preferences SET "experienceLevel" = ${v}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "areasOfInterest") {
    await sql`UPDATE user_preferences SET "areasOfInterest" = ${v}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "responseStyle") {
    await sql`UPDATE user_preferences SET "responseStyle" = ${v}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "customInstructions") {
    await sql`UPDATE user_preferences SET "customInstructions" = ${v}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  }

  const rows = await sql`
    SELECT "investorType", "investmentHorizon", "riskTolerance",
           "budgetRange", "experienceLevel", "areasOfInterest",
           "responseStyle", "customInstructions"
    FROM user_preferences WHERE "userId" = ${userId}
  `

  return NextResponse.json({ profile: rows[0] ?? null })
}
