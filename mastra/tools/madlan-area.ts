import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  fetchAreaInsights,
  buildDocId,
  type MadlanInsight,
} from "../../app/lib/madlan-client";
import { fetchAreaInfoCached } from "../../app/lib/madlan-cache";

export const queryAreaPricing = createTool({
  id: "query-area-pricing",
  description:
    "Get real market pricing data for a city or neighborhood. Returns average price per sqm (NIS), number of deals in the last year, nearby neighborhoods, and area insights (livability, parks, transport, schools).",
  inputSchema: z.object({
    city: z.string().describe("City name in Hebrew (e.g., בת ים)"),
    neighborhood: z
      .string()
      .optional()
      .describe("Neighborhood name in Hebrew (e.g., רמת הנשיא)"),
    includeInsights: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include detailed area insights (livability, parks, transport)"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    areaInfo: z.array(z.record(z.string(), z.unknown())),
    insights: z.array(z.record(z.string(), z.unknown())).optional(),
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
    const docId = buildDocId({
      city: input.city,
      neighborhood: input.neighborhood,
    });
    const areas = await fetchAreaInfoCached({ docIds: [docId] });

    let insights: MadlanInsight[] | undefined;
    if (input.includeInsights && areas.length > 0) {
      try {
        insights = await fetchAreaInsights({ docId: areas[0].docId });
      } catch {
        /* insights are optional */
      }
    }

    const areaInfo = areas.map((a) => ({
      docId: a.docId,
      name: a.name,
      city: a.city,
      type: a.type,
      pricePerSqm: a.ppa,
      yearlyDeals: a.yearNumberOfDeals,
      nearbyNeighborhoods: a.nearbyNeighbourhoods.map((n) => n.text),
    }));

    const ppaStr = areas[0]?.ppa
      ? `${Math.round(areas[0].ppa).toLocaleString()} NIS/sqm`
      : "no price data";
    const dealsStr = areas[0]?.yearNumberOfDeals
      ? `${areas[0].yearNumberOfDeals} deals/year`
      : "";
    const summary = `Area pricing for ${input.neighborhood ? `${input.neighborhood}, ` : ""}${input.city}: ${ppaStr}${dealsStr ? `, ${dealsStr}` : ""}.`;

    const sources = [
      {
        dataset: "market-data",
        resourceId: "api",
        fetchedAt: new Date().toISOString(),
        url: "",
      },
    ];

    return {
      summary,
      total: areas.length,
      areaInfo,
      ...(insights
        ? {
            insights: insights.map((i) => ({
              category: i.category,
              type: i.type,
              preview: i.preview,
              isPositive: i.tradeoff.goodTradeoff,
              value: i.tradeoff.value,
            })),
          }
        : {}),
      sources,
    };
  },
});
