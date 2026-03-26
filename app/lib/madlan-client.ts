import { db } from "./db";
import { madlanApiLog } from "./schema";

const MADLAN_API2_URL = "https://www.madlan.co.il/api2";
const MADLAN_API3_URL = "https://www.madlan.co.il/api3";
const MADLAN_FETCH_TIMEOUT_MS = 15_000;
const MIN_REQUEST_INTERVAL_MS = 1_000;

let lastRequestTimestamp = 0;

export class MadlanError extends Error {
  constructor(
    message: string,
    public readonly operationName: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "MadlanError";
  }
}

export interface MadlanAreaInfo {
  docId: string;
  name: string;
  city: string;
  type: string;
  ppa: number;
  yearNumberOfDeals: number;
  location: [number, number];
  geometry: number[][][][] | null;
  nearbyNeighbourhoods: Array<{ docId: string; text: string }>;
}

export interface MadlanListing {
  id: string;
  type: "bulletin" | "project";
  price: number | null;
  area: number | null;
  beds: number | null;
  floor: string | null;
  buildingYear: number | null;
  generalCondition: string | null;
  buildingClass: string | null;
  city: string;
  neighbourhood: string | null;
  streetName: string | null;
  streetNumber: string | null;
  eventsHistory: Array<{ eventType: string; price: number; date: string }>;
  estimatedPrice: number | null;
  tags: Record<string, number | null> | null;
  locationPoint: { lat: number; lng: number };
}

export interface MadlanInsight {
  category: string;
  type: string;
  preview: string;
  tradeoff: { goodTradeoff: boolean; value: string };
  priority: number;
}

export interface MadlanProject {
  id: string;
  projectName: string;
  priceRange: { min: number | null; max: number | null };
  bedsRange: { min: number | null; max: number | null };
  apartmentTypes: Array<{ beds: number | null; price: number | null; type: string | null }>;
  developers: Array<{ id: string; name: string }>;
  buildingStage: string | null;
  urbanRenewal: string | null;
  units: number | null;
  floorRange: { min: number | null; max: number | null };
  city: string;
  neighbourhood: string | null;
}

async function enforceRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastRequestTimestamp;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
  }
  lastRequestTimestamp = Date.now();
}

async function queryMadlanGraphQL<T>({
  endpoint,
  operationName,
  query,
  variables,
}: {
  endpoint: string;
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
}): Promise<T> {
  await enforceRateLimit();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MADLAN_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operationName, query, variables }),
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new MadlanError(`Request timed out after ${MADLAN_FETCH_TIMEOUT_MS}ms`, operationName, 408);
    }
    throw new MadlanError(
      `Network error: ${error instanceof Error ? error.message : "Unknown"}`,
      operationName,
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new MadlanError(`HTTP ${response.status}: ${response.statusText}`, operationName, response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new MadlanError("Invalid JSON response", operationName, response.status);
  }

  const parsed = body as { data?: Record<string, unknown>; errors?: unknown[] };

  if (parsed.errors && Array.isArray(parsed.errors) && parsed.errors.length > 0) {
    const firstError = parsed.errors[0] as { message?: string };
    throw new MadlanError(firstError.message ?? "GraphQL error", operationName, response.status);
  }

  if (!parsed.data) {
    throw new MadlanError("Missing data in GraphQL response", operationName, response.status);
  }

  // Log structured data responses to permanent data lake (skip heavy insight HTML)
  const SKIP_LOGGING = new Set(["docId2Insights", "addRecentlyViewed", "currentPromotionPlan", "me"]);
  if (!SKIP_LOGGING.has(operationName)) {
    db.insert(madlanApiLog)
      .values({
        operationName,
        endpoint,
        variables: JSON.stringify(variables),
        response: JSON.stringify(parsed.data),
      })
      .catch(() => {/* logging failure must not break the request */});
  }

  return parsed.data as T;
}

const AREA_INFO_QUERY = `query docIds2Information($docIds: [String]) {
  docIds2Information(docIds: $docIds) {
    document { city id location docId identityDocId name type geometry neighbourhood
      nearbyNeighbourhoods { docId text } }
    ppa yearNumberOfDeals
  }
}`;

interface AreaInfoRaw {
  document: {
    city: string;
    id: string;
    location: [number, number];
    docId: string;
    name: string;
    type: string;
    geometry: number[][][][] | null;
    nearbyNeighbourhoods: Array<{ docId: string; text: string }>;
  };
  ppa: number;
  yearNumberOfDeals: number;
}

export async function fetchAreaInfo({ docIds }: { docIds: string[] }): Promise<MadlanAreaInfo[]> {
  const data = await queryMadlanGraphQL<{ docIds2Information: AreaInfoRaw[] }>({
    endpoint: MADLAN_API2_URL,
    operationName: "docIds2Information",
    query: AREA_INFO_QUERY,
    variables: { docIds },
  });

  return data.docIds2Information.map((item) => ({
    docId: item.document.docId,
    name: item.document.name,
    city: item.document.city,
    type: item.document.type,
    ppa: item.ppa,
    yearNumberOfDeals: item.yearNumberOfDeals,
    location: item.document.location,
    geometry: item.document.geometry,
    nearbyNeighbourhoods: item.document.nearbyNeighbourhoods ?? [],
  }));
}

const INSIGHTS_QUERY = `query docId2Insights($docId: String!, $user: UserContext, $withGeoData: Boolean = false) {
  docId2Insights(docId: $docId, user: $user, withGeoData: $withGeoData) {
    insights { category type preview tradeoff { goodTradeoff value } priority }
  }
}`;

export async function fetchAreaInsights({ docId }: { docId: string }): Promise<MadlanInsight[]> {
  const data = await queryMadlanGraphQL<{ docId2Insights: { insights: MadlanInsight[] } }>({
    endpoint: MADLAN_API3_URL,
    operationName: "docId2Insights",
    query: INSIGHTS_QUERY,
    variables: { docId, withGeoData: false },
  });

  return data.docId2Insights.insights;
}

const SEARCH_POI_QUERY = `query searchPoi(
  $dealType: String, $sort: [SortField], $poiTypes: [String],
  $limit: Int, $offset: Int, $priceRange: [Int], $roomsRange: [Float],
  $areaRange: [Int], $searchContext: String
) {
  searchPoiV2(
    dealType: $dealType, sort: $sort, poiTypes: $poiTypes,
    limit: $limit, offset: $offset, priceRange: $priceRange,
    roomsRange: $roomsRange, areaRange: $areaRange, searchContext: $searchContext
  ) {
    total
    poi {
      ... on Bulletin {
        id type price area beds floor buildingYear generalCondition buildingClass
        addressDetails { city neighbourhood streetName streetNumber docId }
        eventsHistory { eventType price date }
        estimatedPrice
        tags { bestSchool safety parkAccess quietStreet familyFriendly lightRail commute }
        locationPoint { lat lng }
      }
      ... on Project {
        id type projectName
        addressDetails { city neighbourhood streetName streetNumber docId }
        priceRange { min max }
        bedsRange { min max }
        locationPoint { lat lng }
      }
    }
  }
}`;

interface SearchPoiRaw {
  id: string;
  type: "bulletin" | "project";
  price?: number | null;
  area?: number | null;
  beds?: number | null;
  floor?: string | null;
  buildingYear?: number | null;
  generalCondition?: string | null;
  buildingClass?: string | null;
  addressDetails?: {
    city: string;
    neighbourhood: string | null;
    streetName: string | null;
    streetNumber: string | null;
  };
  eventsHistory?: Array<{ eventType: string; price: number; date: string }>;
  estimatedPrice?: number | null;
  tags?: Record<string, number | null> | null;
  locationPoint: { lat: number; lng: number };
}

export async function searchListings({
  docIds,
  dealType = "unitBuy",
  poiTypes = ["bulletin", "project"],
  limit = 50,
  offset = 0,
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
  const data = await queryMadlanGraphQL<{
    searchPoiV2: { total: number; poi: SearchPoiRaw[] };
  }>({
    endpoint: MADLAN_API2_URL,
    operationName: "searchPoi",
    query: SEARCH_POI_QUERY,
    variables: {
      dealType,
      sort: [{ field: "geometry", order: "asc", docIds }],
      poiTypes,
      limit,
      offset,
      priceRange: priceRange ?? [null, null],
      roomsRange: roomsRange ?? [null, null],
      areaRange: areaRange ?? [null, null],
      searchContext: "marketplace",
    },
  });

  const listings: MadlanListing[] = data.searchPoiV2.poi.map((item) => ({
    id: item.id,
    type: item.type,
    price: item.price ?? null,
    area: item.area ?? null,
    beds: item.beds ?? null,
    floor: item.floor ?? null,
    buildingYear: item.buildingYear ?? null,
    generalCondition: item.generalCondition ?? null,
    buildingClass: item.buildingClass ?? null,
    city: item.addressDetails?.city ?? "",
    neighbourhood: item.addressDetails?.neighbourhood ?? null,
    streetName: item.addressDetails?.streetName ?? null,
    streetNumber: item.addressDetails?.streetNumber ?? null,
    eventsHistory: item.eventsHistory ?? [],
    estimatedPrice: item.estimatedPrice ?? null,
    tags: item.tags ?? null,
    locationPoint: item.locationPoint,
  }));

  return { total: data.searchPoiV2.total, listings };
}

const POI_BY_IDS_QUERY = `query poiByIds($ids: [PoiIdInput]) {
  poiByIds(ids: $ids) {
    id projectName priceRange { min max } bedsRange { min max }
    apartmentTypes { beds price type } developers { id name }
    buildingStage urbanRenewal units floorRange { min max } city neighbourhood
  }
}`;

export async function fetchProjectById({
  ids,
}: {
  ids: Array<{ type: string; id: string }>;
}): Promise<MadlanProject[]> {
  const data = await queryMadlanGraphQL<{ poiByIds: MadlanProject[] }>({
    endpoint: MADLAN_API2_URL,
    operationName: "poiByIds",
    query: POI_BY_IDS_QUERY,
    variables: { ids },
  });

  return data.poiByIds;
}

export function buildDocId({ city, neighborhood }: { city: string; neighborhood?: string }): string {
  const normalize = (s: string) => s.trim().replace(/\s+/g, "-");

  if (neighborhood) {
    return `שכונה-${normalize(neighborhood)}-${normalize(city)}-ישראל`;
  }
  return `${normalize(city)}-ישראל`;
}
