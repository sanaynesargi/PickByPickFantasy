import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { teams as teamsTable, picks as picksTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const teamId = Number(id);
  const body = await req.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.owner === "string") update.owner = body.owner.trim();
  if (body.wins !== undefined) update.wins = Math.max(0, Number(body.wins) || 0);
  if (body.losses !== undefined) update.losses = Math.max(0, Number(body.losses) || 0);
  if (body.ties !== undefined) update.ties = Math.max(0, Number(body.ties) || 0);
  if (body.pointsFor !== undefined) update.pointsFor = Math.max(0, Number(body.pointsFor) || 0);
  if (body.pointsAgainst !== undefined) update.pointsAgainst = Math.max(0, Number(body.pointsAgainst) || 0);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const db = await getDb();
  const [updated] = await db
    .update(teamsTable)
    .set(update)
    .where(eq(teamsTable.id, teamId))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const teamId = Number(id);
  const db = await getDb();
  // Removing a team also frees any draft slot it had claimed.
  await db.delete(picksTable).where(eq(picksTable.teamId, teamId));
  await db.delete(teamsTable).where(eq(teamsTable.id, teamId));
  return NextResponse.json({ ok: true });
}
