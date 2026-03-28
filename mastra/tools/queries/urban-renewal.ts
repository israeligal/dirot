/**
 * Urban renewal (Pinui Binui) database queries.
 */

import { getSql, formatResult } from "./shared";

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
