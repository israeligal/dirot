import { NextResponse } from "next/server"
import { neon, NeonQueryFunction } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

type Sql = NeonQueryFunction<false, false>

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

async function updateField({
  sql,
  field,
  value,
  userId,
  now,
}: {
  sql: Sql
  field: string
  value: string | null
  userId: string
  now: Date
}): Promise<void> {
  switch (field) {
    case "investorType":
      await sql`UPDATE user_preferences SET "investorType" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
      break
    case "investmentHorizon":
      await sql`UPDATE user_preferences SET "investmentHorizon" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
      break
    case "riskTolerance":
      await sql`UPDATE user_preferences SET "riskTolerance" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
      break
    case "budgetRange":
      await sql`UPDATE user_preferences SET "budgetRange" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
      break
    case "experienceLevel":
      await sql`UPDATE user_preferences SET "experienceLevel" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
      break
    case "areasOfInterest":
      await sql`UPDATE user_preferences SET "areasOfInterest" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
      break
    case "responseStyle":
      await sql`UPDATE user_preferences SET "responseStyle" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
      break
    case "customInstructions":
      await sql`UPDATE user_preferences SET "customInstructions" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`
      break
  }
}

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
  await updateField({ sql, field, value: value ?? null, userId, now })

  const rows = await sql`
    SELECT "investorType", "investmentHorizon", "riskTolerance",
           "budgetRange", "experienceLevel", "areasOfInterest",
           "responseStyle", "customInstructions"
    FROM user_preferences WHERE "userId" = ${userId}
  `

  return NextResponse.json({ profile: rows[0] ?? null })
}
