import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

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
      if (input.field === "investorType") {
        await sql`UPDATE user_preferences SET "investorType" = ${input.value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      } else if (input.field === "investmentHorizon") {
        await sql`UPDATE user_preferences SET "investmentHorizon" = ${input.value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      } else if (input.field === "riskTolerance") {
        await sql`UPDATE user_preferences SET "riskTolerance" = ${input.value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      } else if (input.field === "budgetRange") {
        await sql`UPDATE user_preferences SET "budgetRange" = ${input.value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      } else if (input.field === "experienceLevel") {
        await sql`UPDATE user_preferences SET "experienceLevel" = ${input.value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      } else if (input.field === "areasOfInterest") {
        await sql`UPDATE user_preferences SET "areasOfInterest" = ${input.value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      } else if (input.field === "responseStyle") {
        await sql`UPDATE user_preferences SET "responseStyle" = ${input.value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      } else if (input.field === "customInstructions") {
        await sql`UPDATE user_preferences SET "customInstructions" = ${input.value}, "updatedAt" = ${now} WHERE "userId" = ${userId}`;
      }

      return { success: true, message: `Updated ${input.field} successfully.` };
    } catch (err) {
      console.error("[updateProfile] error:", err);
      return { success: false, message: "Failed to update profile." };
    }
  },
});
