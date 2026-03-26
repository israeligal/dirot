# DB Setup & Data Sync Scripts

Scripts for database initialization, CKAN data synchronization, and verification. Run via `npx tsx scripts/<name>.ts`.

## Files

- `init-db.ts` — Enables PostgreSQL extensions (`pg_trgm` for fuzzy search, `pgvector` optional)
- `sync-ckan-to-pg.ts` — Fetches all records from 15 CKAN datasets, transforms fields, batch-inserts into PostgreSQL
- `sync-statistical-areas.ts` — Syncs CBS statistical areas (neighborhoods/polygons) into `statistical_areas` table
- `create-trgm-indexes.ts` — Creates 15 GIN trigram indexes on key search columns across 9 tables
- `check-db.ts` — Displays row counts for all tables
- `verify-data-layer.ts` — Tests all 17 CKAN resources: Hebrew filtering, pagination, error handling, caching
- `verify-agent-tools.ts` — Verifies Mastra agent tools work with Hebrew queries
- `verify-pg-tools.ts` — Tests PostgreSQL-backed tools: fuzzy search, summaries, source citations

## Conventions

- **Env loading**: All scripts load `.env.local` via dotenv at top
- **Verification scripts**: Pass/fail counters with `ok()`/`fail()` helpers, exit code 1 on failure
- **Data sync**: Truncate-and-reload (not incremental), batch inserts of 100 records to stay under Neon's ~6500 parameter limit
- **Provenance**: Every synced record gets `sourceDataset`, `resourceId`, `dataGovUrl`, `fetchedAt` metadata

## Gotchas

- CKAN `filters` requires exact match with whitespace — use `query` parameter for Hebrew text search instead
- `pgvector` creation wrapped in try-catch (not available on all Neon plans)
- `sync-ckan-to-pg.ts` has `@ts-expect-error` on dynamic table inserts (Drizzle typing limitation)
- Next.js `revalidate` caching only works in server context, not in standalone scripts
