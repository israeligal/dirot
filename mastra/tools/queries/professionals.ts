/**
 * Brokers and appraisers database queries.
 */

import { getSql, formatResult } from "./shared";

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
