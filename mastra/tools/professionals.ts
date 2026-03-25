import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { queryContractors, queryBrokers, queryAppraisers } from "./db-queries";

const sourcesSchema = z.array(z.object({
  dataset: z.string(), resourceId: z.string(), fetchedAt: z.string(), url: z.string(),
}));

export const searchContractors = createTool({
  id: "search-contractors",
  description:
    "Search registered contractors by name (fuzzy match), city, or branch. Shows classification, scope, and recognition. Uses pg_trgm for fuzzy Hebrew name matching.",
  inputSchema: z.object({
    name: z.string().optional().describe("Contractor name (fuzzy match, Hebrew)"),
    city: z.string().optional().describe("City name in Hebrew"),
    branch: z.string().optional().describe("Branch (e.g., בניה for construction)"),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    contractors: z.array(z.record(z.string(), z.unknown())),
    sources: sourcesSchema,
  }),
  execute: async (input) => {
    const result = await queryContractors({
      name: input.name,
      city: input.city,
      branch: input.branch,
      limit: input.limit,
      offset: input.offset,
    });

    const contractors = result.records.map((r) => ({
      name: r.shem_yeshut,
      contractorNumber: r.mispar_kablan,
      city: r.shem_yishuv,
      street: r.shem_rehov,
      phone: r.mispar_tel,
      email: r.email,
      branchCode: r.kod_anaf,
      branchDescription: r.teur_anaf,
      group: r.kvutza,
      classification: r.sivug,
      scope: r.hekef,
      recognized: r.kablan_mukar,
      registrationDate: r.taarich_kablan,
      notes: r.heara,
      matchScore: r.match_score,
    }));

    const summary = `Found ${result.total} contractors${input.name ? ` matching "${input.name}"` : ""}${input.city ? ` in ${input.city}` : ""}. Showing ${contractors.length} results.`;
    const sources = result.source ? [result.source] : [];

    return { summary, total: result.total, contractors, sources };
  },
});

export const searchBrokersAndAppraisers = createTool({
  id: "search-brokers-and-appraisers",
  description: "Search licensed real estate brokers or property appraisers by city.",
  inputSchema: z.object({
    city: z.string().optional().describe("City name in Hebrew"),
    type: z.enum(["broker", "appraiser"]).describe("Professional type"),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    professionals: z.array(z.record(z.string(), z.unknown())),
    sources: sourcesSchema,
  }),
  execute: async (input) => {
    if (input.type === "broker") {
      const result = await queryBrokers({ city: input.city, limit: input.limit, offset: input.offset });
      const professionals = result.records.map((r) => ({
        type: "broker", name: r.name, licenseNumber: r.license_number, city: r.city,
      }));
      const summary = `Found ${result.total} licensed brokers${input.city ? ` in ${input.city}` : ""}. Showing ${professionals.length}.`;
      return { summary, total: result.total, professionals, sources: result.source ? [result.source] : [] };
    }

    const result = await queryAppraisers({ city: input.city, limit: input.limit, offset: input.offset });
    const professionals = result.records.map((r) => ({
      type: "appraiser", name: r.name, licenseNumber: r.license_number, fileNumber: r.file_number, city: r.city,
    }));
    const summary = `Found ${result.total} licensed appraisers${input.city ? ` in ${input.city}` : ""}. Showing ${professionals.length}.`;
    return { summary, total: result.total, professionals, sources: result.source ? [result.source] : [] };
  },
});
