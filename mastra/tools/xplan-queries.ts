/**
 * XPLAN ArcGIS REST API query layer.
 * Queries the Israeli Planning Administration's public map service
 * to find ALL plans affecting a location (not just Pinui Binui).
 */

import type { SourceInfo } from "./db-queries";

const XPLAN_BASE_URL =
  "https://ags.iplan.gov.il/arcgisiplan/rest/services/PlanningPublic/Xplan/MapServer/1/query";

const XPLAN_OUT_FIELDS = [
  "pl_number",
  "pl_name",
  "station_desc",
  "pl_landuse_string",
  "quantity_delta_120",
  "pl_url",
  "plan_county_name",
  "pl_objectives",
  "pl_area_dunam",
  "shape_area",
].join(",");

const XPLAN_SOURCE: SourceInfo = {
  dataset: "XPLAN - Planning Administration",
  resourceId: "iplan-arcgis-xplan",
  fetchedAt: new Date().toISOString(),
  url: "https://xplan.gov.il",
};

const FETCH_TIMEOUT_MS = 15_000;

interface XplanRecord {
  pl_number: string;
  pl_name: string;
  station_desc: string;
  pl_landuse_string: string;
  quantity_delta_120: number | null;
  pl_url: string;
  plan_county_name: string;
  pl_objectives: string;
  pl_area_dunam: number | null;
  shape_area: number | null;
}

export interface XplanQueryResult {
  records: XplanRecord[];
  total: number;
  hasMore: boolean;
  source: SourceInfo;
}

function buildWhereClause({
  city,
  planNumber,
  keyword,
  landUse,
  status,
}: {
  city?: string;
  planNumber?: string;
  keyword?: string;
  landUse?: string;
  status?: string;
}): string {
  const conditions: string[] = [];

  if (city) conditions.push(`plan_county_name LIKE '%${city}%'`);
  if (planNumber) conditions.push(`pl_number LIKE '%${planNumber}%'`);
  if (keyword) {
    conditions.push(
      `(pl_name LIKE '%${keyword}%' OR pl_objectives LIKE '%${keyword}%')`,
    );
  }
  if (landUse) conditions.push(`pl_landuse_string LIKE '%${landUse}%'`);
  if (status) conditions.push(`station_desc = '${status}'`);

  if (conditions.length === 0) {
    throw new Error("At least one search parameter is required for XPLAN query");
  }

  return conditions.join(" AND ");
}

export async function queryXplan({
  city,
  planNumber,
  keyword,
  landUse,
  status,
  limit = 20,
  offset = 0,
}: {
  city?: string;
  planNumber?: string;
  keyword?: string;
  landUse?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<XplanQueryResult> {
  const where = buildWhereClause({ city, planNumber, keyword, landUse, status });

  const params = new URLSearchParams({
    where,
    outFields: XPLAN_OUT_FIELDS,
    returnGeometry: "false",
    f: "json",
    resultRecordCount: String(limit),
    resultOffset: String(offset),
  });

  const url = `${XPLAN_BASE_URL}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`XPLAN API returned ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    const parsed = data as {
      features?: Array<{ attributes: Record<string, unknown> }>;
      exceededTransferLimit?: boolean;
      error?: { message: string };
    };

    if (parsed.error) {
      throw new Error(`XPLAN API error: ${parsed.error.message}`);
    }

    const features = parsed.features ?? [];
    const records: XplanRecord[] = features.map((f) => ({
      pl_number: String(f.attributes.pl_number ?? ""),
      pl_name: String(f.attributes.pl_name ?? ""),
      station_desc: String(f.attributes.station_desc ?? ""),
      pl_landuse_string: String(f.attributes.pl_landuse_string ?? ""),
      quantity_delta_120: f.attributes.quantity_delta_120 as number | null,
      pl_url: String(f.attributes.pl_url ?? ""),
      plan_county_name: String(f.attributes.plan_county_name ?? ""),
      pl_objectives: String(f.attributes.pl_objectives ?? ""),
      pl_area_dunam: f.attributes.pl_area_dunam as number | null,
      shape_area: f.attributes.shape_area as number | null,
    }));

    return {
      records,
      total: records.length,
      hasMore: parsed.exceededTransferLimit === true,
      source: { ...XPLAN_SOURCE, fetchedAt: new Date().toISOString() },
    };
  } finally {
    clearTimeout(timeout);
  }
}
