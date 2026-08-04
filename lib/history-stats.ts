// Derived analytics over the static HISTORY archive. All computed from
// lib/history-data.ts: add a season there and these update automatically.
//
// Records and points (PF/PA, and therefore point-differential) exist for every
// season (2022-2025). Sample sizes are still surfaced in the UI.

import { HISTORY, LEAGUE, winPct } from "./history-data";

export type FlatRecord = {
  season: number;
  pick: number;
  manager: string;
  team: string;
  wins: number;
  losses: number;
  ties: number;
  rank: number; // regular-season finish
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

export type H2H = {
  opponent: string;
  wins: number; losses: number; ties: number;
  pointsFor: number; pointsAgainst: number; games: number;
};

// One person's all-time head-to-head vs every opponent (ESPN seasons w/ scores).
export function headToHead(person: string): H2H[] {
  const acc = new Map<string, H2H>();
  for (const s of LEAGUE.seasons) {
    const personByTeam = new Map(s.teams.map((t) => [t.id, t.person]));
    for (const g of s.schedule) {
      if (g.winner === "UNDECIDED") continue;
      const hp = personByTeam.get(g.homeId);
      const ap = personByTeam.get(g.awayId);
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
    res.push({
      manager,
      seasons: rs.length,
      wins,
      losses,
      ties,
      winPct: winPct({ wins, losses, ties }),
      avgFinish: avg(rs.map((r) => r.rank)),
      avgPlayoff: pos.length ? avg(pos) : undefined,
      avgPick: avg(rs.map((r) => r.pick)),
      bestFinish: Math.min(...rs.map((r) => r.rank)),
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
  const recs = flatten();
  const picks = [...new Set(recs.map((r) => r.pick))].sort((a, b) => a - b);
  return picks.map((pick) => {
    const rs = recs.filter((r) => r.pick === pick);
    const pts = rs.filter((r) => r.pd !== undefined);
    const pos = rs.map((r) => r.po).filter((v): v is number => v !== undefined);
    return {
      pick,
      n: rs.length,
      avgWins: avg(rs.map((r) => r.wins)),
      avgFinish: avg(rs.map((r) => r.rank)),
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
  const recs = flatten();
  const pts = recs.filter((r) => r.pd !== undefined);
  return [
    { label: "Wins", r: pearson(recs.map((r) => r.pick), recs.map((r) => r.wins)), n: recs.length },
    { label: "Points for", r: pearson(pts.map((r) => r.pick), pts.map((r) => r.pf!)), n: pts.length },
    { label: "Points against", r: pearson(pts.map((r) => r.pick), pts.map((r) => r.pa!)), n: pts.length },
    { label: "Point diff.", r: pearson(pts.map((r) => r.pick), pts.map((r) => r.pd!)), n: pts.length },
  ];
}
