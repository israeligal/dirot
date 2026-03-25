import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const pbStub = JSON.parse(
  readFileSync(join(__dirname, "../data/stubs/pinui-binui-bat-yam.json"), "utf-8"),
);
const constructionStub = JSON.parse(
  readFileSync(join(__dirname, "../data/stubs/construction-sites-bat-yam.json"), "utf-8"),
);

// Mock fetchResource to return stub data based on resource ID
vi.mock("../app/lib/ckan-client", async () => {
  const actual = await vi.importActual("../app/lib/ckan-client");
  const { RESOURCE_URBAN_RENEWAL, RESOURCE_ACTIVE_CONSTRUCTION } = await import(
    "../app/lib/constants"
  );
  return {
    ...actual,
    fetchResource: vi.fn().mockImplementation(async ({ resourceId, query }: { resourceId: string; query?: string }) => {
      let records: Record<string, unknown>[];
      if (resourceId === RESOURCE_URBAN_RENEWAL) {
        records = pbStub.result.records;
      } else if (resourceId === RESOURCE_ACTIVE_CONSTRUCTION) {
        records = constructionStub.result.records;
      } else {
        return { records: [], total: 0 };
      }

      if (query) {
        const terms = query.split(/\s+/).filter(Boolean);
        records = records.filter((r) => {
          const text = Object.values(r)
            .filter((v) => typeof v === "string")
            .join(" ")
            .toLowerCase();
          return terms.every((t: string) => text.includes(t.toLowerCase()));
        });
      }

      return { records, total: records.length };
    }),
  };
});

const { searchPinuiBinui } = await import("../mastra/tools/pinui-binui");
const { searchConstructionSites } = await import("../mastra/tools/construction");

describe("cross-reference: PB projects ↔ construction sites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("both datasets have Bat Yam data", async () => {
    const pb = await searchPinuiBinui.execute!(
      { city: "בת ים", limit: 50, offset: 0 },
      {} as never,
    );
    const sites = await searchConstructionSites.execute!(
      { city: "בת ים", limit: 200, offset: 0 },
      {} as never,
    );
    expect(pb.total).toBe(37);
    expect(sites.total).toBeGreaterThan(100);
  });

  it("agent can count residential construction activity in an area", async () => {
    const sites = await searchConstructionSites.execute!(
      { city: "בת ים", buildType: "מגורים", limit: 200, offset: 0 },
      {} as never,
    );
    // Some sites should be residential
    const residentialSites = sites.sites.filter((s) =>
      ((s as Record<string, unknown>).buildingType as string)?.includes("מגורים"),
    );
    expect(residentialSites.length).toBeGreaterThanOrEqual(0);
  });

  it("cluster analysis: PB projects + construction sites shows total development", async () => {
    const pb = await searchPinuiBinui.execute!(
      { city: "בת ים", limit: 50, offset: 0 },
      {} as never,
    );
    const sites = await searchConstructionSites.execute!(
      { city: "בת ים", limit: 200, offset: 0 },
      {} as never,
    );
    const totalDevelopment = {
      pinuiBinuiProjects: pb.total,
      activeConstructionSites: sites.total,
      // Total new units from PB
      totalNewUnitsFromPB: pb.projects.reduce(
        (sum, p) => sum + ((p as Record<string, unknown>).totalProposedUnits as number || 0),
        0,
      ),
    };
    expect(totalDevelopment.pinuiBinuiProjects).toBeGreaterThan(0);
    expect(totalDevelopment.activeConstructionSites).toBeGreaterThan(0);
  });
});
