import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { teams as teamsTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }
  const wins = Math.max(0, Number(body.wins) || 0);
  const losses = Math.max(0, Number(body.losses) || 0);
  const ties = Math.max(0, Number(body.ties) || 0);

  const db = await getDb();
  const [created] = await db
    .insert(teamsTable)
    .values({ name, wins, losses, ties })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
