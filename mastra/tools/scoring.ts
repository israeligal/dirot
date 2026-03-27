import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import {
  queryUrbanRenewal,
  queryInfrastructure,
  queryContractors,
  type SourceInfo,
} from "./db-queries"
import { queryXplan } from "./xplan-queries"
import { buildDocId } from "../../app/lib/madlan-client"
import { fetchAreaInfoCached } from "../../app/lib/madlan-cache"
import { neon } from "@neondatabase/serverless"
import {
  getFactorWeights,
  detectStageProfile,
  scorePlanningStage,
  scoreMunicipalMomentum,
  scoreContractor,
  scorePublicTransport,
  scorePrice,
  scoreNeighborhoodServices,
  scoreMunicipalSupport,
  computeGrade,
  type FactorResult,
} from "./scoring-factors"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL required")
  return neon(url)
}

interface FactorOutput {
  name: string
  weight: number
  score: number
  weightedScore: number
  detail: string
}

interface DroppedFactor {
  name: string
  reason: string
}

interface StatusBreakdownRow {
  category: string
  cnt: string
}

interface LrtStationRow {
  station_name: string
  line: string
  x: number
  y: number
}

async function gatherScoringData({
  city,
  neighborhood,
  contractorName,
}: {
  city: string
  neighborhood?: string
  contractorName?: string
}) {
  const sql = getSql()
  const madlanDocId = buildDocId({ city, neighborhood })

  const cityPattern = "%" + city + "%"

  const [
    urbanResult,
    infraResult,
    xplanResult,
    contractorResult,
    madlanResult,
    busStopsResult,
    lrtStationsResult,
    schoolsResult,
    greenBuildingsResult,
    momentumResult,
  ] = await Promise.allSettled([
    queryUrbanRenewal({ city, neighborhood, limit: 100 }),
    queryInfrastructure({ type: "all", keyword: city, limit: 20 }),
    queryXplan({ city, limit: 10 }),
    contractorName
      ? queryContractors({ name: contractorName, limit: 5 })
      : Promise.resolve(null),
    fetchAreaInfoCached({ docIds: [madlanDocId] }),
    sql`SELECT COUNT(*) as cnt, AVG(lat) as center_lat, AVG(lng) as center_lng FROM bus_stops WHERE city_name ILIKE ${cityPattern} AND lat > 0 AND lng > 0` as unknown as Promise<Array<{ cnt: string; center_lat: number | null; center_lng: number | null }>>,
    sql`SELECT DISTINCT station_name, line, x, y FROM lrt_stations` as unknown as Promise<LrtStationRow[]>,
    sql`SELECT COUNT(*) as cnt FROM schools WHERE city ILIKE ${cityPattern}` as unknown as Promise<Array<{ cnt: string }>>,
    sql`SELECT COUNT(*) as cnt FROM green_buildings WHERE municipality_name ILIKE ${cityPattern}` as unknown as Promise<Array<{ cnt: string }>>,
    sql`SELECT
      CASE
        WHEN status ILIKE '%במימוש%' OR status ILIKE '%בביצוע%' OR status ILIKE '%בנייה%' THEN 'construction'
        WHEN status ILIKE '%רישוי%' OR status ILIKE '%היתר%' THEN 'postLicensing'
        WHEN status ILIKE '%מימוש%' AND status NOT ILIKE '%לפני%' THEN 'preImplementation'
        ELSE 'planning'
      END as category,
      COUNT(*) as cnt
    FROM urban_renewal
    WHERE yeshuv ILIKE ${cityPattern}
    GROUP BY category` as unknown as Promise<StatusBreakdownRow[]>,
  ])

  return {
    urbanResult,
    infraResult,
    xplanResult,
    contractorResult,
    madlanResult,
    busStopsResult,
    lrtStationsResult,
    schoolsResult,
    greenBuildingsResult,
    momentumResult,
  }
}

function computeFactors({
  urbanResult,
  infraResult,
  xplanResult,
  contractorResult,
  madlanResult,
  busStopsResult,
  lrtStationsResult,
  schoolsResult,
  greenBuildingsResult,
  momentumResult,
  projectStatus,
  yearApproved,
}: {
  urbanResult: PromiseSettledResult<Awaited<ReturnType<typeof queryUrbanRenewal>>>
  infraResult: PromiseSettledResult<Awaited<ReturnType<typeof queryInfrastructure>>>
  xplanResult: PromiseSettledResult<Awaited<ReturnType<typeof queryXplan>>>
  contractorResult: PromiseSettledResult<Awaited<ReturnType<typeof queryContractors>> | null>
  madlanResult: PromiseSettledResult<Awaited<ReturnType<typeof fetchAreaInfoCached>>>
  busStopsResult: PromiseSettledResult<Array<{ cnt: string; center_lat: number | null; center_lng: number | null }>>
  lrtStationsResult: PromiseSettledResult<LrtStationRow[]>
  schoolsResult: PromiseSettledResult<Array<{ cnt: string }>>
  greenBuildingsResult: PromiseSettledResult<Array<{ cnt: string }>>
  momentumResult: PromiseSettledResult<StatusBreakdownRow[]>
  projectStatus?: string
  yearApproved?: number
}) {
  // Extract data safely
  const status =
    projectStatus ??
    (urbanResult.status === "fulfilled" && urbanResult.value.records.length > 0
      ? String(urbanResult.value.records[0].status ?? "")
      : null)

  const track =
    urbanResult.status === "fulfilled" && urbanResult.value.records.length > 0
      ? String(urbanResult.value.records[0].maslul ?? "")
      : null

  const approvalYear =
    yearApproved ??
    (urbanResult.status === "fulfilled" && urbanResult.value.records.length > 0
      ? Number(urbanResult.value.records[0].shnat_matan_tokef) || null
      : null)

  const xplanCount =
    xplanResult.status === "fulfilled" ? xplanResult.value.records.length : 0

  const contractorFound =
    contractorResult.status === "fulfilled" &&
    contractorResult.value !== null &&
    contractorResult.value.total > 0
  const contractorRecognized =
    contractorFound &&
    contractorResult.status === "fulfilled" &&
    contractorResult.value !== null &&
    contractorResult.value.records.some(
      (r) => String(r.kablan_mukar ?? "") === "כן",
    )
  const constructionRecords =
    urbanResult.status === "fulfilled" ? urbanResult.value.records : []
  const hasSanctions = constructionRecords.some(
    (r) => Number(r.sanctions ?? 0) > 0,
  )
  const sanctionsCount = constructionRecords.filter(
    (r) => Number(r.sanctions ?? 0) > 0,
  ).length

  const madlanPpa =
    madlanResult.status === "fulfilled" && madlanResult.value.length > 0
      ? madlanResult.value[0].ppa
      : null

  const busStopsRow =
    busStopsResult.status === "fulfilled" && busStopsResult.value.length > 0
      ? busStopsResult.value[0]
      : null
  const busStopCount = busStopsRow ? Number(busStopsRow.cnt) : 0
  const cityLat = busStopsRow?.center_lat ? Number(busStopsRow.center_lat) : null
  const cityLng = busStopsRow?.center_lng ? Number(busStopsRow.center_lng) : null

  // Filter LRT stations within ~3km of city center
  // WGS84 → approximate ITM: x ≈ (lng - 34.0) * 95000 + 170000, y ≈ (lat - 29.5) * 111000
  const allLrtStations =
    lrtStationsResult.status === "fulfilled" ? lrtStationsResult.value : []

  let nearbyLrtStations: LrtStationRow[] = []
  if (cityLat && cityLng) {
    const cityItmX = (cityLng - 34.0) * 95000 + 170000
    const cityItmY = (cityLat - 29.5) * 111000
    const radius = 3000 // 3km in meters
    nearbyLrtStations = allLrtStations.filter((s) => {
      const dx = Number(s.x) - cityItmX
      const dy = Number(s.y) - cityItmY
      return Math.sqrt(dx * dx + dy * dy) <= radius
    })
  }
  const lrtStationNames = [...new Set(nearbyLrtStations.map((s) => s.station_name))].filter(Boolean)

  const schoolCount =
    schoolsResult.status === "fulfilled" && schoolsResult.value.length > 0
      ? Number(schoolsResult.value[0].cnt)
      : 0

  const greenBuildingCount =
    greenBuildingsResult.status === "fulfilled" && greenBuildingsResult.value.length > 0
      ? Number(greenBuildingsResult.value[0].cnt)
      : 0

  // Road project count from infrastructure (remove transit overlap)
  const roadProjectCount =
    infraResult.status === "fulfilled"
      ? (infraResult.value.totalBySource["TMA3 Roads"] ?? 0) +
        (infraResult.value.totalBySource["TMA23 Rail"] ?? 0)
      : 0

  // Municipal momentum breakdown
  const momentumRows =
    momentumResult.status === "fulfilled" ? momentumResult.value : []
  const statusBreakdown = {
    construction: 0,
    postLicensing: 0,
    preImplementation: 0,
    planning: 0,
    total: 0,
  }
  for (const row of momentumRows) {
    const cnt = Number(row.cnt)
    statusBreakdown.total += cnt
    if (row.category === "construction") statusBreakdown.construction = cnt
    else if (row.category === "postLicensing") statusBreakdown.postLicensing = cnt
    else if (row.category === "preImplementation") statusBreakdown.preImplementation = cnt
    else statusBreakdown.planning += cnt
  }

  const stageProfile = detectStageProfile({ status })
  const weights = getFactorWeights({ stage: stageProfile })

  // Compute all factor results (some may be null)
  const rawFactors: Array<{
    key: keyof typeof weights
    hebrewName: string
    result: FactorResult
  }> = [
    {
      key: "neighborhoodServices",
      hebrewName: "שירותי שכונה",
      result: scoreNeighborhoodServices({ schoolCount, greenBuildingCount, xplanCount, roadProjectCount }),
    },
    {
      key: "planningStage",
      hebrewName: "שלב תכנוני",
      result: scorePlanningStage({ status, yearApproved: approvalYear }),
    },
    {
      key: "municipalMomentum",
      hebrewName: "מומנטום עירוני",
      result: scoreMunicipalMomentum({ statusBreakdown }),
    },
    {
      key: "contractor",
      hebrewName: "יזם/קבלן",
      result: scoreContractor({ found: contractorFound, recognized: contractorRecognized, hasSanctions, sanctionsCount }),
    },
    {
      key: "publicTransport",
      hebrewName: "תחבורה ציבורית",
      result: scorePublicTransport({
        lrtStationCount: lrtStationNames.length,
        lrtStationNames,
        busStopCount,
        hasMetroOrLrt: lrtStationNames.length > 0,
      }),
    },
    {
      key: "price",
      hebrewName: "מחיר",
      result: scorePrice({ madlanPpa }),
    },
    {
      key: "municipalSupport",
      hebrewName: "תמיכת רשות",
      result: scoreMunicipalSupport({ track }),
    },
  ]

  // Separate active factors (score != null) from dropped
  const activeFactors = rawFactors.filter((f) => f.result.score !== null)
  const droppedFactors: DroppedFactor[] = rawFactors
    .filter((f) => f.result.score === null)
    .map((f) => ({ name: f.hebrewName, reason: f.result.detail }))

  // Redistribute weights among active factors
  const totalActiveWeight = activeFactors.reduce((sum, f) => sum + weights[f.key], 0)
  const weightMultiplier = totalActiveWeight > 0 ? 1 / totalActiveWeight : 0

  const factors: FactorOutput[] = activeFactors.map((f) => {
    const normalizedWeight = Math.round(weights[f.key] * weightMultiplier * 1000) / 1000
    return {
      name: f.hebrewName,
      weight: normalizedWeight,
      score: f.result.score!,
      weightedScore: Math.round(f.result.score! * normalizedWeight * 10) / 10,
      detail: f.result.detail,
    }
  })

  return { stageProfile, factors, droppedFactors }
}

export const scoreProject = createTool({
  id: "score-project",
  description:
    "Compute the weighted investment score for a city/area. Returns per-factor scores (0-100), weighted total, and letter grade (A-F). Factors with missing data are dropped and weights redistributed. Use this to compare investment potential across areas.",
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
    yearApproved: z
      .number()
      .optional()
      .describe("Year the plan was approved (for time decay)"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    totalScore: z.number(),
    grade: z.string(),
    weightProfile: z.string(),
    factors: z.array(
      z.object({
        name: z.string(),
        weight: z.number(),
        score: z.number(),
        weightedScore: z.number(),
        detail: z.string(),
      }),
    ),
    droppedFactors: z.array(
      z.object({
        name: z.string(),
        reason: z.string(),
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
    console.log("[scoreProject] input:", JSON.stringify(input))

    const data = await gatherScoringData({
      city: input.city,
      neighborhood: input.neighborhood,
      contractorName: input.contractorName,
    })

    const { stageProfile, factors, droppedFactors } = computeFactors({
      ...data,
      projectStatus: input.projectStatus,
      yearApproved: input.yearApproved,
    })

    const totalScore = Math.round(
      factors.reduce((sum, f) => sum + f.weightedScore, 0),
    )
    const grade = computeGrade({ totalScore })
    const weightProfile = stageProfile === "default"
      ? "ברירת מחדל (שלב לא ידוע)"
      : `${stageProfile} (משקלות מותאמים לשלב)`

    const activeCount = factors.length
    const droppedCount = droppedFactors.length
    const droppedNote = droppedCount > 0 ? ` (${droppedCount} פקטורים הושמטו בשל חוסר מידע)` : ""

    const summary = `ציון השקעה ל${input.city}${input.neighborhood ? ` (${input.neighborhood})` : ""}: ${totalScore}/100 (דירוג ${grade}). ${activeCount} פקטורים פעילים${droppedNote}. פרופיל משקלות: ${weightProfile}.`

    const sources: SourceInfo[] = []
    if (data.urbanResult.status === "fulfilled" && data.urbanResult.value.source) {
      sources.push(data.urbanResult.value.source)
    }
    if (data.xplanResult.status === "fulfilled") {
      sources.push(data.xplanResult.value.source)
    }

    console.log("[scoreProject] score:", totalScore, "grade:", grade, "active:", activeCount, "dropped:", droppedCount)

    return { summary, totalScore, grade, weightProfile, factors, droppedFactors, sources }
  },
})
