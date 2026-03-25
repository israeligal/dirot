import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { queryConstructionSites, queryConstructionProgress } from "./db-queries";

const sourcesSchema = z.array(z.object({
  dataset: z.string(), resourceId: z.string(), fetchedAt: z.string(), url: z.string(),
}));

export const searchConstructionSites = createTool({
  id: "search-construction-sites",
  description:
    "Search active construction sites by city or building type. Shows contractor, safety record, and sanctions.",
  inputSchema: z.object({
    city: z.string().optional().describe("City name in Hebrew"),
    buildType: z.string().optional().describe("Building type (e.g., מגורים for residential)"),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    sites: z.array(z.record(z.string(), z.unknown())),
    sources: sourcesSchema,
  }),
  execute: async (input) => {
    const result = await queryConstructionSites({
      city: input.city,
      buildType: input.buildType,
      limit: input.limit,
      offset: input.offset,
    });

    const sites = result.records.map((r) => ({
      workId: r.work_id,
      siteName: r.site_name,
      contractor: r.executor_name,
      contractorId: r.executor_id,
      foremanName: r.foreman_name,
      hasCranes: r.has_cranes === 1,
      city: r.city_name,
      buildingType: r.build_types,
      safetyWarnings: r.safety_warrents,
      sanctions: r.sanctions,
      sanctionsAmount: r.sanctions_sum,
    }));

    const summary = `Found ${result.total} active construction sites${input.city ? ` in ${input.city}` : ""}. Showing ${sites.length} results.`;
    const sources = result.source ? [result.source] : [];

    return { summary, total: result.total, sites, sources };
  },
});

export const searchConstructionProgress = createTool({
  id: "search-construction-progress",
  description:
    "Search construction progress by city or gush (block) number. Shows building stages and timeline. Note: only covers periphery cities (not Gush Dan).",
  inputSchema: z.object({
    city: z.string().optional().describe("City name in Hebrew"),
    gush: z.string().optional().describe("Gush (block) number"),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    buildings: z.array(z.record(z.string(), z.unknown())),
    sources: sourcesSchema,
  }),
  execute: async (input) => {
    const result = await queryConstructionProgress({
      city: input.city,
      gush: input.gush,
      limit: input.limit,
      offset: input.offset,
    });

    const buildings = result.records.map((r) => ({
      district: r.mahoz,
      city: r.yeshuv_lamas,
      site: r.atar,
      complexNumber: r.mispar_mitham,
      complexName: r.shem_mitham,
      gush: r.gush,
      helka: r.helka,
      buildingNumber: r.mispar_binyan,
      floors: r.komot_binyan,
      units: r.yehidot_binyan,
      area: r.shetah,
      contractYear: r.shnat_hoze,
      stage5Date: r.stage_5_date,
      stage8Date: r.stage_8_date,
      stage16Date: r.stage_16_date,
      stage18Date: r.stage_18_date,
      stage29Date: r.stage_29_date,
      stage39Date: r.stage_39_date,
      stage42Date: r.stage_42_date,
    }));

    const summary = `Found ${result.total} construction progress records${input.city ? ` in ${input.city}` : ""}. Showing ${buildings.length} results.`;
    const sources = result.source ? [result.source] : [];

    return { summary, total: result.total, buildings, sources };
  },
});
