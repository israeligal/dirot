/**
 * Agent Tools Verification Script
 * Run: npx tsx scripts/verify-agent-tools.ts
 */

import { searchPinuiBinui } from "../mastra/tools/pinui-binui";
import { searchConstructionSites, searchConstructionProgress } from "../mastra/tools/construction";
import { searchLotteries } from "../mastra/tools/lotteries";
import { searchInfrastructure } from "../mastra/tools/infrastructure";
import { searchContractors, searchBrokersAndAppraisers } from "../mastra/tools/professionals";
import { searchPublicHousing } from "../mastra/tools/public-housing";

let passed = 0;
let failed = 0;

function ok(test: string, detail?: string) {
  passed++;
  console.log(`  ✅ ${test}${detail ? ` — ${detail}` : ""}`);
}

function fail(test: string, error: unknown) {
  failed++;
  console.log(`  ❌ ${test}: ${error instanceof Error ? error.message : error}`);
}

async function run(name: string, fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    const summary = (result as { summary?: string })?.summary ?? JSON.stringify(result).slice(0, 100);
    ok(name, summary);
  } catch (error) {
    fail(name, error);
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Dirot Agent Tools Verification");
  console.log("═══════════════════════════════════════════════\n");

  await run("searchPinuiBinui (Bat Yam)", () =>
    searchPinuiBinui.execute!({ city: "בת ים", limit: 3, offset: 0 }, {} as never),
  );

  await run("searchPinuiBinui (Ramat HaNassi)", () =>
    searchPinuiBinui.execute!({ city: "בת ים", neighborhood: "רמת הנשיא", limit: 3, offset: 0 }, {} as never),
  );

  await run("searchConstructionSites (Bat Yam)", () =>
    searchConstructionSites.execute!({ city: "בת ים", limit: 3, offset: 0 }, {} as never),
  );

  await run("searchConstructionProgress (Bat Yam)", () =>
    searchConstructionProgress.execute!({ city: "בת ים", limit: 3, offset: 0 }, {} as never),
  );

  await run("searchLotteries (Bat Yam)", () =>
    searchLotteries.execute!({ city: "בת ים", limit: 3, offset: 0 }, {} as never),
  );

  await run("searchInfrastructure (all)", () =>
    searchInfrastructure.execute!({ type: "all", limit: 6 }, {} as never),
  );

  await run("searchInfrastructure (transit, keyword: בת ים)", () =>
    searchInfrastructure.execute!({ type: "transit", keyword: "בת ים", limit: 5 }, {} as never),
  );

  await run("searchContractors (partial name)", () =>
    searchContractors.execute!({ name: "רובין", limit: 3, offset: 0 }, {} as never),
  );

  await run("searchBrokersAndAppraisers (broker, Bat Yam)", () =>
    searchBrokersAndAppraisers.execute!({ type: "broker", city: "בת ים", limit: 3, offset: 0 }, {} as never),
  );

  await run("searchBrokersAndAppraisers (appraiser)", () =>
    searchBrokersAndAppraisers.execute!({ type: "appraiser", limit: 3, offset: 0 }, {} as never),
  );

  await run("searchPublicHousing (Bat Yam)", () =>
    searchPublicHousing.execute!({ city: "בת ים", limit: 3, offset: 0 }, {} as never),
  );

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`═══════════════════════════════════════════════\n`);

  if (failed > 0) process.exit(1);
}

main();
