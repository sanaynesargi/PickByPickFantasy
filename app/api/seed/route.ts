import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { teams as teamsTable, picks as picksTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

// "No Punt Intended" — last year's final standings (from the league export).
// Order here doesn't matter; the app ranks by record then points-for.
const LEAGUE_TEAMS = [
  { name: "Dat N*bba", owner: "Ahan Nanda", wins: 10, losses: 4, ties: 0, pointsFor: 1792.38, pointsAgainst: 1539.70 },
  { name: "Ceedeez Nuts", owner: "Ansuman Chandan", wins: 9, losses: 5, ties: 0, pointsFor: 1699.94, pointsAgainst: 1590.42 },
  { name: "Teeth", owner: "Vj Seth", wins: 8, losses: 6, ties: 0, pointsFor: 1759.76, pointsAgainst: 1746.60 },
  { name: "Olive Garden", owner: "Jai Shenoy", wins: 7, losses: 7, ties: 0, pointsFor: 1732.12, pointsAgainst: 1725.36 },
  { name: "Project X", owner: "Aarav Nesargi", wins: 7, losses: 7, ties: 0, pointsFor: 1728.86, pointsAgainst: 1723.08 },
  { name: "Team 7", owner: "Charles", wins: 7, losses: 7, ties: 0, pointsFor: 1612.50, pointsAgainst: 1695.22 },
  { name: "Lil Fetus Fantasy", owner: "Samar Dogra", wins: 7, losses: 7, ties: 0, pointsFor: 1605.70, pointsAgainst: 1678.36 },
  { name: "Mr. Morningstar", owner: "Sanay Nesargi", wins: 6, losses: 8, ties: 0, pointsFor: 1677.28, pointsAgainst: 1705.76 },
  { name: "Last Place Race", owner: "Cyrus Sudepally", wins: 5, losses: 9, ties: 0, pointsFor: 1450.46, pointsAgainst: 1604.12 },
  { name: "Saquons Big Fat Brock", owner: "Arav Nanda", wins: 4, losses: 10, ties: 0, pointsFor: 1729.08, pointsAgainst: 1779.46 },
];

// Reset to the real league with last year's standings (wipes teams & picks).
export async function POST() {
  const db = await getDb();
  await db.delete(picksTable);
  await db.delete(teamsTable);
  await db.insert(teamsTable).values(LEAGUE_TEAMS);
  return NextResponse.json({ ok: true, count: LEAGUE_TEAMS.length });
}
