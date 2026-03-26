import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../app/lib/db";
import { statisticalAreas } from "../../app/lib/schema";
import { sql } from "drizzle-orm";

const DEG_PER_KM_LAT = 0.009;
const DEG_PER_KM_LNG = 0.0105;

export const lookupNeighborhood = createTool({
  id: "lookup-neighborhood",
  description:
    "Find which neighborhood / statistical area a location belongs to. Uses CBS Statistical Areas data. Returns the nearest statistical area with city and area name. Use when you need to determine which neighborhood an address is in.",
  inputSchema: z.object({
    lat: z.number().describe("Latitude (WGS84)"),
    lng: z.number().describe("Longitude (WGS84)"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    areas: z.array(z.record(z.string(), z.unknown())),
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
    const { lat, lng } = input;

    const nearby = await db
      .select({
        statAreaCode: statisticalAreas.statAreaCode,
        cityCode: statisticalAreas.cityCode,
        cityName: statisticalAreas.cityName,
        areaName: statisticalAreas.areaName,
        population: statisticalAreas.population,
        centroidLat: statisticalAreas.centroidLat,
        centroidLng: statisticalAreas.centroidLng,
      })
      .from(statisticalAreas)
      .orderBy(
        sql`(${statisticalAreas.centroidLat} - ${lat}) * (${statisticalAreas.centroidLat} - ${lat}) + (${statisticalAreas.centroidLng} - ${lng}) * (${statisticalAreas.centroidLng} - ${lng})`,
      )
      .limit(5);

    const areas = nearby.map((a) => ({
      statAreaCode: a.statAreaCode,
      cityCode: a.cityCode,
      cityName: a.cityName,
      areaName: a.areaName,
      population: a.population,
      distanceKm: Math.sqrt(
        Math.pow(((a.centroidLat ?? 0) - lat) / DEG_PER_KM_LAT, 2) +
          Math.pow(((a.centroidLng ?? 0) - lng) / DEG_PER_KM_LNG, 2),
      ),
    }));

    const best = areas[0];
    const summary = best
      ? `Location is in ${best.areaName || "unnamed area"}, ${best.cityName} (statistical area ${best.statAreaCode})${best.population ? `, population ${best.population.toLocaleString()}` : ""}.`
      : "No statistical area found near this location.";

    return {
      summary,
      total: areas.length,
      areas,
      sources: [
        {
          dataset: "statistical_areas",
          resourceId: "cbs-2022",
          fetchedAt: new Date().toISOString(),
          url: "https://hub.arcgis.com/datasets/IsraelData::statistical-areas-2022",
        },
      ],
    };
  },
});
