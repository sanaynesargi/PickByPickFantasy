import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { teams as teamsTable, picks as picksTable } from "@/lib/schema";
import { computeState } from "@/lib/draft";

export const dynamic = "force-dynamic";

// Claim a draft slot. The team must be the one on the clock (enforced by
// reverse-standings order) and the chosen slot must still be available.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const teamId = Number(body.teamId);
  const pickNumber = Number(body.pickNumber);

  const db = await getDb();
  const [teams, picks] = await Promise.all([
    db.select().from(teamsTable),
    db.select().from(picksTable),
  ]);
  const state = computeState(teams, picks);

  if (state.onTheClockTeamId === null) {
    return NextResponse.json({ error: "The draft is complete." }, { status: 409 });
  }
  if (teamId !== state.onTheClockTeamId) {
    const onClock = teams.find((t) => t.id === state.onTheClockTeamId);
    return NextResponse.json(
      { error: `It's not that team's turn. ${onClock?.name ?? "Another team"} is on the clock.` },
      { status: 409 }
    );
  }
  if (!state.availableSlots.includes(pickNumber)) {
    return NextResponse.json(
      { error: `Pick #${pickNumber} is no longer available.` },
      { status: 409 }
    );
  }

  try {
    await db.insert(picksTable).values({ teamId, pickNumber });
  } catch {
    // Unique-constraint violation => someone claimed it a moment earlier.
    return NextResponse.json(
      { error: "That slot was just taken. Refresh and try again." },
      { status: 409 }
    );
  }

  const updated = computeState(teams, [...picks, { id: -1, teamId, pickNumber, createdAt: new Date() }]);
  return NextResponse.json(updated);
}
