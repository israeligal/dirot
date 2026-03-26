/**
 * Pure scoring functions for the 7-factor appreciation model.
 * Each function takes pre-fetched data and returns { score: 0-100, detail: string }.
 */

export interface FactorResult {
  score: number;
  detail: string;
}

export type StageProfile =
  | "pre-plan"
  | "submitted"
  | "approved"
  | "permit"
  | "construction"
  | "default";

export interface FactorWeights {
  infrastructureProximity: number;
  projectStage: number;
  clusterEffect: number;
  contractorReliability: number;
  transportAccess: number;
  priceRelative: number;
  municipalSupport: number;
}

const STAGE_WEIGHT_PROFILES: Record<StageProfile, FactorWeights> = {
  "pre-plan": {
    infrastructureProximity: 0.20,
    projectStage: 0.30,
    clusterEffect: 0.15,
    contractorReliability: 0.05,
    transportAccess: 0.10,
    priceRelative: 0.10,
    municipalSupport: 0.10,
  },
  submitted: {
    infrastructureProximity: 0.22,
    projectStage: 0.25,
    clusterEffect: 0.15,
    contractorReliability: 0.10,
    transportAccess: 0.10,
    priceRelative: 0.10,
    municipalSupport: 0.08,
  },
  approved: {
    infrastructureProximity: 0.25,
    projectStage: 0.15,
    clusterEffect: 0.15,
    contractorReliability: 0.15,
    transportAccess: 0.10,
    priceRelative: 0.12,
    municipalSupport: 0.08,
  },
  permit: {
    infrastructureProximity: 0.25,
    projectStage: 0.10,
    clusterEffect: 0.15,
    contractorReliability: 0.20,
    transportAccess: 0.10,
    priceRelative: 0.15,
    municipalSupport: 0.05,
  },
  construction: {
    infrastructureProximity: 0.25,
    projectStage: 0.05,
    clusterEffect: 0.15,
    contractorReliability: 0.25,
    transportAccess: 0.10,
    priceRelative: 0.15,
    municipalSupport: 0.05,
  },
  default: {
    infrastructureProximity: 0.25,
    projectStage: 0.20,
    clusterEffect: 0.15,
    contractorReliability: 0.15,
    transportAccess: 0.10,
    priceRelative: 0.10,
    municipalSupport: 0.05,
  },
};

/** @deprecated Use getFactorWeights() instead */
export const FACTOR_WEIGHTS = STAGE_WEIGHT_PROFILES.default;

export function detectStageProfile({
  status,
}: {
  status: string | null;
}): StageProfile {
  if (!status) return "default";
  const s = status.trim();
  if (s.includes("בביצוע") || s.includes("בנייה")) return "construction";
  if (s.includes("היתר") || s.includes("רישוי")) return "permit";
  if (s.includes("תוקף") || s.includes("אישור")) return "approved";
  if (s.includes("הפקדה")) return "submitted";
  if (s.includes("הכרזה")) return "pre-plan";
  return "default";
}

export function getFactorWeights({
  stage,
}: {
  stage: StageProfile;
}): FactorWeights {
  return STAGE_WEIGHT_PROFILES[stage];
}

const STATUS_SCORE_MAP: Array<{ pattern: string; score: number; label: string }> = [
  { pattern: "בביצוע", score: 95, label: "Under construction" },
  { pattern: "בנייה", score: 95, label: "Under construction" },
  { pattern: "היתר", score: 85, label: "Permit issued" },
  { pattern: "תוקף", score: 70, label: "Plan approved (tokef)" },
  { pattern: "אישור", score: 70, label: "Approved" },
  { pattern: "הפקדה", score: 55, label: "Deposited" },
  { pattern: "הכרזה", score: 35, label: "Declared" },
];

export function scoreInfrastructureProximity({
  infrastructureCount,
  xplanCount,
}: {
  infrastructureCount: number;
  xplanCount: number;
}): FactorResult {
  const total = infrastructureCount + xplanCount;
  let score: number;

  if (total === 0) score = 20;
  else if (total <= 3) score = 40;
  else if (total <= 7) score = 60;
  else if (total <= 15) score = 80;
  else score = 100;

  return {
    score,
    detail: `${infrastructureCount} infrastructure plans + ${xplanCount} XPLAN plans nearby`,
  };
}

export function scoreProjectStage({
  status,
}: {
  status: string | null;
}): FactorResult {
  if (!status) {
    return { score: 25, detail: "No status data available — early stage assumed" };
  }

  const trimmed = status.trim();
  for (const entry of STATUS_SCORE_MAP) {
    if (trimmed.includes(entry.pattern)) {
      return { score: entry.score, detail: `${trimmed} (${entry.label})` };
    }
  }

  return { score: 25, detail: `${trimmed} (early stage or unknown status)` };
}

export function scoreClusterEffect({
  pbProjectCount,
  constructionSiteCount,
}: {
  pbProjectCount: number;
  constructionSiteCount: number;
}): FactorResult {
  const total = pbProjectCount + constructionSiteCount;
  let score: number;

  if (total <= 2) score = 20;
  else if (total <= 5) score = 40;
  else if (total <= 10) score = 60;
  else if (total <= 20) score = 80;
  else score = 100;

  return {
    score,
    detail: `${pbProjectCount} PB projects + ${constructionSiteCount} construction sites in area`,
  };
}

export function scoreContractorReliability({
  found,
  recognized,
  hasSanctions,
  sanctionsCount,
}: {
  found: boolean;
  recognized: boolean;
  hasSanctions: boolean;
  sanctionsCount: number;
}): FactorResult {
  if (!found) {
    return { score: 50, detail: "No contractor name provided — neutral score" };
  }
  if (hasSanctions) {
    return { score: 40, detail: `Contractor found but has ${sanctionsCount} sanctions` };
  }
  if (recognized) {
    return { score: 90, detail: "Registered contractor, no sanctions" };
  }
  return { score: 70, detail: "Contractor found in registry" };
}

export function scoreTransportAccess({
  transitLineCount,
  hasMetroOrLrt,
}: {
  transitLineCount: number;
  hasMetroOrLrt: boolean;
}): FactorResult {
  if (hasMetroOrLrt) {
    return { score: 95, detail: `Metro/LRT access planned (${transitLineCount} transit lines)` };
  }
  if (transitLineCount === 0) return { score: 20, detail: "No planned transit lines found" };
  if (transitLineCount === 1) return { score: 50, detail: "1 transit line planned" };
  return { score: 75, detail: `${transitLineCount} transit lines planned` };
}

export function scorePriceRelative({
  averagePricePerSqm,
}: {
  averagePricePerSqm: number | null;
}): FactorResult {
  if (averagePricePerSqm === null) {
    return { score: 50, detail: "No Dira BeHanacha price data — neutral score" };
  }
  const priceK = averagePricePerSqm / 1000;

  if (priceK < 20) return { score: 90, detail: `${Math.round(priceK)}K NIS/sqm — very affordable` };
  if (priceK < 30) return { score: 70, detail: `${Math.round(priceK)}K NIS/sqm — affordable` };
  if (priceK < 40) return { score: 50, detail: `${Math.round(priceK)}K NIS/sqm — moderate` };
  if (priceK < 50) return { score: 30, detail: `${Math.round(priceK)}K NIS/sqm — expensive` };
  return { score: 20, detail: `${Math.round(priceK)}K NIS/sqm — very expensive` };
}

export function scoreMunicipalSupport({
  track,
}: {
  track: string | null;
}): FactorResult {
  if (!track) return { score: 60, detail: "Track info not available" };

  const trimmed = track.trim();
  if (trimmed.includes("מיסוי")) {
    return { score: 80, detail: "Taxation track (מיסוי) — tax benefits available" };
  }
  if (trimmed.includes("עירוני")) {
    return { score: 50, detail: "Municipal track (עירוני) — standard process" };
  }
  return { score: 60, detail: `Track: ${trimmed}` };
}

export function computeGrade({
  totalScore,
}: {
  totalScore: number;
}): string {
  if (totalScore >= 80) return "A";
  if (totalScore >= 65) return "B";
  if (totalScore >= 50) return "C";
  if (totalScore >= 35) return "D";
  return "F";
}
