import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { queryInfrastructure } from "./db-queries";

export const searchInfrastructure = createTool({
  id: "search-infrastructure",
  description:
    "Search planned infrastructure: roads (TMA3), rail (TMA23), transport projects, national plans, Tel Aviv 2050 mass transit. Use type='all' to search across all sources.",
  inputSchema: z.object({
    type: z
      .enum(["road", "rail", "transit", "transport", "national", "all"])
      .optional()
      .default("all")
      .describe("Infrastructure type to search"),
    keyword: z
      .string()
      .optional()
      .describe("Search keyword (city, road number, plan name, line name)"),
    limit: z.number().optional().default(10),
  }),
  outputSchema: z.object({
    summary: z.string(),
    totalBySource: z.record(z.string(), z.number()),
    results: z.array(z.record(z.string(), z.unknown())),
  }),
  execute: async (input) => {
    const { results, totalBySource } = await queryInfrastructure({
      type: input.type,
      keyword: input.keyword,
      limit: input.limit ?? 10,
    });

    const totalAll = Object.values(totalBySource).reduce((a, b) => a + b, 0);
    const summary = `Found ${totalAll} infrastructure records across ${Object.keys(totalBySource).length} source(s)${input.keyword ? ` matching "${input.keyword}"` : ""}. Showing ${results.length} results.`;

    return { summary, totalBySource, results };
  },
});
