import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  queryUrbanRenewalByAddress,
  queryConstructionProgress,
  type SourceInfo,
} from "./db-queries";
import { queryXplan } from "./xplan-queries";
import { trimRecord } from "./utils";

const sourcesSchema = z.array(
  z.object({
    dataset: z.string(),
    resourceId: z.string(),
    fetchedAt: z.string(),
    url: z.string(),
  }),
);

function settled<T>(
  result: PromiseSettledResult<T>,
): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

export const searchByAddress = createTool({
  id: "search-by-address",
  description:
    "Search for information about a specific address (city + street + optional house number). Queries Pinui Binui projects, XPLAN planning authority plans, and construction progress in parallel. Use when the user asks about a specific property, street, or building.",
  inputSchema: z.object({
    city: z.string().describe("City name in Hebrew (e.g., בת ים)"),
    street: z.string().describe("Street name in Hebrew (e.g., השמונאים)"),
    houseNumber: z
      .string()
      .optional()
      .describe("House number (e.g., 22)"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    address: z.object({
      city: z.string(),
      street: z.string(),
      houseNumber: z.string().optional(),
    }),
    pinuiBinui: z.object({
      found: z.boolean(),
      projects: z.array(z.record(z.string(), z.unknown())),
    }),
    planningAuthority: z.object({
      found: z.boolean(),
      plans: z.array(z.record(z.string(), z.unknown())),
    }),
    constructionProgress: z.object({
      found: z.boolean(),
      buildings: z.array(z.record(z.string(), z.unknown())),
    }),
    sources: sourcesSchema,
  }),
  execute: async ({ city, street, houseNumber }) => {
    const addressLabel = houseNumber
      ? `${street} ${houseNumber}, ${city}`
      : `${street}, ${city}`;

    console.log(`[searchByAddress] searching: ${addressLabel}`);

    const searchTerm = houseNumber ? `${street} ${houseNumber}` : street;

    const [pbResult, xplanResult, constructionResult] =
      await Promise.allSettled([
        queryUrbanRenewalByAddress({ city, searchTerm, limit: 10 }),
        queryXplan({ city, keyword: searchTerm, limit: 10 }),
        queryConstructionProgress({ city, siteName: street, limit: 10 }),
      ]);

    const pb = settled(pbResult);
    const xplan = settled(xplanResult);
    const construction = settled(constructionResult);

    const sources: SourceInfo[] = [];

    // Map PB results
    const pbProjects = (pb?.records ?? []).map((r) => ({
      projectNumber: r.mispar_mitham,
      city: r.yeshuv,
      neighborhood: r.shem_mitcham,
      matchScore: r.match_score,
      existingUnits: r.yachad_kayam,
      additionalUnits: r.yachad_tosafti,
      totalProposedUnits: r.yachad_mutza,
      planNumber: r.mispar_tochnit,
      status: r.status,
      track: r.maslul,
      yearApproved: r.shnat_matan_tokef,
      underConstruction: r.bebitzua,
      mavatLink: r.kishur_latar || null,
    }));
    if (pb?.source) sources.push(pb.source);

    // Map XPLAN results
    const plans = (xplan?.records ?? []).map((r) => ({
      planNumber: r.pl_number,
      planName: r.pl_name,
      status: r.station_desc,
      landUseTypes: r.pl_landuse_string,
      housingUnitsDelta: r.quantity_delta_120,
      objectives: r.pl_objectives,
      mavatLink: r.pl_url,
    }));
    if (xplan?.source) sources.push(xplan.source);

    // Map construction results
    const buildings = (construction?.records ?? []).map((r) =>
      trimRecord({
        district: r.mahoz,
        city: r.yeshuv_lamas,
        site: r.atar,
        complexName: r.shem_mitham,
        gush: r.gush,
        helka: r.helka,
        buildingNumber: r.mispar_binyan,
        floors: r.komot_binyan,
        units: r.yehidot_binyan,
        contractYear: r.shnat_hoze,
      }),
    );
    if (construction?.source) sources.push(construction.source);

    const totalFinds =
      pbProjects.length + plans.length + buildings.length;

    const parts: string[] = [];
    if (pbProjects.length > 0) {
      parts.push(
        `${pbProjects.length} Pinui Binui project(s)`,
      );
    }
    if (plans.length > 0) {
      parts.push(`${plans.length} planning authority plan(s)`);
    }
    if (buildings.length > 0) {
      parts.push(
        `${buildings.length} construction progress record(s)`,
      );
    }

    const summary =
      totalFinds > 0
        ? `Found ${totalFinds} result(s) for ${addressLabel}: ${parts.join(", ")}.`
        : `No results found for ${addressLabel} across Pinui Binui projects, planning authority, and construction progress databases.`;

    return {
      summary,
      address: { city, street, houseNumber },
      pinuiBinui: { found: pbProjects.length > 0, projects: pbProjects },
      planningAuthority: { found: plans.length > 0, plans },
      constructionProgress: {
        found: buildings.length > 0,
        buildings,
      },
      sources,
    };
  },
});
