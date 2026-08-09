// Local ESPN boxscore importer. Pulls real per-week lineups (starters + bench,
// per-player points) for every ESPN season via the seasons/{year} endpoint —
// the one that returns TRUE per-week rosters (leagueHistory only gives a final
// snapshot). Writes lib/boxscores.json. NO secrets written.
//
//   ESPN_COOKIES=/path/to/cookies.txt node scripts/espn-boxscores.mjs
//
// Output shape (compact; join to lib/league.json by season+week+teamId):
//   {
//     players:  { "<playerId>": "Full Name" },
//     seasons:  { "2025": { "<week>": { "<teamId>": [[playerId, slotId, pts], ...] } } }
//   }
// slotId: 20 = bench, 21 = IR; anything else started (0 QB,2 RB,4 WR,6 TE,16 D/ST,17 K,23 FLEX).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEAGUE_ID = 1732369750;
const BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl";
const OUT = path.join(__dirname, "..", "lib", "boxscores.json");
const LEAGUE = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "lib", "league.json"), "utf8"));

function readCookies() {
  const p =
    process.env.ESPN_COOKIES ||
    path.join(__dirname, "..", "..", "EspnFantasyCompanion.py", "cookies.txt");
  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
  const swid = (lines[0] || "").trim();
  const espn_s2 = (lines[1] || "").trim();
  if (!swid || !espn_s2) throw new Error(`cookies file ${p} missing swid/espn_s2`);
  return { swid, espn_s2 };
}
const { swid, espn_s2 } = readCookies();
const COOKIE = `SWID=${swid}; espn_s2=${espn_s2}`;

async function get(url) {
  const res = await fetch(url, { headers: { Cookie: COOKIE, Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function fetchWeek(season, week) {
  const url =
    `${BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}` +
    `?view=mBoxscore&view=mMatchup&scoringPeriodId=${week}&matchupPeriodId=${week}`;
  return get(url);
}

const round2 = (n) => Math.round(n * 100) / 100;

async function main() {
  const players = {}; // playerId -> name
  const seasons = {};

  for (const s of LEAGUE.seasons) {
    const season = s.season;
    const weeks = [...new Set(s.schedule.map((g) => g.week))].sort((a, b) => a - b);
    seasons[season] = {};
    process.stdout.write(`\n${season}: weeks ${weeks[0]}-${weeks[weeks.length - 1]} `);

    for (const wk of weeks) {
      const j = await fetchWeek(season, wk);
      const wkOut = {};
      let entryCount = 0;

      for (const m of j.schedule || []) {
        if ((m.matchupPeriodId ?? m.matchupPeriod) !== wk) continue;
        for (const side of ["home", "away"]) {
          const box = m[side];
          if (!box) continue;
          const entries =
            box.rosterForCurrentScoringPeriod?.entries ||
            box.rosterForMatchupPeriod?.entries ||
            [];
          const rows = [];
          for (const e of entries) {
            const pl = e.playerPoolEntry?.player || {};
            const pid = e.playerId ?? e.playerPoolEntry?.id;
            if (pid == null) continue;
            if (!players[pid] && pl.fullName) players[pid] = pl.fullName;
            const stat = (pl.stats || []).find(
              (x) => x.scoringPeriodId === wk && x.statSourceId === 0
            );
            const pts = stat?.appliedTotal ?? e.playerPoolEntry?.appliedStatTotal ?? 0;
            rows.push([pid, e.lineupSlotId, round2(pts)]);
          }
          if (rows.length) { wkOut[box.teamId] = rows; entryCount += rows.length; }
        }
      }
      seasons[season][wk] = wkOut;
      process.stdout.write(entryCount ? "." : "x");
    }
  }

  const out = { players, seasons };
  fs.writeFileSync(OUT, JSON.stringify(out));
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`\n\nwrote ${OUT} (${kb} KB, ${Object.keys(players).length} players)`);
}

main().catch((e) => { console.error("\nERROR:", e.message); process.exit(1); });
