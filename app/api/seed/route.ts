import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { teams as teamsTable, picks as picksTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

// "No Punt Intended" — 2025 final regular-season standings (ESPN export).
// finishRank is the real standing (ESPN has no points-for to tie-break the
// five 7-7 teams, so we store the order directly). The draft reverses it.
const LEAGUE_TEAMS = [
  { name: "Teeth", owner: "Viraaj", wins: 9, losses: 5, ties: 0, finishRank: 1 },
  { name: "Dat N*bba", owner: "Ahan", wins: 8, losses: 6, ties: 0, finishRank: 2 },
  { name: "Saquons Big Fat Brock", owner: "Arav", wins: 8, losses: 6, ties: 0, finishRank: 3 },
  { name: "Chris olave", owner: "Charles", wins: 7, losses: 7, ties: 0, finishRank: 4 },
  { name: "Mr. Morningstar", owner: "Sanay", wins: 7, losses: 7, ties: 0, finishRank: 5 },
  { name: "Lil Fetus Fantasy", owner: "Sami", wins: 7, losses: 7, ties: 0, finishRank: 6 },
  { name: "Last Place Race", owner: "Cyrus", wins: 7, losses: 7, ties: 0, finishRank: 7 },
  { name: "Olive Garden", owner: "Jai", wins: 7, losses: 7, ties: 0, finishRank: 8 },
  { name: "Ceedeez Nuts", owner: "Ansuman", wins: 6, losses: 8, ties: 0, finishRank: 9 },
  { name: "Project X", owner: "Aarav", wins: 4, losses: 10, ties: 0, finishRank: 10 },
];

// Reset to the real league with last year's standings (wipes teams & picks).
export async function POST() {
  const db = await getDb();
  await db.delete(picksTable);
  await db.delete(teamsTable);
  await db.insert(teamsTable).values(LEAGUE_TEAMS);
  return NextResponse.json({ ok: true, count: LEAGUE_TEAMS.length });
}
