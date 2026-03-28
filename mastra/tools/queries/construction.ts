/**
 * Active construction sites and construction progress queries.
 */

import { getSql, formatResult } from "./shared";

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

export async function queryConstructionSitesByDeveloper({
  name,
  city,
  limit = 20,
}: {
  name: string;
  city?: string;
  limit?: number;
}) {
  if (city) {
    const rows = await getSql()`
      SELECT *, COUNT(*) OVER() as total_count
      FROM active_construction
      WHERE executor_name ILIKE ${"%" + name + "%"}
        AND city_name ILIKE ${"%" + city + "%"}
      ORDER BY work_id
      LIMIT ${limit}
    `;
    return formatResult(rows);
  }
  const rows = await getSql()`
    SELECT *, COUNT(*) OVER() as total_count
    FROM active_construction
    WHERE executor_name ILIKE ${"%" + name + "%"}
    ORDER BY work_id
    LIMIT ${limit}
  `;
  return formatResult(rows);
}

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
