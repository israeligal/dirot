import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const transitStub = JSON.parse(
  readFileSync(join(__dirname, "../data/stubs/mass-transit-tlv-2050.json"), "utf-8"),
);

vi.mock("../app/lib/ckan-client", async () => {
  const actual = await vi.importActual("../app/lib/ckan-client");
  return {
    ...actual,
    fetchResource: vi.fn().mockImplementation(async ({ resourceId, query }: { resourceId: string; query?: string }) => {
      // Return transit stub for mass transit resource
      if (resourceId === "bd11e899-65c0-43aa-8264-c07434da22aa") {
        const records = transitStub.result.records;
        if (!query) return { records, total: records.length };
        const terms = query.split(/\s+/).filter(Boolean);
        const filtered = records.filter((r: Record<string, unknown>) => {
          const text = Object.values(r)
            .filter((v) => typeof v === "string")
            .join(" ")
            .toLowerCase();
          return terms.some((t: string) => text.includes(t.toLowerCase()));
        });
        return { records: filtered, total: filtered.length };
      }
      // Other resources return empty for now
      return { records: [], total: 0 };
    }),
  };
});

const { searchInfrastructure } = await import("../mastra/tools/infrastructure");

describe("searchInfrastructure", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns transit data when type=transit", async () => {
    const result = await searchInfrastructure.execute!(
      { type: "transit", limit: 50 },
      {} as never,
    );
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.totalBySource).toHaveProperty("Tel Aviv Mass Transit 2050");
  });

  it("returns all types when type=all", async () => {
    const result = await searchInfrastructure.execute!(
      { type: "all", limit: 50 },
      {} as never,
    );
    // Should have transit results at minimum
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("can search transit by line name (not city)", async () => {
    const result = await searchInfrastructure.execute!(
      { type: "transit", keyword: "אדום", limit: 50 },
      {} as never,
    );
    expect(result.results.length).toBeGreaterThan(0);
    const hasRedLine = result.results.some((r) =>
      (r.name as string)?.includes("אדום"),
    );
    expect(hasRedLine).toBe(true);
  });

  it("transit results include type (LRT/BRT/Metro)", async () => {
    const result = await searchInfrastructure.execute!(
      { type: "transit", limit: 10 },
      {} as never,
    );
    const first = result.results[0] as Record<string, unknown>;
    expect(first).toHaveProperty("type");
    expect(["LRT", "BRT", "Metro"]).toContain(first.type);
  });
});

describe("mass transit data in repo", () => {
  it("stub data has all 32 transit records", () => {
    expect(transitStub.result.total).toBe(32);
    expect(transitStub.result.records.length).toBe(32);
  });

  it("includes LRT, BRT, and Metro types", () => {
    const types = new Set(
      transitStub.result.records.map((r: Record<string, unknown>) =>
        (r.TYPE as string)?.trim(),
      ),
    );
    expect(types.has("LRT")).toBe(true);
    expect(types.has("BRT")).toBe(true);
    expect(types.has("Metro")).toBe(true);
  });
});
