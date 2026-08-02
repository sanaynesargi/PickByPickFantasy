import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { teams as teamsTable, picks as picksTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

// "No Punt Intended": 2025 final regular-season standings (ESPN export).
// finishRank is the real standing (ESPN has no points-for to tie-break the
// five 7-7 teams, so we store the order directly). The draft reverses it.
const LEAGUE_TEAMS = [
  { name: "Teeth", owner: "Viraaj", wins: 9, losses: 5, ties: 0, finishRank: 1, pointsFor: 1799.48, pointsAgainst: 1551.52 },
  { name: "Dat N*bba", owner: "Ahan", wins: 8, losses: 6, ties: 0, finishRank: 2, pointsFor: 1894.94, pointsAgainst: 1830.5 },
  { name: "Saquons Big Fat Brock", owner: "Arav", wins: 8, losses: 6, ties: 0, finishRank: 3, pointsFor: 1738.24, pointsAgainst: 1659.02 },
  // Charles became Advik for the upcoming draft; standings unchanged, but he
  // picks 10th this year (draftPick override) and everyone else shifts up.
  { name: "Chris olave", owner: "Advik", wins: 7, losses: 7, ties: 0, finishRank: 4, pointsFor: 1683.04, pointsAgainst: 1626.46, draftPick: 10 },
  { name: "Mr. Morningstar", owner: "Sanay", wins: 7, losses: 7, ties: 0, finishRank: 5, pointsFor: 1662.34, pointsAgainst: 1489.9 },
  { name: "Lil Fetus Fantasy", owner: "Sami", wins: 7, losses: 7, ties: 0, finishRank: 6, pointsFor: 1598.14, pointsAgainst: 1739.34 },
  { name: "Last Place Race", owner: "Cyrus", wins: 7, losses: 7, ties: 0, finishRank: 7, pointsFor: 1574.24, pointsAgainst: 1627.76 },
  { name: "Olive Garden", owner: "Jai", wins: 7, losses: 7, ties: 0, finishRank: 8, pointsFor: 1555.8, pointsAgainst: 1594.8 },
  { name: "Ceedeez Nuts", owner: "Ansuman", wins: 6, losses: 8, ties: 0, finishRank: 9, pointsFor: 1486.28, pointsAgainst: 1655.98 },
  { name: "Project X", owner: "Aarav", wins: 4, losses: 10, ties: 0, finishRank: 10, pointsFor: 1490.2, pointsAgainst: 1707.42 },
];

// Reset to the real league with last year's standings (wipes teams & picks).
export async function POST() {
  const db = await getDb();
  await db.delete(picksTable);
  await db.delete(teamsTable);
  await db.insert(teamsTable).values(LEAGUE_TEAMS);
  return NextResponse.json({ ok: true, count: LEAGUE_TEAMS.length });
}
