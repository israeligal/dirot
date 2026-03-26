# Agent Data Tools & Scoring

Mastra tool definitions for the Dirot agent: DB query tools, XPLAN API, scoring system, and HITL workflow tools.

## Files

- `db-queries.ts` — Shared DB query functions (Neon PostgreSQL, pg_trgm fuzzy search, source metadata extraction)
- `utils.ts` — Helpers: `trimRecord()`, `formatGovMapUrl()`, `parseStringNumber()`
- `xplan-queries.ts` — ArcGIS REST API client for Israeli Planning Authority (XPLAN)
- `pinui-binui.ts` — Urban renewal projects search by city/neighborhood
- `construction.ts` — Active construction sites + construction progress (exports 2 tools)
- `lotteries.ts` — Dira BeHanacha lottery data (price/sqm, subscribers, winners)
- `infrastructure.ts` — Multi-source search: roads, rail, transit, transport projects, national plans (5 tables in parallel)
- `professionals.ts` — Contractors (pg_trgm fuzzy) + brokers/appraisers (exports 2 tools)
- `public-housing.ts` — Public housing inventory and vacancies
- `xplan.ts` — Planning authority plans at location (commercial, parks, schools, roads — not just PB)
- `scoring.ts` — Orchestrates 7-factor weighted scoring (0-100, grade A-F) via `Promise.allSettled()`
- `scoring-factors.ts` — Pure scoring functions: infrastructure, stage, cluster, contractor, transport, price, municipal
- `address.ts` — Address-level search (7 sources in parallel: PB, XPLAN, construction progress, active sites, green buildings, dev costs, lotteries)
- `developer.ts` — Developer research (gov registry + active sites + Firecrawl web search for reviews/reputation)
- `saved-properties.ts` — Save/list/remove properties per user (3 tools, uses context.agent.resourceId for user ID)
- `compare-properties.ts` — Compare 2-4 addresses side by side (parallel searchByAddress + scoreProject, renders as HITL card)
- `update-todos-tool.ts` — HITL: stateful task list management (searches message history for previous state)
- `ask-for-plan-approval-tool.ts` — HITL: request user approval (no execute fn — framework-handled)
- `request-input.ts` — HITL: request user input (no execute fn — framework-handled)

## Conventions

- **Tool definition**: `createTool({ id, description, inputSchema, outputSchema, execute })` from `@mastra/core/tools`
- **Input schemas**: Optional filters + `limit`/`offset` pagination (defaults: limit=20, offset=0)
- **Output format**: All query tools return `{ summary, total, <domain-named-array>, sources[] }` — array key matches domain (e.g., `projects`, `lotteries`, `plans`, `sites`)
- **Source metadata**: Extracted from DB columns (`source_dataset`, `resource_id`, `fetched_at`, `data_gov_url`)
- **Search types**: ILIKE for general text, `%` operator (pg_trgm) for name fuzzy matching, exact match for codes (gush)
- **Field mapping**: Snake_case DB fields manually mapped to camelCase in each tool's execute function
- **Scoring**: `Promise.allSettled()` for parallel data gathering — partial failures return neutral scores, not errors

## Gotchas

- `searchInfrastructure` splits limit across 5 sources (`Math.floor(limit/5)`) — total results can exceed requested limit
- `searchByAddress` queries 7 sources via `Promise.allSettled()` — same partial-failure pattern as scoring
- `searchContractors` is the only tool with fuzzy match scores; other tools use ILIKE without scoring
- XPLAN WHERE clause uses string concatenation, not parameterized queries — input validation is critical
- HITL tools (`askForPlanApproval`, `requestInput`) have no `execute` function — Mastra framework intercepts them
- `updateTodosTool` is stateful: traverses `context.agent.messages` in reverse to find previous todo state
