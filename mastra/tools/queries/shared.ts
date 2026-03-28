/**
 * Shared database helpers: connection, result formatting, source extraction.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql() {
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

export function formatResult(rows: Record<string, unknown>[]) {
  const total = rows.length > 0 ? Number(rows[0].total_count ?? rows.length) : 0;
  const source = rows.length > 0 ? extractSource(rows[0]) : null;
  return { records: rows, total, source };
}
