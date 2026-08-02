import type { DraftState } from "./draft";

export type { DraftState };
export type { StandingTeam } from "./draft";

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
  return data as T;
}

export const api = {
  state: () => fetch("/api/state", { cache: "no-store" }).then((r) => json<DraftState>(r)),
  seed: () => fetch("/api/seed", { method: "POST" }).then((r) => json(r)),
  reset: () => fetch("/api/reset", { method: "POST" }).then((r) => json(r)),
  pick: (teamId: number, pickNumber: number) =>
    fetch("/api/pick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, pickNumber }),
    }).then((r) => json<DraftState>(r)),
  addTeam: (t: {
    name: string;
    owner?: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor?: number;
    pointsAgainst?: number;
    finishRank?: number;
    draftPick?: number;
  }) =>
    fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    }).then((r) => json(r)),
  updateTeam: (
    id: number,
    t: Partial<{
      name: string;
      owner: string;
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
      finishRank: number;
      draftPick: number;
    }>
  ) =>
    fetch(`/api/teams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    }).then((r) => json(r)),
  deleteTeam: (id: number) =>
    fetch(`/api/teams/${id}`, { method: "DELETE" }).then((r) => json(r)),
};
