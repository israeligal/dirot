/**
 * Shared constants and types for the 7-factor investment scoring model.
 */

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

export const STAGE_WEIGHT_PROFILES: Record<StageProfile, FactorWeights> = {
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

export const STATUS_SCORE_MAP: Array<{ pattern: string; baseScore: number; label: string }> = [
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

export const TIME_DECAY_BRACKETS = [
  { maxYears: 1, decay: 0 },
  { maxYears: 3, decay: 5 },
  { maxYears: 5, decay: 10 },
  { maxYears: Infinity, decay: 15 },
]
