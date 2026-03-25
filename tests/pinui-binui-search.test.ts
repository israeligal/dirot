import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Load real stub data
const stubData = JSON.parse(
  readFileSync(join(__dirname, "../data/stubs/pinui-binui-bat-yam.json"), "utf-8"),
);
const stubRecords = stubData.result.records;

// Mock the fetch to return stub data
vi.mock("../app/lib/ckan-client", async () => {
  const actual = await vi.importActual("../app/lib/ckan-client");
  return {
    ...actual,
    fetchResource: vi.fn().mockImplementation(async ({ query }: { query?: string }) => {
      if (!query) {
        return { records: stubRecords, total: stubRecords.length };
      }

      // Simulate CKAN full-text search behavior
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

// Import AFTER mock setup
const { searchPinuiBinui } = await import("../mastra/tools/pinui-binui");

describe("searchPinuiBinui", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all Bat Yam projects when searching by city", async () => {
    const result = await searchPinuiBinui.execute!(
      { city: "בת ים", limit: 50, offset: 0 },
      {} as never,
    );
    expect(result.total).toBe(37);
    expect(result.projects.length).toBe(37);
  });

  it("returns projects with trimmed fields", async () => {
    const result = await searchPinuiBinui.execute!(
      { city: "בת ים", limit: 5, offset: 0 },
      {} as never,
    );
    const project = result.projects[0] as Record<string, unknown>;
    // City should be trimmed (no trailing whitespace)
    expect((project.city as string).length).toBeLessThan(50);
    expect((project.city as string).trim()).toBe(project.city);
  });

  it("returns projects with GovMap links (fallback when empty)", async () => {
    const result = await searchPinuiBinui.execute!(
      { city: "בת ים", limit: 50, offset: 0 },
      {} as never,
    );
    for (const project of result.projects) {
      const p = project as Record<string, unknown>;
      expect(p.govMapLink).toBeTruthy();
      expect(typeof p.govMapLink).toBe("string");
    }
  });

  it("includes summary with result count", async () => {
    const result = await searchPinuiBinui.execute!(
      { city: "בת ים", limit: 5, offset: 0 },
      {} as never,
    );
    expect(result.summary).toContain("בת ים");
    expect(result.summary).toContain("37");
  });

  it("returns parsed numeric unit counts", async () => {
    const result = await searchPinuiBinui.execute!(
      { city: "בת ים", limit: 5, offset: 0 },
      {} as never,
    );
    const project = result.projects[0] as Record<string, unknown>;
    expect(typeof project.existingUnits).toBe("number");
    expect(typeof project.additionalUnits).toBe("number");
  });
});

describe("neighborhood search behavior", () => {
  it("searching 'בת ים' returns all 37 projects (user can browse neighborhoods)", async () => {
    const result = await searchPinuiBinui.execute!(
      { city: "בת ים", limit: 50, offset: 0 },
      {} as never,
    );
    expect(result.total).toBe(37);
  });

  it("searching 'יוספטל' returns projects with יוספטל in any field", async () => {
    const result = await searchPinuiBinui.execute!(
      { neighborhood: "יוספטל", limit: 50, offset: 0 },
      {} as never,
    );
    expect(result.total).toBeGreaterThan(0);
    for (const p of result.projects) {
      const project = p as Record<string, unknown>;
      const neighborhood = project.neighborhood as string;
      expect(neighborhood.toLowerCase()).toContain("יוספטל");
    }
  });

  it("searching city + neighborhood narrows results", async () => {
    const cityOnly = await searchPinuiBinui.execute!(
      { city: "בת ים", limit: 50, offset: 0 },
      {} as never,
    );
    const cityAndNeighborhood = await searchPinuiBinui.execute!(
      { city: "בת ים", neighborhood: "בלפור", limit: 50, offset: 0 },
      {} as never,
    );
    expect(cityAndNeighborhood.total).toBeLessThan(cityOnly.total);
    expect(cityAndNeighborhood.total).toBeGreaterThan(0);
  });
});
