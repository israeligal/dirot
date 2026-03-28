# Govmap API Integration — Replace Madlan with Government Transaction Data

**Date:** 2026-03-28
**Status:** Draft

## Context

Dirot currently sources real estate market data from Madlan (madlan.co.il) via unofficial GraphQL scraping. This has several problems:

1. **Legal gray area** — Madlan's GraphQL API is not public; we're scraping it
2. **Estimated prices** — Madlan provides asking prices and proprietary estimates, not actual transaction records
3. **Contradicts V1 philosophy** — PRD says "only free, open government data"

**nadlan.gov.il** is the Israeli government's official real estate transaction registry (Tax Authority). Its data is served via the **Govmap public REST API** (`https://www.govmap.gov.il/api/`). This is free, public, and contains actual recorded transaction prices.

**Decision:** Replace Madlan's area pricing and listing tools with Govmap. Keep Madlan's `queryProject` tool for new construction project details (developers, building stage, urban renewal status) which Govmap doesn't provide.

## Scope

### In scope
- TypeScript Govmap REST client with rate limiting and retry
- New DB table for synced transaction data
- Two new agent tools: `searchDeals` and `analyzeTrends`
- Sync script for bulk-importing deals (follows existing CKAN pipeline pattern)
- Update scoring engine to derive PPA from Govmap transactions
- Remove Madlan area pricing and listings code

### Out of scope
- Removing `queryProject` tool (stays as-is, backed by Madlan)
- Deleting historical Madlan data from DB (tables remain, just stop writing)
- Block/parcel (Gush/Helka) lookup tool (future enhancement)

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `app/lib/govmap-client.ts` | HTTP client wrapping the Govmap REST API |
| `app/lib/govmap-cache.ts` | DB read/write for govmapDeals, API logging |
| `mastra/tools/govmap-deals.ts` | Agent tool: search transactions near an address |
| `mastra/tools/govmap-trends.ts` | Agent tool: market trend analysis from historical data |
| `scripts/sync-govmap.ts` | Bulk sync script: fetch deals for configured areas, insert to DB |

### Modified Files

| File | Change |
|------|--------|
| `app/lib/schema.ts` | Add `govmapDeals` and `govmapApiLog` tables |
| `mastra/tools/scoring-engine.ts` | Replace `fetchAreaInfoCached()` with Govmap-derived PPA |
| `mastra/agents/dirot-agent.ts` | Swap `queryAreaPricing` + `searchListings` for `searchDeals` + `analyzeTrends` |
| `mastra/agents/dirot-instructions.ts` | Update agent instructions to reference transaction data instead of listings |

### Removed Code

| File | Action |
|------|--------|
| `mastra/tools/madlan-area.ts` | Delete entirely |
| `mastra/tools/madlan-listings.ts` | Delete entirely |
| `app/lib/madlan-client.ts` | Remove area/listing queries; keep only `fetchProjectById()` and its types |
| `app/lib/madlan-cache.ts` | Remove area pricing/listings cache; keep only project-related code if needed |

### Kept As-Is

| File | Reason |
|------|--------|
| `mastra/tools/madlan-project.ts` | Govmap has no project data; Madlan provides developer, building stage, urban renewal |
| `madlanApiLog` table | Historical record; no new writes (except from project queries) |
| `madlanAreaPricing` table | Historical data stays; no new writes |
| `madlanListingsCache` table | Historical data stays; no new writes |

---

## Govmap Client (`app/lib/govmap-client.ts`)

### Configuration

```typescript
const GOVMAP_BASE_URL = "https://www.govmap.gov.il/api"
const MAX_REQUESTS_PER_SECOND = 5
const CONNECT_TIMEOUT_MS = 10_000
const READ_TIMEOUT_MS = 30_000
const MAX_RETRIES = 3
const RETRY_MIN_WAIT_MS = 1_000
const RETRY_MAX_WAIT_MS = 10_000
```

### API Functions

#### `autocompleteAddress({ searchText })`
- **Endpoint:** `POST /search-service/autocomplete`
- **Request:** `{ searchText, language: "he", isAccurate: false, maxResults: 10 }`
- **Returns:** `GovmapAddress[]` — each with `text`, `id`, `type`, `coordinates: { longitude, latitude }`
- **Purpose:** Resolve a Hebrew address string to coordinates

#### `getDealsByRadius({ longitude, latitude, radiusMeters })`
- **Endpoint:** `GET /real-estate/deals/{longitude},{latitude}/{radiusMeters}`
- **Returns:** `GovmapPolygon[]` — each with `polygon_id`, `dealscount`, `settlementNameHeb`, `streetNameHeb`, `houseNum`
- **Purpose:** Discover deal polygons (streets/neighborhoods) near a point

#### `getStreetDeals({ polygonId, limit?, dealType?, startDate?, endDate? })`
- **Endpoint:** `GET /real-estate/street-deals/{polygonId}`
- **Query params:** `limit` (1-1000), `dealType` (1=new, 2=resale), `startDate` (YYYY-MM), `endDate` (YYYY-MM)
- **Returns:** `{ data: GovmapDeal[], totalCount: number }`
- **Purpose:** Get individual transactions on a street

#### `getNeighborhoodDeals({ polygonId, limit?, dealType?, startDate?, endDate? })`
- **Endpoint:** `GET /real-estate/neighborhood-deals/{polygonId}`
- **Query params:** Same as street deals
- **Returns:** `{ data: GovmapDeal[], totalCount: number }`
- **Purpose:** Get individual transactions in a neighborhood

### GovmapDeal Type

```typescript
interface GovmapDeal {
  objectid: number
  dealAmount: number | null
  dealDate: string              // YYYY-MM-DD
  propertyTypeDescription: string | null  // Hebrew, e.g., "דירה"
  assetRoomNum: number | null   // rooms
  assetArea: number | null      // sqm
  floor: string | null          // floor description
  floorNumber: number | null    // numeric floor
  settlementNameHeb: string | null
  streetName: string | null
  houseNumber: string | null
  neighborhood: string | null
  shape: string | null          // WKT geometry (strip before storage)
}
```

### Rate Limiting

Token bucket at 5 req/sec, enforced globally. Similar to the existing Madlan pattern but more generous (Madlan was 1 req/sec).

### Retry Logic

Exponential backoff: retry on 429/5xx status codes, up to 3 attempts, wait 1-10 seconds.

### Error Handling

```typescript
class GovmapError extends Error {
  constructor(
    message: string,
    public endpoint: string,
    public statusCode?: number
  ) { super(message) }
}
```

---

## Database Schema

### `govmapDeals` Table

```typescript
export const govmapDeals = pgTable("govmap_deals", {
  id: serial("id").primaryKey(),
  objectId: integer("object_id").notNull(),
  dealAmount: integer("deal_amount"),
  dealDate: date("deal_date"),
  propertyType: text("property_type"),
  rooms: real("rooms"),
  areaSqm: real("area_sqm"),
  floor: text("floor"),
  floorNumber: integer("floor_number"),
  settlement: text("settlement"),
  street: text("street"),
  houseNumber: text("house_number"),
  neighborhood: text("neighborhood"),
  pricePerSqm: real("price_per_sqm"),      // computed on insert: dealAmount / areaSqm
  polygonId: text("polygon_id"),
  lat: real("lat"),
  lng: real("lng"),
  syncedAt: timestamp("synced_at").defaultNow(),
}, (table) => [
  uniqueIndex("govmap_deals_object_id_idx").on(table.objectId),
  index("govmap_deals_settlement_idx").on(table.settlement),
  index("govmap_deals_neighborhood_idx").on(table.neighborhood),
  index("govmap_deals_deal_date_idx").on(table.dealDate),
  index("govmap_deals_composite_idx").on(table.settlement, table.neighborhood, table.dealDate),
])
```

### `govmapApiLog` Table

```typescript
export const govmapApiLog = pgTable("govmap_api_log", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  params: jsonb("params"),
  responseCount: integer("response_count"),
  userId: text("user_id"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => [
  index("govmap_api_log_endpoint_idx").on(table.endpoint),
  index("govmap_api_log_fetched_at_idx").on(table.fetchedAt),
])
```

Note: Unlike `madlanApiLog`, we don't store raw responses (deals go to `govmapDeals` table instead). We log the request metadata for rate monitoring and debugging.

---

## Agent Tools

### `searchDeals` (`mastra/tools/govmap-deals.ts`)

Replaces both `queryAreaPricing` and `searchListings`.

**Input:**
```typescript
{
  address: string           // Hebrew address, e.g., "רוטשילד 1 תל אביב"
  radiusMeters?: number     // default: 500
  yearsBack?: number        // default: 2
  minRooms?: number
  maxRooms?: number
  minPrice?: number         // NIS
  maxPrice?: number         // NIS
  dealType?: 1 | 2          // 1=new construction, 2=resale (default: 2)
  limit?: number            // default: 50
}
```

**Logic:**
1. Query local `govmapDeals` table first (by settlement + neighborhood + date range + filters)
2. If local results are sufficient (>5 deals within date range), return from DB
3. If insufficient, call Govmap API: `autocompleteAddress()` → `getDealsByRadius()` → `getStreetDeals()`/`getNeighborhoodDeals()`
4. Upsert new deals to `govmapDeals` (ON CONFLICT objectId DO NOTHING)
5. Apply client-side filters (rooms, price range)
6. Compute stats from result set

**Output:**
```typescript
{
  summary: string
  total: number
  stats: {
    medianPricePerSqm: number | null
    meanPricePerSqm: number | null
    minPrice: number | null
    maxPrice: number | null
    dealCount: number
    dateRange: { from: string, to: string }
  }
  deals: Array<{
    dealAmount: number
    dealDate: string
    propertyType: string | null
    rooms: number | null
    areaSqm: number | null
    floor: number | null
    pricePerSqm: number | null
    address: string
  }>
  sources: Array<{ dataset: string, url: string, fetchedAt: string }>
}
```

**Tool description (for LLM):**
> "Search real estate transactions near an address. Returns actual closed deals from the government registry (Tax Authority) with prices, dates, sizes, and rooms. Includes computed statistics (median price/sqm, deal count). Data is from actual recorded transactions, not estimates."

### `analyzeTrends` (`mastra/tools/govmap-trends.ts`)

**Input:**
```typescript
{
  address: string           // Hebrew address
  yearsBack?: number        // default: 3
  radiusMeters?: number     // default: 500
  groupBy?: "month" | "quarter" | "year"  // default: "quarter"
}
```

**Logic:**
1. Resolve address to settlement/neighborhood
2. Query `govmapDeals` table for historical transactions
3. Group by time period, compute per-period stats
4. Calculate trend: price appreciation rate, volume changes

**Output:**
```typescript
{
  summary: string
  area: { settlement: string, neighborhood: string | null }
  periods: Array<{
    period: string            // e.g., "2025-Q3"
    medianPricePerSqm: number
    dealCount: number
    medianPrice: number
  }>
  trend: {
    priceAppreciationPercent: number   // annualized
    volumeTrend: "increasing" | "stable" | "decreasing"
    latestMedianPpa: number
  }
  sources: Array<{ dataset: string, url: string }>
}
```

**Tool description (for LLM):**
> "Analyze real estate price trends for an area over time. Returns historical price/sqm by period (month/quarter/year), deal volume, and price appreciation rate. Based on actual government transaction records."

---

## Scoring Engine Integration

In `mastra/tools/scoring-engine.ts`, replace:

```typescript
// BEFORE (Madlan)
const areaInfo = await fetchAreaInfoCached({ docIds: [madlanDocId] })
const madlanPpa = areaInfo[0]?.ppa ?? null

// AFTER (Govmap)
const recentDeals = await getRecentDealsForScoring({
  settlement: city,
  neighborhood,
  monthsBack: 12
})
const govmapPpa = recentDeals.length > 0
  ? median(recentDeals.map(d => d.pricePerSqm).filter(Boolean))
  : null
```

`scorePrice()` interface stays identical — it takes a `ppa: number | null` and returns a score. The change is only in how PPA is sourced.

Add a helper in `govmap-cache.ts`:

```typescript
function getRecentDealsForScoring({
  settlement, neighborhood, monthsBack
}: {
  settlement: string
  neighborhood?: string
  monthsBack: number
}): Promise<GovmapDealRow[]>
```

This queries `govmapDeals` table directly — no API call needed for scoring.

---

## Sync Script (`scripts/sync-govmap.ts`)

Follows the existing CKAN sync pattern in `scripts/`.

**Behavior:**
1. Define a list of target areas (settlements + neighborhoods) to sync
2. For each area: `autocompleteAddress()` → `getDealsByRadius()` → fetch all street/neighborhood deals
3. Upsert to `govmapDeals` (ON CONFLICT objectId DO NOTHING)
4. Log sync metadata (areas synced, deals inserted, duration)
5. Rate-limited: respects 5 req/sec globally

**Initial sync areas:** All settlements that appear in the project's existing data (from CKAN urban renewal tables).

**Run schedule:** Manual for now (`pnpm sync:govmap`). Can be cron-scheduled later.

**Package.json script:**
```json
"sync:govmap": "npx tsx scripts/sync-govmap.ts"
```

---

## Madlan Cleanup

### Keep
- `app/lib/madlan-client.ts` — Slim down to only: `fetchProjectById()`, `MadlanProject` type, `queryMadlanGraphQL()` helper, `MadlanError` class
- `mastra/tools/madlan-project.ts` — Unchanged
- DB tables `madlanApiLog`, `madlanAreaPricing`, `madlanListingsCache` — Keep data, stop new writes (except project API log entries)

### Delete
- `mastra/tools/madlan-area.ts` — Entire file
- `mastra/tools/madlan-listings.ts` — Entire file
- `app/lib/madlan-cache.ts` — Remove `fetchAreaInfoCached()`, `searchListingsCached()`, `cacheAreaPricing()`, `cacheListings()`. Keep if `fetchProjectById` needs caching, otherwise delete entirely.

### Clean up imports
- `mastra/agents/dirot-agent.ts` — Remove madlan-area/listings imports, add govmap tool imports
- `mastra/tools/scoring-engine.ts` — Remove madlan imports, add govmap-cache import

---

## Migration Path

This is a clean swap — no data migration needed. Old Madlan data stays in its tables for historical reference. New Govmap data populates fresh tables.

1. Add `govmapDeals` and `govmapApiLog` tables via Drizzle migration
2. Build Govmap client + cache layer
3. Build agent tools
4. Run initial sync for key areas
5. Update scoring engine
6. Update agent registration
7. Delete Madlan area/listings code
8. Update agent instructions

---

## Verification

1. **Unit tests:** Govmap client functions with mocked HTTP responses
2. **Integration test:** `searchDeals` tool with a real address (e.g., "רוטשילד 1 תל אביב")
3. **Sync test:** Run `sync:govmap` for one small settlement, verify DB rows
4. **Scoring test:** Verify `scorePrice()` receives valid PPA from Govmap data
5. **Agent test:** Chat with agent, ask "what are recent transaction prices near Rothschild Tel Aviv?" — verify it uses Govmap data
6. **Regression:** Verify `queryProject` still works via Madlan
