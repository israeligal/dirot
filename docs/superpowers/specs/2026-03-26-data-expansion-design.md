# Data Pipeline Expansion: Transport, Schools, Neighborhood Polygons

**Date:** 2026-03-26
**Status:** Draft

## Context

Dirot currently syncs 16 datasets from data.gov.il (CKAN) covering urban renewal, housing, infrastructure plans, and professional registries. Three categories of public data are missing:

1. **Transportation stops/stations** — We have infrastructure *plans* (TMA3 roads, TMA23 rail, mass transit lines) but not the actual stop/station locations with GPS coordinates. The scoring system's "Transportation Access" factor currently just detects metro/LRT keywords — it can't measure actual proximity.

2. **Schools** — No school data at all. Area assessments for families can't include school proximity or coverage.

3. **Neighborhood polygons** — No geographic boundary data. We can't determine which neighborhood an address belongs to, or compute neighborhood-level statistics from point data.

All three are available as public government datasets. This spec adds them to the data pipeline.

## Datasets to Add

### Transport (4 datasets — CKAN sync)

| Dataset | Resource ID | Source | Format | Update Freq |
|---------|-------------|--------|--------|-------------|
| Bus Stops | `e873e6a2-66c1-494f-a677-f5e77348edb0` | Ministry of Transport | CSV | Quarterly |
| Train Stations | `cdffbed6-8388-4b72-8c74-d36403cc5b83` | Ministry of Transport | CSV | Daily |
| Light Rail Stations | `86fce9f0-0e5a-4012-8a84-86a233e83191` | Ministry of Transport | CSV | Manual |
| Light Rail Lines | `b65ae5cf-8aab-4b8e-ae08-de941368fff0` | Ministry of Transport | CSV | Manual |

### Schools (2 datasets — CKAN sync)

| Dataset | Resource ID | Source | Format | Update Freq |
|---------|-------------|--------|--------|-------------|
| School Directory (MOSDOT) | `5a9278c8-fa76-46e1-bf2d-0368078c9cc7` | Ministry of Education | XLSX | Manual |
| School Coordinates | `845e1d30-1b79-46a0-870c-6c39d18700d0` | Ministry of Education | CSV | Manual |

### Neighborhood Polygons (1 dataset — ArcGIS Hub)

| Dataset | Source | Format | Update Freq |
|---------|--------|--------|-------------|
| Statistical Areas 2022 | CBS via ArcGIS Hub | GeoJSON | Yearly |

**Note:** The school directory is XLSX format, not CSV. The CKAN `datastore_search` API doesn't work for XLSX — we need to download the file directly and parse it.

## Database Schema

### New Tables (7)

**`bus_stops`** — Public transit bus stop locations
- `stop_id` (int) — Stop identifier
- `stop_name` (text) — Stop name in Hebrew
- `stop_lat` (real) — WGS84 latitude
- `stop_lng` (real) — WGS84 longitude
- `city` (text) — City name
- `operator` (text) — Bus operator (Egged, Dan, etc.)
- Indexes: `city`, trigram on `stop_name`
- Provenance: standard CKAN fields

**`train_stations`** — Israel Railways stations
- `station_id` (int) — Station identifier
- `station_name` (text) — Station name in Hebrew
- `station_lat` (real) — WGS84 latitude
- `station_lng` (real) — WGS84 longitude
- `city` (text) — City name
- `status` (text) — active/inactive/planning
- Indexes: `city`, `status`
- Provenance: standard CKAN fields

**`light_rail_stations`** — Light rail / metro stations
- `station_id` (int) — Station identifier
- `station_name` (text) — Station name
- `line_name` (text) — Which line (Red, Green, Purple, etc.)
- `station_lat` (real) — Latitude
- `station_lng` (real) — Longitude
- `city` (text) — City
- `status` (text) — operational status
- Indexes: `city`, `line_name`
- Provenance: standard CKAN fields

**`light_rail_lines`** — Light rail route metadata
- `line_id` (text) — Line identifier
- `line_name` (text) — Line name
- `line_type` (text) — LRT / Metro
- `status` (text) — operational status
- `geometry` (text) — Route geometry as JSON (if available in CSV)
- Provenance: standard CKAN fields

**`schools`** — Educational institutions directory
- `school_id` (int) — Institution code
- `school_name` (text) — School name in Hebrew
- `school_type` (text) — Elementary / Middle / High / etc.
- `city` (text) — City name
- `neighborhood` (text) — Neighborhood (if available)
- `address` (text) — Street address
- `sector` (text) — Jewish / Arab / Druze / etc.
- `supervision` (text) — State / State-Religious / Independent / etc.
- `lat` (real) — Latitude (from coordinates dataset)
- `lng` (real) — Longitude (from coordinates dataset)
- Indexes: `city`, `school_type`, trigram on `school_name`
- Provenance: standard CKAN fields

**Note:** Schools and coordinates are separate datasets on data.gov.il. We'll join them by institution code during sync and store in a single table.

**`statistical_areas`** — CBS neighborhood/statistical area polygons
- `stat_area_code` (text) — CBS statistical area code
- `city_code` (text) — CBS city/settlement code
- `city_name` (text) — City name in Hebrew
- `area_name` (text) — Statistical area / neighborhood name
- `population` (int) — Population count (if in dataset)
- `geometry` (text) — GeoJSON polygon as text
- `centroid_lat` (real) — Center point latitude
- `centroid_lng` (real) — Center point longitude
- Indexes: `city_code`, `city_name`, trigram on `area_name`
- No provenance (not from CKAN — separate source)
- `fetched_at` (timestamp) — When downloaded

## Sync Implementation

### CKAN Datasets (6 datasets)

Follow the existing `SyncConfig` pattern exactly:
1. Add resource constants to `app/lib/constants.ts`
2. Add table definitions to `app/lib/schema.ts`
3. Add `SyncConfig` entries to `scripts/sync-ckan-to-pg.ts` with field mappings
4. Add trigram indexes to `scripts/create-trgm-indexes.ts`

**XLSX handling for schools:** The MOSDOT dataset is XLSX, not CSV. The CKAN `datastore_search` API won't work. Instead:
- Download the file directly via `resource_show` → `url` field
- Parse with a lightweight XLSX parser (e.g., `xlsx` or `exceljs`)
- Map fields and insert using the same batch pattern

**School coordinate join:** The coordinates dataset has institution codes matching the MOSDOT directory. During sync:
1. Fetch MOSDOT (school details)
2. Fetch coordinates (lat/lng by institution code)
3. Join by institution code
4. Insert the merged record into the `schools` table

### CBS Statistical Areas (separate script)

New script: `scripts/sync-statistical-areas.ts`
- Fetch GeoJSON from ArcGIS Hub REST API
- Parse features → extract area code, city, name, geometry, centroid
- Truncate and reload (same as CKAN pattern)
- Run separately: `npx tsx scripts/sync-statistical-areas.ts`
- Re-run when CBS publishes updates (approximately yearly)

The ArcGIS Hub dataset exposes a REST API:
```
https://services5.arcgis.com/.../query?where=1=1&outFields=*&f=geojson
```

## Tools & Agent Integration

### New Mastra Tool: `queryNearbyTransit`

**File:** `mastra/tools/nearby-transit.ts`

Input: `{ lat, lng, radiusMeters? }` (default radius: 1000m)
Output: Nearby bus stops, train stations, light rail stations sorted by distance

Uses Haversine formula or simple bounding box query on lat/lng columns.

### New Mastra Tool: `queryNearbySchools`

**File:** `mastra/tools/nearby-schools.ts`

Input: `{ lat, lng, radiusMeters?, schoolType? }`
Output: Nearby schools with type, name, distance

### Enhanced Scoring: Transportation Access

Update `mastra/tools/scoring-factors.ts` → `scoreTransportationAccess`:
- **Current:** Keyword detection ("metro", "LRT") from mass transit table
- **New:** Count actual transit stops within radius of the address
  - Train station within 1km → 95 points
  - Light rail station within 500m → 90 points
  - 5+ bus stops within 500m → 75 points
  - 1-4 bus stops within 500m → 60 points
  - No transit within 1km → 20 points

### Neighborhood Lookup

**File:** `mastra/tools/neighborhood-lookup.ts` (or add to existing address tool)

Input: `{ lat, lng }` or `{ city, streetName, streetNumber }`
Output: Which statistical area / neighborhood the point falls in

This enables: "What neighborhood is חשמונאים 22 in?" → point-in-polygon lookup against `statistical_areas` geometry.

**Note:** Point-in-polygon in PostGIS requires the `postgis` extension. If Neon doesn't support it, we can do a simpler centroid-distance lookup (find the statistical area whose centroid is closest). Alternatively, use a JS library for the geometry check.

## Verification Plan

1. **Sync verification:** After running sync, verify record counts match CKAN totals
2. **Coordinate spot-check:** Pick a known bus stop (e.g., "תחנה מרכזית תל אביב"), verify lat/lng lands on the map correctly
3. **School join verification:** Ensure >90% of schools have coordinates after the join
4. **Polygon coverage:** Verify statistical areas cover all major cities
5. **Proximity query test:** Query transit near a known address, verify results make sense
6. **Scoring test:** Compare old vs new transportation scoring for the same address

## File Changes Summary

**New files:**
- `mastra/tools/nearby-transit.ts`
- `mastra/tools/nearby-schools.ts`
- `mastra/tools/neighborhood-lookup.ts`
- `scripts/sync-statistical-areas.ts`

**Modified files:**
- `app/lib/constants.ts` — Add 6 new resource IDs
- `app/lib/schema.ts` — Add 7 new tables
- `scripts/sync-ckan-to-pg.ts` — Add 6 SyncConfig entries (including XLSX handler)
- `scripts/create-trgm-indexes.ts` — Add trigram indexes for new tables
- `mastra/tools/scoring-factors.ts` — Enhance `scoreTransportationAccess`
- `mastra/tools/scoring.ts` — Add transit/school queries to `gatherScoringData`
- `mastra/agents/dirot-agent.ts` — Register new tools
