/**
 * Initialize Database
 * Run: npx tsx scripts/init-db.ts
 *
 * Enables pg_trgm + vector extensions and pushes Drizzle schema to Neon.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

async function main() {
  const sql = neon(databaseUrl!);

  console.log("Enabling PostgreSQL extensions...");

  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
  console.log("  ✅ pg_trgm enabled (fuzzy text search)");

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log("  ✅ pgvector enabled (vector similarity)");
  } catch (error) {
    console.log("  ⚠️  pgvector not available on this Neon plan — skipping");
  }

  console.log("\nPushing schema via drizzle-kit...");
  console.log("Run: npx drizzle-kit push");
}

main().catch(console.error);
