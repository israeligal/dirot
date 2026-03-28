/**
 * Infrastructure queries: roads, rail, transit, transport projects, national plans.
 */

import { getSql } from "./shared";

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
