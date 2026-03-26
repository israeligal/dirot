/**
 * Shared database query helpers for agent tools.
 * All queries go through Neon PG with fuzzy search via pg_trgm.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL required. Set it in .env.local");
    }
    _sql = neon(url);
  }
  return _sql;
}

export interface QueryResult<T> {
  records: T[];
  total: number;
  source: {
    dataset: string;
    resourceId: string;
    fetchedAt: string;
    url: string;
  };
}

export interface SourceInfo {
  dataset: string;
  resourceId: string;
  fetchedAt: string;
  url: string;
}

export function extractSource(row: Record<string, unknown>): SourceInfo {
  const fetchedAt = row.fetched_at;
  return {
    dataset: String(row.source_dataset ?? ""),
    resourceId: String(row.resource_id ?? ""),
    fetchedAt: fetchedAt instanceof Date ? fetchedAt.toISOString() : String(fetchedAt ?? ""),
    url: String(row.data_gov_url ?? ""),
  };
}

// --- Urban Renewal ---

export async function queryUrbanRenewal({
  city,
  neighborhood,
  limit = 20,
  offset = 0,
}: {
  city?: string;
  neighborhood?: string;
  limit?: number;
  offset?: number;
}) {
  if (city && neighborhood) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM urban_renewal
      WHERE yeshuv ILIKE ${"%" + city + "%"}
        AND shem_mitcham ILIKE ${"%" + neighborhood + "%"}
      ORDER BY mispar_mitham
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  if (city) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM urban_renewal
      WHERE yeshuv ILIKE ${"%" + city + "%"}
      ORDER BY mispar_mitham
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  if (neighborhood) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM urban_renewal
      WHERE shem_mitcham % ${neighborhood}
      ORDER BY similarity(shem_mitcham, ${neighborhood}) DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM urban_renewal
    ORDER BY mispar_mitham
    LIMIT ${limit} OFFSET ${offset}
  `;
  return formatResult(rows);
}

// --- Urban Renewal by Address (fuzzy street search) ---

export async function queryUrbanRenewalByAddress({
  city,
  searchTerm,
  limit = 10,
}: {
  city: string;
  searchTerm: string;
  limit?: number;
}) {
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count,
           similarity(shem_mitcham, ${searchTerm}) as match_score
    FROM urban_renewal
    WHERE yeshuv ILIKE ${"%" + city + "%"}
      AND shem_mitcham % ${searchTerm}
    ORDER BY match_score DESC
    LIMIT ${limit}
  `;
  return formatResult(rows);
}

// --- Active Construction ---

export async function queryConstructionSites({
  city,
  buildType,
  limit = 20,
  offset = 0,
}: {
  city?: string;
  buildType?: string;
  limit?: number;
  offset?: number;
}) {
  if (city && buildType) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM active_construction
      WHERE city_name ILIKE ${"%" + city + "%"}
        AND build_types ILIKE ${"%" + buildType + "%"}
      ORDER BY work_id
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  if (city) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM active_construction
      WHERE city_name ILIKE ${"%" + city + "%"}
      ORDER BY work_id
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM active_construction
    ORDER BY work_id
    LIMIT ${limit} OFFSET ${offset}
  `;
  return formatResult(rows);
}

// --- Construction Progress ---

export async function queryConstructionProgress({
  city,
  gush,
  siteName,
  limit = 20,
  offset = 0,
}: {
  city?: string;
  gush?: string;
  siteName?: string;
  limit?: number;
  offset?: number;
}) {
  if (city && siteName) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM construction_progress
      WHERE yeshuv_lamas ILIKE ${"%" + city + "%"}
        AND atar ILIKE ${"%" + siteName + "%"}
      ORDER BY ckan_id
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  if (gush) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM construction_progress
      WHERE gush = ${gush}
      ORDER BY ckan_id
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  if (city) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM construction_progress
      WHERE yeshuv_lamas ILIKE ${"%" + city + "%"}
      ORDER BY ckan_id
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM construction_progress
    ORDER BY ckan_id
    LIMIT ${limit} OFFSET ${offset}
  `;
  return formatResult(rows);
}

// --- Lottery ---

// For inline template fragments inside queries, we need the neon sql function
// These are used for conditional WHERE clauses: ${condition ? sql`AND ...` : sql``}

export async function queryLotteries({
  city,
  neighborhood,
  limit = 20,
  offset = 0,
}: {
  city?: string;
  neighborhood?: string;
  limit?: number;
  offset?: number;
}) {
  if (city && neighborhood) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM lottery
      WHERE lamas_name ILIKE ${"%" + city + "%"}
        AND neighborhood ILIKE ${"%" + neighborhood + "%"}
      ORDER BY lottery_id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  if (city) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM lottery
      WHERE lamas_name ILIKE ${"%" + city + "%"}
      ORDER BY lottery_id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM lottery
    ORDER BY lottery_id DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return formatResult(rows);
}

// --- Contractors ---

export async function queryContractors({
  name,
  city,
  branch,
  limit = 20,
  offset = 0,
}: {
  name?: string;
  city?: string;
  branch?: string;
  limit?: number;
  offset?: number;
}) {
  if (name && city && branch) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count, similarity(shem_yeshut, ${name}) as match_score
      FROM contractors WHERE shem_yeshut % ${name} AND shem_yishuv ILIKE ${"%" + city + "%"} AND teur_anaf ILIKE ${"%" + branch + "%"}
      ORDER BY match_score DESC LIMIT ${limit} OFFSET ${offset}`;
    return formatResult(rows);
  }
  if (name && city) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count, similarity(shem_yeshut, ${name}) as match_score
      FROM contractors WHERE shem_yeshut % ${name} AND shem_yishuv ILIKE ${"%" + city + "%"}
      ORDER BY match_score DESC LIMIT ${limit} OFFSET ${offset}`;
    return formatResult(rows);
  }
  if (name) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count, similarity(shem_yeshut, ${name}) as match_score
      FROM contractors WHERE shem_yeshut % ${name}
      ORDER BY match_score DESC LIMIT ${limit} OFFSET ${offset}`;
    return formatResult(rows);
  }
  if (city && branch) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count FROM contractors
      WHERE shem_yishuv ILIKE ${"%" + city + "%"} AND teur_anaf ILIKE ${"%" + branch + "%"}
      ORDER BY shem_yeshut LIMIT ${limit} OFFSET ${offset}`;
    return formatResult(rows);
  }
  if (city) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count FROM contractors
      WHERE shem_yishuv ILIKE ${"%" + city + "%"}
      ORDER BY shem_yeshut LIMIT ${limit} OFFSET ${offset}`;
    return formatResult(rows);
  }
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM contractors
    ORDER BY shem_yeshut
    LIMIT ${limit} OFFSET ${offset}
  `;
  return formatResult(rows);
}

// --- Infrastructure (combined) ---

export async function queryInfrastructure({
  type = "all",
  keyword,
  limit = 10,
}: {
  type?: "road" | "rail" | "transit" | "transport" | "national" | "all";
  keyword?: string;
  limit?: number;
}) {
  const results: Record<string, unknown>[] = [];
  const totalBySource: Record<string, number> = {};
  const perLimit = type === "all" ? Math.max(3, Math.floor(limit / 5)) : limit;

  if (type === "all" || type === "road") {
    const rows = keyword
      ? await getSql()`SELECT *, 'TMA3 Roads' as _source FROM tma3_roads WHERE tochnit_na ILIKE ${"%" + keyword + "%"} OR status ILIKE ${"%" + keyword + "%"} LIMIT ${perLimit}`
      : await getSql()`SELECT *, 'TMA3 Roads' as _source FROM tma3_roads LIMIT ${perLimit}`;
    totalBySource["TMA3 Roads"] = rows.length;
    results.push(...rows);
  }
  if (type === "all" || type === "rail") {
    const rows = keyword
      ? await getSql()`SELECT *, 'TMA23 Rail' as _source FROM tma23_rail WHERE tochnit_na ILIKE ${"%" + keyword + "%"} OR status ILIKE ${"%" + keyword + "%"} LIMIT ${perLimit}`
      : await getSql()`SELECT *, 'TMA23 Rail' as _source FROM tma23_rail LIMIT ${perLimit}`;
    totalBySource["TMA23 Rail"] = rows.length;
    results.push(...rows);
  }
  if (type === "all" || type === "transport") {
    const rows = keyword
      ? await getSql()`SELECT *, 'Transport Projects' as _source FROM transport_projects WHERE prj_name ILIKE ${"%" + keyword + "%"} OR road ILIKE ${"%" + keyword + "%"} OR main_name ILIKE ${"%" + keyword + "%"} LIMIT ${perLimit}`
      : await getSql()`SELECT *, 'Transport Projects' as _source FROM transport_projects LIMIT ${perLimit}`;
    totalBySource["Transport Projects"] = rows.length;
    results.push(...rows);
  }
  if (type === "all" || type === "national") {
    const rows = keyword
      ? await getSql()`SELECT *, 'National Transport' as _source FROM national_transport WHERE name ILIKE ${"%" + keyword + "%"} OR subject ILIKE ${"%" + keyword + "%"} LIMIT ${perLimit}`
      : await getSql()`SELECT *, 'National Transport' as _source FROM national_transport LIMIT ${perLimit}`;
    totalBySource["National Transport"] = rows.length;
    results.push(...rows);
  }
  if (type === "all" || type === "transit") {
    const rows = keyword
      ? await getSql()`SELECT *, 'Mass Transit TLV' as _source FROM mass_transit WHERE name ILIKE ${"%" + keyword + "%"} OR type ILIKE ${"%" + keyword + "%"} LIMIT ${perLimit}`
      : await getSql()`SELECT *, 'Mass Transit TLV' as _source FROM mass_transit LIMIT ${perLimit}`;
    totalBySource["Mass Transit TLV"] = rows.length;
    results.push(...rows);
  }

  return { results, totalBySource };
}

// --- Brokers & Appraisers ---

export async function queryBrokers({
  city,
  limit = 20,
  offset = 0,
}: {
  city?: string;
  limit?: number;
  offset?: number;
}) {
  if (city) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM brokers
      WHERE city ILIKE ${"%" + city + "%"}
      ORDER BY name
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM brokers ORDER BY name LIMIT ${limit} OFFSET ${offset}
  `;
  return formatResult(rows);
}

export async function queryAppraisers({
  city,
  limit = 20,
  offset = 0,
}: {
  city?: string;
  limit?: number;
  offset?: number;
}) {
  if (city) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM appraisers
      WHERE city ILIKE ${"%" + city + "%"}
      ORDER BY name
      LIMIT ${limit} OFFSET ${offset}
    `;
    return formatResult(rows);
  }
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM appraisers ORDER BY name LIMIT ${limit} OFFSET ${offset}
  `;
  return formatResult(rows);
}

// --- Public Housing ---

export async function queryPublicHousing({
  city,
  limit = 20,
  offset = 0,
}: {
  city?: string;
  limit?: number;
  offset?: number;
}) {
  const inventoryRows = city
    ? await getSql()`SELECT *, COUNT(*) OVER() as total_count FROM public_housing_inventory WHERE city_lms_name ILIKE ${"%" + city + "%"} LIMIT ${limit} OFFSET ${offset}`
    : await getSql()`SELECT *, COUNT(*) OVER() as total_count FROM public_housing_inventory LIMIT ${limit} OFFSET ${offset}`;

  const vacancyRows = city
    ? await getSql()`SELECT *, COUNT(*) OVER() as total_count FROM public_housing_vacancies WHERE city_lms_name ILIKE ${"%" + city + "%"} LIMIT ${limit} OFFSET ${offset}`
    : await getSql()`SELECT *, COUNT(*) OVER() as total_count FROM public_housing_vacancies LIMIT ${limit} OFFSET ${offset}`;

  return {
    inventory: formatResult(inventoryRows),
    vacancies: formatResult(vacancyRows),
  };
}

// --- Address-level queries (for searchByAddress tool) ---

export async function queryConstructionSitesByAddress({
  city,
  siteName,
  limit = 10,
}: {
  city: string;
  siteName: string;
  limit?: number;
}) {
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM active_construction
    WHERE city_name ILIKE ${"%" + city + "%"}
      AND site_name ILIKE ${"%" + siteName + "%"}
    ORDER BY work_id
    LIMIT ${limit}
  `;
  return formatResult(rows);
}

export async function queryGreenBuildingsByAddress({
  city,
  street,
  limit = 10,
}: {
  city: string;
  street: string;
  limit?: number;
}) {
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM green_buildings
    WHERE municipality_name ILIKE ${"%" + city + "%"}
      AND building_street ILIKE ${"%" + street + "%"}
    ORDER BY ckan_id
    LIMIT ${limit}
  `;
  return formatResult(rows);
}

export async function queryDevelopmentCostsByAddress({
  city,
  siteName,
  limit = 10,
}: {
  city: string;
  siteName: string;
  limit?: number;
}) {
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM development_costs
    WHERE lamas_name ILIKE ${"%" + city + "%"}
      AND atar_name ILIKE ${"%" + siteName + "%"}
    ORDER BY ckan_id
    LIMIT ${limit}
  `;
  return formatResult(rows);
}

export async function queryLotteriesByAddress({
  city,
  searchTerm,
  limit = 10,
}: {
  city: string;
  searchTerm: string;
  limit?: number;
}) {
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM lottery
    WHERE lamas_name ILIKE ${"%" + city + "%"}
      AND (project_name ILIKE ${"%" + searchTerm + "%"}
        OR neighborhood ILIKE ${"%" + searchTerm + "%"})
    ORDER BY lottery_id DESC
    LIMIT ${limit}
  `;
  return formatResult(rows);
}

// --- Helpers ---

function formatResult(rows: Record<string, unknown>[]) {
  const total = rows.length > 0 ? Number(rows[0].total_count ?? rows.length) : 0;
  const source = rows.length > 0 ? extractSource(rows[0]) : null;
  return { records: rows, total, source };
}
