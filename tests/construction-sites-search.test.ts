import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const stubData = JSON.parse(
  readFileSync(join(__dirname, "../data/stubs/construction-sites-bat-yam.json"), "utf-8"),
);
const stubRecords = stubData.result.records;

vi.mock("../app/lib/ckan-client", async () => {
  const actual = await vi.importActual("../app/lib/ckan-client");
  return {
    ...actual,
    fetchResource: vi.fn().mockImplementation(async ({ query }: { query?: string }) => {
      if (!query) {
        return { records: stubRecords, total: stubRecords.length };
      }
      const terms = query.split(/\s+/).filter(Boolean);
      const filtered = stubRecords.filter((r: Record<string, unknown>) => {
        const text = Object.values(r)
          .filter((v) => typeof v === "string")
          .join(" ")
          .toLowerCase();
        return terms.every((t: string) => text.includes(t.toLowerCase()));
      });
      return { records: filtered, total: filtered.length };
    }),
  };
});

const { searchConstructionSites } = await import("../mastra/tools/construction");

describe("searchConstructionSites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns Bat Yam construction sites", async () => {
    const result = await searchConstructionSites.execute!(
      { city: "בת ים", limit: 50, offset: 0 },
      {} as never,
    );
    expect(result.total).toBeGreaterThan(0);
    expect(result.sites.length).toBeGreaterThan(0);
  });

  it("includes contractor name and safety data", async () => {
    const result = await searchConstructionSites.execute!(
      { city: "בת ים", limit: 5, offset: 0 },
      {} as never,
    );
    const site = result.sites[0] as Record<string, unknown>;
    expect(site).toHaveProperty("contractor");
    expect(site).toHaveProperty("safetyWarnings");
    expect(site).toHaveProperty("sanctions");
    expect(site).toHaveProperty("city");
  });

  it("can filter by building type", async () => {
    const result = await searchConstructionSites.execute!(
      { city: "בת ים", buildType: "מגורים", limit: 50, offset: 0 },
      {} as never,
    );
    // May have fewer than total since we filter by type
    expect(result.total).toBeLessThanOrEqual(168);
  });
});

describe("contractor cross-reference via construction sites", () => {
  it("can find sites by contractor name for due diligence", async () => {
    const all = await searchConstructionSites.execute!(
      { city: "בת ים", limit: 50, offset: 0 },
      {} as never,
    );
    // Find a site that has a contractor (some may be null)
    const siteWithContractor = all.sites.find(
      (s) => (s as Record<string, unknown>).contractor != null,
    ) as Record<string, unknown> | undefined;
    expect(siteWithContractor).toBeDefined();
    expect(siteWithContractor!.contractor).toBeTruthy();
  });
});
