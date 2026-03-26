---
name: pinui-binui-analysis
description: Pinui Binui (urban renewal) investment analysis methodology — 6-pillar due diligence framework, Standard 21 viability, risk detection, stage-specific analysis, and investor action items. Use this skill whenever the user asks about a specific PB project, wants investment analysis, asks "is it worth investing", compares properties or projects, asks about risks, mentions Standard 21/תקן 21, or needs a structured assessment of any Pinui Binui opportunity. Also use when doing address lookups that find PB-related data — the skill teaches HOW to interpret the findings.
---

# Pinui Binui Investment Analysis

This skill teaches how to conduct professional-grade Pinui Binui due diligence using the available data tools. It covers what to check, in what order, how to interpret findings, and what to recommend.

## The 6 Pillars of PB Due Diligence

Every PB analysis should cover these 6 areas. Not all data will be available for every property — explicitly state what was checked and what data is missing.

### Pillar 1: Planning Status (תכנוני)

The foundation. A PB project without an approved plan is speculative.

**What to check:**
- Is there a TBA (תב"ע) for the address? What stage is it in?
- Is there a Pinui Binui project declared for the area?
- What does the XPLAN planning authority show for this location?

**Tools:** `searchByAddress` (finds PB projects + XPLAN plans), `searchPinuiBinui` (broader city/neighborhood search), `searchXplan` (by plan number for deep dive)

**How to interpret:**
- Plan approved (אישור/תוקף) = planning risk resolved, focus shifts to execution
- Plan deposited (הפקדה) = still subject to objections, 1-3 year uncertainty
- Plan in review (בבדיקה תכנונית) = early stage, high uncertainty
- No plan found = speculative, requires manual verification with municipality

**Key data points:** Plan number (`mispar_tochnit`), status, year approved (`shnat_matan_tokef`), existing units (`yachad_kayam`), additional units (`yachad_tosafti`), MAVAT link for full plan documents.

### Pillar 2: Economic Viability (כלכלי)

A project must be profitable for the developer to proceed. Standard 21 defines the methodology — see `references/standard-21.md` for details.

**Quick viability signals from available data:**
- **Density multiplier:** total proposed units / existing units. Below 1.5x is often unviable in expensive markets. Above 3x suggests favorable conditions.
- **Development costs:** `searchByAddress` returns development levy data (היטל פיתוח) for the area — high levies reduce developer margin.
- **Track (maslul):** Municipal track (עירוני) vs taxation track (מיסוי). Taxation track often indicates stronger developer initiative.
- **Developer profit benchmark:** 20-25% of total project cost is the Standard 21 standard. Below 15% makes the project fragile.

**Tools:** `scoreProject` (municipal + stage factors), `searchByAddress` (development costs)

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

### Pillar 4: Resident Consent (הסכמת דיירים)

Required majority: **67% of all owners** (since 2025 reform, down from 80%), with at least **60% per building**.

**Not available in data** — always flag as a manual check item. Recommend the investor verify:
- Current signature rate with the developer or residents' representative
- Whether there are known objectors (דיירים סרבנים)
- Whether legal proceedings have been initiated against objectors

### Pillar 5: Market Context (שוק)

Understanding nearby prices, supply pipeline, and demand signals.

**What to check:**
- Dira BeHanacha lottery data: price per sqm in the area
- Subscriber-to-winner ratio (demand signal: >10:1 = high demand)
- How many other PB projects in the same city? (cluster effect)
- Green building certifications nearby (quality signal)

**Tools:** `searchByAddress` (lottery + green buildings), `searchLotteries` (city-wide), `searchPinuiBinui` (cluster count)

**Interpretation:**
- Price/sqm < 20K NIS = affordable area, strong PB economics
- Price/sqm > 50K NIS = premium market, different investment dynamics
- 10+ PB projects in city = active renewal market, municipal support likely strong
- High subscriber ratio in nearby lotteries = strong demand signal

### Pillar 6: Infrastructure Catalyst (תשתיות)

Infrastructure drives long-term appreciation — especially mass transit.

**What to check:**
- Planned transit lines (metro, LRT, BRT) near the address
- Road improvements, rail expansion
- XPLAN plans for public facilities (schools, parks, commercial)

**Tools:** `searchInfrastructure` (5 datasets), `searchXplan` (all plan types)

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

1. **Stalled project:** Declared 5+ years ago, no stage progression → likely stuck in legal/planning limbo
2. **Contractor sanctions:** 5+ sanctions → red flag, explain what kind and how recent
3. **Zero additional units:** `yachad_tosafti = 0` → may be replacement-only, not true PB value creation
4. **Deposited 2+ years:** Plan in "הפקדה להתנגדויות" for 2+ years → likely significant opposition
5. **No bank accompaniment:** Developer without bank backing → funds at risk if developer fails
6. **Subscriber ratio > 10:1:** In nearby lotteries → very high demand, but also high competition

See `references/risk-catalog.md` for the full catalog with detection patterns.

---

## Output Structure

When producing an investment assessment, structure it as:

```
## [Address/Project] Investment Assessment
**Score:** X/100 | **Grade:** A-F | **Confidence:** High/Medium/Low

### Strengths (2-3 with evidence)
### Concerns (2-3 with evidence)
### Data Gaps (what's missing)
### Recommendation (1 line + investment horizon)
### Next Steps (what the investor should do)

📋 Sources: [list datasets queried with dates]
```

---

## When to Use This Skill

- User asks about a specific address → searchByAddress + interpret with this framework
- User asks "is it worth investing?" → full 6-pillar analysis
- User asks to compare properties → stage-adjusted comparison using scoreProject + this framework
- User asks about risks → consult `references/risk-catalog.md`
- User mentions Standard 21 → consult `references/standard-21.md`
