# Dirot V2 — Feature Specification

**Author:** Gal + Claude
**Date:** 2026-03-26
**Status:** Draft

---

## Problem Statement

Dirot V1 is a capable AI analyst with 17 government data sources, 7-source address search, and a 6-pillar analysis framework. But it's a one-shot research tool — users ask a question, get an answer, and that's it. For real estate investment, this isn't enough. Investors need to:

1. **Track properties over time** — research today, revisit next week, compare next month
2. **Compare options side by side** — not in prose, but visually
3. **Know who's building** — developer identity is critical but not linked in the data
4. **Get accurate stage-adjusted analysis** — a pre-plan project and an under-construction project have fundamentally different risk profiles, but scoring treats them the same

Without these, Dirot is a research assistant you use once. With them, it becomes an investment workbench you use every week.

---

## Feature 1: Saved Properties (My Properties)

### Goals

- Users can save addresses they're researching and revisit them later
- Each saved property stores the latest analysis data + history
- Properties persist across sessions (tied to user account via Better Auth)
- Foundation for comparison (Feature 2) and future notifications (Feature 5)

### Non-Goals

- Not a CRM — no deal stages, no contact management
- No collaborative sharing between users (v2+ consideration)
- No automatic re-analysis — user manually refreshes (notifications are Future Plan)

### User Stories

- As an investor, I want to save an address I'm researching so I can come back to it later without re-asking the agent
- As an investor, I want to see all my saved properties in one view so I can quickly review my research portfolio
- As an investor, I want to remove a property I'm no longer interested in so my list stays relevant
- As an investor, I want to see when I last researched each property so I know if the data is stale
- As an investor, I want to add a personal note to a saved property so I can remember my thoughts about it

### Requirements

**Must-Have (P0):**
- [ ] Database table: `saved_properties` (userId, address, city, street, houseNumber, nickname, notes, lastAnalyzedAt, analysisData JSON, createdAt, updatedAt)
- [ ] Agent tool: `saveProperty` — saves current address + analysis results to user's portfolio
- [ ] Agent tool: `listProperties` — returns user's saved properties
- [ ] Agent tool: `removeProperty` — removes a saved property
- [ ] UI: "My Properties" sidebar section showing saved addresses with last-analyzed date
- [ ] UI: Click a saved property to load its analysis in the chat

**Nice-to-Have (P1):**
- [ ] "Refresh analysis" button that re-runs searchByAddress + scoreProject for a saved property
- [ ] Show score/grade badge next to each saved property in the list
- [ ] Property notes editable from the sidebar (not just via agent)
- [ ] Sort/filter saved properties by score, date, city

**Future (P2):**
- [ ] Share a property analysis via link (public read-only view)
- [ ] Export property analysis as PDF
- [ ] Property groups/tags for organizing research

### Technical Considerations

- `saved_properties` table in Neon PostgreSQL, managed by Drizzle
- `analysisData` stored as JSONB — contains the full searchByAddress + scoreProject output snapshot
- `userId` references the Better Auth `user` table (FK, cascade delete)
- Agent needs access to the authenticated user's ID (already available via session in chat route)
- New Mastra tools need `context` access to get the user ID — check if Mastra tool execute function receives context

### Acceptance Criteria

- Given I'm logged in, when I ask the agent "save this property", then the current address and analysis are persisted to my account
- Given I have saved properties, when I ask "show my properties", then I see a list with addresses, scores, and dates
- Given I click a saved property in the sidebar, then the chat loads that property's saved analysis
- Given I ask to remove a property, then it's deleted and no longer appears in my list

---

## Feature 2: Comparison UI Component

### Goals

- Users can compare 2-4 properties side by side in a structured visual format
- Comparison shows the same data dimensions for each property (score, stage, units, infrastructure, developer)
- Differences are highlighted — what makes one property better/worse than another
- Integrated with the chat — agent can generate a comparison that renders as a card UI, not just text

### Non-Goals

- Not a spreadsheet — limited to 4 properties max for visual clarity
- No custom column selection (v2) — fixed comparison dimensions based on the 6 pillars
- No real-time auto-update — comparison is a snapshot at the time of request

### User Stories

- As an investor, I want to compare two addresses side by side so I can see which is the stronger investment
- As an investor, I want the comparison to highlight key differences (better/worse indicators) so I can quickly spot the deciding factors
- As an investor, I want to compare properties from my saved list so I don't have to re-type addresses
- As an investor, I want the comparison to account for different project stages so I'm not comparing apples to oranges

### Requirements

**Must-Have (P0):**
- [ ] Agent tool: `compareProperties` — accepts 2-4 addresses, runs searchByAddress + scoreProject for each in parallel, returns structured comparison data
- [ ] HITL UI component: `ComparisonCard` — renders comparison as a responsive card grid
- [ ] Comparison dimensions: Overall score/grade, project stage, existing units, additional units, plan number, infrastructure score, contractor info, price/sqm reference, key risk flags
- [ ] Stage grouping: Warn when comparing projects at different stages; show stage-adjusted context
- [ ] Winner/leader indicators: Green/red highlighting on the best/worst value per dimension

**Nice-to-Have (P1):**
- [ ] "Add to comparison" action on saved properties — builds comparison incrementally
- [ ] Comparison summary text generated by agent explaining the key tradeoffs
- [ ] Export comparison as image/screenshot
- [ ] Comparison history — saved comparisons accessible later

**Future (P2):**
- [ ] Custom comparison dimensions (user picks which factors to show)
- [ ] Map view showing compared properties geographically
- [ ] Price trend overlay if nadlan.gov.il data becomes available

### UI Design Direction

```
+------------------+------------------+------------------+
| Property A       | Property B       | Property C       |
| השמונאים 22      | קריאטי 8         | בלפור 15         |
| בת ים            | בת ים            | בת ים            |
+------------------+------------------+------------------+
| Score: 72/100 B  | Score: 65/100 C  | Score: 81/100 A  |
|                  |                  | ** BEST **       |
+------------------+------------------+------------------+
| Stage            | Stage            | Stage            |
| Plan approved    | Pre-plan         | Under const.     |
| (2022)           | (speculative)    | (permit 2024)    |
+------------------+------------------+------------------+
| Units: 68→267    | Units: N/A       | Units: 45→180    |
| +61 additional   |                  | +42 additional   |
+------------------+------------------+------------------+
| Developer        | Developer        | Developer        |
| ??? (unknown)    | ??? (unknown)    | שאפ בנייה        |
| No sanctions     |                  | 2 sanctions      |
+------------------+------------------+------------------+
| Infrastructure   | Infrastructure   | Infrastructure   |
| BRT Brown nearby | BRT Brown nearby | LRT Red + BRT    |
| Score: 65        | Score: 60        | Score: 85        |
+------------------+------------------+------------------+
| RISKS            | RISKS            | RISKS            |
| None detected    | No approved plan | Contractor       |
|                  | HIGH RISK        | sanctions (2)    |
+------------------+------------------+------------------+
```

- Mobile: Vertical stack with swipe between properties
- Desktop: Side-by-side cards (2-4 columns)
- Use existing shadcn/ui card components
- Color coding: green (strength), red (concern), yellow (data gap)

### Technical Considerations

- `compareProperties` tool runs `Promise.allSettled()` on multiple `searchByAddress` + `scoreProject` calls — up to 8 parallel queries per property (56 total for 4 properties). May need to respect rate limits.
- HITL UI: New `makeAssistantToolUI` component following the existing `plan-approval.tsx` pattern
- Comparison data structure must be normalized across properties even when some have data gaps
- Consider caching — if a property was recently analyzed (saved or in current thread), reuse the data

---

## Feature 3: Stage-Aware Scoring

### Goals

- Scoring model dynamically adjusts factor weights based on the project's stage
- Early-stage projects weight planning risk and municipality support higher
- Late-stage projects weight contractor quality and market pricing higher
- Scores become more meaningful and comparable within the same stage group

### Non-Goals

- Not a full rewrite of the scoring system — same 7 factors, just different weights
- Not a financial model — still an appreciation signal score, not a price predictor

### User Stories

- As an investor, I want the score to reflect that an early-stage project has higher planning risk so I don't get a falsely optimistic score
- As an investor comparing projects, I want scores to be stage-adjusted so comparing a pre-plan to an under-construction project shows accurate relative risk

### Requirements

**Must-Have (P0):**
- [ ] Define weight profiles per stage in `scoring-factors.ts`:

| Factor | Pre-plan | Submitted | Approved | Permit | Construction |
|--------|----------|-----------|----------|--------|-------------|
| Infrastructure | 20% | 22% | 25% | 25% | 25% |
| Project Stage | 30% | 25% | 15% | 10% | 5% |
| Cluster | 15% | 15% | 15% | 15% | 15% |
| Contractor | 5% | 10% | 15% | 20% | 25% |
| Transport | 10% | 10% | 10% | 10% | 10% |
| Price | 10% | 10% | 12% | 15% | 15% |
| Municipal | 10% | 8% | 8% | 5% | 5% |

- [ ] `scoreProject` tool detects project stage from PB data before scoring
- [ ] Score output includes which weight profile was used and why
- [ ] When stage is unknown, use the current default weights (backward compatible)

**Nice-to-Have (P1):**
- [ ] Show weight profile in score breakdown ("Using pre-plan weights: planning risk weighted 30%")
- [ ] Compare scores within the same stage group in comparison view

### Technical Considerations

- `scoring-factors.ts` currently has `FACTOR_WEIGHTS` as a single constant — change to a function `getFactorWeights(stage: string)` that returns the appropriate profile
- Stage detection: look at `urban_renewal.status` field from PB data, map to stage category
- Backward compatible: if no PB data found, use default weights

### Acceptance Criteria

- Given a pre-plan project, when I run scoreProject, then the planning stage factor has 30% weight (not 20%)
- Given a project under construction, when I run scoreProject, then the contractor factor has 25% weight (not 15%)
- Given no PB data found (unknown stage), when I run scoreProject, then default weights are used
- Given a score output, I can see which weight profile was used

---

## Feature 4: Developer Auto-Detection

### Goals

- When a PB project is found for an address, automatically attempt to identify the developer
- Cross-reference multiple data sources to find the company name
- Feed into `searchDeveloper` tool for full profile

### Non-Goals

- Not 100% reliable — developer identity may not be in the data
- Not a developer database — we're cross-referencing existing data, not creating new data

### User Stories

- As an investor, I want the agent to automatically tell me who the developer is when I look up a PB project so I don't have to research this separately
- As an investor, if the developer can't be identified automatically, I want guidance on how to find out

### Requirements

**Must-Have (P0):**
- [ ] When `searchByAddress` finds a PB project, check `active_construction` for matching complex/site name + city to find `executor_name`
- [ ] When `searchByAddress` finds a PB project, check XPLAN plan objectives for developer/company mentions
- [ ] If developer name found, automatically include it in the address search results
- [ ] Agent instruction: when developer identified, suggest running `searchDeveloper` for full profile

**Nice-to-Have (P1):**
- [ ] Parse MAVAT plan documents (kishur_latar URL) for developer name — this is the most reliable source but requires scraping the MAVAT page
- [ ] Store developer-to-project mapping when manually confirmed by user

**Future (P2):**
- [ ] Maintain a developer-project mapping table (crowd-sourced from user confirmations)
- [ ] Auto-scrape MAVAT documents for developer names on a schedule

### Technical Considerations

- Developer name is NOT in the `urban_renewal` table — this is the core challenge
- Best current signal: `active_construction.executor_name` where `site_name` matches the PB complex name
- XPLAN `pl_objectives` sometimes mentions the developer in the plan description text
- This is fuzzy matching — confidence should be communicated ("likely developer" vs "confirmed developer")

### Acceptance Criteria

- Given a PB project found at an address, when there's a matching active construction site, then the developer name is included in results
- Given no matching construction site, when XPLAN objectives mention a company, then it's flagged as "possible developer"
- Given no developer can be identified, then the output explicitly says developer is unknown and suggests manual investigation

---

## Future Plans (Not In V2 Scope)

### Notifications & Monitoring

**Concept:** Users can "watch" a saved property and receive notifications when government data changes — plan status advances, construction starts, new XPLAN plan submitted, new sanctions on the contractor.

**Why deferred:** Requires:
- Background job infrastructure (cron or queue) to periodically re-check data sources
- Diff logic to detect meaningful changes vs noise
- Notification delivery (email, push, in-app)
- Significant operational complexity

**When to build:** After saved properties and comparison are stable. Notifications are the "stickiness" feature that turns Dirot from a tool into a service.

**Design notes for later:**
- Compare current data snapshot with saved property's `analysisData` JSONB
- Only notify on "material" changes (stage changed, sanctions added, new plan — not data refresh timestamps)
- Daily or weekly check cadence, not real-time
- In-app notification center + optional email digest

### Advanced Scoring Model

**Concept:** Beyond stage-aware weights, incorporate:
- Dynamic factor weights based on location (Tel Aviv weights infrastructure less than periphery)
- Historical appreciation data to validate/calibrate the scoring model
- Demand signals from lottery subscriber ratios as a predictive factor
- Developer financial stability score (if data becomes available)
- Time-to-completion estimation based on similar projects' historical timelines

**Why deferred:** Requires:
- Historical data that we don't collect yet (time-series of plan statuses)
- Validation data (actual appreciation outcomes to calibrate against)
- More sophisticated statistical modeling

**When to build:** After V2 features are stable and we have 3-6 months of data collection for historical comparison.

### Guided First-Time Flow

**Concept:** Instead of a blank chat, new users see:
1. "Enter an address you're considering" → auto-runs full analysis
2. "Save to your properties" → teaches the save workflow
3. "Compare with another address" → teaches comparison
4. Progressive disclosure of advanced features

**Why deferred:** The current 2-user invite-only audience (Gal + Talia) doesn't need onboarding. Build this when opening to more users.

---

## Success Metrics

### V2 Launch (features 1-4)

| Metric | Target | How to measure |
|--------|--------|----------------|
| Properties saved per user | 3+ within first week | Count rows in saved_properties per user |
| Comparison used | At least 1 comparison per session | Count compareProperties tool calls in traces |
| Return sessions | User returns within 7 days | Mastra thread creation timestamps |
| Stage-aware scoring | 100% of scores use stage weights when PB data available | Log which weight profile is used |

### Leading indicators (first 2 weeks)
- Are users saving properties? (adoption)
- Are users comparing? (feature discovery)
- Are scores more differentiated with stage-aware weights? (quality)

### Lagging indicators (1-3 months)
- Do users come back weekly? (retention)
- Do users save more properties over time? (deepening engagement)
- Do users report the tool helped them make a decision? (qualitative)

---

## Open Questions

| Question | Owner | Blocking? |
|----------|-------|-----------|
| How should saved property data be structured in JSONB — full tool output or normalized summary? | Engineering | Yes — affects DB schema |
| Should comparison support properties from different cities? | Product | No — default yes, can restrict later |
| How to handle Firecrawl rate limits (181 credits remaining) when running 4-property comparison with developer search? | Engineering | Yes — may need to skip web search in comparison mode |
| Should the comparison UI be a HITL tool component or a separate page/route? | Design | Yes — affects architecture |
| How to detect project stage reliably from `urban_renewal.status` field — what are all possible values? | Data | Yes — needed for stage-aware scoring |

---

## Implementation Order

```
Phase 1: Stage-Aware Scoring (smallest change, highest analytical impact)
  └── Modify scoring-factors.ts + scoring.ts

Phase 2: Saved Properties (foundation for comparison + notifications)
  └── DB schema → agent tools → sidebar UI

Phase 3: Developer Auto-Detection (enriches address search)
  └── Modify searchByAddress to cross-reference developer

Phase 4: Comparison UI (depends on saved properties + scoring)
  └── compareProperties tool → ComparisonCard HITL component → integration
```

Each phase can be implemented and shipped independently.
