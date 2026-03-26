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

export const saveProperty = createTool({
  id: "save-property",
  description:
    "Save an address to the user's property portfolio with analysis snapshot and score. Use when the user says 'save this', 'add to my properties', 'remember this address'. The user ID is extracted automatically from the session.",
  inputSchema: z.object({
    city: z.string().describe("City name in Hebrew"),
    street: z.string().describe("Street name in Hebrew"),
    houseNumber: z.string().optional().describe("House number"),
    nickname: z.string().optional().describe("User's nickname for this property"),
    notes: z.string().optional().describe("User's notes about this property"),
    score: z.number().optional().describe("Latest score from scoreProject"),
    grade: z.string().optional().describe("Latest grade (A-F)"),
    analysisData: z.string().optional().describe("JSON string of full analysis snapshot"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    propertyId: z.string().optional(),
  }),
  execute: async (input, context) => {
    const userId = getUserId(context);
    const sql = getSql();
    const id = crypto.randomUUID();
    const now = new Date();

    try {
      await sql`
        INSERT INTO saved_properties (id, "userId", city, street, "houseNumber", nickname, notes, score, grade, "analysisData", "lastAnalyzedAt", "createdAt", "updatedAt")
        VALUES (${id}, ${userId}, ${input.city}, ${input.street}, ${input.houseNumber ?? null}, ${input.nickname ?? null}, ${input.notes ?? null}, ${input.score ?? null}, ${input.grade ?? null}, ${input.analysisData ?? null}, ${now}, ${now}, ${now})
      `;

      const label = input.houseNumber ? `${input.street} ${input.houseNumber}, ${input.city}` : `${input.street}, ${input.city}`;
      return { success: true, message: `Saved ${label} to your properties.`, propertyId: id };
    } catch (err) {
      console.error("[saveProperty] error:", err);
      return { success: false, message: "Failed to save property." };
    }
  },
});

export const listProperties = createTool({
  id: "list-properties",
  description:
    "List all saved properties for the current user. Shows addresses, scores, last analyzed dates, and notes. Use when the user says 'show my properties', 'what properties do I have', 'my portfolio'.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    properties: z.array(z.record(z.string(), z.unknown())),
  }),
  execute: async (_input, context) => {
    const userId = getUserId(context);
    const sql = getSql();

    try {
      const rows = await sql`
        SELECT id, city, street, "houseNumber", nickname, notes, score, grade, "lastAnalyzedAt", "createdAt"
        FROM saved_properties
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
      `;

      const properties = rows.map((r) => ({
        id: r.id,
        city: r.city,
        street: r.street,
        houseNumber: r.houseNumber,
        address: r.houseNumber ? `${r.street} ${r.houseNumber}, ${r.city}` : `${r.street}, ${r.city}`,
        nickname: r.nickname,
        notes: r.notes,
        score: r.score,
        grade: r.grade,
        lastAnalyzedAt: r.lastAnalyzedAt,
        savedAt: r.createdAt,
      }));

      const summary = properties.length > 0
        ? `You have ${properties.length} saved properties.`
        : "You don't have any saved properties yet.";

      return { summary, total: properties.length, properties };
    } catch (err) {
      console.error("[listProperties] error:", err);
      return { summary: "Failed to load properties.", total: 0, properties: [] };
    }
  },
});

export const removeProperty = createTool({
  id: "remove-property",
  description:
    "Remove a saved property from the user's portfolio. Can remove by property ID or by address (city + street). Use when the user says 'remove this property', 'delete from my list', 'not interested anymore'.",
  inputSchema: z.object({
    propertyId: z.string().optional().describe("ID of the property to remove"),
    city: z.string().optional().describe("City name to match"),
    street: z.string().optional().describe("Street name to match"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async (input, context) => {
    const userId = getUserId(context);
    const sql = getSql();

    try {
      if (input.propertyId) {
        await sql`DELETE FROM saved_properties WHERE id = ${input.propertyId} AND "userId" = ${userId}`;
        return { success: true, message: "Property removed." };
      }

      if (input.city && input.street) {
        await sql`
          DELETE FROM saved_properties
          WHERE "userId" = ${userId}
            AND city ILIKE ${"%" + input.city + "%"}
            AND street ILIKE ${"%" + input.street + "%"}
        `;
        return { success: true, message: `Removed properties matching ${input.street}, ${input.city}.` };
      }

      return { success: false, message: "Please provide a property ID or address (city + street) to remove." };
    } catch (err) {
      console.error("[removeProperty] error:", err);
      return { success: false, message: "Failed to remove property." };
    }
  },
});
