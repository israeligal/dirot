import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("\n📊 Database Row Counts:\n");

  const result = await sql`
    SELECT schemaname, relname as table_name, n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY relname
  `;

  for (const row of result) {
    console.log(`  ${row.table_name}: ${row.row_count} rows`);
  }
}

main().catch(console.error);
