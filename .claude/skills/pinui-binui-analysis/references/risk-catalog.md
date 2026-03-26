# PB Risk Catalog — Detection Patterns

Risks organized by category, with data-based detection methods and recommended actions.

## Planning Risks

### Stalled Project
- **Detection:** `taarich_hachraza` (declaration date) > 5 years ago AND `bebitzua` != yes AND no stage progression
- **Data source:** `urban_renewal` table
- **Severity:** High
- **Action:** Investigate with municipality why project hasn't advanced. May be stuck in legal disputes or lacking economic viability.

### Plan Stuck in Objections
- **Detection:** XPLAN `station_desc` = "הפקדה להתנגדויות" for extended period
- **Data source:** XPLAN API
- **Severity:** Medium-High
- **Action:** Check MAVAT link for objection details. Significant local opposition can delay projects 2-5 years.

### No Approved Plan
- **Detection:** No matching TBA in XPLAN, no plan number in urban_renewal
- **Data source:** searchByAddress returns empty for both PB and XPLAN
- **Severity:** Very High (for investment)
- **Action:** Investment is speculative. Verify with municipality planning department whether any plan is under consideration.

## Developer/Contractor Risks

### High Sanctions Count
- **Detection:** `sanctions` >= 5 in `active_construction` or `contractors` tables
- **Data source:** searchContractors, searchByAddress (active construction)
- **Severity:** High
- **Action:** Always flag prominently. Investigate what the sanctions were for — safety violations during active construction are more concerning than administrative issues.

### Low Contractor Score
- **Detection:** scoreProject contractor factor <= 40
- **Data source:** scoreProject output
- **Severity:** Medium-High
- **Action:** Explain WHY the score is low (not found in registry? has sanctions? not recognized?). Recommend investigating developer's financial backing and bank accompaniment status.

### Unregistered Developer
- **Detection:** searchContractors returns no match for the developer name
- **Data source:** contractors table (pg_trgm fuzzy search)
- **Severity:** Medium
- **Action:** Developer may operate under a different legal entity name. Recommend verifying company registration number (ח.פ.) and checking for registration under parent company.

## Economic Risks

### Low Density Multiplier
- **Detection:** `yachad_mutza` / `yachad_kayam` < 1.5
- **Data source:** `urban_renewal` table
- **Severity:** Medium-High
- **Action:** Project may struggle economically. Check if there are compensating factors (expensive area with high sale prices, government subsidies, betterment levy exemption).

### Zero Additional Units
- **Detection:** `yachad_tosafti` = 0
- **Data source:** `urban_renewal` table
- **Severity:** High
- **Action:** No new units for developer to sell = no economic driver. May be replacement-only project or data error. Verify with MAVAT documents.

### High Development Costs
- **Detection:** `develop_pay` significantly above area average in `development_costs` table
- **Data source:** searchByAddress (development costs)
- **Severity:** Medium
- **Action:** High development levies reduce developer margin. Check if betterment levy exemptions apply.

## Market Risks

### Premium Pricing Area
- **Detection:** `price_for_meter` > 50,000 NIS in nearby lottery data
- **Data source:** `lottery` table
- **Severity:** Information (not inherently bad)
- **Action:** Premium market has different dynamics — smaller appreciation percentages but larger absolute gains. Investment thesis must account for this.

### Low Demand Signal
- **Detection:** `subscribers` / `winners` ratio < 3:1 in nearby lotteries
- **Data source:** `lottery` table
- **Severity:** Low-Medium
- **Action:** Lower demand may mean slower appreciation. Cross-reference with infrastructure plans — upcoming transit can change demand dynamics.

### High Supply Pipeline
- **Detection:** 20+ PB projects in same city, many in early stages
- **Data source:** searchPinuiBinui city-wide
- **Severity:** Low-Medium
- **Action:** High supply can pressure prices. But also indicates strong municipal support for renewal — net effect depends on absorption rate.

## Temporal Risks

### Timeline Mismatch
- **Detection:** Project expected to complete before nearby infrastructure opens
- **Data source:** Cross-reference construction_progress stage dates with infrastructure timelines
- **Severity:** Information
- **Action:** A project completing in 2 years near a metro line opening in 8 years won't capture transit premium. Flag the mismatch and its implications.

### Long Construction Period
- **Detection:** `stage_5_date` to `stage_42_date` span > 5 years in construction_progress
- **Data source:** `construction_progress` table
- **Severity:** Medium
- **Action:** Extended construction may indicate complications. Check for stage gaps (periods with no progress).

## Legal/Regulatory Risks (Manual Verification Required)

These cannot be detected from available data but should always be recommended as manual checks:

1. **Property encumbrances:** Liens, debts, or legal disputes on the property (check Tabu/land registry)
2. **Resident consent rate:** Current percentage of signed agreements (ask developer/representative)
3. **Bank accompaniment:** Whether project has bank financing commitment (ליווי בנקאי)
4. **Construction guarantees:** Purchase law guarantee (ערבות חוק מכר) covering full apartment value
5. **Rent guarantees:** Developer commitment to cover rent during entire construction period
6. **Developer exclusivity agreement:** Whether residents signed a non-shop/exclusivity (כבילה) — may limit negotiation

## Sources

- [Hagit Law — PB Risks Guide 2025](https://hagitlaw.com/) — Risk categories, regulatory updates
- [Ogen1 — Investor Due Diligence](https://ogen1.co.il/) — Investor checklist
- [Yoni Levy — PB Feasibility](https://yonilevy.co.il/) — Developer assessment methodology
- [Matzner Goldstein — Feasibility Secrets](https://mg-firm.co.il/) — Economic viability analysis
