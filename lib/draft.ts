import type { Team, Pick } from "./schema";

export type StandingTeam = Team & {
  rank: number; // 1 = best record last year
  points: number; // win = 1, tie = 0.5
};

export type DraftState = {
  teams: StandingTeam[]; // sorted best -> worst (standings order)
  selectionOrder: number[]; // team ids, worst -> best (who picks in what order)
  picks: { pickNumber: number; teamId: number }[];
  picksByTeam: Record<number, number>; // teamId -> pickNumber
  onTheClockTeamId: number | null;
  onTheClockIndex: number; // position in selectionOrder, -1 if done
  availableSlots: number[];
  totalTeams: number;
  complete: boolean;
};

function points(t: Team) {
  return t.wins + t.ties * 0.5;
}

// Standings order. If every team has an explicit finishRank (the real final
// standing), that is authoritative. Otherwise compute: more W/L points, then
// higher points-for (usual fantasy tiebreaker), then fewer losses, then name.
export function rankTeams(teams: Team[]): StandingTeam[] {
  const allSeeded = teams.length > 0 && teams.every((t) => t.finishRank > 0);

  const sorted = [...teams].sort((a, b) => {
    if (allSeeded) return a.finishRank - b.finishRank;
    const pd = points(b) - points(a);
    if (pd !== 0) return pd;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((t, i) => ({
    ...t,
    rank: allSeeded ? t.finishRank : i + 1,
    points: points(t),
  }));
}

export function computeState(teams: Team[], picks: Pick[]): DraftState {
  const ranked = rankTeams(teams);
  // Reverse standings: the worst team from last year selects first.
  const selectionOrder = [...ranked].reverse().map((t) => t.id);

  const picksByTeam: Record<number, number> = {};
  const takenSlots = new Set<number>();
  for (const p of picks) {
    picksByTeam[p.teamId] = p.pickNumber;
    takenSlots.add(p.pickNumber);
  }

  const total = teams.length;
  const availableSlots: number[] = [];
  for (let n = 1; n <= total; n++) {
    if (!takenSlots.has(n)) availableSlots.push(n);
  }

  // First team in selection order that has not yet claimed a slot.
  const onTheClockIndex = selectionOrder.findIndex(
    (id) => picksByTeam[id] === undefined
  );
  const onTheClockTeamId =
    onTheClockIndex === -1 ? null : selectionOrder[onTheClockIndex];

  return {
    teams: ranked,
    selectionOrder,
    picks: picks
      .map((p) => ({ pickNumber: p.pickNumber, teamId: p.teamId }))
      .sort((a, b) => a.pickNumber - b.pickNumber),
    picksByTeam,
    onTheClockTeamId,
    onTheClockIndex,
    availableSlots,
    totalTeams: total,
    complete: total > 0 && onTheClockTeamId === null,
  };
}
