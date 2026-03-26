import { db } from "./db";
import { madlanAreaPricing, madlanListingsCache } from "./schema";
import { desc, eq, sql, and, gte } from "drizzle-orm";
import {
  fetchAreaInfo,
  searchListings,
  type MadlanAreaInfo,
  type MadlanListing,
} from "./madlan-client";

const CACHE_TTL_DAYS = 10;

function cacheCutoff(): Date {
  const d = new Date();
  d.setDate(d.getDate() - CACHE_TTL_DAYS);
  return d;
}

// --- Area Pricing Cache ---

export async function getCachedAreaInfo({ docId }: { docId: string }): Promise<MadlanAreaInfo | null> {
  const rows = await db
    .select()
    .from(madlanAreaPricing)
    .where(and(eq(madlanAreaPricing.docId, docId), gte(madlanAreaPricing.fetchedAt, cacheCutoff())))
    .orderBy(desc(madlanAreaPricing.fetchedAt))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    docId: row.docId,
    name: row.name,
    city: row.city,
    type: row.type,
    ppa: row.ppa ?? 0,
    yearNumberOfDeals: row.yearNumberOfDeals ?? 0,
    location: row.location ? JSON.parse(row.location) : [0, 0],
    geometry: row.geometry ? JSON.parse(row.geometry) : null,
    nearbyNeighbourhoods: row.nearbyNeighborhoods ? JSON.parse(row.nearbyNeighborhoods) : [],
  };
}

async function saveAreaInfo({ areas }: { areas: MadlanAreaInfo[] }): Promise<void> {
  if (areas.length === 0) return;

  await db.insert(madlanAreaPricing).values(
    areas.map((a) => ({
      docId: a.docId,
      city: a.city,
      neighborhood: a.type === "neighbourhood" ? a.name.split(",")[0].trim() : null,
      name: a.name,
      type: a.type,
      ppa: a.ppa,
      yearNumberOfDeals: a.yearNumberOfDeals,
      location: JSON.stringify(a.location),
      geometry: a.geometry ? JSON.stringify(a.geometry) : null,
      nearbyNeighborhoods: JSON.stringify(a.nearbyNeighbourhoods),
    })),
  );
}

export async function fetchAreaInfoCached({ docIds }: { docIds: string[] }): Promise<MadlanAreaInfo[]> {
  // Check cache for each docId
  const results: MadlanAreaInfo[] = [];
  const uncachedDocIds: string[] = [];

  for (const docId of docIds) {
    const cached = await getCachedAreaInfo({ docId });
    if (cached) {
      results.push(cached);
    } else {
      uncachedDocIds.push(docId);
    }
  }

  // Fetch uncached from API
  if (uncachedDocIds.length > 0) {
    const fresh = await fetchAreaInfo({ docIds: uncachedDocIds });
    // Always save to DB (never delete — historical record)
    await saveAreaInfo({ areas: fresh });
    results.push(...fresh);
  }

  return results;
}

// --- Listings Cache ---

async function getCachedListings({ docId }: { docId: string }): Promise<{
  total: number;
  listings: MadlanListing[];
} | null> {
  const rows = await db
    .select()
    .from(madlanListingsCache)
    .where(
      and(
        eq(madlanListingsCache.city, docId),
        gte(madlanListingsCache.fetchedAt, cacheCutoff()),
      ),
    )
    .orderBy(desc(madlanListingsCache.fetchedAt))
    .limit(50);

  if (rows.length === 0) return null;

  const listings: MadlanListing[] = rows.map((row) => ({
    id: row.listingId,
    type: (row.listingType as "bulletin" | "project") ?? "bulletin",
    price: row.price,
    area: row.areaSqm,
    beds: row.beds,
    floor: row.floor,
    buildingYear: row.buildingYear,
    generalCondition: row.generalCondition,
    buildingClass: row.buildingClass,
    city: row.city,
    neighbourhood: row.neighborhood,
    streetName: row.streetName,
    streetNumber: row.streetNumber,
    eventsHistory: row.eventsHistory ? JSON.parse(row.eventsHistory) : [],
    estimatedPrice: row.estimatedPrice,
    tags: row.tags ? JSON.parse(row.tags) : null,
    locationPoint: { lat: row.lat ?? 0, lng: row.lng ?? 0 },
  }));

  return { total: listings.length, listings };
}

async function saveListings({ docId, listings }: { docId: string; listings: MadlanListing[] }): Promise<void> {
  if (listings.length === 0) return;

  // Insert in batches to stay under Neon parameter limit
  const BATCH_SIZE = 20;
  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batch = listings.slice(i, i + BATCH_SIZE);
    await db.insert(madlanListingsCache).values(
      batch.map((l) => ({
        listingId: l.id,
        listingType: l.type,
        city: docId,
        neighborhood: l.neighbourhood,
        streetName: l.streetName,
        streetNumber: l.streetNumber,
        price: l.price,
        areaSqm: l.area,
        beds: l.beds,
        floor: l.floor,
        buildingYear: l.buildingYear,
        generalCondition: l.generalCondition,
        buildingClass: l.buildingClass,
        eventsHistory: l.eventsHistory.length > 0 ? JSON.stringify(l.eventsHistory) : null,
        estimatedPrice: l.estimatedPrice,
        tags: l.tags ? JSON.stringify(l.tags) : null,
        lat: l.locationPoint.lat,
        lng: l.locationPoint.lng,
      })),
    );
  }
}

export async function searchListingsCached({
  docIds,
  dealType,
  poiTypes,
  limit,
  offset,
  priceRange,
  roomsRange,
  areaRange,
}: {
  docIds: string[];
  dealType?: string;
  poiTypes?: string[];
  limit?: number;
  offset?: number;
  priceRange?: [number | null, number | null];
  roomsRange?: [number | null, number | null];
  areaRange?: [number | null, number | null];
}): Promise<{ total: number; listings: MadlanListing[] }> {
  // Only cache simple queries (no filters, first page)
  const isSimpleQuery =
    !priceRange?.[0] && !priceRange?.[1] &&
    !roomsRange?.[0] && !roomsRange?.[1] &&
    !areaRange?.[0] && !areaRange?.[1] &&
    (offset ?? 0) === 0;

  if (isSimpleQuery && docIds.length === 1) {
    const cached = await getCachedListings({ docId: docIds[0] });
    if (cached) return cached;
  }

  // Fetch from API
  const result = await searchListings({
    docIds,
    dealType,
    poiTypes,
    limit,
    offset,
    priceRange,
    roomsRange,
    areaRange,
  });

  // Always save to DB (never delete — historical record)
  if (docIds.length === 1) {
    await saveListings({ docId: docIds[0], listings: result.listings });
  }

  return result;
}

// --- Historical Queries ---

export async function getAreaPricingHistory({ docId }: { docId: string }) {
  return db
    .select({
      ppa: madlanAreaPricing.ppa,
      yearNumberOfDeals: madlanAreaPricing.yearNumberOfDeals,
      fetchedAt: madlanAreaPricing.fetchedAt,
    })
    .from(madlanAreaPricing)
    .where(eq(madlanAreaPricing.docId, docId))
    .orderBy(desc(madlanAreaPricing.fetchedAt));
}

export async function getListingPriceHistory({ listingId }: { listingId: string }) {
  return db
    .select({
      price: madlanListingsCache.price,
      estimatedPrice: madlanListingsCache.estimatedPrice,
      fetchedAt: madlanListingsCache.fetchedAt,
    })
    .from(madlanListingsCache)
    .where(eq(madlanListingsCache.listingId, listingId))
    .orderBy(desc(madlanListingsCache.fetchedAt));
}
