# Data Layer — Spec (Sub-Project 1 of 5)

**Parent PRD:** `PRD.md`
**Date:** 2026-03-24
**Status:** Draft (revision 2 — post spec review)

## Problem Statement

The Dirot agent needs to query 17 Israeli government datasets from data.gov.il's CKAN API. These datasets contain real estate, construction, infrastructure, and professional registry data. Currently there is no client — every downstream consumer (agent tools, API routes, tests) would need to construct raw HTTP requests, handle pagination, parse untyped JSON, and manage caching independently.

This sub-project creates a single, typed, cached data access layer that all other sub-projects build on.

**Scope note:** XPLAN (Planning Administration) is listed as P0 in the master PRD but is NOT a CKAN dataset — it's an external website (`xplan.gov.il`). XPLAN integration will be handled in Sub-Project 5 (Cross-Reference & Scoring), not here. This spec covers only the 17 CKAN datastore resources.

## Goals

1. **Single typed client** for all CKAN datastore queries — one function, generic over record types
2. **All 17 datasets typed** — TypeScript interfaces with complete field lists matching actual API responses
3. **24h caching** — government data updates weekly; avoid redundant API calls
4. **CORS proxy** — Next.js API route for future client-side access (chat UI may need direct data queries)
5. **Central constants** — all resource IDs, API URLs, and a validation set in one place

## Non-Goals

- No agent logic, no Mastra, no AI — pure data access
- No UI — server-side only (the proxy enables future client access but this spec doesn't build UI)
- No GIS/shapefile parsing — CSV/JSON CKAN resources only
- No data transformation or scoring — that's Sub-Project 5
- No XPLAN integration — that's Sub-Project 5 (XPLAN is not CKAN)

## Architecture

### Files

```
app/
  lib/
    constants.ts          # Resource IDs, API base URL, valid resource set
    types.ts              # TypeScript interfaces for all 17 datasets + CkanResponse
    ckan-client.ts        # fetchResource<T>() + CkanError class
  api/
    ckan/
      route.ts            # Next.js GET handler — proxies to CKAN API
```

### `ckan-client.ts` — Core API

```typescript
export interface CkanResponse<T> {
  records: T[]
  total: number
}

export class CkanError extends Error {
  constructor(
    message: string,
    public readonly resourceId: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'CkanError'
  }
}

export function fetchResource<T>({
  resourceId,
  filters,
  query,
  sort,
  limit = 100,
  offset = 0,
}: {
  resourceId: string
  filters?: Record<string, string | number>
  query?: string
  sort?: string
  limit?: number
  offset?: number
}): Promise<CkanResponse<T>>
```

**Behavior:**
- Constructs URL: `${CKAN_BASE_URL}/datastore_search` with params
- Serializes `filters` as JSON string in the URL query param (CKAN expects `filters={"Yeshuv":"בת ים"}`)
- All URL params are encoded via `URLSearchParams` — handles Hebrew text (UTF-8) correctly
- Uses Next.js `fetch()` with `{ next: { revalidate: 86400 } }` for 24h cache
- Uses `AbortController` with 15-second timeout
- No retries in V1 — throws `CkanError` on any failure (consumers can add retry logic)

**Response parsing guard clauses:**
- If HTTP status is not 200 → throw `CkanError`
- If response is not valid JSON → throw `CkanError` with "Invalid JSON response"
- If `success` is not `true` → throw `CkanError` with CKAN error message
- If `result` or `result.records` is missing → throw `CkanError` with "Malformed CKAN response"
- If `records` is empty array → return `{ records: [], total: 0 }` (not an error)

**Pagination:**
- CKAN max limit is 32000; client caps at 1000 per request as a practical limit
- Defaults: `limit = 100`, `offset = 0`
- Consumers paginate by calling with increasing `offset`

**Caching notes:**
- `next.revalidate` uses ISR behavior: stale responses served while revalidating in background
- In `next dev` mode, caching is disabled by default (Next.js dev behavior). This is acceptable for development.
- No manual cache-busting mechanism in V1

### `constants.ts` — Resource IDs

```typescript
export const CKAN_BASE_URL = 'https://data.gov.il/api/3/action'
export const FETCH_TIMEOUT_MS = 15_000
export const MAX_LIMIT = 1000

// Core datasets
export const RESOURCE_URBAN_RENEWAL = 'f65a0daf-f737-49c5-9424-d378d52104f5'
export const RESOURCE_LOTTERY = '7c8255d0-49ef-49db-8904-4cf917586031'
export const RESOURCE_LOTTERY_NO_DRAW = 'ea93b3c9-15e2-4b74-a632-097ee53737e4'
export const RESOURCE_CONSTRUCTION_PROGRESS = '1ec45809-5927-430a-9b30-77f77f528ce3'
export const RESOURCE_ACTIVE_CONSTRUCTION = 'b072e36c-a53b-49e1-be08-4a608fcf4638'
export const RESOURCE_PUBLIC_HOUSING_INVENTORY = 'ece87d7d-d79f-4278-8559-921218bc2b6a'
export const RESOURCE_PUBLIC_HOUSING_VACANCIES = 'c3a68837-9b7a-4ee7-bd92-130678dc8ae3'

// Infrastructure
export const RESOURCE_TMA3_ROADS = '643dc6f9-1f78-4a57-9e84-c4ba8809c044'
export const RESOURCE_TMA23_RAIL = '1d421a2a-c7cd-4216-830c-c56419378d0e'
export const RESOURCE_TRANSPORT_PROJECTS = 'c7921041-21de-4027-83a0-d14135bbe81f'
export const RESOURCE_NATIONAL_TRANSPORT = '1f2d023b-da8e-4afd-b478-5f01f5865f77'
export const RESOURCE_MASS_TRANSIT_TLV = 'bd11e899-65c0-43aa-8264-c07434da22aa'

// Supporting
export const RESOURCE_CONTRACTORS = '4eb61bd6-18cf-4e7c-9f9c-e166dfa0a2d8'
export const RESOURCE_BROKERS = 'a0f56034-88db-4132-8803-854bcdb01ca1'
export const RESOURCE_APPRAISERS = '8540534a-eccd-4568-a677-652d589ed172'
export const RESOURCE_DEVELOPMENT_COSTS = 'bf164a03-55c7-4bea-8740-66ce60a51a2c'
export const RESOURCE_GREEN_BUILDINGS = '7f467a30-58cd-44b5-86f0-d570cc7d25ad'

// Validation set — proxy route checks resource_id against this
export const VALID_RESOURCE_IDS = new Set([
  RESOURCE_URBAN_RENEWAL, RESOURCE_LOTTERY, RESOURCE_LOTTERY_NO_DRAW,
  RESOURCE_CONSTRUCTION_PROGRESS, RESOURCE_ACTIVE_CONSTRUCTION,
  RESOURCE_PUBLIC_HOUSING_INVENTORY, RESOURCE_PUBLIC_HOUSING_VACANCIES,
  RESOURCE_TMA3_ROADS, RESOURCE_TMA23_RAIL, RESOURCE_TRANSPORT_PROJECTS,
  RESOURCE_NATIONAL_TRANSPORT, RESOURCE_MASS_TRANSIT_TLV,
  RESOURCE_CONTRACTORS, RESOURCE_BROKERS, RESOURCE_APPRAISERS,
  RESOURCE_DEVELOPMENT_COSTS, RESOURCE_GREEN_BUILDINGS,
])
```

**Note:** `RESOURCE_TRANSPORT_PROJECTS` changed from PRD's `5a14da23` (returned 404) to `c7921041` (2019 Q2 workplan CSV, 448 records, verified working).

### `types.ts` — Complete Record Interfaces

All fields verified against live CKAN API responses on 2026-03-24.

**File size note:** `types.ts` will exceed the ~300-line guideline from CLAUDE.md. This is an accepted deviation — the file has a single responsibility (CKAN record types). If it grows beyond ~500 lines, split into `types/core.ts`, `types/infrastructure.ts`, `types/supporting.ts`.

**Type conventions:**
- CKAN returns some numeric fields as `string` (e.g., `PriceForMeter: "9,242.00"`). Types match the actual API response, not the semantic meaning. Comments note where string-encoded numbers occur.
- Field names match the API exactly, including inconsistencies (e.g., `safety_warrents` is a real typo in the API — do not "fix" it)
- Hebrew field names (brokers, appraisers) are kept as-is to match the API

```typescript
// --- Core Datasets ---

export interface UrbanRenewalRecord {
  _id: number
  MisparMitham: number          // Project number
  Yeshuv: string                // City name (Hebrew)
  SemelYeshuv: number           // City code (CBS/LAMAS code)
  ShemMitcham: string           // Complex/neighborhood name (Hebrew)
  YachadKayam: string           // Existing housing units (string-encoded number)
  YachadTosafti: string         // Additional housing units (string-encoded number)
  YachadMutza: number           // Total proposed housing units
  TaarichHachraza: string       // Declaration date
  MisparTochnit: string         // Plan number
  KishurLatar: string           // Link to MAVAT plan page (may be empty)
  KishurLaMapa: string          // Link to GovMap (may be empty)
  SachHeterim: string           // Total permits (string-encoded number)
  Maslul: string                // Track: "מיסוי" (taxation) or municipal
  ShnatMatanTokef: string       // Year plan became valid
  Bebitzua: string              // Under construction: "כן"/"לא"
  Status: string                // Project status
}

export interface LotteryRecord {
  _id: number
  LotteryId: number
  LotteryType: string
  ParentLotteryId: string
  ContinLotteryId: string
  CentralizationType: string
  MarketingMethod: number
  MarketingMethodDesc: string
  MarketingRep: string
  Eligibility: string
  LotteryStatusValue: string
  LotteryEndSignupDate: string
  LotteryExecutionDate: string
  LamasCode: number
  LamasName: string             // City name
  Neighborhood: string
  ProjectId: number
  ProjectName: string
  ProviderName: string          // Developer name
  ProjectStatus: string
  ConstructionPermitName: string
  PriceForMeter: string         // Price per sqm (string, e.g. "9,242.00")
  LotterySignupHousingUnits: number
  LotterySignupNativeHousingUnits: string
  LotteryHousingUnits: number
  LotteryNativeHousingUnits: number
  Subscribers: number
  SubscribersBenyMakom: number
  SubscribersDisabled: number
  SubscribersSeriesA: number
  SubscribersSeriesB: number
  SubscribersSeriesC: number
  SubscribersMeshapryDiur: number
  Winners: number
  WinnersBneyMakom: string
  WinnersSeriesA: number
  WinnersSeriesB: number
  WinnersSeriesC: number
  WinnersHasryDiur: number
  WinnersMeshapryDiur: number
}

export interface LotteryNoDrawRecord {
  _id: number
  // Dataset currently has 0 records — fields will be populated when data becomes available
  // Expected to mirror LotteryRecord structure
}

export interface ConstructionProgressRecord {
  _id: number
  MAHOZ: string                 // District
  YESHUV_LAMAS: string          // City name
  ATAR: string                  // Site name
  MISPAR_MITHAM: number         // Complex number
  SHEM_MITHAM: string           // Complex name
  MIGRASH: string               // Plot (string)
  GUSH: string                  // Block number (string — may contain non-numeric)
  HELKA: string                 // Parcel number (string)
  MISPAR_BINYAN: string         // Building number (string)
  KOMOT_BINYAN: string          // Floors (string-encoded number)
  YEHIDOT_BINYAN: number        // Housing units per building
  SHETAH: string                // Area sqm (string-encoded number)
  SHITAT_SHIVUK: string         // Marketing method
  TAARICH_KOBEA: string         // Determining date
  SHNAT_HOZE: string            // Contract year
  TAARICH_SHLAV_BNIYA_5: string   // Construction stage 5 date
  TAARICH_SHLAV_BNIYA_7: number   // Stage 7 (numeric — API inconsistency, likely Excel serial date)
  TAARICH_SHLAV_BNIYA_8: string   // Stage 8 date
  TAARICH_SHLAV_BNIYA_16: string  // Stage 16 date
  TAARICH_SHLAV_BNIYA_18: string  // Stage 18 date
  TAARICH_SHLAV_BNIYA_29: string  // Stage 29 date
  TAARICH_SHLAV_BNIYA_39: string  // Stage 39 date
  TAARICH_SHLAV_BNIYA_42: string  // Stage 42 date (completion)
}

export interface ActiveConstructionSiteRecord {
  _id: number
  work_id: number
  site_name: string             // Site address/name (Hebrew)
  executor_name: string         // Contractor name
  executor_id: number
  foreman_name: string | null
  has_cranes: number            // 0 or 1
  city_name: string             // City name (Hebrew)
  build_types: string           // "מגורים", "מסחרי", etc.
  safety_warrents: number       // Intentional API typo — do not rename
  sanctions: number
  sanctions_sum: number
}

// --- Infrastructure Datasets ---

export interface RoadPlanRecord {
  _id: number
  OBJECTID: string
  TOCHNIT_NU: string            // Plan number
  TOCHNIT_NA: string            // Plan name
  STATUS: string                // Plan status
  SHAPE_Leng: string
  Shape_Length: string
}

export interface RailPlanRecord {
  _id: number
  OBJECTID: string
  TOCHNIT_NU: string
  TOCHNIT_NA: string
  STATUS: string
  SHAPE_Leng: string
  Shape_Length: string
}

export interface TransportProjectRecord {
  _id: number
  FID: number
  Main_ID: string
  Main_Name: string             // Main project name
  PRJ_NAME: string              // Project name
  PRJ_ID: string
  PRJ_TYP: string               // Project type
  PRJ_SUBTYP: string            // Project subtype
  COMP_NAME: string             // Company name
  TAT_NAME: string
  ORIG_YEAR: string
  WP_YEAR: string               // Workplan year
  PRJ_COST: string              // Project cost (string)
  TAT_COST: string
  EXEC_QRT: string              // Execution quarter
  PRJ_END: string               // Project end date/quarter
  TAT_STG: string               // Stage
  MS_UPDATE: string
  LST_MS_NAM: string            // Last milestone name
  LST_MS_QRT: string            // Last milestone quarter
  LST_MS_TYP: string
  NXT_MS_NAM: string            // Next milestone name
  NXT_MS_QRT: string            // Next milestone quarter
  NXT_MS_TYP: string
  ROAD: string                  // Road number (string)
  Shape_Leng: number
  Shape_Le_1: string
  GEO_ID: string
  COMP_ID: string
  CR_PNIM: string
}

export interface NationalTransportRecord {
  _id: number
  OID: number
  YEARMONTH: number
  REMARKS: string
  PLAN_LINK: string             // Link to plan document
  PLAN_NAME: string
  NAME: string
  LABEL: string
  STATUS: string
  SUBJECT: string
  ADRESS: string                // Address (intentional API spelling)
  Shape_Length: number
  Shape_Area: number
}

export interface MassTransitRecord {
  _id: number
  OID: number
  NAME: string                  // Line/station name
  LINE_ID: number
  TYPE: string                  // "רכבת קלה", "BRT", "מטרו"
  YEAR: number                  // Target year
  Shape_Length: number
}

// --- Supporting Datasets ---

export interface ContractorRecord {
  _id: number
  MISPAR_YESHUT: string
  SHEM_YESHUT: string           // Contractor name
  MISPAR_KABLAN: string         // Contractor number
  SHEM_YISHUV: string           // City
  SHEM_REHOV: string            // Street
  MISPAR_BAIT: string           // House number
  TAARICH_KABLAN: string        // Registration date
  MISPAR_TEL: string            // Phone
  EMAIL: string
  KOD_ANAF: string              // Branch code
  TEUR_ANAF: string             // Branch description ("בניה")
  KVUTZA: string                // Group classification
  SIVUG: string                 // Rating
  TARICH_SUG: string
  HEKEF: string                 // Scope (financial)
  KABLAN_MUKAR: string          // Recognized contractor ("מוכר"/"לא מוכר")
  OVDIM: string                 // Employees/key personnel
  HEARA: string                 // Notes
}

export interface BrokerRecord {
  _id: number
  'מס רשיון': number            // License number (Hebrew field name)
  'שם המתווך': string           // Broker name
  'עיר מגורים': string          // City of residence
}

export interface AppraiserRecord {
  _id: number
  'שם שמאי': string             // Appraiser name (Hebrew field name)
  'מספר רשיון': number          // License number
  'מספר תיק': number            // File number
  'עיר': string                 // City
}

export interface DevelopmentCostRecord {
  _id: number
  ProjectID: number
  ProjectName: string
  MahozCode: number
  MahozName: string             // District name
  MashbashCode: number
  MashbashName: string
  LamasCode: number
  LamasName: string             // City name
  AtarCode: number
  AtarName: string              // Site name
  LivingUnits: number
  ProjectStatus: number
  StatusDescription: string
  TenderIndexDate: string
  DevelopPay: number            // Development payment
  OldByNewCost: number
  MosdotDevPay: number
  TenderDevPay: number
}

export interface GreenBuildingRecord {
  _id: number
  project_id: number
  building_id: number
  municipality_name: string
  building_street: string
  building_address_number: string
  gush: string
  helka: string
  X: number                     // ITM X coordinate
  Y: number                     // ITM Y coordinate
  floors_above_ground: number
  building_area: number
  residential_units: number
  standard_name: string         // Green standard name
  certification_status: string
  certificate_score_pre: number
  certificate_stars_pre: number
  // Full interface has 47 fields — only key fields listed here.
  // Implementation should include all fields from API response.
}

export interface PublicHousingRecord {
  _id: number
  CityLMSName: string           // City name
  Floor: number
  NoRooms: number               // Units with unspecified rooms
  OneRooms: number
  TwoRooms: number
  ThreeRooms: number
  FourRooms: number
  FiveRooms: number
  SixRooms: number
  SevenRooms: number
  EightRooms: number
  NineRooms: number
  TenRooms: number
  MoreRooms: number
}

export interface PublicHousingVacancyRecord {
  _id: number
  CityLmsName: string
  CityLmsCode: number
  NumOfRooms: number
  Floor: number
  TotalArea: number
  ValidityDate: string
  CompanyName: string           // Management company
  StatusName: string
  StatusChangeDate: string
  PropertyTypeName: string
}
```

### `app/api/ckan/route.ts` — Proxy

```typescript
// GET /api/ckan?resource_id=xxx&filters={"Yeshuv":"בת ים"}&limit=100&offset=0
// Exception to RORO: Next.js route handlers require positional (request: Request) signature
export async function GET(request: Request): Promise<Response>
```

**Behavior:**
- Parses query params from `request.url`: `resource_id` (required), `filters`, `q`, `sort`, `limit`, `offset`
- Validates `resource_id` exists in `VALID_RESOURCE_IDS` set — returns 400 if not
- Calls `fetchResource()` from ckan-client
- Returns `NextResponse.json()` (includes proper content-type, no extra CORS headers needed — same-origin in Next.js)
- Returns 400 for missing/invalid resource_id, 502 for CKAN errors (wraps CkanError)

**CORS clarification:** Since the proxy runs on the same Next.js origin as the frontend, no CORS headers are needed. The proxy exists to keep API calls server-side (hiding the CKAN URL from the client) and to leverage Next.js fetch caching.

## Acceptance Criteria

### Happy paths
- [ ] `fetchResource<UrbanRenewalRecord>({ resourceId: RESOURCE_URBAN_RENEWAL })` returns typed records with `total > 0`
- [ ] `fetchResource({ resourceId: RESOURCE_URBAN_RENEWAL, filters: { Yeshuv: 'בת ים' } })` returns only Bat Yam projects (Hebrew filter works)
- [ ] `fetchResource({ resourceId: RESOURCE_URBAN_RENEWAL, limit: 10, offset: 10 })` returns page 2
- [ ] `fetchResource({ resourceId: RESOURCE_URBAN_RENEWAL, query: 'רמת הנשיא' })` does full-text search with Hebrew
- [ ] `GET /api/ckan?resource_id=f65a0daf-f737-49c5-9424-d378d52104f5&limit=2` returns JSON
- [ ] All 17 resource IDs are defined as named constants
- [ ] All 17 record types have TypeScript interfaces (GreenBuildingRecord: key fields in spec, full 47 fields derived from API at implementation; LotteryNoDrawRecord: `_id` only — dataset has 0 records, will be typed when data appears)
- [ ] No `any` types anywhere
- [ ] `pnpm build` succeeds with no type errors

### Error paths
- [ ] `fetchResource({ resourceId: 'invalid-id' })` throws `CkanError`
- [ ] `GET /api/ckan` without resource_id returns 400
- [ ] `GET /api/ckan?resource_id=not-in-allowed-set` returns 400
- [ ] Network timeout (>15s) throws `CkanError` (test by using invalid URL in dev)
- [ ] Malformed CKAN response (missing `result.records`) throws `CkanError`

### Hebrew round-trip
- [ ] Filter with Hebrew value `{ Yeshuv: 'בת ים' }` passes through URL encoding correctly and returns Hebrew results
- [ ] Proxy route handles Hebrew in `filters` query param: `?filters={"Yeshuv":"בת ים"}`

### Caching
- [ ] Second call to same resource within 24h is significantly faster than first (verify via timing in a test script)

## Verification Plan

1. Create `scripts/verify-data-layer.ts` that:
   - Calls `fetchResource` for each of the 17 resources with `limit: 1`
   - Verifies each returns at least 1 record (except `LotteryNoDrawRecord` which may be 0)
   - Verifies Hebrew filtering: `{ Yeshuv: 'בת ים' }` on urban renewal
   - Verifies pagination: `offset: 0` vs `offset: 1` return different `_id` values
   - Times two sequential calls to verify caching
2. `curl http://localhost:3000/api/ckan?resource_id=f65a0daf-f737-49c5-9424-d378d52104f5&limit=2` — verify JSON response
3. `curl http://localhost:3000/api/ckan` — verify 400 error
4. `pnpm build` — no type errors

## Dependencies

- None. This is the foundation layer.
- Next.js 16 `fetch()` with `next.revalidate` for caching (built-in, no new deps)
- `AbortController` for timeout (built-in)

## What This Enables

After this sub-project, Sub-Project 2 (Agent Tools) builds Mastra `createTool()` wrappers that call `fetchResource()` with domain-specific filters and formatting.
