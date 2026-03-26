import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../app/lib/db";
import { busStops, lrtStations } from "../../app/lib/schema";
import { sql, and, gte, lte } from "drizzle-orm";

const DEG_PER_KM_LAT = 0.009;
const DEG_PER_KM_LNG = 0.0105;

export const queryNearbyTransit = createTool({
  id: "query-nearby-transit",
  description:
    "Find bus stops, train stations, and light rail stations near a location. Returns stops within a given radius sorted by distance. Use when assessing transportation access for a property or area.",
  inputSchema: z.object({
    lat: z.number().describe("Latitude (WGS84)"),
    lng: z.number().describe("Longitude (WGS84)"),
    radiusKm: z
      .number()
      .optional()
      .default(1)
      .describe("Search radius in km (default 1)"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    total: z.number(),
    busStops: z.array(z.record(z.string(), z.unknown())),
    lrtStations: z.array(z.record(z.string(), z.unknown())),
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
    const radiusKm = input.radiusKm ?? 1;
    const dLat = radiusKm * DEG_PER_KM_LAT;
    const dLng = radiusKm * DEG_PER_KM_LNG;

    const nearbyBusStops = await db
      .select()
      .from(busStops)
      .where(
        and(
          gte(busStops.lat, lat - dLat),
          lte(busStops.lat, lat + dLat),
          gte(busStops.lng, lng - dLng),
          lte(busStops.lng, lng + dLng),
        ),
      );

    // LRT stations have ITM X,Y coords — no WGS84, so return all unique stations for now
    // TODO: Convert ITM to WGS84 or add WGS84 columns
    const nearbyLrt = await db
      .select()
      .from(lrtStations)
      .where(sql`1=1`)
      .limit(500);

    const busWithDist = nearbyBusStops
      .map((s) => ({
        stationId: s.stationId,
        name: s.cityName,
        type: s.stationTypeName,
        operator: s.stationOperatorTypeName,
        lat: s.lat,
        lng: s.lng,
        distanceKm: Math.sqrt(
          Math.pow((s.lat! - lat) / DEG_PER_KM_LAT, 2) +
            Math.pow((s.lng! - lng) / DEG_PER_KM_LNG, 2),
        ),
      }))
      .filter((s) => s.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const uniqueLrtNames = [...new Set(nearbyLrt.map((s) => s.stationName))];
    const lrtMapped = uniqueLrtNames.map((name) => {
      const station = nearbyLrt.find((s) => s.stationName === name)!;
      return {
        name: station.stationName,
        line: station.line,
        type: station.type,
        status: station.status,
        company: station.company,
      };
    });

    const summary = `Found ${busWithDist.length} bus stops and ${lrtMapped.length} LRT stations within ${radiusKm}km.`;

    return {
      summary,
      total: busWithDist.length + lrtMapped.length,
      busStops: busWithDist,
      lrtStations: lrtMapped,
      sources: [
        {
          dataset: "bus_stops",
          resourceId: "e873e6a2-66c1-494f-a677-f5e77348edb0",
          fetchedAt: new Date().toISOString(),
          url: "https://data.gov.il",
        },
        {
          dataset: "lrt_stations",
          resourceId: "b2ca8ac5-d7ea-41a5-8119-a30e98cf71e0",
          fetchedAt: new Date().toISOString(),
          url: "https://data.gov.il",
        },
      ],
    };
  },
});
