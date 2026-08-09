// Derived analytics over real per-week ESPN boxscores (lib/boxscores.json).
// Covers the ESPN seasons only (2022, 2023, 2025); 2024 was on Sleeper and has
// no player-level data. All functions return null / empty when a season lacks
// boxscores, so callers can gate the UI.

import boxData from "./boxscores.json";
import { RICH_SEASONS, winPct } from "./history-data";
import { personForTeamWeek } from "./history-stats";

type Entry = [number, number, number]; // [playerId, lineupSlotId, points]
const BX = boxData as unknown as { players: Record<string, string>; seasons: Record<string, Record<string, Record<string, Entry[]>>> };

const SLOT_LABEL: Record<number, string> = {
  0: "QB", 1: "QB", 2: "RB", 3: "RB", 4: "WR", 5: "WR", 6: "TE",
  16: "D/ST", 17: "K", 20: "BE", 21: "IR", 23: "FLEX",
};
const SLOT_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "D/ST", "K"];
const isStarter = (slot: number) => slot !== 20 && slot !== 21;

export function hasBoxscores(season: number): boolean {
  return !!BX.seasons[season];
}

export type BoxPlayer = { name: string; slot: string; starter: boolean; pts: number };
export type Boxscore = { starters: BoxPlayer[]; bench: BoxPlayer[]; total: number };

// One team's lineup for a given week. `null` if no boxscore data (e.g. 2024).
export function boxscore(season: number, week: number, teamId: number): Boxscore | null {
  const rows = BX.seasons[season]?.[week]?.[teamId];
  if (!rows) return null;
  const players: BoxPlayer[] = rows.map(([pid, slot, pts]) => ({
    name: BX.players[pid] || "?",
    slot: SLOT_LABEL[slot] ?? String(slot),
    starter: isStarter(slot),
    pts,
  }));
  const starters = players
    .filter((p) => p.starter)
    .sort((a, b) => (SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)) || b.pts - a.pts);
  const bench = players.filter((p) => !p.starter).sort((a, b) => b.pts - a.pts);
  const total = starters.reduce((s, p) => s + p.pts, 0);
  return { starters, bench, total };
}

// Team id -> person for a season, from RICH_SEASONS (finisher of the season).
function teamPersonMap(season: number): Map<number, string> {
  const s = RICH_SEASONS.find((x) => x.season === season);
  return new Map((s?.teams ?? []).map((t) => [t.id, t.person]));
}

export type FavPlayer = { name: string; pts: number; starts: number; ppg: number; seasons: number[] };

// A person's most-productive players across their career, by total points scored
// while in their STARTING lineup. Honors the 2022 mid-season handoff.
// Aggregate on player NAME, not raw id — ESPN and Sleeper use different id
// namespaces, so the same player (e.g. Jonathan Taylor) would otherwise split
// across the 2024 (Sleeper) boundary.
export function topPlayers(person: string, limit = 5): FavPlayer[] {
  const agg = new Map<string, { pts: number; starts: number; seasons: Set<number> }>();
  for (const season of Object.keys(BX.seasons)) {
    const yr = Number(season);
    const tp = teamPersonMap(yr);
    const weeks = BX.seasons[season];
    for (const week of Object.keys(weeks)) {
      const wk = Number(week);
      for (const [teamIdStr, rows] of Object.entries(weeks[week])) {
        const teamId = Number(teamIdStr);
        const owner = personForTeamWeek(yr, teamId, wk, tp.get(teamId) ?? "");
        if (owner !== person) continue;
        for (const [pid, slot, pts] of rows) {
          if (!isStarter(slot)) continue;
          const name = BX.players[pid] || "?";
          const a = agg.get(name) ?? { pts: 0, starts: 0, seasons: new Set<number>() };
          a.pts += pts; a.starts += 1; a.seasons.add(yr);
          agg.set(name, a);
        }
      }
    }
  }
  return [...agg.entries()]
    .map(([name, v]) => ({ name, pts: v.pts, starts: v.starts, ppg: v.starts ? v.pts / v.starts : 0, seasons: [...v.seasons].sort((a, b) => a - b) }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, limit);
}

export function favoritePlayer(person: string): FavPlayer | null {
  return topPlayers(person, 1)[0] ?? null;
}

export type LoyalPlayer = { name: string; seasons: number[]; weeks: number };

// A person's most loyal-to players: rostered (started OR benched) across the most
// distinct seasons, tie-broken by total weeks kept. Honors the 2022 handoff.
export function mostRostered(person: string, limit = 5): LoyalPlayer[] {
  const agg = new Map<string, { seasons: Set<number>; weeks: number }>();
  for (const season of Object.keys(BX.seasons)) {
    const yr = Number(season);
    const tp = teamPersonMap(yr);
    const weeks = BX.seasons[season];
    for (const week of Object.keys(weeks)) {
      const wk = Number(week);
      for (const [teamIdStr, rows] of Object.entries(weeks[week])) {
        const teamId = Number(teamIdStr);
        const owner = personForTeamWeek(yr, teamId, wk, tp.get(teamId) ?? "");
        if (owner !== person) continue;
        for (const [pid] of rows) {
          const name = BX.players[pid] || "?";
          if (name.includes("D/ST")) continue; // defenses get streamed; not "loyalty"
          const a = agg.get(name) ?? { seasons: new Set<number>(), weeks: 0 };
          a.seasons.add(yr); a.weeks += 1;
          agg.set(name, a);
        }
      }
    }
  }
  return [...agg.entries()]
    .map(([name, v]) => ({ name, seasons: [...v.seasons].sort((a, b) => a - b), weeks: v.weeks }))
    .sort((a, b) => b.seasons.length - a.seasons.length || b.weeks - a.weeks)
    .slice(0, limit);
}

export type ActivitySeason = {
  season: number; person: string; teamId: number;
  addsPerWeek: number; totalAdds: number; winPct: number; weeks: number;
};

// "Activity" = roster churn: players added to the roster from one week to the
// next (regular season). One row per team-season with that season's win%.
// Keyed by the finishing manager (matches how the win% plots treat a season).
export function activityBySeason(): ActivitySeason[] {
  const out: ActivitySeason[] = [];
  for (const s of RICH_SEASONS) {
    const weeksData = BX.seasons[s.season];
    if (!weeksData) continue; // no boxscores (2024)
    const regWeeks = [...new Set(s.schedule.filter((g) => !g.isPlayoff).map((g) => g.week))].sort((a, b) => a - b);
    for (const t of s.teams) {
      let w = 0, l = 0, ties = 0;
      for (const g of s.schedule) {
        if (g.isPlayoff || g.winner === "UNDECIDED") continue;
        const me = g.homeId === t.id ? g.homePts : g.awayId === t.id ? g.awayPts : null;
        const opp = g.homeId === t.id ? g.awayPts : g.awayId === t.id ? g.homePts : null;
        if (me == null || opp == null) continue;
        if (me > opp) w++; else if (me < opp) l++; else ties++;
      }
      let churn = 0, compared = 0;
      let prev: Set<number> | null = null;
      for (const week of regWeeks) {
        const rows = weeksData[week]?.[t.id];
        if (!rows) continue;
        const set = new Set(rows.map((r) => r[0]));
        if (prev) {
          let added = 0;
          for (const id of set) if (!prev.has(id)) added++;
          churn += added; compared++;
        }
        prev = set;
      }
      out.push({
        season: s.season, person: t.person, teamId: t.id,
        addsPerWeek: compared ? churn / compared : 0, totalAdds: churn,
        winPct: winPct({ wins: w, losses: l, ties }), weeks: compared,
      });
    }
  }
  return out;
}

export type TradePlayer = { name: string; started: boolean }; // started = mostly started by the acquirer after the trade
export type Trade = { season: number; week: number; a: string; b: string; aGot: TradePlayer[]; bGot: TradePlayer[] };

// Detect in-season trades from weekly roster snapshots: a reciprocal exchange
// where, from one week to the next, team A gains a player last on team B AND
// team B gains one last on A. A "stickiness" guard (received player stays on the
// new roster >= 2 snapshots) filters out coincidental crossing waiver claims.
// Note: this is a heuristic — ESPN doesn't expose a transaction log, and it
// cannot see pre-season/draft-day trades (no roster snapshot before week 1).
// Validated against Sleeper's authoritative 2024 log: recovers both in-season
// trades with no false positives (detected one snapshot late, ~the trade week).
const STICK = 2;
let _trades: Trade[] | null = null;
export function allTrades(): Trade[] {
  if (_trades) return _trades;
  const out: Trade[] = [];
  const rosterAt = (season: number, teamId: number, week: number) =>
    new Set((BX.seasons[season]?.[week]?.[teamId] ?? []).map((r) => r[0]));
  for (const seasonStr of Object.keys(BX.seasons)) {
    const season = Number(seasonStr);
    const tp = teamPersonMap(season);
    const weeks = Object.keys(BX.seasons[seasonStr]).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < weeks.length; i++) {
      const w = weeks[i], pw = weeks[i - 1];
      const teams = Object.keys(BX.seasons[seasonStr][w]).map(Number).filter((t) => BX.seasons[seasonStr][pw]?.[t]);
      const prev: Record<number, Set<number>> = {}, gained: Record<number, number[]> = {};
      for (const t of teams) {
        prev[t] = rosterAt(season, t, pw);
        const cur = rosterAt(season, t, w);
        gained[t] = [...cur].filter((id) => !prev[t].has(id));
      }
      const sticks = (t: number, id: number) => {
        let ok = 0;
        for (let k = i; k < Math.min(i + STICK, weeks.length); k++) { if (rosterAt(season, t, weeks[k]).has(id)) ok++; else break; }
        return ok >= STICK;
      };
      // Did the acquiring team mostly start this player after the trade?
      const startedFlag = (teamId: number, pid: number): boolean => {
        let started = 0, present = 0;
        for (let k = i; k < weeks.length; k++) {
          const row = BX.seasons[seasonStr][weeks[k]]?.[teamId];
          const e = row?.find((r) => r[0] === pid);
          if (!e) continue;
          present++;
          if (e[1] !== 20 && e[1] !== 21) started++;
        }
        return present > 0 && started / present >= 0.5;
      };
      for (let a = 0; a < teams.length; a++) for (let b = a + 1; b < teams.length; b++) {
        const A = teams[a], C = teams[b];
        const aFromC = gained[A].filter((id) => prev[C].has(id) && sticks(A, id));
        const cFromA = gained[C].filter((id) => prev[A].has(id) && sticks(C, id));
        if (aFromC.length && cFromA.length) {
          out.push({
            season, week: w,
            a: personForTeamWeek(season, A, w, tp.get(A) ?? ""),
            b: personForTeamWeek(season, C, w, tp.get(C) ?? ""),
            aGot: aFromC.map((id) => ({ name: BX.players[id] || "?", started: startedFlag(A, id) })),
            bGot: cFromA.map((id) => ({ name: BX.players[id] || "?", started: startedFlag(C, id) })),
          });
        }
      }
    }
  }
  _trades = out;
  return out;
}

export type PersonTrade = { season: number; week: number; partner: string; got: TradePlayer[]; gave: string[] };

// One person's in-season trades, newest first (from their point of view).
export function careerTrades(person: string): PersonTrade[] {
  return allTrades()
    .filter((t) => t.a === person || t.b === person)
    .map((t) => t.a === person
      ? { season: t.season, week: t.week, partner: t.b, got: t.aGot, gave: t.bGot.map((p) => p.name) }
      : { season: t.season, week: t.week, partner: t.a, got: t.bGot, gave: t.aGot.map((p) => p.name) })
    .sort((x, y) => y.season - x.season || y.week - x.week);
}

// A person's career activity (avg adds/week across their boxscore seasons).
export function careerActivity(person: string): { addsPerWeek: number; seasons: number } | null {
  const mine = activityBySeason().filter((r) => r.person === person && r.weeks > 0);
  if (!mine.length) return null;
  const totalAdds = mine.reduce((s, r) => s + r.totalAdds, 0);
  const totalWeeks = mine.reduce((s, r) => s + r.weeks, 0);
  return { addsPerWeek: totalWeeks ? totalAdds / totalWeeks : 0, seasons: mine.length };
}
