# Standard 21 (תקן 21) — Economic Viability Reference

Standard 21 is the official appraisal standard issued by the Council of Real Estate Appraisers (מועצת שמאי המקרקעין) at the Ministry of Justice. It defines the methodology for calculating economic viability of Pinui Binui projects.

## What Standard 21 Determines

1. **Maximum compensation package for residents** — what the developer can afford to give
2. **Minimum developer profit** — below which the project is unviable
3. **Economic feasibility** — whether the project pencils out at all

## Key Components of the "Zero Report" (דוח אפס)

The appraiser produces a comprehensive economic analysis:

### Revenue Side
- Sale price of new market-rate apartments (developer's units)
- Based on comparable sales analysis (CMA) in the area
- Adjusted for floor, view, finish level, project quality

### Cost Side
- **Construction costs:** Per sqm, based on standard price indices (Dekel)
- **Planning & permits:** Architect, engineer, permits, fees
- **Development levy (היטל פיתוח):** Paid to municipality — often the largest single cost
- **Betterment levy (היטל השבחה):** Tax on value increase from plan approval. PB projects often get exemptions.
- **Financing costs:** Bank interest during construction (36+ months typical)
- **Marketing & sales:** 2-4% of revenue
- **Resident compensation package:**
  - New apartment (typically 12-25 sqm larger)
  - Balcony (~12 sqm)
  - Parking spot + storage room
  - Safe room (ממ"ד)
  - Full rent during construction
  - Two moves (to temporary + to new)
  - Legal fees for residents' lawyer
  - Construction supervisor for residents

### The Balance
- Revenue minus all costs = developer profit
- Standard profit margin: **20-25%** of total project cost
- Below ~15% → project is fragile, any cost overrun kills it
- Above 30% → residents may be able to negotiate better terms

## Density Multiplier

The key economic driver: how many new units can be built per existing unit.

- **1.5x or less:** Often unviable in expensive markets (insufficient developer revenue)
- **2x:** Standard for most urban areas
- **3x or more:** Favorable economics, allows generous resident compensation
- **Depends on:** Building height allowed, land area, setback requirements, public space requirements

## What the Agent Can Check

From available data, assess viability signals:

| Signal | Data Source | Interpretation |
|--------|-----------|----------------|
| Total proposed / existing units | `urban_renewal` table | Density multiplier |
| Development costs for area | `development_costs` table | High costs reduce margin |
| Price/sqm in area | `lottery` table | Revenue potential |
| Track (maslul) | `urban_renewal` table | Municipal vs taxation |
| Plan area (dunam) | XPLAN | Land available for development |
| Housing unit delta | XPLAN `quantity_delta_120` | Net new units in plan |

## What the Agent Cannot Check (Manual Verification Needed)

- Actual construction cost estimates
- Bank financing terms and rates
- Betterment levy exemption status
- Specific resident compensation agreements
- Developer's financial statements
- Detailed architectural plans and buildable area calculations

## 2022 Update

Standard 21 was updated on June 13, 2022. Key change: the standard no longer fixes specific profit margins and compensation rates, recognizing that these vary by location and time. This gives more flexibility but also makes each project assessment more context-dependent.

## Sources

- [Official Standard 21 — Ministry of Justice](https://www.gov.il/he/departments/policies/standard_21)
- [JLRE Standard 21 Guide](https://jlre.co.il/tiken-21-pinui-binui-tenant-compensation-guide/)
- [Matzner Goldstein — Feasibility Analysis](https://mg-firm.co.il/)
