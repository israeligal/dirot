# Agent Tools — Spec (Sub-Project 2 of 5)

**Parent PRD:** `PRD.md`
**Date:** 2026-03-25
**Status:** Draft

## Problem Statement

The data layer (Sub-Project 1) provides raw CKAN data access via `fetchResource<T>()`. The Mastra agent needs domain-specific tools that the LLM can call to answer investment questions. Each tool should have a clear purpose, Zod input schema, and return formatted results the LLM can reason about.

## Key Discovery from Data Layer Testing

**CKAN `filters` requires exact string match including trailing whitespace** in text fields (e.g., `Yeshuv` is padded to 255 chars). Agent tools MUST use `query` (full-text search via `q` param) for city/text lookups, NOT `filters`. The `filters` param works fine for numeric fields (e.g., `SemelYeshuv: 6200`).

## Tools to Create

### Core Tools (6)

| Tool | Input | Data Source | Purpose |
|------|-------|-------------|---------|
| `searchPinuiBinui` | city?, neighborhood?, status? | Urban Renewal | Find Pinui Binui projects |
| `searchConstructionSites` | city?, buildType? | Active Construction Sites | Find active construction sites |
| `searchConstructionProgress` | city?, gush? | Construction Progress | Track building stages |
| `searchLotteries` | city?, neighborhood? | Lottery + No-Draw | Dira BeHanacha price data |
| `searchContractors` | name?, city?, branch? | Registered Contractors | Lookup contractor info |
| `searchInfrastructure` | type?, status?, keyword? | TMA3 + TMA23 + Transport + National + Mass Transit | Find planned infrastructure |

### Supporting Tools (2)

| Tool | Input | Data Source | Purpose |
|------|-------|-------------|---------|
| `searchBrokersAndAppraisers` | city?, type ("broker" \| "appraiser") | Brokers + Appraisers | Lookup licensed professionals |
| `searchPublicHousing` | city? | Public Housing Inventory + Vacancies | Public housing data |

### Design Decisions

1. **`searchInfrastructure` combines 5 datasets** — the agent doesn't need to know which infrastructure dataset to query. One tool searches all 5 and merges results. The `type` param filters by category (road/rail/transit/national).

2. **All text search uses `query` param** — avoids the whitespace padding issue in CKAN text fields.

3. **Results are trimmed and formatted** — strip whitespace from text fields, parse string-encoded numbers, add GovMap fallback links for Pinui Binui.

4. **Limit results to 20 per tool call** — prevents overwhelming the LLM context window. Agent can paginate by calling again with offset.

5. **Each tool returns a summary string + structured data** — the summary helps the LLM respond naturally, the structured data enables comparisons.

## Tool Signatures

### searchPinuiBinui

```typescript
inputSchema: z.object({
  city: z.string().optional().describe("City name in Hebrew (e.g., בת ים)"),
  neighborhood: z.string().optional().describe("Neighborhood/complex name"),
  status: z.string().optional().describe("Project status filter"),
})

// Returns: { summary, projects: UrbanRenewalProject[] }
```

### searchConstructionSites

```typescript
inputSchema: z.object({
  city: z.string().optional().describe("City name in Hebrew"),
  buildType: z.string().optional().describe("Building type (e.g., מגורים)"),
})
```

### searchConstructionProgress

```typescript
inputSchema: z.object({
  city: z.string().optional().describe("City name in Hebrew"),
  gush: z.string().optional().describe("Block (gush) number"),
})
```

### searchLotteries

```typescript
inputSchema: z.object({
  city: z.string().optional().describe("City name in Hebrew"),
  neighborhood: z.string().optional().describe("Neighborhood name"),
})
```

### searchContractors

```typescript
inputSchema: z.object({
  name: z.string().optional().describe("Contractor name (partial match)"),
  city: z.string().optional().describe("City name"),
  branch: z.string().optional().describe("Branch (e.g., בניה)"),
})
```

### searchInfrastructure

```typescript
inputSchema: z.object({
  type: z.enum(["road", "rail", "transit", "transport", "national", "all"]).optional()
    .describe("Infrastructure type filter"),
  keyword: z.string().optional().describe("Search keyword"),
  status: z.string().optional().describe("Plan status filter"),
})
```

### searchBrokersAndAppraisers

```typescript
inputSchema: z.object({
  city: z.string().optional().describe("City name"),
  type: z.enum(["broker", "appraiser"]).describe("Professional type"),
})
```

### searchPublicHousing

```typescript
inputSchema: z.object({
  city: z.string().optional().describe("City name"),
})
```

## Data Formatting

Each tool trims whitespace from all string fields and formats output for LLM consumption:

```typescript
// Utility: trim all string values in a record
function trimRecord<T extends Record<string, unknown>>(record: T): T
```

For Pinui Binui specifically:
- Parse `YachadKayam` and `YachadTosafti` from string to number
- Generate GovMap fallback URL when `KishurLaMapa` is empty
- Translate `Status` codes to plain language where possible

## File Structure

```
mastra/tools/
  pinui-binui.ts          # searchPinuiBinui
  construction.ts         # searchConstructionSites + searchConstructionProgress
  lotteries.ts            # searchLotteries
  infrastructure.ts       # searchInfrastructure (combines 5 datasets)
  professionals.ts        # searchContractors + searchBrokersAndAppraisers
  public-housing.ts       # searchPublicHousing
  utils.ts                # trimRecord, formatGovMapUrl, shared helpers
```

## Acceptance Criteria

- [ ] All 8 tools are `createTool()` with Zod input/output schemas
- [ ] Each tool returns results when called with city="בת ים"
- [ ] `searchPinuiBinui({ city: "בת ים" })` returns projects with trimmed fields and GovMap links
- [ ] `searchInfrastructure({ type: "all" })` merges results from 5 datasets
- [ ] `searchContractors({ name: "partial" })` does fuzzy text search
- [ ] All tools wired into dirot-agent
- [ ] `pnpm build` passes
- [ ] Agent can answer "show me Pinui Binui projects in Bat Yam" using the tools
