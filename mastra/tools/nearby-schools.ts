import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../app/lib/db";
import { schools } from "../../app/lib/schema";
import { and, gte, lte } from "drizzle-orm";

const DEG_PER_KM_LAT = 0.009;
const DEG_PER_KM_LNG = 0.0105;

export const queryNearbySchools = createTool({
  id: "query-nearby-schools",
  description:
    "Find schools near a location. Returns schools within a given radius sorted by distance. Use when assessing area suitability for families or evaluating neighborhood quality.",
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
    schools: z.array(z.record(z.string(), z.unknown())),
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

    const nearbySchools = await db
      .select()
      .from(schools)
      .where(
        and(
          gte(schools.lat, lat - dLat),
          lte(schools.lat, lat + dLat),
          gte(schools.lng, lng - dLng),
          lte(schools.lng, lng + dLng),
        ),
      );

    const withDist = nearbySchools
      .map((s) => ({
        code: s.schoolCode,
        name: s.schoolName,
        city: s.cityName,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        accuracy: s.locationAccuracy,
        distanceKm: Math.sqrt(
          Math.pow((s.lat! - lat) / DEG_PER_KM_LAT, 2) +
            Math.pow((s.lng! - lng) / DEG_PER_KM_LNG, 2),
        ),
      }))
      .filter((s) => s.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const summary = `Found ${withDist.length} schools within ${radiusKm}km.`;

    return {
      summary,
      total: withDist.length,
      schools: withDist,
      sources: [
        {
          dataset: "schools",
          resourceId: "5c5d6bb0-755d-470d-84b6-d7dd3135ba9c",
          fetchedAt: new Date().toISOString(),
          url: "https://data.gov.il",
        },
      ],
    };
  },
});
