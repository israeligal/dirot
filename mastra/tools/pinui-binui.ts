import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { queryUrbanRenewal } from "./db-queries";
import { formatGovMapUrl } from "./utils";

export const searchPinuiBinui = createTool({
  id: "search-pinui-binui",
  description:
    "Search for Pinui Binui (urban renewal) projects by city, neighborhood, or status. Returns project details including units, plan status, and links to maps/plans.",
  inputSchema: z.object({
    city: z.string().optional().describe("City name in Hebrew (e.g., בת ים)"),
    neighborhood: z.string().optional().describe("Neighborhood or complex name in Hebrew"),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    projects: z.array(z.record(z.string(), z.unknown())),
    sources: z.array(z.object({
      dataset: z.string(), resourceId: z.string(), fetchedAt: z.string(), url: z.string(),
    })),
  }),
  execute: async (input) => {
    console.log("[searchPinuiBinui] input:", JSON.stringify(input));
    let result;
    try {
      result = await queryUrbanRenewal({
        city: input.city,
        neighborhood: input.neighborhood,
        limit: input.limit,
        offset: input.offset,
      });
      console.log("[searchPinuiBinui] got", result.total, "results");
    } catch (err) {
      console.error("[searchPinuiBinui] DB error:", err);
      return { summary: "Database query failed", total: 0, projects: [], sources: [] };
    }

    const projects = result.records.map((r) => ({
      projectNumber: r.mispar_mitham,
      city: r.yeshuv,
      cityCode: r.semel_yeshuv,
      neighborhood: r.shem_mitcham,
      existingUnits: r.yachad_kayam,
      additionalUnits: r.yachad_tosafti,
      totalProposedUnits: r.yachad_mutza,
      declarationDate: r.taarich_hachraza,
      planNumber: r.mispar_tochnit,
      mavatLink: r.kishur_latar || null,
      govMapLink: r.kishur_la_mapa || formatGovMapUrl({ city: String(r.yeshuv ?? "") }),
      totalPermits: r.sach_heterim,
      track: r.maslul,
      yearApproved: r.shnat_matan_tokef,
      underConstruction: r.bebitzua,
      status: r.status,
    }));

    const summary = `Found ${result.total} Pinui Binui projects${input.city ? ` in ${input.city}` : ""}${input.neighborhood ? ` (${input.neighborhood})` : ""}. Showing ${projects.length} results.`;
    const sources = result.source ? [result.source] : [];

    return { summary, total: result.total, projects, sources };
  },
});
