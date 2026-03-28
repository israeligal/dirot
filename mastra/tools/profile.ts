import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  return neon(url);
}

function getUserId(context: { agent?: { resourceId?: string } }): string {
  const userId = context?.agent?.resourceId;
  if (!userId) throw new Error("User not authenticated — no resourceId in context");
  return userId;
}

const PROFILE_FIELDS = [
  "investorType",
  "investmentHorizon",
  "riskTolerance",
  "budgetRange",
  "experienceLevel",
  "areasOfInterest",
  "responseStyle",
  "customInstructions",
] as const;

export const getProfile = createTool({
  id: "get-profile",
  description:
    "Load the user's investor profile (type, horizon, risk, budget, experience, areas, response style, custom instructions). Call at the start of each conversation to personalize analysis. Returns null fields for unset preferences.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    profile: z.record(z.string(), z.unknown()).nullable(),
  }),
  execute: async (_input, context) => {
    const userId = getUserId(context);
    const sql = getSql();

    try {
      const rows = await sql`
        SELECT "investorType", "investmentHorizon", "riskTolerance", "budgetRange",
               "experienceLevel", "areasOfInterest", "responseStyle", "customInstructions",
               "createdAt", "updatedAt"
        FROM user_preferences
        WHERE "userId" = ${userId}
      `;

      if (rows.length === 0) {
        return { profile: null };
      }

      return { profile: rows[0] };
    } catch (err) {
      console.error("[getProfile] error:", err);
      return { profile: null };
    }
  },
});

type Sql = NeonQueryFunction<false, false>;

async function updateField({
  sql,
  field,
  value,
  userId,
  now,
}: {
  sql: Sql;
  field: string;
  value: string;
  userId: string;
  now: Date;
}): Promise<void> {
  switch (field) {
    case "investorType":
      await sql`UPDATE user_preferences SET "investorType" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      break;
    case "investmentHorizon":
      await sql`UPDATE user_preferences SET "investmentHorizon" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      break;
    case "riskTolerance":
      await sql`UPDATE user_preferences SET "riskTolerance" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      break;
    case "budgetRange":
      await sql`UPDATE user_preferences SET "budgetRange" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      break;
    case "experienceLevel":
      await sql`UPDATE user_preferences SET "experienceLevel" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      break;
    case "areasOfInterest":
      await sql`UPDATE user_preferences SET "areasOfInterest" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      break;
    case "responseStyle":
      await sql`UPDATE user_preferences SET "responseStyle" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      break;
    case "customInstructions":
      await sql`UPDATE user_preferences SET "customInstructions" = ${value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      break;
  }
}

export const updateProfile = createTool({
  id: "update-profile",
  description:
    "Save or update a field in the user's investor profile. Call when the user mentions a preference (e.g., 'I'm looking for long-term investment') or when you learn something about them. Only update one field at a time. For areasOfInterest, pass a JSON array string.",
  inputSchema: z.object({
    field: z.enum(PROFILE_FIELDS).describe("Profile field to update"),
    value: z.string().describe("New value for the field"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async (input, context) => {
    const userId = getUserId(context);
    const sql = getSql();
    const now = new Date();

    try {
      // Check if row exists
      const existing = await sql`
        SELECT id FROM user_preferences WHERE "userId" = ${userId}
      `;

      // Insert row with defaults if it doesn't exist
      if (existing.length === 0) {
        const id = crypto.randomUUID();
        await sql`
          INSERT INTO user_preferences (id, "userId", "createdAt", "updatedAt")
          VALUES (${id}, ${userId}, ${now}, ${now})
        `;
      }

      // Update the specific field
      await updateField({ sql, field: input.field, value: input.value, userId, now });

      return { success: true, message: `Updated ${input.field} successfully.` };
    } catch (err) {
      console.error("[updateProfile] error:", err);
      return { success: false, message: "Failed to update profile." };
    }
  },
});
