import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { teams as teamsTable, picks as picksTable } from "@/lib/schema";
import { computeState } from "@/lib/draft";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const [teams, picks] = await Promise.all([
    db.select().from(teamsTable),
    db.select().from(picksTable),
  ]);
  return NextResponse.json(computeState(teams, picks));
}
