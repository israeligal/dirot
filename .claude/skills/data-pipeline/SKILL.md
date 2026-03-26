---
name: data-pipeline
description: CKAN to PostgreSQL data sync pipeline for Israeli government open data (data.gov.il). Covers the CKAN HTTP client, resource constants and IDs, Drizzle schema with 16 domain tables, sync script with batch inserts, trigram index creation, and data verification. Use when working on data sync, adding new datasets, modifying schema tables, updating resource IDs, troubleshooting CKAN queries, or running verification scripts.
---

# Data Pipeline (CKAN → PostgreSQL)

ETL pipeline syncing 15 Israeli government datasets from data.gov.il CKAN API into Neon PostgreSQL for agent queries.

## File Map

| Layer | Path | Purpose |
|-------|------|---------|
| HTTP Client | `app/lib/ckan-client.ts` | `fetchResource<T>()` — paginated CKAN API wrapper with timeout and caching |
| Constants | `app/lib/constants.ts` | 17 `RESOURCE_*` IDs, `CKAN_BASE_URL`, `MAX_LIMIT`, `VALID_RESOURCE_IDS` set |
| Schema | `app/lib/schema.ts` | 16 Drizzle `pgTable()` definitions with provenance fields |
| Sync | `scripts/sync-ckan-to-pg.ts` | Fetch all → truncate → batch insert (100/batch) for 15 datasets |
| Indexes | `scripts/create-trgm-indexes.ts` | 15 GIN trigram indexes on city/name columns across 9 tables |
| Verify CKAN | `scripts/verify-data-layer.ts` | Tests CKAN resources: Hebrew search, pagination, errors |
| Verify Tools | `scripts/verify-pg-tools.ts` | Tests Mastra tools against PostgreSQL data |
| Types | `app/lib/types.ts` | Shared TypeScript types for CKAN records |

## Data Flow

```
data.gov.il CKAN API
  → fetchResource<T>() [ckan-client.ts]
    - Full-text search via `query` param (not `filters` for Hebrew)
    - 15s timeout, max 1000 records per request
    - 24h cache via Next.js revalidate (server context only)
  → fetchAllCkan() [sync-ckan-to-pg.ts]
    - Paginates through all records (offset-based, limit 1000)
  → mapRecord() transforms CKAN fields → DB columns
    - trim(), toInt(), toFloat() for data cleaning
    - Adds provenance: sourceDataset, resourceId, dataGovUrl, fetchedAt
  → TRUNCATE TABLE (not incremental — full reload each sync)
  → Batch INSERT (100 records) via Drizzle ORM
    - Neon ~6500 param limit constrains batch size
  → GIN trigram indexes [create-trgm-indexes.ts]
    - Enable fuzzy substring search on city/name fields
```

## Dataset Categories

- **Housing**: urban_renewal, lottery, construction_progress, active_construction, public_housing_inventory, public_housing_vacancies
- **Infrastructure**: tma3_roads, tma23_rail, transport_projects, national_transport, mass_transit
- **Professionals**: contractors, brokers, appraisers
- **Economics**: development_costs, green_buildings

## Key Patterns

- **Provenance metadata**: Every record stores `sourceDataset`, `resourceId`, `dataGovUrl`, `fetchedAt` — used by agent for source citations
- **SyncConfig array**: Each dataset defined as `{ name, resourceId, table, dataGovUrl, mapRecord }` in sync script
- **Hebrew search**: Use CKAN `query` parameter (full-text) — `filters` requires exact match including whitespace
- **Trigram search**: `pg_trgm` + GIN indexes enable `%` operator for fuzzy matching in `db-queries.ts`

## Gotchas

- CKAN `filters` parameter requires exact match including trailing whitespace — always use `query` for user-facing Hebrew searches
- Batch size of 100 chosen to avoid Neon's ~6500 query parameter limit (tables with many columns risk hitting it)
- `pgvector` extension is optional (try-catch in init-db.ts) — not available on all Neon plans
- `sync-ckan-to-pg.ts` has `@ts-expect-error` on dynamic table inserts (Drizzle typing limitation with variable table refs)
- Next.js `revalidate` caching only works in server context — standalone scripts don't cache
- 15 of 17 datasets synced; "Lottery No Draw" resource excluded from sync configs
- Sync is destructive (TRUNCATE + re-insert) — no rollback or incremental strategy
