import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  queryUrbanRenewal,
  queryConstructionSites,
  queryInfrastructure,
  queryLotteries,
  queryContractors,
  type SourceInfo,
} from "./db-queries";
import { queryXplan } from "./xplan-queries";
import {
  FACTOR_WEIGHTS,
  scoreInfrastructureProximity,
  scoreProjectStage,
  scoreClusterEffect,
  scoreContractorReliability,
  scoreTransportAccess,
  scorePriceRelative,
  scoreMunicipalSupport,
  computeGrade,
} from "./scoring-factors";

interface FactorOutput {
  name: string;
  weight: number;
  score: number;
  weightedScore: number;
  detail: string;
}

async function gatherScoringData({
  city,
  neighborhood,
  contractorName,
}: {
  city: string;
  neighborhood?: string;
  contractorName?: string;
}) {
  const queries = [
    queryUrbanRenewal({ city, neighborhood, limit: 100 }),
    queryConstructionSites({ city, limit: 100 }),
    queryInfrastructure({ type: "all", keyword: city, limit: 20 }),
    queryXplan({ city, limit: 10 }),
    queryLotteries({ city, limit: 50 }),
    contractorName
      ? queryContractors({ name: contractorName, limit: 5 })
      : Promise.resolve(null),
  ] as const;

  const [
    urbanResult,
    constructionResult,
    infraResult,
    xplanResult,
    lotteryResult,
    contractorResult,
  ] = await Promise.allSettled(queries);

  return {
    urbanResult,
    constructionResult,
    infraResult,
    xplanResult,
    lotteryResult,
    contractorResult,
  };
}

function computeFactors({
  urbanResult,
  constructionResult,
  infraResult,
  xplanResult,
  lotteryResult,
  contractorResult,
  projectStatus,
}: {
  urbanResult: PromiseSettledResult<Awaited<ReturnType<typeof queryUrbanRenewal>>>;
  constructionResult: PromiseSettledResult<Awaited<ReturnType<typeof queryConstructionSites>>>;
  infraResult: PromiseSettledResult<Awaited<ReturnType<typeof queryInfrastructure>>>;
  xplanResult: PromiseSettledResult<Awaited<ReturnType<typeof queryXplan>>>;
  lotteryResult: PromiseSettledResult<Awaited<ReturnType<typeof queryLotteries>>>;
  contractorResult: PromiseSettledResult<Awaited<ReturnType<typeof queryContractors>> | null>;
  projectStatus?: string;
}): FactorOutput[] {
  const infraCount =
    infraResult.status === "fulfilled"
      ? Object.values(infraResult.value.totalBySource).reduce((a, b) => a + b, 0)
      : 0;
  const xplanCount =
    xplanResult.status === "fulfilled" ? xplanResult.value.records.length : 0;

  const pbCount =
    urbanResult.status === "fulfilled" ? urbanResult.value.total : 0;
  const siteCount =
    constructionResult.status === "fulfilled"
      ? constructionResult.value.total
      : 0;

  const status =
    projectStatus ??
    (urbanResult.status === "fulfilled" && urbanResult.value.records.length > 0
      ? String(urbanResult.value.records[0].status ?? "")
      : null);

  const track =
    urbanResult.status === "fulfilled" && urbanResult.value.records.length > 0
      ? String(urbanResult.value.records[0].maslul ?? "")
      : null;

  const transitCount =
    infraResult.status === "fulfilled"
      ? (infraResult.value.totalBySource["Mass Transit TLV"] ?? 0)
      : 0;
  const hasMetroOrLrt =
    infraResult.status === "fulfilled"
      ? infraResult.value.results.some((r) => {
          const type = String(r.type ?? r._source ?? "").toLowerCase();
          return type.includes("metro") || type.includes("lrt") || type.includes("קלה");
        })
      : false;

  let avgPrice: number | null = null;
  if (lotteryResult.status === "fulfilled" && lotteryResult.value.records.length > 0) {
    const prices = lotteryResult.value.records
      .map((r) => Number(r.price_per_meter ?? 0))
      .filter((p) => p > 0);
    avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  }

  const contractorFound =
    contractorResult.status === "fulfilled" &&
    contractorResult.value !== null &&
    contractorResult.value.total > 0;
  const contractorRecognized =
    contractorFound &&
    contractorResult.status === "fulfilled" &&
    contractorResult.value !== null &&
    contractorResult.value.records.some(
      (r) => String(r.kablan_mukar ?? "") === "כן",
    );
  const hasSanctions =
    constructionResult.status === "fulfilled" &&
    constructionResult.value.records.some(
      (r) => Number(r.sanctions ?? 0) > 0,
    );
  const sanctionsCount =
    constructionResult.status === "fulfilled"
      ? constructionResult.value.records.filter(
          (r) => Number(r.sanctions ?? 0) > 0,
        ).length
      : 0;

  const w = FACTOR_WEIGHTS;
  const factors: Array<{ key: string; name: string; weight: number; result: { score: number; detail: string } }> = [
    { key: "infrastructure", name: "Infrastructure Proximity", weight: w.infrastructureProximity, result: scoreInfrastructureProximity({ infrastructureCount: infraCount, xplanCount }) },
    { key: "stage", name: "Project Stage", weight: w.projectStage, result: scoreProjectStage({ status }) },
    { key: "cluster", name: "Neighborhood Cluster", weight: w.clusterEffect, result: scoreClusterEffect({ pbProjectCount: pbCount, constructionSiteCount: siteCount }) },
    { key: "contractor", name: "Contractor Reliability", weight: w.contractorReliability, result: scoreContractorReliability({ found: contractorFound, recognized: contractorRecognized, hasSanctions, sanctionsCount }) },
    { key: "transport", name: "Transportation Access", weight: w.transportAccess, result: scoreTransportAccess({ transitLineCount: transitCount, hasMetroOrLrt: hasMetroOrLrt }) },
    { key: "price", name: "Price Relative to Area", weight: w.priceRelative, result: scorePriceRelative({ averagePricePerSqm: avgPrice }) },
    { key: "municipal", name: "Municipal Support", weight: w.municipalSupport, result: scoreMunicipalSupport({ track }) },
  ];

  return factors.map((f) => ({
    name: f.name,
    weight: f.weight,
    score: f.result.score,
    weightedScore: Math.round(f.result.score * f.weight * 10) / 10,
    detail: f.result.detail,
  }));
}

export const scoreProject = createTool({
  id: "score-project",
  description:
    "Compute the 7-factor weighted appreciation score for a city/area. Returns per-factor scores (0-100), weighted total, and letter grade (A-F). Use this to compare investment potential across areas.",
  inputSchema: z.object({
    city: z.string().describe("City name in Hebrew (required)"),
    neighborhood: z
      .string()
      .optional()
      .describe("Neighborhood or complex name"),
    contractorName: z
      .string()
      .optional()
      .describe("Contractor name for reliability check"),
    projectStatus: z
      .string()
      .optional()
      .describe("Known project status if available"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    totalScore: z.number(),
    grade: z.string(),
    factors: z.array(
      z.object({
        name: z.string(),
        weight: z.number(),
        score: z.number(),
        weightedScore: z.number(),
        detail: z.string(),
      }),
    ),
    sources: z.array(
      z.object({
        dataset: z.string(),
        resourceId: z.string(),
        fetchedAt: z.string(),
        url: z.string(),
      }),
    ),
  }),
  execute: async (input) => {
    console.log("[scoreProject] input:", JSON.stringify(input));

    const data = await gatherScoringData({
      city: input.city,
      neighborhood: input.neighborhood,
      contractorName: input.contractorName,
    });

    const factors = computeFactors({
      ...data,
      projectStatus: input.projectStatus,
    });

    const totalScore = Math.round(
      factors.reduce((sum, f) => sum + f.weightedScore, 0),
    );
    const grade = computeGrade({ totalScore });

    const summary = `Investment score for ${input.city}${input.neighborhood ? ` (${input.neighborhood})` : ""}: ${totalScore}/100 (Grade ${grade}). Top factor: ${factors.sort((a, b) => b.weightedScore - a.weightedScore)[0].name}.`;

    const sources: SourceInfo[] = [];
    if (data.urbanResult.status === "fulfilled" && data.urbanResult.value.source) {
      sources.push(data.urbanResult.value.source);
    }
    if (data.xplanResult.status === "fulfilled") {
      sources.push(data.xplanResult.value.source);
    }

    console.log("[scoreProject] score:", totalScore, "grade:", grade);

    return { summary, totalScore, grade, factors, sources };
  },
});
