import { neon } from "@neondatabase/serverless"
import {
  queryUrbanRenewal,
  queryInfrastructure,
  queryContractors,
} from "./db-queries"
import { queryXplan } from "./xplan-queries"
import { buildDocId } from "../../app/lib/madlan-client"
import { fetchAreaInfoCached } from "../../app/lib/madlan-cache"
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
  type FactorResult,
} from "./scoring-factors"
import type { FactorWeights } from "./scoring-constants"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL required")
  return neon(url)
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

export interface FactorOutput {
  name: string
  weight: number
  score: number
  weightedScore: number
  detail: string
}

export interface DroppedFactor {
  name: string
  reason: string
}

export async function gatherScoringData({
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

type ScoringData = Awaited<ReturnType<typeof gatherScoringData>>

interface RawFactor {
  key: keyof FactorWeights
  hebrewName: string
  result: FactorResult
}

function extractScoringInputs({
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
}: ScoringData & { projectStatus?: string; yearApproved?: number }) {
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

  const allLrtStations =
    lrtStationsResult.status === "fulfilled" ? lrtStationsResult.value : []
  const nearbyLrtStations = buildNearbyLrtStations({ allLrtStations, cityLat, cityLng })
  const lrtStationNames = [...new Set(nearbyLrtStations.map((s) => s.station_name))].filter(Boolean)

  const schoolCount =
    schoolsResult.status === "fulfilled" && schoolsResult.value.length > 0
      ? Number(schoolsResult.value[0].cnt)
      : 0

  const greenBuildingCount =
    greenBuildingsResult.status === "fulfilled" && greenBuildingsResult.value.length > 0
      ? Number(greenBuildingsResult.value[0].cnt)
      : 0

  const roadProjectCount =
    infraResult.status === "fulfilled"
      ? (infraResult.value.totalBySource["TMA3 Roads"] ?? 0) +
        (infraResult.value.totalBySource["TMA23 Rail"] ?? 0)
      : 0

  const statusBreakdown = buildStatusBreakdown({
    momentumRows: momentumResult.status === "fulfilled" ? momentumResult.value : [],
  })

  return {
    status,
    track,
    approvalYear,
    xplanCount,
    contractorFound,
    contractorRecognized,
    hasSanctions,
    sanctionsCount,
    madlanPpa,
    busStopCount,
    lrtStationNames,
    schoolCount,
    greenBuildingCount,
    roadProjectCount,
    statusBreakdown,
  }
}

function buildNearbyLrtStations({
  allLrtStations,
  cityLat,
  cityLng,
}: {
  allLrtStations: LrtStationRow[]
  cityLat: number | null
  cityLng: number | null
}): LrtStationRow[] {
  if (!cityLat || !cityLng) return []

  // WGS84 → approximate ITM: x ≈ (lng - 34.0) * 95000 + 170000, y ≈ (lat - 29.5) * 111000
  const cityItmX = (cityLng - 34.0) * 95000 + 170000
  const cityItmY = (cityLat - 29.5) * 111000
  const radius = 3000 // 3km in meters

  return allLrtStations.filter((s) => {
    const dx = Number(s.x) - cityItmX
    const dy = Number(s.y) - cityItmY
    return Math.sqrt(dx * dx + dy * dy) <= radius
  })
}

function buildStatusBreakdown({ momentumRows }: { momentumRows: StatusBreakdownRow[] }) {
  const breakdown = { construction: 0, postLicensing: 0, preImplementation: 0, planning: 0, total: 0 }

  for (const row of momentumRows) {
    const cnt = Number(row.cnt)
    breakdown.total += cnt
    if (row.category === "construction") breakdown.construction = cnt
    else if (row.category === "postLicensing") breakdown.postLicensing = cnt
    else if (row.category === "preImplementation") breakdown.preImplementation = cnt
    else breakdown.planning += cnt
  }

  return breakdown
}

export function computeFactorScores({
  status,
  track,
  approvalYear,
  xplanCount,
  contractorFound,
  contractorRecognized,
  hasSanctions,
  sanctionsCount,
  madlanPpa,
  busStopCount,
  lrtStationNames,
  schoolCount,
  greenBuildingCount,
  roadProjectCount,
  statusBreakdown,
}: ReturnType<typeof extractScoringInputs>): RawFactor[] {
  return [
    {
      key: "neighborhoodServices" as keyof FactorWeights,
      hebrewName: "שירותי שכונה",
      result: scoreNeighborhoodServices({ schoolCount, greenBuildingCount, xplanCount, roadProjectCount }),
    },
    {
      key: "planningStage" as keyof FactorWeights,
      hebrewName: "שלב תכנוני",
      result: scorePlanningStage({ status, yearApproved: approvalYear }),
    },
    {
      key: "municipalMomentum" as keyof FactorWeights,
      hebrewName: "מומנטום עירוני",
      result: scoreMunicipalMomentum({ statusBreakdown }),
    },
    {
      key: "contractor" as keyof FactorWeights,
      hebrewName: "יזם/קבלן",
      result: scoreContractor({ found: contractorFound, recognized: contractorRecognized, hasSanctions, sanctionsCount }),
    },
    {
      key: "publicTransport" as keyof FactorWeights,
      hebrewName: "תחבורה ציבורית",
      result: scorePublicTransport({
        lrtStationCount: lrtStationNames.length,
        lrtStationNames,
        busStopCount,
        hasMetroOrLrt: lrtStationNames.length > 0,
      }),
    },
    {
      key: "price" as keyof FactorWeights,
      hebrewName: "מחיר",
      result: scorePrice({ madlanPpa }),
    },
    {
      key: "municipalSupport" as keyof FactorWeights,
      hebrewName: "תמיכת רשות",
      result: scoreMunicipalSupport({ track }),
    },
  ]
}

export function redistributeWeights({
  rawFactors,
  weights,
}: {
  rawFactors: RawFactor[]
  weights: FactorWeights
}): { factors: FactorOutput[]; droppedFactors: DroppedFactor[] } {
  const activeFactors = rawFactors.filter((f) => f.result.score !== null)
  const droppedFactors: DroppedFactor[] = rawFactors
    .filter((f) => f.result.score === null)
    .map((f) => ({ name: f.hebrewName, reason: f.result.detail }))

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

  return { factors, droppedFactors }
}

export function computeFactors({
  projectStatus,
  yearApproved,
  ...data
}: ScoringData & { projectStatus?: string; yearApproved?: number }) {
  const inputs = extractScoringInputs({ ...data, projectStatus, yearApproved })
  const stageProfile = detectStageProfile({ status: inputs.status })
  const weights = getFactorWeights({ stage: stageProfile })
  const rawFactors = computeFactorScores(inputs)
  const { factors, droppedFactors } = redistributeWeights({ rawFactors, weights })
  return { stageProfile, factors, droppedFactors }
}
