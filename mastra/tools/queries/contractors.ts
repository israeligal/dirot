/**
 * Registered contractors database queries (pg_trgm fuzzy search).
 */

import { getSql, formatResult } from "./shared";

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
