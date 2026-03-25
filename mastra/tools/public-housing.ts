import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { queryPublicHousing } from "./db-queries";

export const searchPublicHousing = createTool({
  id: "search-public-housing",
  description: "Search public housing inventory and vacancies by city.",
  inputSchema: z.object({
    city: z.string().optional().describe("City name in Hebrew"),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),
  outputSchema: z.object({
    summary: z.string(),
    inventory: z.object({ total: z.number(), records: z.array(z.record(z.string(), z.unknown())) }),
    vacancies: z.object({ total: z.number(), records: z.array(z.record(z.string(), z.unknown())) }),
  }),
  execute: async (input) => {
    const result = await queryPublicHousing({
      city: input.city,
      limit: input.limit,
      offset: input.offset,
    });

    const summary = `Public housing${input.city ? ` in ${input.city}` : ""}: ${result.inventory.total} inventory records, ${result.vacancies.total} vacancy records.`;

    return {
      summary,
      inventory: { total: result.inventory.total, records: result.inventory.records },
      vacancies: { total: result.vacancies.total, records: result.vacancies.records },
    };
  },
});
