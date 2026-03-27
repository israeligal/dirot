/**
 * Pure scoring functions for the 7-factor investment model.
 * Each function returns { score: 0-100 | null, detail: string }.
 * null score = data missing → factor dropped from total, weight redistributed.
 */

export interface FactorResult {
  score: number | null
  detail: string
}

export type StageProfile =
  | "pre-plan"
  | "submitted"
  | "approved"
  | "permit"
  | "construction"
  | "default"

export interface FactorWeights {
  neighborhoodServices: number
  planningStage: number
  municipalMomentum: number
  contractor: number
  publicTransport: number
  price: number
  municipalSupport: number
}

const STAGE_WEIGHT_PROFILES: Record<StageProfile, FactorWeights> = {
  "pre-plan": {
    neighborhoodServices: 0.20,
    planningStage: 0.30,
    municipalMomentum: 0.15,
    contractor: 0.05,
    publicTransport: 0.10,
    price: 0.10,
    municipalSupport: 0.10,
  },
  submitted: {
    neighborhoodServices: 0.22,
    planningStage: 0.25,
    municipalMomentum: 0.15,
    contractor: 0.10,
    publicTransport: 0.10,
    price: 0.10,
    municipalSupport: 0.08,
  },
  approved: {
    neighborhoodServices: 0.25,
    planningStage: 0.15,
    municipalMomentum: 0.15,
    contractor: 0.15,
    publicTransport: 0.10,
    price: 0.12,
    municipalSupport: 0.08,
  },
  permit: {
    neighborhoodServices: 0.25,
    planningStage: 0.10,
    municipalMomentum: 0.15,
    contractor: 0.20,
    publicTransport: 0.10,
    price: 0.15,
    municipalSupport: 0.05,
  },
  construction: {
    neighborhoodServices: 0.25,
    planningStage: 0.05,
    municipalMomentum: 0.15,
    contractor: 0.25,
    publicTransport: 0.10,
    price: 0.15,
    municipalSupport: 0.05,
  },
  default: {
    neighborhoodServices: 0.25,
    planningStage: 0.20,
    municipalMomentum: 0.15,
    contractor: 0.15,
    publicTransport: 0.10,
    price: 0.10,
    municipalSupport: 0.05,
  },
}

export function detectStageProfile({
  status,
}: {
  status: string | null
}): StageProfile {
  if (!status) return "default"
  const s = status.trim()
  if (s.includes("בביצוע") || s.includes("בנייה") || s.includes("במימוש")) return "construction"
  if (s.includes("היתר") || s.includes("רישוי")) return "permit"
  if (s.includes("תוקף") || s.includes("אישור")) return "approved"
  if (s.includes("הפקדה")) return "submitted"
  if (s.includes("הכרזה")) return "pre-plan"
  return "default"
}

export function getFactorWeights({
  stage,
}: {
  stage: StageProfile
}): FactorWeights {
  return STAGE_WEIGHT_PROFILES[stage]
}

// --- Scoring Functions ---

const STATUS_SCORE_MAP: Array<{ pattern: string; baseScore: number; label: string }> = [
  { pattern: "בביצוע", baseScore: 95, label: "בביצוע" },
  { pattern: "במימוש", baseScore: 95, label: "במימוש" },
  { pattern: "בנייה", baseScore: 95, label: "בנייה" },
  { pattern: "היתר", baseScore: 85, label: "אחרי רישוי" },
  { pattern: "רישוי", baseScore: 85, label: "אחרי רישוי" },
  { pattern: "תוקף", baseScore: 70, label: "תכנית בתוקף" },
  { pattern: "אישור", baseScore: 70, label: "מאושרת" },
  { pattern: "הפקדה", baseScore: 55, label: "בהפקדה" },
  { pattern: "הכרזה", baseScore: 35, label: "הכרזה" },
]

const TIME_DECAY_BRACKETS = [
  { maxYears: 1, decay: 0 },
  { maxYears: 3, decay: 5 },
  { maxYears: 5, decay: 10 },
  { maxYears: Infinity, decay: 15 },
]

function computeTimeDecay({ yearApproved }: { yearApproved: number | null }): number {
  if (!yearApproved) return 0
  const yearsSince = new Date().getFullYear() - yearApproved
  if (yearsSince <= 0) return 0
  for (const bracket of TIME_DECAY_BRACKETS) {
    if (yearsSince <= bracket.maxYears) return bracket.decay
  }
  return 15
}

/** שלב תכנוני — Planning Stage with time decay */
export function scorePlanningStage({
  status,
  yearApproved,
}: {
  status: string | null
  yearApproved: number | null
}): FactorResult {
  if (!status) {
    return { score: null, detail: "אין נתוני סטטוס — הפקטור הושמט" }
  }

  const trimmed = status.trim()
  for (const entry of STATUS_SCORE_MAP) {
    if (trimmed.includes(entry.pattern)) {
      const decay = computeTimeDecay({ yearApproved })
      const score = Math.max(entry.baseScore - decay, 20)
      const decayNote = decay > 0 ? ` (${yearApproved}, ירידת זמן -${decay})` : ""
      return { score, detail: `${entry.label}${decayNote}` }
    }
  }

  return { score: null, detail: `${trimmed} — סטטוס לא מזוהה, הפקטור הושמט` }
}

const MOMENTUM_ADVANCED_STATUSES = ["במימוש", "אחרי רישוי", "היתר", "רישוי"]
const MOMENTUM_THRESHOLDS = [
  { minPercent: 60, score: 90 },
  { minPercent: 40, score: 70 },
  { minPercent: 20, score: 50 },
  { minPercent: 0, score: 30 },
]

interface StatusBreakdown {
  construction: number
  postLicensing: number
  preImplementation: number
  planning: number
  total: number
}

/** מומנטום עירוני — Municipal Momentum (replaces cluster) */
export function scoreMunicipalMomentum({
  statusBreakdown,
}: {
  statusBreakdown: StatusBreakdown
}): FactorResult {
  const { construction, postLicensing, preImplementation, planning, total } = statusBreakdown

  if (total === 0) {
    return { score: null, detail: "אין פרויקטי פינוי בינוי בעיר" }
  }

  const advancedCount = construction + postLicensing
  const advancedPercent = Math.round((advancedCount / total) * 100)

  let score = 30
  for (const threshold of MOMENTUM_THRESHOLDS) {
    if (advancedPercent >= threshold.minPercent) {
      score = threshold.score
      break
    }
  }

  const detail = `${construction} במימוש, ${postLicensing} אחרי רישוי, ${preImplementation} לפני מימוש, ${planning} תכנון (${advancedPercent}% מתקדמים מתוך ${total})`
  return { score, detail }
}

/** יזם/קבלן — Contractor (dropped if not identified) */
export function scoreContractor({
  found,
  recognized,
  hasSanctions,
  sanctionsCount,
}: {
  found: boolean
  recognized: boolean
  hasSanctions: boolean
  sanctionsCount: number
}): FactorResult {
  if (!found) {
    return { score: null, detail: "לא זוהה קבלן — הפקטור הושמט" }
  }
  if (hasSanctions) {
    return { score: 40, detail: `קבלן זוהה עם ${sanctionsCount} סנקציות` }
  }
  if (recognized) {
    return { score: 90, detail: "קבלן רשום ומוכר, ללא סנקציות" }
  }
  return { score: 70, detail: "קבלן רשום במרשם הקבלנים" }
}

const TRANSPORT_THRESHOLDS = {
  lrtPresent: 90,
  busStopsHigh: 70,
  busStopsMedium: 50,
  busStopsLow: 30,
  none: 20,
}

/** תחבורה ציבורית — Public Transport (LRT, metro, BRT, bus stops) */
export function scorePublicTransport({
  lrtStationCount,
  lrtStationNames,
  busStopCount,
  hasMetroOrLrt,
}: {
  lrtStationCount: number
  lrtStationNames: string[]
  busStopCount: number
  hasMetroOrLrt: boolean
}): FactorResult {
  if (hasMetroOrLrt || lrtStationCount > 0) {
    const stationList = lrtStationNames.length > 0
      ? lrtStationNames.slice(0, 3).join(", ")
      : ""
    const stationNote = stationList ? ` (${stationList})` : ""
    return {
      score: TRANSPORT_THRESHOLDS.lrtPresent + Math.min(lrtStationCount, 10),
      detail: `${lrtStationCount} תחנות רכבת קלה${stationNote}, ${busStopCount} תחנות אוטובוס`,
    }
  }

  if (busStopCount > 100) {
    return { score: TRANSPORT_THRESHOLDS.busStopsHigh, detail: `${busStopCount} תחנות אוטובוס — רשת צפופה` }
  }
  if (busStopCount > 30) {
    return { score: TRANSPORT_THRESHOLDS.busStopsMedium, detail: `${busStopCount} תחנות אוטובוס` }
  }
  if (busStopCount > 0) {
    return { score: TRANSPORT_THRESHOLDS.busStopsLow, detail: `${busStopCount} תחנות אוטובוס — מעט` }
  }

  return { score: TRANSPORT_THRESHOLDS.none, detail: "לא אותרה תחבורה ציבורית" }
}

/** מחיר — Price (Madlan only, no lottery fallback) */
export function scorePrice({
  madlanPpa,
}: {
  madlanPpa: number | null
}): FactorResult {
  if (madlanPpa === null || madlanPpa === 0) {
    return { score: null, detail: "אין נתוני מחיר שוק (Madlan) — הפקטור הושמט" }
  }

  const priceK = madlanPpa / 1000

  if (priceK < 20) return { score: 90, detail: `${Math.round(priceK)}K ₪/מ״ר — מחיר נמוך מאוד` }
  if (priceK < 30) return { score: 70, detail: `${Math.round(priceK)}K ₪/מ״ר — מחיר נגיש` }
  if (priceK < 40) return { score: 50, detail: `${Math.round(priceK)}K ₪/מ״ר — מחיר ממוצע` }
  if (priceK < 50) return { score: 30, detail: `${Math.round(priceK)}K ₪/מ״ר — יקר` }
  return { score: 20, detail: `${Math.round(priceK)}K ₪/מ״ר — יקר מאוד` }
}

/** שירותי שכונה — Neighborhood Services (schools, roads, green buildings; no transit) */
export function scoreNeighborhoodServices({
  schoolCount,
  greenBuildingCount,
  xplanCount,
  roadProjectCount,
}: {
  schoolCount: number
  greenBuildingCount: number
  xplanCount: number
  roadProjectCount: number
}): FactorResult {
  const total = schoolCount + greenBuildingCount + xplanCount + roadProjectCount

  if (total === 0) {
    return { score: null, detail: "אין נתוני שירותי שכונה — הפקטור הושמט" }
  }

  let score: number
  if (total <= 3) score = 40
  else if (total <= 7) score = 55
  else if (total <= 15) score = 70
  else if (total <= 30) score = 85
  else score = 95

  const parts: string[] = []
  if (schoolCount > 0) parts.push(`${schoolCount} מוסדות חינוך`)
  if (greenBuildingCount > 0) parts.push(`${greenBuildingCount} בנייה ירוקה`)
  if (xplanCount > 0) parts.push(`${xplanCount} תכניות (XPLAN)`)
  if (roadProjectCount > 0) parts.push(`${roadProjectCount} פרויקטי כבישים`)

  return { score, detail: parts.join(", ") }
}

/** תמיכת רשות — Municipal Support */
export function scoreMunicipalSupport({
  track,
}: {
  track: string | null
}): FactorResult {
  if (!track) return { score: null, detail: "אין נתוני מסלול — הפקטור הושמט" }

  const trimmed = track.trim()
  if (trimmed.includes("מיסוי")) {
    return { score: 60, detail: "מסלול מיסוי — סטנדרטי ברוב פרויקטי פינוי בינוי" }
  }
  if (trimmed.includes("רשויות") || trimmed.includes("עירוני")) {
    return { score: 50, detail: "מסלול רשויות — תהליך סטנדרטי" }
  }
  if (trimmed.includes("טרם")) {
    return { score: null, detail: "טרם הוכרז מסלול — הפקטור הושמט" }
  }
  return { score: 60, detail: `מסלול: ${trimmed}` }
}

export function computeGrade({
  totalScore,
}: {
  totalScore: number
}): string {
  if (totalScore >= 80) return "A"
  if (totalScore >= 65) return "B"
  if (totalScore >= 50) return "C"
  if (totalScore >= 35) return "D"
  return "F"
}
