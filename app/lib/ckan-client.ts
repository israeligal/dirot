import { CKAN_BASE_URL, FETCH_TIMEOUT_MS, MAX_LIMIT } from "./constants";

export interface CkanResponse<T> {
  records: T[];
  total: number;
}

export class CkanError extends Error {
  constructor(
    message: string,
    public readonly resourceId: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "CkanError";
  }
}

export async function fetchResource<T>({
  resourceId,
  filters,
  query,
  sort,
  limit = 100,
  offset = 0,
}: {
  resourceId: string;
  filters?: Record<string, string | number>;
  query?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<CkanResponse<T>> {
  const cappedLimit = Math.min(limit, MAX_LIMIT);

  const params = new URLSearchParams({
    resource_id: resourceId,
    limit: String(cappedLimit),
    offset: String(offset),
  });

  if (filters) {
    params.set("filters", JSON.stringify(filters));
  }
  if (query) {
    params.set("q", query);
  }
  if (sort) {
    params.set("sort", sort);
  }

  const url = `${CKAN_BASE_URL}/datastore_search?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CkanError(
        `Request timed out after ${FETCH_TIMEOUT_MS}ms`,
        resourceId,
        408,
      );
    }
    throw new CkanError(
      `Network error: ${error instanceof Error ? error.message : "Unknown"}`,
      resourceId,
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new CkanError(
      `HTTP ${response.status}: ${response.statusText}`,
      resourceId,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CkanError("Invalid JSON response", resourceId, response.status);
  }

  const parsed = body as {
    success?: boolean;
    result?: { records?: T[]; total?: number };
    error?: { message?: string };
  };

  if (!parsed.success) {
    throw new CkanError(
      parsed.error?.message ?? "CKAN returned success: false",
      resourceId,
      response.status,
    );
  }

  if (!parsed.result || !Array.isArray(parsed.result.records)) {
    throw new CkanError("Malformed CKAN response", resourceId, response.status);
  }

  return {
    records: parsed.result.records,
    total: parsed.result.total ?? 0,
  };
}
