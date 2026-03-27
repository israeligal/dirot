import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { buildDocId } from "../../app/lib/madlan-client";
import { searchListingsCached } from "../../app/lib/madlan-cache";

export const searchListings = createTool({
  id: "search-listings",
  description:
    "Search current apartment listings for sale in a city or neighborhood. Returns individual listings with prices, sizes, rooms, condition, price history, and computed stats (median price/sqm).",
  inputSchema: z.object({
    city: z.string().describe("City name in Hebrew"),
    neighborhood: z
      .string()
      .optional()
      .describe("Neighborhood name in Hebrew"),
    minPrice: z.number().optional().describe("Minimum price in NIS"),
    maxPrice: z.number().optional().describe("Maximum price in NIS"),
    minRooms: z.number().optional().describe("Minimum number of rooms"),
    maxRooms: z.number().optional().describe("Maximum number of rooms"),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    stats: z.object({
      medianPricePerSqm: z.number().nullable(),
      minPrice: z.number().nullable(),
      maxPrice: z.number().nullable(),
      averageArea: z.number().nullable(),
    }),
    listings: z.array(z.record(z.string(), z.unknown())),
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

    const priceRange: [number | null, number | null] = [
      input.minPrice ?? null,
      input.maxPrice ?? null,
    ];
    const roomsRange: [number | null, number | null] = [
      input.minRooms ?? null,
      input.maxRooms ?? null,
    ];

    const result = await searchListingsCached({
      docIds: [docId],
      limit: input.limit,
      offset: input.offset,
      priceRange,
      roomsRange,
    });

    const withPriceAndArea = result.listings.filter(
      (l) => l.price && l.area && l.area > 0,
    );
    const pricesPerSqm = withPriceAndArea
      .map((l) => l.price! / l.area!)
      .sort((a, b) => a - b);

    const medianPricePerSqm =
      pricesPerSqm.length > 0
        ? pricesPerSqm[Math.floor(pricesPerSqm.length / 2)]
        : null;

    const allPrices = result.listings
      .filter((l) => l.price)
      .map((l) => l.price!);
    const allAreas = result.listings
      .filter((l) => l.area)
      .map((l) => l.area!);

    const stats = {
      medianPricePerSqm: medianPricePerSqm
        ? Math.round(medianPricePerSqm)
        : null,
      minPrice: allPrices.length > 0 ? Math.min(...allPrices) : null,
      maxPrice: allPrices.length > 0 ? Math.max(...allPrices) : null,
      averageArea:
        allAreas.length > 0
          ? Math.round(
              allAreas.reduce((a, b) => a + b, 0) / allAreas.length,
            )
          : null,
    };

    const listings = result.listings.map((l) => ({
      id: l.id,
      type: l.type,
      price: l.price,
      areaSqm: l.area,
      pricePerSqm:
        l.price && l.area ? Math.round(l.price / l.area) : null,
      beds: l.beds,
      floor: l.floor,
      buildingYear: l.buildingYear,
      condition: l.generalCondition,
      buildingClass: l.buildingClass,
      address: [l.streetName, l.streetNumber].filter(Boolean).join(" "),
      neighborhood: l.neighbourhood,
      priceHistory: l.eventsHistory,
      estimatedPrice: l.estimatedPrice,
      tags: l.tags,
    }));

    const medianStr = stats.medianPricePerSqm
      ? `median ${Math.round(stats.medianPricePerSqm / 1000)}K NIS/sqm`
      : "";
    const summary = `Found ${result.total} listings in ${input.neighborhood ? `${input.neighborhood}, ` : ""}${input.city}${medianStr ? ` (${medianStr})` : ""}. Showing ${listings.length} results.`;

    const sources = [
      {
        dataset: "market-data",
        resourceId: "api",
        fetchedAt: new Date().toISOString(),
        url: "",
      },
    ];

    return { summary, total: result.total, stats, listings, sources };
  },
});
