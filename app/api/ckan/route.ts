import { NextResponse } from "next/server";
import { fetchResource, CkanError } from "@/app/lib/ckan-client";
import { VALID_RESOURCE_IDS } from "@/app/lib/constants";

// Exception to RORO: Next.js route handlers require positional signature
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const resourceId = searchParams.get("resource_id");
  if (!resourceId) {
    return NextResponse.json(
      { error: "resource_id query parameter is required" },
      { status: 400 },
    );
  }

  if (!VALID_RESOURCE_IDS.has(resourceId)) {
    return NextResponse.json(
      { error: "Invalid resource_id" },
      { status: 400 },
    );
  }

  const filtersParam = searchParams.get("filters");
  const filters = filtersParam ? JSON.parse(filtersParam) : undefined;
  const query = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;
  const offset = searchParams.get("offset")
    ? Number(searchParams.get("offset"))
    : undefined;

  try {
    const result = await fetchResource({
      resourceId,
      filters,
      query,
      sort,
      limit,
      offset,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CkanError) {
      return NextResponse.json(
        { error: error.message, resourceId: error.resourceId },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
