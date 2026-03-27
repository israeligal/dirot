---
name: pinui-binui-analysis
description: Pinui Binui (urban renewal) investment analysis methodology — 6-pillar due diligence framework, Standard 21 viability, risk detection, stage-specific analysis, and investor action items. Use this skill whenever the user asks about a specific PB project, wants investment analysis, asks "is it worth investing", compares properties or projects, asks about risks, mentions Standard 21/תקן 21, or needs a structured assessment of any Pinui Binui opportunity. Also use when doing address lookups that find PB-related data — the skill teaches HOW to interpret the findings.
---

# Pinui Binui Investment Analysis

This skill teaches how to conduct professional-grade Pinui Binui due diligence using the available data tools. It covers what to check, in what order, how to interpret findings, and what to recommend.

## Scoring System — 7 Factors

The `scoreProject` tool computes a weighted investment score (0-100, grade A-F). **Factors with missing data are DROPPED** from the score — weights redistribute among remaining factors. No fallback scores.

### Factor Definitions

| Factor | Hebrew | What It Measures | Data Source |
|--------|--------|-----------------|-------------|
| Public Transport | תחבורה ציבורית | LRT/metro/BRT stations, bus stops | `lrt_stations`, `bus_stops`, `mass_transit` |
| Neighborhood Services | שירותי שכונה | Schools, parks, roads, green buildings | `schools`, `tma3_roads`, XPLAN, `green_buildings` |
| Planning Stage | שלב תכנוני | Project status + time-since-approval decay | `status` + `shnat_matan_tokef` |
| Municipal Momentum | מומנטום עירוני | % of city PB projects in advanced stages | `urban_renewal` grouped by status |
| Municipal Support | תמיכת רשות | Tax track (מיסוי = היטל השבחה exemption) | `maslul` field |
| Price | מחיר | Market price relative to area | Market data (ppa) ONLY — no lottery data |
| Contractor | יזם/קבלן | Registration, recognition, sanctions | `contractors` + `active_construction` |

### When Factors Are Dropped

- **Contractor not identified** → factor dropped, weight redistributed
- **No market pricing data** → price factor dropped
- **No status data** → stage factor dropped
- **No PB projects in city** → momentum factor dropped
- **No track data (טרם הוכרז)** → municipal support dropped

Always list dropped factors in the analysis output.

### Stage-Specific Weights

Weights shift based on the project's planning stage:
- **Early stages**: Planning Stage gets highest weight (30%) — it's the biggest unknown
- **Late stages**: Contractor gets highest weight (25%) — execution risk dominates
- Public Transport and Neighborhood Services are consistently important (25% + 10%)

### Time Decay on Planning Stage

The stage score decays based on how long since approval:
- 0-1 years: no decay
- 2-3 years: -5 points
- 4-5 years: -10 points
- 6+ years: -15 points

Example: "אחרי רישוי" (base 85) approved 2022 → 4 years → score 75.

---

## The 6 Pillars of PB Due Diligence

Every PB analysis should cover these 6 areas. Not all data will be available for every property — explicitly state what was checked and what data is missing.

### Pillar 1: Planning Status (תכנוני)

The foundation. A PB project without an approved plan is speculative.

**What to check:**
- Is there a TBA (תב"ע) for the address? What stage is it in?
- Is there a Pinui Binui project declared for the area?
- What does the XPLAN planning authority show for this location?
- How long since the plan was approved? (time decay)

**Tools:** `searchByAddress` (finds PB projects + XPLAN plans), `searchPinuiBinui` (broader city/neighborhood search), `searchXplan` (by plan number for deep dive)

**How to interpret:**
- Plan approved (אישור/תוקף) = planning risk resolved, focus shifts to execution
- Plan deposited (הפקדה) = still subject to objections, 1-3 year uncertainty
- Plan in review (בבדיקה תכנונית) = early stage, high uncertainty
- No plan found = speculative, requires manual verification with municipality
- **Approved 4+ years ago with no construction** = stagnation, investigate why

**Key data points:** Plan number (`mispar_tochnit`), status, year approved (`shnat_matan_tokef`), existing units (`yachad_kayam`), additional units (`yachad_tosafti`), MAVAT link for full plan documents.

### Pillar 2: Economic Viability (כלכלי)

A project must be profitable for the developer to proceed. Standard 21 defines the methodology — see `references/standard-21.md` for details.

**Quick viability signals from available data:**
- **Density multiplier:** total proposed units / existing units. Below 1.5x is often unviable in expensive markets. Above 3x suggests favorable conditions.
- **Development costs:** `searchByAddress` returns development levy data (היטל פיתוח) for the area — high levies reduce developer margin.
- **Track (maslul):** מיסוי = tax benefits (היטל השבחה exemption), רשויות = standard municipal process without tax perks.
- **Developer profit benchmark:** 20-25% of total project cost is the Standard 21 standard. Below 15% makes the project fragile.

**Tools:** `scoreProject` (municipal support + stage factors), `searchByAddress` (development costs)

### Pillar 3: Developer Assessment (יזם)

The developer's capability determines whether a good plan becomes a real building.

**What to check:**
- Is the developer a registered contractor? What classification?
- How many active construction sites do they have?
- Any safety sanctions? How many, how recent?
- Do they have prior PB completion experience?

**Tools:** `searchContractors` (by name, fuzzy match), `searchByAddress` (active construction sites near address), `searchConstructionSites` (city-wide)

**Red flags:**
- 5+ sanctions = investigate before proceeding (always flag prominently)
- Contractor score <= 40 = always explain why
- No prior completed PB projects = higher execution risk
- No bank accompaniment (ליווי בנקאי) = critical financial risk
- **Contractor not identified** = factor DROPPED from score, flag as data gap

### Pillar 4: Resident Consent (הסכמת דיירים)

Required majority: **67% of all owners** (since 2025 reform, down from 80%), with at least **60% per building**.

**Not available in data** — always flag as a manual check item. Recommend the investor verify:
- Current signature rate with the developer or residents' representative
- Whether there are known objectors (דיירים סרבנים)
- Whether legal proceedings have been initiated against objectors

### Pillar 5: Market & Municipal Context (שוק ורשות)

Understanding market pricing, supply pipeline, and municipal momentum.

**What to check:**
- **Market pricing data:** real price per sqm in the area (ONLY source for price scoring — no lottery data)
- **Municipal momentum:** what % of the city's PB projects are progressing vs. stuck. Show breakdown: "X במימוש, Y אחרי רישוי, Z לפני מימוש, W תכנון"
- **Municipal track:** מיסוי (tax benefits) vs. רשויות (standard process)
- Green building certifications nearby (quality signal)

**Tools:** `scoreProject` (momentum + municipal factors), `searchByAddress` (green buildings), `searchPinuiBinui` (city-wide project list)

**Interpretation:**
- 60%+ of city projects in advanced stages = strong municipal momentum
- מיסוי track = tax benefits including היטל השבחה (betterment levy) exemption
- No market price data = price factor dropped from score

### Pillar 6: Transport & Neighborhood Services (תחבורה ושירותים)

Public transit access and quality-of-life infrastructure drive long-term appreciation.

**Public Transport (תחבורה ציבורית):**
- LRT stations near the address (check `lrt_stations` by proximity)
- Bus stop density in the city (`bus_stops` count)
- Planned metro/BRT lines (`mass_transit` table)

**Neighborhood Services (שירותי שכונה):**
- Schools near the address (`schools` table)
- Green building certifications (`green_buildings`)
- Road infrastructure projects (`tma3_roads`)
- XPLAN plans for parks, commercial, educational facilities

**Tools:** `queryNearbyTransit` (LRT + bus stops by coordinates), `queryNearbySchools`, `searchInfrastructure`, `searchXplan`

**Key insight:** A project completing in 2 years near a metro line opening in 8 years won't capture the transit premium. Earlier-stage projects near imminent infrastructure have asymmetric upside.

---

## Stage-Specific Analysis Depth

Not every pillar needs the same depth at every stage. Focus analysis effort where it matters most:

| Stage | Primary Focus | Secondary | Can Skip |
|-------|--------------|-----------|----------|
| Pre-plan | Planning feasibility, municipality support | Developer credibility | Market pricing (too early) |
| Plan submitted | Objection risk, timeline | Economic viability | Construction details |
| Plan approved | Permit status, developer financials | Market context | Planning (resolved) |
| Under construction | Contractor quality, timeline adherence | Market pricing | Planning, viability (resolved) |

---

## Stage Premiums (Reference)

What the data says about appreciation by stage:

| Stage | Premium over market | Time to completion | Risk level |
|-------|--------------------|--------------------|------------|
| Potential (no plan) | +10-20% | 7-12 years | Very high |
| Plan submitted | +20-30% | 5-8 years | High |
| Plan approved (tokef) | +30-50% | 3-5 years | Medium |
| Permit issued | +50-70% | 2-3 years | Low-medium |
| Under construction | +70-90% | 1-2 years | Low |

---

## Red Flags — Always Flag These

When encountered in any analysis, flag prominently with context:

1. **Stalled project:** Approved 4+ years ago with no construction → time decay penalty in score, investigate bottleneck
2. **Contractor sanctions:** 5+ sanctions → red flag, explain what kind and how recent
3. **Zero additional units:** `yachad_tosafti = 0` → may be replacement-only, not true PB value creation
4. **Deposited 2+ years:** Plan in "הפקדה להתנגדויות" for 2+ years → likely significant opposition
5. **No bank accompaniment:** Developer without bank backing → funds at risk if developer fails
6. **Multiple dropped factors:** If 3+ factors dropped from score → low confidence, flag prominently

See `references/risk-catalog.md` for the full catalog with detection patterns.

---

## Output Structure

When producing an investment assessment, structure it as:

```
## [Address/Project] Investment Assessment
**Score:** X/100 | **Grade:** A-F | **Active Factors:** N/7
**Dropped Factors:** [list with reasons]

### Strengths (2-3 with evidence)
### Concerns (2-3 with evidence)
### Data Gaps (what's missing and how to fill)
### Recommendation (1 line + investment horizon)
### Next Steps (what the investor should do)

Sources: [list datasets queried with dates]
```

---

## When to Use This Skill

- User asks about a specific address → searchByAddress + interpret with this framework
- User asks "is it worth investing?" → full 6-pillar analysis
- User asks to compare properties → stage-adjusted comparison using scoreProject + this framework
- User asks about risks → consult `references/risk-catalog.md`
- User mentions Standard 21 → consult `references/standard-21.md`
