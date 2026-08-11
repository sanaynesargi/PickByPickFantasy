// Shared data layer for league analyses. Reads the committed data the importers
// produce — lib/league.json (ESPN 2022/23/25) and lib/boxscores.json (per-week
// lineups incl. Sleeper 2024) — plus the hand-entered Sleeper 2024 season block
// in lib/history-data.ts. No network calls: run `scripts/espn-import.mjs` /
// `scripts/espn-boxscores.mjs` / `scripts/sleeper-boxscores.mjs` to refresh.
//
// Everything else in analysis/ imports from here so the person mapping, schedule,
// PPG, win%, trade detection, etc. live in exactly one place.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJSON = (p) => JSON.parse(read(p));

export const LEAGUE = readJSON("lib/league.json");
export const BOX = readJSON("lib/boxscores.json");
const HD = read("lib/history-data.ts");

// ---- Sleeper 2024 (not in league.json; parse the SLEEPER_2024_RICH block) ----
function parse2024() {
  const teamsBlock = HD.match(/SLEEPER_2024_RICH[\s\S]*?teams:\s*\[([\s\S]*?)\],\s*\n\s*draftPicks/)[1];
  const teams = [...teamsBlock.matchAll(/\{[^}]*\}/g)].map((m) => {
    const o = m[0];
    const g = (k) => { const mm = o.match(new RegExp(k + ':\\s*"?([^,"}]+)')); return mm ? mm[1].trim() : null; };
    return {
      id: +g("id"), person: g("person"), name: g("name"),
      regRank: +g("regRank"), playoffRank: +g("playoffRank"),
      wins: +g("wins"), losses: +g("losses"), ties: +(g("ties") || 0),
      pointsFor: +g("pointsFor"), pointsAgainst: +g("pointsAgainst"),
    };
  });
  const schedBlock = HD.match(/SLEEPER_2024_RICH[\s\S]*?schedule:\s*\[([\s\S]*?)\],?\s*\n\s*\};/)[1];
  const schedule = [...schedBlock.matchAll(/\b([gp])\((\d+),\s*(\d+),\s*([\d.]+),\s*(\d+),\s*([\d.]+)\)/g)].map((m) => ({
    week: +m[2], isPlayoff: m[1] === "p",
    homeId: +m[3], homePts: +m[4], awayId: +m[5], awayPts: +m[6],
    winner: +m[4] > +m[6] ? "HOME" : +m[6] > +m[4] ? "AWAY" : "TIE",
  }));
  return { season: 2024, league: "No Punt Intended", size: 10, teams, schedule, draftPicks: [] };
}
const S2024 = parse2024();

// All seasons with rich schedule data, oldest first.
export const SEASONS = [...LEAGUE.seasons, S2024].sort((a, b) => a.season - b.season);
export const YEARS = SEASONS.map((s) => s.season);
const bySeason = new Map(SEASONS.map((s) => [s.season, s]));
export const season = (yr) => bySeason.get(yr);
export const teams = (yr) => season(yr)?.teams ?? [];
export const schedule = (yr) => season(yr)?.schedule ?? [];

// ---- person resolution (honors the 2022 New England Jit handoff) ----
const HANDOFFS = [{ season: 2022, teamId: 12, throughWeek: 7, person: "Ansuman" }];
const baseName = new Map();
for (const s of SEASONS) baseName.set(s.season, new Map(s.teams.map((t) => [t.id, t.person])));
export function personOf(yr, teamId, week = Infinity) {
  const h = HANDOFFS.find((x) => x.season === yr && x.teamId === teamId && week <= x.throughWeek);
  return h ? h.person : baseName.get(yr)?.get(teamId);
}

// ---- team-season records / scoring (regular season) ----
export function teamSeason(yr, teamId) {
  let wins = 0, losses = 0, ties = 0, pf = 0, pa = 0, g = 0;
  for (const gm of schedule(yr)) {
    if (gm.isPlayoff || gm.winner === "UNDECIDED") continue;
    const home = gm.homeId === teamId, away = gm.awayId === teamId;
    if (!home && !away) continue;
    const me = home ? gm.homePts : gm.awayPts;
    const opp = home ? gm.awayPts : gm.homePts;
    pf += me; pa += opp; g++;
    if (me > opp) wins++; else if (me < opp) losses++; else ties++;
  }
  return {
    season: yr, teamId, person: personOf(yr, teamId),
    wins, losses, ties, games: g,
    winPct: wins + losses ? wins / (wins + losses) : 0,
    pf, pa, ppg: g ? pf / g : 0, papg: g ? pa / g : 0, diff: g ? (pf - pa) / g : 0,
  };
}

// One row per team-season across all seasons (n=40).
export function allTeamSeasons() {
  const out = [];
  for (const s of SEASONS) for (const t of s.teams) out.push(teamSeason(s.season, t.id));
  return out;
}

// ---- boxscores (per-week lineups) ----
const SLOT_LABEL = { 0: "QB", 1: "QB", 2: "RB", 3: "RB", 4: "WR", 5: "WR", 6: "TE", 16: "D/ST", 17: "K", 20: "BE", 21: "IR", 23: "FLEX" };
export const isStarter = (slot) => slot !== 20 && slot !== 21;
export const playerName = (id) => BOX.players[id] || `#${id}`;
export const hasBox = (yr) => !!BOX.seasons[yr];
export const boxWeeks = (yr) => Object.keys(BOX.seasons[yr] ?? {}).map(Number).sort((a, b) => a - b);
export function roster(yr, week, teamId) {
  return (BOX.seasons[yr]?.[week]?.[teamId] ?? []).map(([id, slot, pts]) => ({ id, slot: SLOT_LABEL[slot] ?? String(slot), started: isStarter(slot), pts, name: playerName(id) }));
}
const rosterIds = (yr, teamId, week) => new Set((BOX.seasons[yr]?.[week]?.[teamId] ?? []).map((r) => r[0]));

// A player's PPG over weeks [fromWeek, toWeek) — full production wherever
// rostered (bench included). fromWeek default 1, toWeek default +inf.
export function playerPPG(yr, playerId, fromWeek = 1, toWeek = Infinity) {
  const wks = boxWeeks(yr);
  let sum = 0, n = 0;
  for (const wk of wks) {
    if (wk < fromWeek || wk >= toWeek) continue;
    for (const t of Object.keys(BOX.seasons[yr][wk])) {
      const e = BOX.seasons[yr][wk][t].find((x) => x[0] === playerId);
      if (e) { sum += e[2]; n++; break; }
    }
  }
  return n ? sum / n : 0;
}

// ---- roster churn ("activity") ----
export function activityBySeason() {
  const out = [];
  for (const s of SEASONS) {
    if (!hasBox(s.season)) continue;
    const regWeeks = [...new Set(s.schedule.filter((g) => !g.isPlayoff).map((g) => g.week))].sort((a, b) => a - b);
    for (const t of s.teams) {
      let churn = 0, compared = 0, prev = null;
      for (const wk of regWeeks) {
        const set = rosterIds(s.season, t.id, wk);
        if (!set.size) continue;
        if (prev) { let a = 0; for (const id of set) if (!prev.has(id)) a++; churn += a; compared++; }
        prev = set;
      }
      const ts = teamSeason(s.season, t.id);
      out.push({ season: s.season, person: t.person, teamId: t.id, addsPerWeek: compared ? churn / compared : 0, totalAdds: churn, winPct: ts.winPct, ppg: ts.ppg });
    }
  }
  return out;
}

// ---- trade detection (reciprocal exchange; stickiness confirms, full contents) ----
const STICK = 2;
let _trades = null;
export function detectTrades() {
  if (_trades) return _trades;
  const out = [];
  for (const s of SEASONS) {
    const yr = s.season;
    if (!hasBox(yr)) continue;
    const wks = boxWeeks(yr);
    for (let i = 1; i < wks.length; i++) {
      const w = wks[i], pw = wks[i - 1];
      const teamIds = Object.keys(BOX.seasons[yr][w]).map(Number).filter((t) => BOX.seasons[yr][pw]?.[t]);
      const prev = {}, gained = {};
      for (const t of teamIds) {
        prev[t] = rosterIds(yr, t, pw);
        gained[t] = [...rosterIds(yr, t, w)].filter((id) => !prev[t].has(id));
      }
      const sticks = (t, id) => { let ok = 0; for (let k = i; k < Math.min(i + STICK, wks.length); k++) { if (rosterIds(yr, t, wks[k]).has(id)) ok++; else break; } return ok >= STICK; };
      for (let a = 0; a < teamIds.length; a++) for (let b = a + 1; b < teamIds.length; b++) {
        const A = teamIds[a], C = teamIds[b];
        const aFromC = gained[A].filter((id) => prev[C].has(id));
        const cFromA = gained[C].filter((id) => prev[A].has(id));
        const confirmed = aFromC.some((id) => sticks(A, id)) && cFromA.some((id) => sticks(C, id));
        if (confirmed && aFromC.length && cFromA.length) {
          out.push({
            season: yr, week: w,
            a: personOf(yr, A, w), b: personOf(yr, C, w), teamA: A, teamB: C,
            aGot: aFromC.map((id) => ({ id, name: playerName(id) })),
            bGot: cFromA.map((id) => ({ id, name: playerName(id) })),
          });
        }
      }
    }
  }
  _trades = out;
  return out;
}

// Signed net post-trade PPG for a trade (from person A's perspective):
// sum(PPG of players A received) − sum(PPG of players A gave), weeks >= trade week.
export function tradeValue(t) {
  const recv = t.aGot.reduce((s, p) => s + playerPPG(t.season, p.id, t.week), 0);
  const gave = t.bGot.reduce((s, p) => s + playerPPG(t.season, p.id, t.week), 0);
  return recv - gave;
}

// Pearson correlation helper.
export function pearson(xs, ys) {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  const r = sxy / Math.sqrt(sxx * syy);
  return { r, slope: sxy / sxx, intercept: my - (sxy / sxx) * mx, r2: r * r };
}
