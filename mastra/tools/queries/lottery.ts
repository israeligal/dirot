/**
 * Dira BeHanacha lottery database queries.
 */

import { getSql, formatResult } from "./shared";

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
