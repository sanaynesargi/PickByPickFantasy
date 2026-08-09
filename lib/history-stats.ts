// Derived analytics over the static HISTORY archive. All computed from
// lib/history-data.ts: add a season there and these update automatically.
//
// Records and points (PF/PA, and therefore point-differential) exist for every
// season (2022-2025). Sample sizes are still surfaced in the UI.

import { HISTORY, RICH_SEASONS, winPct } from "./history-data";

export type FlatRecord = {
  season: number;
  pick?: number; // undefined for a mid-season replacement who didn't draft
  manager: string;
  team: string;
  wins: number;
  losses: number;
  ties: number;
  rank?: number; // regular-season finish; undefined for a partial (mid-season) stint
  po?: number; // playoff finish
  pf?: number;
  pa?: number;
  pd?: number;
};

// One row per team-season, joining draft slot to that team's final line.
export function flatten(): FlatRecord[] {
  const out: FlatRecord[] = [];
  for (const s of HISTORY) {
    for (const p of s.draftOrder) {
      const st = s.standings.find((x) => x.team === p.team);
      if (!st) continue;
      const pf = st.pointsFor;
      const pa = st.pointsAgainst;
      out.push({
        season: s.season,
        pick: p.pick,
        manager: p.manager ?? "unknown",
        team: p.team,
        wins: st.wins,
        losses: st.losses,
        ties: st.ties,
        rank: st.rank,
        po: st.playoffRank,
        pf,
        pa,
        pd: pf !== undefined && pa !== undefined ? pf - pa : undefined,
      });
    }
  }

  // Mid-season handoffs: split the finisher's team-season into the finisher's
  // portion (keeps finish + draft pick) and the leaver's partial (record only).
  for (const h of MANAGER_HANDOFFS) {
    const s = RICH_SEASONS.find((x) => x.season === h.season);
    const team = s?.teams.find((t) => t.id === h.teamId);
    if (!s || !team) continue;
    const idx = out.findIndex((r) => r.season === h.season && r.team === team.name);
    if (idx < 0) continue;
    const pre = { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
    const post = { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
    for (const g of s.schedule) {
      if (g.isPlayoff || g.winner === "UNDECIDED") continue; // regular season only (matches standings W-L)
      const home = g.homeId === h.teamId;
      if (!home && g.awayId !== h.teamId) continue;
      const my = home ? g.homePts : g.awayPts;
      const opp = home ? g.awayPts : g.homePts;
      const b = g.week <= h.throughWeek ? pre : post;
      b.pf += my; b.pa += opp;
      if (my > opp) b.wins++; else if (my < opp) b.losses++; else b.ties++;
    }
    const base = out[idx];
    // finisher keeps rank/po/pick; record + points shrink to the post-handoff portion
    out[idx] = { ...base, wins: post.wins, losses: post.losses, ties: post.ties, pf: post.pf, pa: post.pa, pd: post.pf - post.pa };
    // leaver: partial record only, no finish or draft pick
    out.push({ season: h.season, manager: h.person, team: team.name, pick: undefined, rank: undefined, po: undefined, wins: pre.wins, losses: pre.losses, ties: pre.ties, pf: pre.pf, pa: pre.pa, pd: pre.pf - pre.pa });
  }
  return out;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// Podium tally as repeated medals, e.g. "🏆🏆 🥉".
export function medalTally(c: { titles: number; seconds: number; thirds: number }): string {
  return ["🏆".repeat(c.titles), "🥈".repeat(c.seconds), "🥉".repeat(c.thirds)]
    .filter(Boolean)
    .join(" ");
}

// Mid-season manager changes. A team's games up to and including `throughWeek`
// count for `person` in the per-game views (head-to-head, rivalries, game log).
// Season-level records/standings stay with the team's finishing owner.
const MANAGER_HANDOFFS: { season: number; teamId: number; throughWeek: number; person: string }[] = [
  // Ansuman ran the New England Jit (team 12) for weeks 1-7 of 2022 before
  // leaving the league that year; Charles took over from week 8. The 2022
  // season line stays with Charles (he finished it and made the playoffs).
  { season: 2022, teamId: 12, throughWeek: 7, person: "Ansuman" },
];
function personOnWeek(base: Map<number, string>, season: number, teamId: number, week: number): string | undefined {
  const h = MANAGER_HANDOFFS.find((x) => x.season === season && x.teamId === teamId && week <= x.throughWeek);
  return h ? h.person : base.get(teamId);
}
// Resolve who managed a team on a given week, honoring mid-season handoffs.
export function personForTeamWeek(season: number, teamId: number, week: number, fallback: string): string {
  const h = MANAGER_HANDOFFS.find((x) => x.season === season && x.teamId === teamId && week <= x.throughWeek);
  return h ? h.person : fallback;
}

export type H2H = {
  opponent: string;
  wins: number; losses: number; ties: number;
  pointsFor: number; pointsAgainst: number; games: number;
};

// One person's all-time head-to-head vs every opponent (ESPN seasons w/ scores).
export function headToHead(person: string): H2H[] {
  const acc = new Map<string, H2H>();
  for (const s of RICH_SEASONS) {
    const personByTeam = new Map(s.teams.map((t) => [t.id, t.person]));
    for (const g of s.schedule) {
      if (g.winner === "UNDECIDED") continue;
      const hp = personOnWeek(personByTeam, s.season, g.homeId, g.week);
      const ap = personOnWeek(personByTeam, s.season, g.awayId, g.week);
      if (!hp || !ap) continue;
      let opp: string, myPts: number, oppPts: number, res: "W" | "L" | "T";
      if (hp === person) {
        opp = ap; myPts = g.homePts; oppPts = g.awayPts;
        res = g.winner === "HOME" ? "W" : g.winner === "AWAY" ? "L" : "T";
      } else if (ap === person) {
        opp = hp; myPts = g.awayPts; oppPts = g.homePts;
        res = g.winner === "AWAY" ? "W" : g.winner === "HOME" ? "L" : "T";
      } else continue;
      const e = acc.get(opp) || { opponent: opp, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, games: 0 };
      e.games++; e.pointsFor += myPts; e.pointsAgainst += oppPts;
      if (res === "W") e.wins++; else if (res === "L") e.losses++; else e.ties++;
      acc.set(opp, e);
    }
  }
  return [...acc.values()].sort(
    (a, b) => b.wins - b.losses - (a.wins - a.losses) || b.games - a.games || a.opponent.localeCompare(b.opponent)
  );
}

export type RivalryGame = {
  season: number; week: number; isPlayoff: boolean;
  aPts: number; bPts: number; winner: "A" | "B" | "T";
};
export type Rivalry = {
  a: string; b: string;
  aWins: number; bWins: number; ties: number; aPf: number; bPf: number;
  games: RivalryGame[];
};

// Full head-to-head series between two people (newest game first).
export function rivalry(a: string, b: string): Rivalry {
  const games: RivalryGame[] = [];
  let aWins = 0, bWins = 0, ties = 0, aPf = 0, bPf = 0;
  for (const s of RICH_SEASONS) {
    const pById = new Map(s.teams.map((t) => [t.id, t.person]));
    for (const g of s.schedule) {
      if (g.winner === "UNDECIDED") continue;
      const hp = personOnWeek(pById, s.season, g.homeId, g.week);
      const ap = personOnWeek(pById, s.season, g.awayId, g.week);
      let aPts: number, bPts: number, winner: "A" | "B" | "T";
      if (hp === a && ap === b) {
        aPts = g.homePts; bPts = g.awayPts;
        winner = g.winner === "HOME" ? "A" : g.winner === "AWAY" ? "B" : "T";
      } else if (hp === b && ap === a) {
        aPts = g.awayPts; bPts = g.homePts;
        winner = g.winner === "AWAY" ? "A" : g.winner === "HOME" ? "B" : "T";
      } else continue;
      games.push({ season: s.season, week: g.week, isPlayoff: g.isPlayoff, aPts, bPts, winner });
      aPf += aPts; bPf += bPts;
      if (winner === "A") aWins++; else if (winner === "B") bWins++; else ties++;
    }
  }
  games.sort((x, y) => y.season - x.season || x.week - y.week);
  return { a, b, aWins, bWins, ties, aPf, bPf, games };
}

export type SeasonRecord = {
  person: string; season: number; wins: number; losses: number; ties: number; regRank: number;
};
export type Collapse = {
  person: string;
  from: SeasonRecord;
  to: SeasonRecord;
  drop: number; // wins lost year-over-year
};

// Single-season superlatives across every season (2022 to 2025).
export function seasonRecords(): { bestRecord: SeasonRecord[]; biggestCollapse: Collapse[] } {
  const all: SeasonRecord[] = [];
  for (const s of RICH_SEASONS)
    for (const t of s.teams)
      all.push({ person: t.person, season: s.season, wins: t.wins, losses: t.losses, ties: t.ties, regRank: t.regRank });

  const pct = (r: SeasonRecord) => r.wins / (r.wins + r.losses + r.ties || 1);
  const bestRecord = [...all]
    .sort((a, b) => pct(b) - pct(a) || b.wins - a.wins || a.losses - b.losses)
    .slice(0, 5);

  const byPerson: Record<string, SeasonRecord[]> = {};
  for (const r of all) (byPerson[r.person] ||= []).push(r);
  const collapses: Collapse[] = [];
  for (const p in byPerson) {
    const arr = byPerson[p].sort((a, b) => a.season - b.season);
    for (let i = 1; i < arr.length; i++)
      if (arr[i].season === arr[i - 1].season + 1)
        collapses.push({ person: p, from: arr[i - 1], to: arr[i], drop: arr[i - 1].wins - arr[i].wins });
  }
  const biggestCollapse = collapses.filter((c) => c.drop > 0).sort((a, b) => b.drop - a.drop).slice(0, 5);

  return { bestRecord, biggestCollapse };
}

export type GameLog = {
  season: number; week: number; isPlayoff: boolean;
  pts: number; oppPts: number; opp: string; result: "W" | "L" | "T";
};

// One person's week-by-week game log across ESPN seasons (newest season first).
export function gameLog(person: string): GameLog[] {
  const out: GameLog[] = [];
  for (const s of RICH_SEASONS) {
    const pById = new Map(s.teams.map((t) => [t.id, t.person]));
    for (const g of s.schedule) {
      if (g.winner === "UNDECIDED") continue;
      const hp = personOnWeek(pById, s.season, g.homeId, g.week);
      const ap = personOnWeek(pById, s.season, g.awayId, g.week);
      let pts: number, oppPts: number, opp: string | undefined, result: "W" | "L" | "T";
      if (hp === person) {
        pts = g.homePts; oppPts = g.awayPts; opp = ap;
        result = g.winner === "HOME" ? "W" : g.winner === "AWAY" ? "L" : "T";
      } else if (ap === person) {
        pts = g.awayPts; oppPts = g.homePts; opp = hp;
        result = g.winner === "AWAY" ? "W" : g.winner === "HOME" ? "L" : "T";
      } else continue;
      out.push({ season: s.season, week: g.week, isPlayoff: g.isPlayoff, pts, oppPts, opp: opp || "?", result });
    }
  }
  return out.sort((a, b) => b.season - a.season || a.week - b.week);
}

// All of one person's team-seasons, oldest first (for the per-player timeline).
export function personSeasons(manager: string): FlatRecord[] {
  return flatten()
    .filter((r) => r.manager === manager)
    .sort((a, b) => a.season - b.season);
}

export type Career = {
  manager: string;
  seasons: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  avgFinish: number; // regular-season
  avgPlayoff?: number; // playoff finish (undefined if no playoff data)
  avgPick: number;
  bestFinish: number;
  firsts: number; // regular-season 1st-place finishes
  titles: number; // playoff championships (playoff finish === 1)
  seconds: number; // playoff runner-up (=== 2)
  thirds: number; // playoff third (=== 3)
};

export function careers(): Career[] {
  const byMgr = new Map<string, FlatRecord[]>();
  for (const r of flatten()) {
    const arr = byMgr.get(r.manager) ?? [];
    arr.push(r);
    byMgr.set(r.manager, arr);
  }
  const res: Career[] = [];
  for (const [manager, rs] of byMgr) {
    const wins = sum(rs.map((r) => r.wins));
    const losses = sum(rs.map((r) => r.losses));
    const ties = sum(rs.map((r) => r.ties));
    const pos = rs.map((r) => r.po).filter((v): v is number => v !== undefined);
    const ranks = rs.map((r) => r.rank).filter((v): v is number => v !== undefined);
    const picks = rs.map((r) => r.pick).filter((v): v is number => v !== undefined);
    res.push({
      manager,
      seasons: rs.length,
      wins,
      losses,
      ties,
      winPct: winPct({ wins, losses, ties }),
      avgFinish: avg(ranks),
      avgPlayoff: pos.length ? avg(pos) : undefined,
      avgPick: avg(picks),
      bestFinish: ranks.length ? Math.min(...ranks) : 0,
      firsts: rs.filter((r) => r.rank === 1).length,
      titles: rs.filter((r) => r.po === 1).length,
      seconds: rs.filter((r) => r.po === 2).length,
      thirds: rs.filter((r) => r.po === 3).length,
    });
  }
  return res.sort((a, b) => b.winPct - a.winPct || a.avgFinish - b.avgFinish);
}

export type PickAvg = {
  pick: number;
  n: number; // team-seasons drafted at this slot
  avgWins: number;
  avgFinish: number; // regular-season
  avgPlayoff?: number; // playoff finish
  nPts: number; // seasons with points data
  avgPf?: number;
  avgPa?: number;
  avgPd?: number;
};

export function perPick(): PickAvg[] {
  const recs = flatten().filter((r) => r.pick !== undefined);
  const picks = [...new Set(recs.map((r) => r.pick as number))].sort((a, b) => a - b);
  return picks.map((pick) => {
    const rs = recs.filter((r) => r.pick === pick);
    const pts = rs.filter((r) => r.pd !== undefined);
    const pos = rs.map((r) => r.po).filter((v): v is number => v !== undefined);
    return {
      pick,
      n: rs.length,
      avgWins: avg(rs.map((r) => r.wins)),
      avgFinish: avg(rs.map((r) => r.rank).filter((v): v is number => v !== undefined)),
      avgPlayoff: pos.length ? avg(pos) : undefined,
      nPts: pts.length,
      avgPf: pts.length ? avg(pts.map((r) => r.pf!)) : undefined,
      avgPa: pts.length ? avg(pts.map((r) => r.pa!)) : undefined,
      avgPd: pts.length ? avg(pts.map((r) => r.pd!)) : undefined,
    };
  });
}

// Pearson correlation coefficient; null if undefined (n<2 or zero variance).
export function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2 || ys.length !== n) return null;
  const mx = avg(xs);
  const my = avg(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? null : num / den;
}

export type Corr = { label: string; r: number | null; n: number };

// Correlation of draft pick number vs each outcome (lower pick = earlier).
export function correlations(): Corr[] {
  const recs = flatten().filter((r) => r.pick !== undefined);
  const pts = recs.filter((r) => r.pd !== undefined);
  return [
    { label: "Wins", r: pearson(recs.map((r) => r.pick!), recs.map((r) => r.wins)), n: recs.length },
    { label: "Points for", r: pearson(pts.map((r) => r.pick!), pts.map((r) => r.pf!)), n: pts.length },
    { label: "Points against", r: pearson(pts.map((r) => r.pick!), pts.map((r) => r.pa!)), n: pts.length },
    { label: "Point diff.", r: pearson(pts.map((r) => r.pick!), pts.map((r) => r.pd!)), n: pts.length },
  ];
}
