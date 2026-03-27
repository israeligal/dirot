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
    SELECT * FROM user_preferences WHERE "userId" = ${userId}
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

  // Ensure the row exists before updating
  await sql`
    INSERT INTO user_preferences (id, "userId", "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${userId}, ${now}, ${now})
    ON CONFLICT ("userId") DO NOTHING
  `

  await updateField({ sql, field, value: value ?? null, userId, now })

  const rows = await sql`
    SELECT * FROM user_preferences WHERE "userId" = ${userId}
  `

  return NextResponse.json({ profile: rows[0] })
}

async function updateField({
  sql,
  field,
  value,
  userId,
  now,
}: {
  sql: ReturnType<typeof neon>
  field: string
  value: string | null
  userId: string
  now: Date
}) {
  if (field === "investorType") {
    await sql`UPDATE user_preferences SET "investorType" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "investmentHorizon") {
    await sql`UPDATE user_preferences SET "investmentHorizon" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "riskTolerance") {
    await sql`UPDATE user_preferences SET "riskTolerance" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "budgetRange") {
    await sql`UPDATE user_preferences SET "budgetRange" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "experienceLevel") {
    await sql`UPDATE user_preferences SET "experienceLevel" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "areasOfInterest") {
    await sql`UPDATE user_preferences SET "areasOfInterest" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "responseStyle") {
    await sql`UPDATE user_preferences SET "responseStyle" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  } else if (field === "customInstructions") {
    await sql`UPDATE user_preferences SET "customInstructions" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
  }
}
