import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { queryLotteries } from "./db-queries";

export const searchLotteries = createTool({
  id: "search-lotteries",
  description:
    "Search Dira BeHanacha (Price for Resident) lottery data by city or neighborhood. Shows price per sqm, project status, subscribers, and winners.",
  inputSchema: z.object({
    city: z.string().optional().describe("City name in Hebrew"),
    neighborhood: z.string().optional().describe("Neighborhood name"),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    lotteries: z.array(z.record(z.string(), z.unknown())),
    sources: z.array(z.object({
      dataset: z.string(), resourceId: z.string(), fetchedAt: z.string(), url: z.string(),
    })),
  }),
  execute: async (input) => {
    const result = await queryLotteries({
      city: input.city,
      neighborhood: input.neighborhood,
      limit: input.limit,
      offset: input.offset,
    });

    const lotteries = result.records.map((r) => ({
      lotteryId: r.lottery_id,
      city: r.lamas_name,
      neighborhood: r.neighborhood,
      projectName: r.project_name,
      developer: r.provider_name,
      pricePerSqm: r.price_for_meter,
      projectStatus: r.project_status,
      lotteryDate: r.lottery_execution_date,
      lotteryStatus: r.lottery_status_value,
      housingUnits: r.lottery_housing_units,
      subscribers: r.subscribers,
      winners: r.winners,
      marketingMethod: r.marketing_method_desc,
    }));

    const summary = `Found ${result.total} Dira BeHanacha lotteries${input.city ? ` in ${input.city}` : ""}. Showing ${lotteries.length} results.`;
    const sources = result.source ? [result.source] : [];

    return { summary, total: result.total, lotteries, sources };
  },
});
