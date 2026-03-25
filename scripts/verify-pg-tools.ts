import { config } from "dotenv";
config({ path: ".env.local" });

import { searchPinuiBinui } from "../mastra/tools/pinui-binui";
import { searchConstructionSites } from "../mastra/tools/construction";
import { searchLotteries } from "../mastra/tools/lotteries";
import { searchInfrastructure } from "../mastra/tools/infrastructure";
import { searchContractors } from "../mastra/tools/professionals";
import { searchPublicHousing } from "../mastra/tools/public-housing";

let passed = 0;
let failed = 0;

async function run(name: string, fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    const r = result as Record<string, unknown>;
    const summary = r.summary as string ?? "";
    const sources = (r.sources as unknown[])?.length ?? 0;
    passed++;
    console.log(`  ✅ ${name}`);
    console.log(`     ${summary}`);
    if (sources > 0) console.log(`     📋 ${sources} source citation(s)`);
  } catch (error) {
    failed++;
    console.log(`  ❌ ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Dirot PG-Based Tools Verification");
  console.log("═══════════════════════════════════════════════\n");

  await run("searchPinuiBinui (Bat Yam)", () =>
    searchPinuiBinui.execute!({ city: "בת ים", limit: 3, offset: 0 }, {} as never));

  await run("searchPinuiBinui (fuzzy neighborhood: יוספטל)", () =>
    searchPinuiBinui.execute!({ neighborhood: "יוספטל", limit: 3, offset: 0 }, {} as never));

  await run("searchConstructionSites (Bat Yam)", () =>
    searchConstructionSites.execute!({ city: "בת ים", limit: 3, offset: 0 }, {} as never));

  await run("searchLotteries (Bat Yam)", () =>
    searchLotteries.execute!({ city: "בת ים", limit: 3, offset: 0 }, {} as never));

  await run("searchInfrastructure (all)", () =>
    searchInfrastructure.execute!({ type: "all", limit: 6 }, {} as never));

  await run("searchInfrastructure (transit: קו אדום)", () =>
    searchInfrastructure.execute!({ type: "transit", keyword: "אדום", limit: 5 }, {} as never));

  await run("searchContractors (fuzzy name: רובין)", () =>
    searchContractors.execute!({ name: "רובין", limit: 3, offset: 0 }, {} as never));

  await run("searchPublicHousing (Bat Yam)", () =>
    searchPublicHousing.execute!({ city: "בת ים", limit: 3, offset: 0 }, {} as never));

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`═══════════════════════════════════════════════\n`);

  if (failed > 0) process.exit(1);
}

main();
