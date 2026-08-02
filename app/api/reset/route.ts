import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { picks as picksTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

// Clear all claimed slots but keep the teams/standings.
export async function POST() {
  const db = await getDb();
  await db.delete(picksTable);
  return NextResponse.json({ ok: true });
}
