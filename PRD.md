# Dirot - Pinui Binui Investment Analysis Agent — PRD

## Problem Statement

Buying a Pinui Binui apartment as a long-term investment (3-7 years) requires cross-referencing dozens of fragmented government data sources: urban renewal project status, planned infrastructure (roads, rail, transit stations), contractor reliability, construction progress, and area pricing. Today this data exists across data.gov.il, nadlan.gov.il, GovMap, and MAVAT — but no tool connects them to help an investor identify which projects have the highest appreciation potential. An investor looking at Bat Yam Ramat HaNassi (or any neighborhood) has no way to systematically compare projects or understand how nearby infrastructure plans affect future value.

**Who**: Real estate investors looking for Pinui Binui opportunities in Israel. First user: the developer, targeting Bat Yam Ramat HaNassi neighborhood, but the tool must be generic for any city/neighborhood.

**Cost of not solving**: Hours of manual research per project, easy to miss critical infrastructure plans that would affect property value, no systematic way to compare projects.

## Goals

1. **Cross-source intelligence**: Automatically correlate Pinui Binui projects with nearby infrastructure plans (new roads, rail stations, transit lines) to surface appreciation signals
2. **Project stage clarity**: Parse and explain what stage each Pinui Binui project is in (plan approved, permits issued, under construction, near completion) and what that means for investment timing
3. **Contractor due diligence**: Cross-reference the project's contractor against the registered contractors database (classification, scope, active sites, safety record)
4. **Area price context**: Compare current deal pricing against Dira BeHanacha prices in the same city to establish relative value
5. **Generic & extensible**: Works for any city/neighborhood in Israel, with Bat Yam Ramat HaNassi as the first use case

## Non-Goals

- **Not a price predictor**: We surface factors that correlate with appreciation (infrastructure, density, transit). The user makes the judgment call.
- **Not a legal advisor**: We don't interpret planning law or Pinui Binui tenant rights. We show data.
- **Not a transaction platform**: Research tooling only — no buying/selling facilitation.
- **Not real-time**: Data updates weekly from government sources.
- **No proprietary data in V1**: Only free, open government data. No scraping nadlan.gov.il (reCAPTCHA protected).

## User Stories

### Investor researching Pinui Binui

- **As an investor**, I want to ask "show me all Pinui Binui projects in Bat Yam" so that I can see what's available in my target area
- **As an investor**, I want to ask "what infrastructure is planned near Ramat HaNassi" so that I can assess whether new transit/roads will drive up property values
- **As an investor**, I want to ask "what stage is project X in and who is the contractor" so that I can assess project reliability and timeline
- **As an investor**, I want to ask "compare all Pinui Binui projects in Bat Yam by appreciation potential" so that I can prioritize which projects to investigate further
- **As an investor**, I want to ask "is there a new train station or light rail planned near this project" so that I can factor transit proximity into my decision
- **As an investor**, I want to ask "how many units are being added in this area" so that I can understand supply dynamics
- **As an investor**, I want to ask "show me the contractor's other active projects and safety record" so that I can assess builder quality

### General user (future)

- **As a home buyer**, I want to ask "what Pinui Binui projects are near good schools" so I can find family-friendly options
- **As a researcher**, I want to ask "which cities have the most urban renewal activity" so I can analyze national trends

## Requirements

### Must-Have (P0)

**1. CKAN Data Layer**
- Typed API client that fetches from all identified data.gov.il resources
- Server-side proxy to avoid CORS
- 24h response caching via Next.js fetch cache (data updates weekly)
- Acceptance:
  - [ ] Can fetch, parse, and return typed data from all 7 core datasets
  - [ ] Can fetch from all 5 infrastructure datasets
  - [ ] Handles CKAN pagination (limit/offset)
  - [ ] Returns typed TypeScript objects, not raw JSON

**2. Chat Interface (Mastra + assistant-ui)**
- Natural language input in Hebrew or English
- Mastra agent with tool-use interprets questions and queries relevant datasets
- assistant-ui provides rich chat UI with streaming, threads, tool result display
- Acceptance:
  - [ ] User can type a question and receive a streamed response
  - [ ] Tool calls are visible in the UI (assistant-ui tool UI support)
  - [ ] Agent matches response language to user's input language
  - [ ] Starter prompts shown for first-time users

**3. Pinui Binui Project Analysis**
- Parse and display project status from urban renewal dataset (`Status` field)
- Show existing units (`YachadKayam`), additional units (`YachadTosafti`), total proposed (`YachadMutza`)
- Link to MAVAT plan page (`KishurLatar`) and GovMap (`KishurLaMapa`)
- When links are empty, generate city-level GovMap fallback URL
- Acceptance:
  - [ ] "Show me Pinui Binui projects in Bat Yam" returns all projects with status, units, links
  - [ ] Empty MAVAT/GovMap links show city-level GovMap fallback
  - [ ] Status field is explained in plain language (not raw codes)

**4. Infrastructure Proximity Analysis**
- Cross-reference Pinui Binui project locations with nearby infrastructure at neighborhood level
- Use neighborhood name from `ShemMitcham` field + city name for matching
- Parse GovMap link URLs for coordinate data where available
- Cross-reference with:
  - TMA 3 road plans (approved/planned roads)
  - TMA 23 rail plans
  - Transport infrastructure projects (5-year plan)
  - Tel Aviv 2050 mass transit network (light rail, BRT, metro)
- Acceptance:
  - [ ] "What infrastructure is planned near Ramat HaNassi in Bat Yam" returns relevant plans
  - [ ] Matching works at neighborhood level (not just city)
  - [ ] Shows plan status (approved, under construction, planned)

**5. Contractor Cross-Reference**
- Match contractor from construction/renewal data against registered contractors DB
- Show classification, scope, branch
- Cross-reference with active construction sites for same contractor
- Acceptance:
  - [ ] "Tell me about contractor Y" returns registration info + active sites + safety/sanctions
  - [ ] Fuzzy name matching handles slight variations in contractor names

**6. Project Timeline Estimation**
- Map each project status to estimated years-to-completion based on Israeli urban renewal stages
- Stages and typical premium (per Yoni Levy / industry standard):
  - **Potential identified** (no plan): +10-20% over market, highest risk, 7-12 years to completion
  - **Plan submitted to local committee**: +20-30%, 5-8 years
  - **Plan approved (tokef)**: +30-50%, 3-5 years
  - **Building permit issued**: +50-70%, 2-3 years
  - **Under construction**: +70-90%, 1-2 years
- Critical for 3-7 year investment horizon — investor needs projects completing within their window
- Acceptance:
  - [ ] "What stage is project X and when will it be done?" returns status + estimated timeline
  - [ ] Agent explains what the stage means and the risk/reward tradeoff

**7. Neighborhood Cluster Analysis**
- Count multiple Pinui Binui projects in the same neighborhood/city
- Cluster effect: multiple projects = neighborhood transformation = stronger appreciation signal
- Count active construction sites of type "residential" in the same area
- Show total units being added (existing + new) to understand supply dynamics
- Acceptance:
  - [ ] "How much development is happening in Ramat HaNassi?" returns count of PB projects + construction sites + total new units
  - [ ] Agent highlights cluster effect when multiple projects exist in same area

**8. Weighted Appreciation Scoring Framework**
- Explicit, tunable scoring model embedded in the agent's system prompt:

| Factor | Weight | Signal Source |
|--------|--------|---------------|
| Infrastructure proximity (new roads, rail, transit) | 25% | TMA 3, TMA 23, mass transit, transport projects |
| Project stage (closer to completion = lower risk) | 20% | Urban renewal status field |
| Neighborhood cluster effect (multiple projects nearby) | 15% | Count of PB projects + construction sites in area |
| Contractor reliability (classification, safety, scope) | 15% | Registered contractors + active sites |
| Transportation access (existing + planned bus/train) | 10% | Mass transit 2050, existing priority lanes |
| Price relative to area (discount to market) | 10% | Dira BeHanacha price/sqm comparison |
| Municipal support (taxation track vs municipal track) | 5% | `Maslul` field in urban renewal data |

- Display ranked comparison with factor breakdown
- Acceptance: "Rank Bat Yam projects by investment potential" -> ordered list with per-factor scores

**9. XPLAN Integration (What Applies at My Location)**
- Query XPLAN data from the Planning Administration to see ALL plans affecting a location
- Reveals hidden value drivers beyond Pinui Binui: new commercial zones, parks, schools, road widening
- Link to XPLAN website for full plan details
- Acceptance: "What other plans affect this area?" returns all active plans, not just PB

### Nice-to-Have (P1)

**10. Price Context from Dira BeHanacha**
- Pull price/sqm from lottery dataset for same city
- Show as price reference
- Acceptance: "What are prices like in Bat Yam" -> price/sqm from recent lotteries

**11. Construction Progress Tracking**
- Cross-reference with construction progress dataset by gush/helka
- Show construction stage milestones
- Acceptance: "What stage is this building at" -> construction milestone data

**12. Conversation Memory**
- Mastra memory to maintain context across messages in a conversation
- Agent remembers which projects user asked about previously
- Acceptance: Follow-up questions ("what about its contractor?") resolve to previously discussed project

**13. Government Viability Calculator Reference**
- The government publishes a Pinui Binui economic viability calculator (Standard 21)
- Key parameters: density multiplier, construction costs, 36-month average evacuation period, 12sqm mamad per unit
- Agent should reference these standards when discussing project viability
- Acceptance: Agent can explain Standard 21 viability factors when asked

### Future Considerations (P2)

14. **Map visualization**: Interactive Leaflet map with project and infrastructure overlays
15. **Alerts**: Notify on project status changes or new infrastructure near watched projects
16. **Historical prices**: If nadlan.gov.il becomes API-accessible, add transaction price history
17. **Multi-project portfolio**: Track and compare investment candidates over time
18. **HITL approval**: Human-in-the-loop for investment recommendations (assistant-ui tool UI)
19. **Education/schools data**: Proximity to good schools affects family buyer demand and resale value
20. **CBS demographics**: Population growth and age demographics as demand signals

## Architecture

### Tech Stack
- **Next.js 16** (App Router, React 19, Server Components)
- **Tailwind CSS v4** for styling
- **Mastra** (`@mastra/core`) — agent framework with tool-use
- **assistant-ui** (`@assistant-ui/react`) — rich chat UI components
- **AI SDK** (`ai`, `@mastra/ai-sdk`) — streaming bridge
- **Configurable model** via Mastra model router (e.g., `anthropic/claude-sonnet-4-20250514`, `openai/gpt-4o`) set by env var `AI_MODEL`

### Agent Architecture (Mastra)

```typescript
const dirotAgent = new Agent({
  id: 'dirot-agent',
  name: 'Dirot Investment Analyst',
  model: process.env.AI_MODEL || 'anthropic/claude-sonnet-4-20250514',
  instructions: '...system prompt with cross-reference logic...',
  tools: {
    searchPinuiBinui,         // urban renewal projects
    searchConstructionSites,  // active construction sites
    searchConstructionProgress, // building stage tracking
    searchLotteries,          // Dira BeHanacha prices
    searchRoadPlans,          // TMA 3 national roads
    searchRailPlans,          // TMA 23 rail network
    searchTransportProjects,  // 5-year infra projects
    searchMassTransit,        // Tel Aviv 2050 transit
    searchContractors,        // registered contractors
    searchBrokers,            // licensed brokers
    searchAppraisers,         // licensed appraisers
  },
})
```

Each tool is a `createTool()` with Zod schema that wraps CKAN `datastore_search`.

### Project Structure

```
app/
  layout.tsx                         # RTL layout, Hebrew font
  page.tsx                           # Chat page (RSC shell + client ChatInterface)
  api/
    chat/
      route.ts                       # Mastra agent stream via handleChatStream
  lib/
    mastra/
      index.ts                       # Mastra instance
      agents/
        dirot-agent.ts               # Agent definition + system prompt
      tools/
        pinui-binui.ts               # searchPinuiBinui tool
        construction.ts              # searchConstructionSites + searchConstructionProgress
        lotteries.ts                 # searchLotteries tool
        infrastructure.ts           # road, rail, transport, mass transit tools
        professionals.ts            # contractors, brokers, appraisers tools
    ckan-client.ts                   # Generic typed CKAN API client
    types.ts                         # TypeScript types for all datasets
    constants.ts                     # Resource IDs, API base URL, field mappings
  components/
    chat/
      ChatInterface.tsx              # assistant-ui runtime + Thread (client)
      thread.tsx                     # assistant-ui Thread component
    layout/
      Header.tsx                     # App header
```

### Key Flow

```
User question (Hebrew/English)
  -> assistant-ui useChatRuntime -> POST /api/chat
  -> handleChatStream({ mastra, agentId: 'dirot-agent', params })
  -> Mastra agent.stream() with tool-use loop
  -> Tools call CKAN API via ckan-client.ts
  -> Agent synthesizes cross-referenced results
  -> createUIMessageStreamResponse -> SSE -> assistant-ui Thread
```

### Neighborhood-Level Matching Strategy

Instead of geocoding (converting addresses to coordinates via external API), extract location from the data itself:
1. **City matching**: `Yeshuv` / `city_name` fields (exact match)
2. **Neighborhood matching**: `ShemMitcham` (complex name) often contains neighborhood — use as text match
3. **Gush/Helka matching**: Cross-reference between datasets using the gush (block) number when available
4. **GovMap URL parsing**: Some records have `KishurLaMapa` URLs containing coordinates — parse these for proximity
5. **Agent intelligence**: The LLM can reason about neighborhood proximity from names and descriptions even without coordinates

## Implementation Plan

### Phase 1: Foundation + Mastra Setup
1. Install dependencies: `@mastra/core`, `@mastra/ai-sdk`, `@assistant-ui/react`, `@assistant-ui/react-ai-sdk`, `ai`, `@ai-sdk/react`, `zod`
2. Configure `next.config.ts` with `serverExternalPackages: ["@mastra/*"]`
3. Create `lib/constants.ts` with all resource IDs
4. Create `lib/types.ts` with TypeScript interfaces for each dataset
5. Create `lib/ckan-client.ts` — generic `fetchResource<T>({ resourceId, filters, limit, offset, sort, query })`

### Phase 2: Agent Tools
1. Create `lib/mastra/tools/pinui-binui.ts` — `searchPinuiBinui` with city/status/neighborhood filters
2. Create `lib/mastra/tools/construction.ts` — sites + progress tools
3. Create `lib/mastra/tools/lotteries.ts` — Dira BeHanacha search
4. Create `lib/mastra/tools/infrastructure.ts` — road, rail, transport, mass transit tools
5. Create `lib/mastra/tools/professionals.ts` — contractors, brokers, appraisers
6. Test each tool independently

### Phase 3: Agent + API Route
1. Create `lib/mastra/agents/dirot-agent.ts` — agent with system prompt and all tools
2. Create `lib/mastra/index.ts` — Mastra instance
3. Create `app/api/chat/route.ts` — `handleChatStream` endpoint
4. System prompt includes: cross-reference instructions, Hebrew/English matching, GovMap fallback logic, neighborhood matching strategy

### Phase 4: Chat UI
1. Set up RTL layout with Hebrew support in `app/layout.tsx`
2. Create `components/chat/thread.tsx` — assistant-ui Thread component
3. Create `components/chat/ChatInterface.tsx` — `useChatRuntime` + `AssistantRuntimeProvider`
4. Create `app/page.tsx` — RSC shell rendering ChatInterface
5. Add starter prompt suggestions

### Phase 5: Cross-Reference & Polish
1. Refine system prompt with cross-reference patterns
2. Test compound queries end-to-end
3. Add GovMap fallback URL generation for empty links
4. Verify neighborhood-level matching quality
5. Add error states and loading indicators

## Success Metrics

### Leading (1-2 weeks)
- Agent correctly answers 8/10 sample questions with relevant data
- Response time < 10s for single-dataset queries, < 20s for cross-reference
- Zero runtime errors on `npm run build`

### Lagging (1-3 months)
- Used weekly to research actual investment opportunities
- Identifies at least 2 projects worth investigating in person
- Data stays fresh (weekly CKAN updates reflected)

## Decisions Log

| # | Question | Resolution |
|---|----------|------------|
| 1 | Empty MAVAT/GovMap links? | Always show — use city-level GovMap fallback when specific link is empty |
| 2 | Geocoding needed? | No — use neighborhood names, gush numbers, and GovMap URL parsing from data itself |
| 3 | AI model provider? | Configurable via env var `AI_MODEL`, Mastra model router supports 600+ models |
| 4 | Chat framework? | Mastra + assistant-ui (full-stack in Next.js) |
| 5 | Response language? | Match user's input language; data labels stay in Hebrew |
| 6 | CKAN rate limits? | No documented limits. Cache all CKAN responses for 24h via Next.js fetch cache. Data updates weekly. |
| 7 | API key management? | `.env.local` with `AI_MODEL` and provider API key. Personal single-user tool. |

## Timeline Considerations

- **Phase 1-2**: Single session (data layer + tools)
- **Phase 3-4**: Follow immediately (agent + chat UI)
- **Phase 5**: Iterative improvement based on actual queries
- No external deadlines. Personal investment research tool.

## Verification

1. `npm run build` — production build succeeds
2. `npm run dev` — chat loads, RTL renders correctly
3. Test: "Show me all Pinui Binui projects in Bat Yam" -> projects with status, units, links
4. Test: "What infrastructure is planned near Ramat HaNassi, Bat Yam" -> road/rail/transit plans
5. Test: "Tell me about the contractor on project X" -> contractor info + active sites
6. Test: "Compare projects in Bat Yam" -> multi-project comparison with factors

## Data Sources (data.gov.il CKAN API)

All data accessed via: `https://data.gov.il/api/3/action/datastore_search?resource_id=<ID>`

### Core Datasets

| Dataset | Resource ID | Records | Key Fields |
|---------|------------|---------|------------|
| **Urban Renewal (Pinui Binui)** | `f65a0daf-f737-49c5-9424-d378d52104f5` | 906 | Yeshuv, SemelYeshuv, ShemMitcham, YachadKayam, YachadTosafti, YachadMutza, Status, MisparTochnit, KishurLatar, KishurLaMapa, Maslul |
| **Dira BeHanacha Lotteries** | `7c8255d0-49ef-49db-8904-4cf917586031` | 2,352 | LamasName, LamasCode, Neighborhood, PriceForMeter, ProjectStatus, ProviderName, Winners, Subscribers |
| **Dira BeHanacha (No Lottery)** | `ea93b3c9-15e2-4b74-a632-097ee53737e4` | ? | Apartments for sale without lottery |
| **Construction Progress** | `1ec45809-5927-430a-9b30-77f77f528ce3` | 10,371 | YESHUV_LAMAS, GUSH, HELKA, KOMOT_BINYAN, YEHIDOT_BINYAN, construction stage dates |
| **Active Construction Sites** | `b072e36c-a53b-49e1-be08-4a608fcf4638` | 10,299 | site_name, executor_name, city_name, build_types, safety_warrents, sanctions |
| **Public Housing Inventory** | `ece87d7d-d79f-4278-8559-921218bc2b6a` | ? | Public housing stock |
| **Public Housing Vacancies** | `c3a68837-9b7a-4ee7-bd92-130678dc8ae3` | ? | Vacant public housing units |

### Infrastructure & Transportation

| Dataset | Resource ID | Records | Key Fields |
|---------|------------|---------|------------|
| **TMA 3 - National Road Plan** | `643dc6f9-1f78-4a57-9e84-c4ba8809c044` | 4,513 | ROAD, NAME, STATUS, TYPE, DESCRPTION |
| **TMA 23 - Railway Plan** | `1d421a2a-c7cd-4216-830c-c56419378d0e` | ? | Rail line plans |
| **Transport Infra Projects** | `5a14da23-1680-4e96-b3ec-1e6a77ea68ad` | ? | 5-year infrastructure workplan |
| **National Transport Plans (TTL)** | `1f2d023b-da8e-4afd-b478-5f01f5865f77` | ? | National-level transport plans |
| **Tel Aviv Mass Transit 2050** | `bd11e899-65c0-43aa-8264-c07434da22aa` | ? | Light rail, BRT, metro network |

### Supporting Datasets

| Dataset | Resource ID | Records | Key Fields |
|---------|------------|---------|------------|
| **Registered Contractors** | `4eb61bd6-18cf-4e7c-9f9c-e166dfa0a2d8` | 23,915 | SHEM_YESHUT, TEUR_ANAF, KVUTZA, SIVUG, HEKEF |
| **Licensed Brokers** | `a0f56034-88db-4132-8803-854bcdb01ca1` | ? | Active licensed brokers |
| **Licensed Appraisers** | `8540534a-eccd-4568-a677-652d589ed172` | ? | Licensed property appraisers |
| **Development Costs** | `bf164a03-55c7-4bea-8740-66ce60a51a2c` | ? | Urban construction costs |
| **Green Buildings** | `7f467a30-58cd-44b5-86f0-d570cc7d25ad` | ? | Green standard buildings |
| **XPLAN (What applies at my location)** | Link: `https://xplan.gov.il` | ? | All plans affecting a location |

## Analysis Framework References

Sources consulted for building the appreciation scoring model and agent knowledge:

### Valuation by Project Stage (Premium over Market)

From [Yoni Levy - Property Valuation by Planning Status](https://yonilevy.co.il/%D7%97%D7%99%D7%A9%D7%95%D7%91-%D7%A9%D7%95%D7%95%D7%99-%D7%A0%D7%9B%D7%A1-%D7%9C%D7%A4%D7%99-%D7%A1%D7%98%D7%98%D7%95%D7%A1-%D7%AA%D7%9B%D7%A0%D7%95%D7%A0%D7%99/):

| Stage | Premium over Market | Risk Level |
|-------|-------------------|------------|
| Potential identified (no plan) | +10-20% | High — no approvals yet |
| Plan submitted to local committee | +20-30% | Medium-high — regulatory uncertainty |
| Plan approved (tokef) | +30-50% | Medium — approved but not yet permitted |
| Building permit issued | +50-70% | Low — construction imminent |
| Under construction | +70-90% | Very low — completion in sight |

Key insight: *"Every planning stage adds certainty to the deal, thereby increasing property value."*

Also: *"Light rail lines in Tel Aviv are expected to increase property values along the route by 15-25%."*

### Government Economic Viability Calculator (Standard 21)

From [gov.il - Pinui Binui Economic Viability Calculator](https://www.gov.il/he/pages/model_dinami):

- Based on **Appraiser Standard 21** — the official standard for calculating Pinui Binui economic viability
- Key assumptions: ~90sqm land per existing unit, 12sqm mamad per new unit, 36-month evacuation period
- Service areas range 18-30% depending on building height and construction standard
- Tool for municipalities, residents, and developers to assess project feasibility
- **Not a substitute for a professional appraisal**

### 10 Factors of Pinui Binui Value Appreciation

From [Tzur Invest - Economic Advantages of Pinui Binui](https://tzurinvest.co.il/blog/the-economic-advantages-of-urban-renewal-how-the-value-of-the-property-increases-significantly):

1. **Apartment size increase** — old 3-room becomes new 4-room
2. **Technical specs upgrade** — modern electrical, plumbing, AC, kitchen
3. **Current building standards** — earthquake resistance, thermal insulation
4. **Elevator + parking** — old buildings lack these; new ones include underground parking
5. **Environmental improvement** — landscaping, infrastructure, public spaces (lifts whole area)
6. **Better use of location** — new project maximizes location potential
7. **Commercial infrastructure** — ground floor retail adds convenience and value
8. **Maintenance savings** — new building = lower maintenance for years
9. **Rental potential** — modern apartments command higher rent
10. **Neighborhood ripple effect** — one big project lifts entire neighborhood values

### AI Multi-Agent Real Estate Analysis

From [dev.to - Building an Intelligent Real Estate Investment Analyzer](https://dev.to/exploredataaiml/building-an-intelligent-real-estate-investment-analyzer-with-ai-agents-khi):

Architecture pattern of 4 specialized agents:
1. **Market Analyzer** — location quality, market trends, appreciation rates
2. **Property Evaluator** — condition, age, value relative to market
3. **Financial Calculator** — cap rate, cash flow, ROI projections
4. **Decision Engine** — weighted scoring, letter grades (A+ to D), buy/hold/pass

Our agent uses a single Mastra agent with multiple tools rather than multiple agents, but the **analysis categories and weighted scoring** logic should be embedded in the system prompt.

### Additional Resources

- [Globes - The Formula for Justified Pinui Binui Price](https://www.globes.co.il/news/article.aspx?did=1001516061) — Israeli appraiser methodology for pricing PB apartments (paywalled)
- [Engel Invest - Economic Potential for RE Investors in Pinui Binui](https://www.engelinvest.co.il/post/%D7%94%D7%A4%D7%95%D7%98%D7%A0%D7%A6%D7%99%D7%90%D7%9C-%D7%94%D7%9B%D7%9C%D7%9B%D7%9C%D7%99-%D7%9C%D7%9E%D7%A9%D7%A7%D7%99%D7%A2%D7%99-%D7%A0%D7%93%D7%9C%D7%9F-%D7%91%D7%A4%D7%A8%D7%95%D7%99%D7%A7%D7%98%D7%99%D7%9D-%D7%A9%D7%9C-%D7%A4%D7%99%D7%A0%D7%95%D7%99-%D7%91%D7%99%D7%A0%D7%95%D7%99) — apartments bought at 2M NIS can reach 2.8-3.4M NIS post-project
- [Sands of Wealth - Jerusalem Price Forecasts](https://sandsofwealth.com/blogs/news/jerusalem-price-forecasts) — renewed apartments appreciating 8-12% annually
- [McKinsey - Gen AI in Real Estate](https://www.mckinsey.com/industries/real-estate/our-insights/generative-ai-can-change-real-estate-but-the-industry-must-change-to-reap-the-benefits) — $110-180B value potential from gen AI in RE
- [Buy It In Israel - What is Pinui Binui](https://www.buyitinisrael.com/guide/what-is-pinui-binui/) — English guide to PB process, two tracks (municipal vs taxation)
