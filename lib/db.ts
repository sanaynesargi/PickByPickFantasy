import { sql } from "drizzle-orm";
import * as schema from "./schema";

// A single Drizzle instance shared across API routes. We pick the driver at
// runtime: Neon Postgres in production (DATABASE_URL set, as injected by the
// Vercel Neon integration) and an embedded PGlite Postgres locally so the demo
// runs with zero infrastructure.
type DrizzleDb = Awaited<ReturnType<typeof createDb>>;

declare global {
  // eslint-disable-next-line no-var
  var __pfpDb: Promise<DrizzleDb> | undefined;
}

async function createDb() {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    const { Pool } = await import("@neondatabase/serverless");
    const pool = new Pool({ connectionString: url });
    return drizzle(pool, { schema });
  }

  // Local fallback: embedded Postgres, persisted so data survives restarts.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite("./.pglite");
  return drizzle(client, { schema });
}

async function init() {
  const db = await createDb();
  // Idempotent schema creation keeps first-run setup simple without a
  // separate migration step. Safe to run on every cold start.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL DEFAULT '',
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      ties INTEGER NOT NULL DEFAULT 0,
      points_for DOUBLE PRECISION NOT NULL DEFAULT 0,
      points_against DOUBLE PRECISION NOT NULL DEFAULT 0,
      finish_rank INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Migrations for databases created before these columns existed.
  await db.execute(sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS owner TEXT NOT NULL DEFAULT '';`);
  await db.execute(sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS points_for DOUBLE PRECISION NOT NULL DEFAULT 0;`);
  await db.execute(sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS points_against DOUBLE PRECISION NOT NULL DEFAULT 0;`);
  await db.execute(sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS finish_rank INTEGER NOT NULL DEFAULT 0;`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS picks (
      id SERIAL PRIMARY KEY,
      pick_number INTEGER NOT NULL UNIQUE,
      team_id INTEGER NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  return db;
}

export function getDb() {
  if (!globalThis.__pfpDb) {
    globalThis.__pfpDb = init();
  }
  return globalThis.__pfpDb;
}
