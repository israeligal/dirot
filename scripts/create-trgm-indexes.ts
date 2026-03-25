import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Creating GIN trigram indexes...\n");

  // Urban Renewal
  await sql`CREATE INDEX IF NOT EXISTS idx_ur_yeshuv_trgm ON urban_renewal USING gin (yeshuv gin_trgm_ops)`;
  console.log("  ✅ urban_renewal.yeshuv");
  await sql`CREATE INDEX IF NOT EXISTS idx_ur_shem_mitcham_trgm ON urban_renewal USING gin (shem_mitcham gin_trgm_ops)`;
  console.log("  ✅ urban_renewal.shem_mitcham");

  // Active Construction
  await sql`CREATE INDEX IF NOT EXISTS idx_ac_city_trgm ON active_construction USING gin (city_name gin_trgm_ops)`;
  console.log("  ✅ active_construction.city_name");
  await sql`CREATE INDEX IF NOT EXISTS idx_ac_executor_trgm ON active_construction USING gin (executor_name gin_trgm_ops)`;
  console.log("  ✅ active_construction.executor_name");

  // Contractors
  await sql`CREATE INDEX IF NOT EXISTS idx_con_shem_trgm ON contractors USING gin (shem_yeshut gin_trgm_ops)`;
  console.log("  ✅ contractors.shem_yeshut");
  await sql`CREATE INDEX IF NOT EXISTS idx_con_city_trgm ON contractors USING gin (shem_yishuv gin_trgm_ops)`;
  console.log("  ✅ contractors.shem_yishuv");

  // Lottery
  await sql`CREATE INDEX IF NOT EXISTS idx_lot_lamas_trgm ON lottery USING gin (lamas_name gin_trgm_ops)`;
  console.log("  ✅ lottery.lamas_name");
  await sql`CREATE INDEX IF NOT EXISTS idx_lot_neighborhood_trgm ON lottery USING gin (neighborhood gin_trgm_ops)`;
  console.log("  ✅ lottery.neighborhood");

  // Brokers
  await sql`CREATE INDEX IF NOT EXISTS idx_br_city_trgm ON brokers USING gin (city gin_trgm_ops)`;
  console.log("  ✅ brokers.city");
  await sql`CREATE INDEX IF NOT EXISTS idx_br_name_trgm ON brokers USING gin (name gin_trgm_ops)`;
  console.log("  ✅ brokers.name");

  // Appraisers
  await sql`CREATE INDEX IF NOT EXISTS idx_ap_city_trgm ON appraisers USING gin (city gin_trgm_ops)`;
  console.log("  ✅ appraisers.city");

  // Construction Progress
  await sql`CREATE INDEX IF NOT EXISTS idx_cp_yeshuv_trgm ON construction_progress USING gin (yeshuv_lamas gin_trgm_ops)`;
  console.log("  ✅ construction_progress.yeshuv_lamas");

  // Transport
  await sql`CREATE INDEX IF NOT EXISTS idx_tp_name_trgm ON transport_projects USING gin (prj_name gin_trgm_ops)`;
  console.log("  ✅ transport_projects.prj_name");
  await sql`CREATE INDEX IF NOT EXISTS idx_nt_name_trgm ON national_transport USING gin (name gin_trgm_ops)`;
  console.log("  ✅ national_transport.name");
  await sql`CREATE INDEX IF NOT EXISTS idx_mt_name_trgm ON mass_transit USING gin (name gin_trgm_ops)`;
  console.log("  ✅ mass_transit.name");

  console.log("\nDone — 15 GIN trigram indexes created.");
}

main().catch(console.error);
