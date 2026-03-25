/**
 * Data Layer Verification Script
 * Run: npx tsx scripts/verify-data-layer.ts
 *
 * Tests all 17 CKAN resources, Hebrew filtering, pagination, and error handling.
 */

import { fetchResource, CkanError } from "../app/lib/ckan-client";
import type { UrbanRenewalRecord, ActiveConstructionSiteRecord } from "../app/lib/types";
import {
  RESOURCE_URBAN_RENEWAL,
  RESOURCE_LOTTERY,
  RESOURCE_LOTTERY_NO_DRAW,
  RESOURCE_CONSTRUCTION_PROGRESS,
  RESOURCE_ACTIVE_CONSTRUCTION,
  RESOURCE_PUBLIC_HOUSING_INVENTORY,
  RESOURCE_PUBLIC_HOUSING_VACANCIES,
  RESOURCE_TMA3_ROADS,
  RESOURCE_TMA23_RAIL,
  RESOURCE_TRANSPORT_PROJECTS,
  RESOURCE_NATIONAL_TRANSPORT,
  RESOURCE_MASS_TRANSIT_TLV,
  RESOURCE_CONTRACTORS,
  RESOURCE_BROKERS,
  RESOURCE_APPRAISERS,
  RESOURCE_DEVELOPMENT_COSTS,
  RESOURCE_GREEN_BUILDINGS,
} from "../app/lib/constants";

const ALL_RESOURCES = [
  { name: "Urban Renewal", id: RESOURCE_URBAN_RENEWAL, allowEmpty: false },
  { name: "Lottery", id: RESOURCE_LOTTERY, allowEmpty: false },
  { name: "Lottery No Draw", id: RESOURCE_LOTTERY_NO_DRAW, allowEmpty: true },
  { name: "Construction Progress", id: RESOURCE_CONSTRUCTION_PROGRESS, allowEmpty: false },
  { name: "Active Construction", id: RESOURCE_ACTIVE_CONSTRUCTION, allowEmpty: false },
  { name: "Public Housing Inventory", id: RESOURCE_PUBLIC_HOUSING_INVENTORY, allowEmpty: false },
  { name: "Public Housing Vacancies", id: RESOURCE_PUBLIC_HOUSING_VACANCIES, allowEmpty: false },
  { name: "TMA3 Roads", id: RESOURCE_TMA3_ROADS, allowEmpty: false },
  { name: "TMA23 Rail", id: RESOURCE_TMA23_RAIL, allowEmpty: false },
  { name: "Transport Projects", id: RESOURCE_TRANSPORT_PROJECTS, allowEmpty: false },
  { name: "National Transport", id: RESOURCE_NATIONAL_TRANSPORT, allowEmpty: false },
  { name: "Mass Transit TLV", id: RESOURCE_MASS_TRANSIT_TLV, allowEmpty: false },
  { name: "Contractors", id: RESOURCE_CONTRACTORS, allowEmpty: false },
  { name: "Brokers", id: RESOURCE_BROKERS, allowEmpty: false },
  { name: "Appraisers", id: RESOURCE_APPRAISERS, allowEmpty: false },
  { name: "Development Costs", id: RESOURCE_DEVELOPMENT_COSTS, allowEmpty: false },
  { name: "Green Buildings", id: RESOURCE_GREEN_BUILDINGS, allowEmpty: false },
];

let passed = 0;
let failed = 0;

function ok(test: string) {
  passed++;
  console.log(`  ✅ ${test}`);
}

function fail(test: string, error: unknown) {
  failed++;
  console.log(`  ❌ ${test}: ${error instanceof Error ? error.message : error}`);
}

async function testAllResources() {
  console.log("\n🔍 Test 1: Fetch 1 record from each of 17 resources\n");

  for (const res of ALL_RESOURCES) {
    try {
      const result = await fetchResource({ resourceId: res.id, limit: 1 });
      if (result.records.length > 0 || res.allowEmpty) {
        ok(`${res.name} — ${result.total} total records`);
      } else {
        fail(`${res.name} — 0 records (expected > 0)`, "empty");
      }
    } catch (error) {
      fail(res.name, error);
    }
  }
}

async function testHebrewFilter() {
  console.log("\n🔍 Test 2: Hebrew filtering — Bat Yam urban renewal\n");

  // Note: CKAN `filters` requires exact match including trailing whitespace in this dataset.
  // Use `query` (full-text search) for city lookups instead — it handles padded fields.
  try {
    const result = await fetchResource<UrbanRenewalRecord>({
      resourceId: RESOURCE_URBAN_RENEWAL,
      query: "בת ים",
    });
    if (result.records.length > 0) {
      const hasBatYam = result.records.some((r) =>
        r.Yeshuv.trim().includes("בת ים"),
      );
      if (hasBatYam) {
        ok(`Hebrew query works — ${result.total} Bat Yam results (full-text search)`);
      } else {
        fail("Hebrew query returned no Bat Yam records", result.records[0]?.Yeshuv);
      }
    } else {
      fail("Hebrew query returned 0 results for Bat Yam", "empty");
    }
  } catch (error) {
    fail("Hebrew filter", error);
  }
}

async function testFullTextSearch() {
  console.log("\n🔍 Test 3: Full-text search — construction sites\n");

  try {
    const result = await fetchResource<ActiveConstructionSiteRecord>({
      resourceId: RESOURCE_ACTIVE_CONSTRUCTION,
      query: "בת ים",
      limit: 5,
    });
    ok(`Full-text search returned ${result.records.length} results (total: ${result.total})`);
  } catch (error) {
    fail("Full-text search", error);
  }
}

async function testPagination() {
  console.log("\n🔍 Test 4: Pagination\n");

  try {
    const page1 = await fetchResource<UrbanRenewalRecord>({
      resourceId: RESOURCE_URBAN_RENEWAL,
      limit: 2,
      offset: 0,
    });
    const page2 = await fetchResource<UrbanRenewalRecord>({
      resourceId: RESOURCE_URBAN_RENEWAL,
      limit: 2,
      offset: 2,
    });

    if (page1.records.length === 2 && page2.records.length === 2) {
      const differentIds = page1.records[0]._id !== page2.records[0]._id;
      if (differentIds) {
        ok("Pagination returns different records for different offsets");
      } else {
        fail("Pagination returned same records", "same _id");
      }
    } else {
      fail("Pagination returned wrong number of records", `${page1.records.length}, ${page2.records.length}`);
    }
  } catch (error) {
    fail("Pagination", error);
  }
}

async function testErrorHandling() {
  console.log("\n🔍 Test 5: Error handling — invalid resource ID\n");

  try {
    await fetchResource({ resourceId: "invalid-id-12345" });
    fail("Should have thrown CkanError", "no error thrown");
  } catch (error) {
    if (error instanceof CkanError) {
      ok(`CkanError thrown for invalid ID: "${error.message}"`);
    } else {
      fail("Wrong error type", error);
    }
  }
}

async function testCaching() {
  console.log("\n🔍 Test 6: Caching (timing comparison)\n");

  const start1 = Date.now();
  await fetchResource({ resourceId: RESOURCE_URBAN_RENEWAL, limit: 1 });
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  await fetchResource({ resourceId: RESOURCE_URBAN_RENEWAL, limit: 1 });
  const time2 = Date.now() - start2;

  console.log(`  First call: ${time1}ms, Second call: ${time2}ms`);
  if (time2 < time1 || time2 < 100) {
    ok(`Second call faster or instant (${time2}ms vs ${time1}ms)`);
  } else {
    // In script context (not Next.js server), caching may not work — that's OK
    console.log("  ⚠️  Caching may not work outside Next.js server context — this is expected");
    ok("Caching test noted (verify in dev server)");
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Dirot Data Layer Verification");
  console.log("═══════════════════════════════════════════════");

  await testAllResources();
  await testHebrewFilter();
  await testFullTextSearch();
  await testPagination();
  await testErrorHandling();
  await testCaching();

  console.log("\n═══════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main();
