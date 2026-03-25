import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { queryXplan } from "./xplan-queries";

export const searchXplan = createTool({
  id: "search-xplan",
  description:
    "Search ALL planning authority plans affecting a location (not just Pinui Binui). Finds commercial zones, parks, schools, road widening, and more. Query by city, plan number, keyword, or land use type. Each result includes a MAVAT link for full plan details.",
  inputSchema: z.object({
    city: z.string().optional().describe("City name in Hebrew (e.g., בת ים)"),
    planNumber: z
      .string()
      .optional()
      .describe("Plan number (e.g., 502-0204784)"),
    keyword: z
      .string()
      .optional()
      .describe("Keyword to search in plan name or objectives"),
    landUse: z
      .string()
      .optional()
      .describe("Land use type (e.g., מגורים, מסחר, ציבורי)"),
    status: z
      .string()
      .optional()
      .describe("Plan status filter (e.g., אישור, הפקדה, בבדיקה תכנונית)"),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    hasMore: z.boolean(),
    plans: z.array(z.record(z.string(), z.unknown())),
    sources: z.array(
      z.object({
        dataset: z.string(),
        resourceId: z.string(),
        fetchedAt: z.string(),
        url: z.string(),
      }),
    ),
  }),
  execute: async (input) => {
    const hasSearchParam =
      input.city || input.planNumber || input.keyword || input.landUse;
    if (!hasSearchParam) {
      return {
        summary:
          "Please provide at least one search parameter: city, planNumber, keyword, or landUse",
        total: 0,
        hasMore: false,
        plans: [],
        sources: [],
      };
    }

    console.log("[searchXplan] input:", JSON.stringify(input));
    let result;
    try {
      result = await queryXplan({
        city: input.city,
        planNumber: input.planNumber,
        keyword: input.keyword,
        landUse: input.landUse,
        status: input.status,
        limit: input.limit,
        offset: input.offset,
      });
      console.log("[searchXplan] got", result.total, "results");
    } catch (err) {
      console.error("[searchXplan] API error:", err);
      return {
        summary: "XPLAN query failed",
        total: 0,
        hasMore: false,
        plans: [],
        sources: [],
      };
    }

    const plans = result.records.map((r) => ({
      planNumber: r.pl_number,
      planName: r.pl_name,
      status: r.station_desc,
      landUseTypes: r.pl_landuse_string,
      housingUnitsDelta: r.quantity_delta_120,
      mavatLink: r.pl_url,
      city: r.plan_county_name,
      objectives: r.pl_objectives,
      areaDunam: r.pl_area_dunam,
    }));

    const filters = [
      input.city && `city: ${input.city}`,
      input.planNumber && `plan: ${input.planNumber}`,
      input.keyword && `keyword: "${input.keyword}"`,
      input.landUse && `land use: ${input.landUse}`,
      input.status && `status: ${input.status}`,
    ]
      .filter(Boolean)
      .join(", ");

    const summary = `Found ${result.total} plans (${filters}). ${result.hasMore ? "More results available — increase offset." : ""} Showing ${plans.length} results.`;

    return {
      summary,
      total: result.total,
      hasMore: result.hasMore,
      plans,
      sources: [result.source],
    };
  },
});
