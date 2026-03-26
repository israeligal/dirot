import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  queryUrbanRenewalByAddress,
  queryConstructionProgress,
  queryConstructionSitesByAddress,
  queryGreenBuildingsByAddress,
  queryDevelopmentCostsByAddress,
  queryLotteriesByAddress,
  type SourceInfo,
} from "./db-queries";
import { queryXplan } from "./xplan-queries";
import { trimRecord } from "./utils";

const sourcesSchema = z.array(
  z.object({
    dataset: z.string(),
    resourceId: z.string(),
    fetchedAt: z.string(),
    url: z.string(),
  }),
);

function settled<T>(
  result: PromiseSettledResult<T>,
): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

export const searchByAddress = createTool({
  id: "search-by-address",
  description:
    "Search for information about a specific address (city + street + optional house number). Queries 7 data sources in parallel: Pinui Binui projects, XPLAN planning authority, construction progress, active construction sites, green buildings, development costs, and nearby lotteries. Use when the user asks about a specific property, street, or building.",
  inputSchema: z.object({
    city: z.string().describe("City name in Hebrew (e.g., בת ים)"),
    street: z.string().describe("Street name in Hebrew (e.g., השמונאים)"),
    houseNumber: z
      .string()
      .optional()
      .describe("House number (e.g., 22)"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    address: z.object({
      city: z.string(),
      street: z.string(),
      houseNumber: z.string().optional(),
    }),
    pinuiBinui: z.object({
      found: z.boolean(),
      projects: z.array(z.record(z.string(), z.unknown())),
    }),
    planningAuthority: z.object({
      found: z.boolean(),
      plans: z.array(z.record(z.string(), z.unknown())),
    }),
    constructionProgress: z.object({
      found: z.boolean(),
      buildings: z.array(z.record(z.string(), z.unknown())),
    }),
    activeConstruction: z.object({
      found: z.boolean(),
      sites: z.array(z.record(z.string(), z.unknown())),
    }),
    greenBuildings: z.object({
      found: z.boolean(),
      buildings: z.array(z.record(z.string(), z.unknown())),
    }),
    developmentCosts: z.object({
      found: z.boolean(),
      projects: z.array(z.record(z.string(), z.unknown())),
    }),
    nearbyLotteries: z.object({
      found: z.boolean(),
      lotteries: z.array(z.record(z.string(), z.unknown())),
    }),
    sources: sourcesSchema,
  }),
  execute: async ({ city, street, houseNumber }) => {
    const addressLabel = houseNumber
      ? `${street} ${houseNumber}, ${city}`
      : `${street}, ${city}`;

    console.log(`[searchByAddress] searching 7 sources: ${addressLabel}`);

    const searchTerm = houseNumber ? `${street} ${houseNumber}` : street;

    const [
      pbResult,
      xplanResult,
      constructionProgressResult,
      activeSitesResult,
      greenResult,
      devCostsResult,
      lotteryResult,
    ] = await Promise.allSettled([
      queryUrbanRenewalByAddress({ city, searchTerm, limit: 10 }),
      queryXplan({ city, keyword: searchTerm, limit: 10 }),
      queryConstructionProgress({ city, siteName: street, limit: 10 }),
      queryConstructionSitesByAddress({ city, siteName: street, limit: 10 }),
      queryGreenBuildingsByAddress({ city, street, limit: 10 }),
      queryDevelopmentCostsByAddress({ city, siteName: searchTerm, limit: 10 }),
      queryLotteriesByAddress({ city, searchTerm, limit: 10 }),
    ]);

    const pb = settled(pbResult);
    const xplan = settled(xplanResult);
    const constructionProg = settled(constructionProgressResult);
    const activeSites = settled(activeSitesResult);
    const green = settled(greenResult);
    const devCosts = settled(devCostsResult);
    const lottery = settled(lotteryResult);

    const sources: SourceInfo[] = [];

    // Source 1: PB projects
    const pbProjects = (pb?.records ?? []).map((r) => ({
      projectNumber: r.mispar_mitham,
      city: r.yeshuv,
      neighborhood: r.shem_mitcham,
      matchScore: r.match_score,
      existingUnits: r.yachad_kayam,
      additionalUnits: r.yachad_tosafti,
      totalProposedUnits: r.yachad_mutza,
      planNumber: r.mispar_tochnit,
      status: r.status,
      track: r.maslul,
      yearApproved: r.shnat_matan_tokef,
      underConstruction: r.bebitzua,
      mavatLink: r.kishur_latar || null,
    }));
    if (pb?.source) sources.push(pb.source);

    // Source 2: XPLAN plans
    const plans = (xplan?.records ?? []).map((r) => ({
      planNumber: r.pl_number,
      planName: r.pl_name,
      status: r.station_desc,
      landUseTypes: r.pl_landuse_string,
      housingUnitsDelta: r.quantity_delta_120,
      objectives: r.pl_objectives,
      mavatLink: r.pl_url,
    }));
    if (xplan?.source) sources.push(xplan.source);

    // Source 3: Construction progress
    const progressBuildings = (constructionProg?.records ?? []).map((r) =>
      trimRecord({
        district: r.mahoz,
        city: r.yeshuv_lamas,
        site: r.atar,
        complexName: r.shem_mitham,
        gush: r.gush,
        helka: r.helka,
        buildingNumber: r.mispar_binyan,
        floors: r.komot_binyan,
        units: r.yehidot_binyan,
        contractYear: r.shnat_hoze,
      }),
    );
    if (constructionProg?.source) sources.push(constructionProg.source);

    // Source 4: Active construction sites
    const sites = (activeSites?.records ?? []).map((r) => trimRecord({
      workId: r.work_id,
      siteName: r.site_name,
      contractor: r.executor_name,
      contractorId: r.executor_id,
      city: r.city_name,
      buildingType: r.build_types,
      hasCranes: r.has_cranes === 1,
      safetyWarnings: r.safety_warrents,
      sanctions: r.sanctions,
      sanctionsAmount: r.sanctions_sum,
    }));
    if (activeSites?.source) sources.push(activeSites.source);

    // Source 5: Green buildings
    const greenBuilds = (green?.records ?? []).map((r) => trimRecord({
      municipality: r.municipality_name,
      street: r.building_street,
      gush: r.gush,
      helka: r.helka,
      floors: r.floors_above_ground,
      area: r.building_area,
      units: r.residential_units,
      standard: r.standard_name,
      certificationStatus: r.certification_status,
    }));
    if (green?.source) sources.push(green.source);

    // Source 6: Development costs
    const devProjects = (devCosts?.records ?? []).map((r) => trimRecord({
      projectName: r.project_name,
      district: r.mahoz_name,
      city: r.lamas_name,
      site: r.atar_name,
      livingUnits: r.living_units,
      status: r.status_description,
      developmentPayment: r.develop_pay,
    }));
    if (devCosts?.source) sources.push(devCosts.source);

    // Source 7: Nearby lotteries
    const lotteries = (lottery?.records ?? []).map((r) => trimRecord({
      lotteryId: r.lottery_id,
      projectName: r.project_name,
      neighborhood: r.neighborhood,
      pricePerSqm: r.price_for_meter,
      subscribers: r.subscribers,
      winners: r.winners,
      status: r.project_status,
      executionDate: r.lottery_execution_date,
    }));
    if (lottery?.source) sources.push(lottery.source);

    // Build summary
    const totalFinds =
      pbProjects.length + plans.length + progressBuildings.length +
      sites.length + greenBuilds.length + devProjects.length + lotteries.length;

    const parts: string[] = [];
    if (pbProjects.length > 0) parts.push(`${pbProjects.length} PB project(s)`);
    if (plans.length > 0) parts.push(`${plans.length} planning plan(s)`);
    if (progressBuildings.length > 0) parts.push(`${progressBuildings.length} construction progress record(s)`);
    if (sites.length > 0) parts.push(`${sites.length} active construction site(s)`);
    if (greenBuilds.length > 0) parts.push(`${greenBuilds.length} green building(s)`);
    if (devProjects.length > 0) parts.push(`${devProjects.length} development cost record(s)`);
    if (lotteries.length > 0) parts.push(`${lotteries.length} nearby lottery/ies`);

    const summary =
      totalFinds > 0
        ? `Found ${totalFinds} result(s) for ${addressLabel}: ${parts.join(", ")}. Searched 7 data sources.`
        : `No results found for ${addressLabel} across 7 data sources (PB projects, planning authority, construction progress, active sites, green buildings, development costs, lotteries).`;

    return {
      summary,
      address: { city, street, houseNumber },
      pinuiBinui: { found: pbProjects.length > 0, projects: pbProjects },
      planningAuthority: { found: plans.length > 0, plans },
      constructionProgress: { found: progressBuildings.length > 0, buildings: progressBuildings },
      activeConstruction: { found: sites.length > 0, sites },
      greenBuildings: { found: greenBuilds.length > 0, buildings: greenBuilds },
      developmentCosts: { found: devProjects.length > 0, projects: devProjects },
      nearbyLotteries: { found: lotteries.length > 0, lotteries },
      sources,
    };
  },
});
