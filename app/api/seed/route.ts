import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { teams as teamsTable, picks as picksTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

const DEMO_TEAMS = [
  { name: "The Gridiron Gurus", wins: 11, losses: 3, ties: 0 },
  { name: "Purple Cobras", wins: 10, losses: 4, ties: 0 },
  { name: "End Zone Enforcers", wins: 9, losses: 5, ties: 0 },
  { name: "Hail Mary Heroes", wins: 8, losses: 6, ties: 0 },
  { name: "Fourth & Long", wins: 7, losses: 7, ties: 0 },
  { name: "Blitz Brigade", wins: 6, losses: 8, ties: 0 },
  { name: "Pocket Protectors", wins: 4, losses: 9, ties: 1 },
  { name: "Toilet Bowl Tenants", wins: 2, losses: 12, ties: 0 },
];

// Reset to a clean 8-team demo league (wipes existing teams & picks).
export async function POST() {
  const db = await getDb();
  await db.delete(picksTable);
  await db.delete(teamsTable);
  await db.insert(teamsTable).values(DEMO_TEAMS);
  return NextResponse.json({ ok: true, count: DEMO_TEAMS.length });
}
