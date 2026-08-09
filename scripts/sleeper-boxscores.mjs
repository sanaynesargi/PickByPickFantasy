// Backfill 2024 (Sleeper) into lib/boxscores.json so player-level features
// (box scores, franchise players, activity) cover all four seasons.
//
// Sleeper's public API needs no auth. Per-player points come from the matchups
// endpoint's `players_points` map. We map Sleeper roster_id -> person (via the
// league users' display names) -> our internal 2024 teamId (from league.json),
// and Sleeper positions -> the ESPN lineup-slot ids the rest of the app uses.
//
//   node scripts/sleeper-boxscores.mjs
//
// Player-id namespaces don't collide: ESPN ids are < 1e8 (D/ST negative);
// Sleeper numeric ids get +1e8, Sleeper D/ST get 2e8 + a stable index.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOX = path.join(__dirname, "..", "lib", "boxscores.json");
const LEAGUE = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "lib", "league.json"), "utf8"));

const SLEEPER_LEAGUE_ID = "1129184401260220416"; // "No punt intended" 2024
const SEASON = 2024;
const B = "https://api.sleeper.app/v1";

// Sleeper display name -> our person (from the league's known owners).
const PERSON_BY_DISPLAY = {
  jojoprocess21: "Sanay", hillnotdatni: "Ahan", mambaforev3r: "Ansuman",
  vjnogay: "Viraaj", jais320: "Jai", atrainn22: "Aarav",
  wembycity1: "Charles", samtheman30: "Sami", supercyrus: "Cyrus", superbat21: "Arav",
};

// Sleeper roster slot label -> ESPN lineup-slot id used across the app.
const SLOT_ID = {
  QB: 0, RB: 2, WR: 4, TE: 6, K: 17, DEF: 16,
  FLEX: 23, SUPER_FLEX: 23, WRRB_FLEX: 23, REC_FLEX: 23, WRRB_WRT: 23,
};
const BENCH = 20;

const get = async (u) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${u} -> ${r.status}`);
  return r.json();
};
const round2 = (n) => Math.round((n || 0) * 100) / 100;

async function main() {
  // 2024 is Sleeper (not in league.json). Canonical person->teamId mirrors
  // SLEEPER_2024_RICH in lib/history-data.ts (kept in sync manually).
  const TEAM_ID_BY_PERSON = {
    Ahan: 1, Ansuman: 2, Viraaj: 3, Jai: 4, Aarav: 5,
    Charles: 6, Sami: 7, Sanay: 8, Cyrus: 9, Arav: 10,
  };

  // players map (id -> name/pos). ~5MB; cache locally (gitignored).
  const cache = path.join(__dirname, "players-nfl.cache.json");
  let playersNfl;
  if (fs.existsSync(cache)) {
    playersNfl = JSON.parse(fs.readFileSync(cache, "utf8"));
    console.log("using cached players/nfl");
  } else {
    console.log("downloading players/nfl (~5MB)...");
    playersNfl = await get(`${B}/players/nfl`);
    fs.writeFileSync(cache, JSON.stringify(playersNfl));
  }

  // roster_id -> person
  const [rosters, users, league] = await Promise.all([
    get(`${B}/league/${SLEEPER_LEAGUE_ID}/rosters`),
    get(`${B}/league/${SLEEPER_LEAGUE_ID}/users`),
    get(`${B}/league/${SLEEPER_LEAGUE_ID}`),
  ]);
  const personByUser = new Map(users.map((u) => [u.user_id, PERSON_BY_DISPLAY[(u.display_name || "").toLowerCase()]]));
  const personByRoster = new Map();
  for (const r of rosters) {
    const person = personByUser.get(r.owner_id);
    if (!person) throw new Error(`no person for roster ${r.roster_id} (owner ${r.owner_id})`);
    personByRoster.set(r.roster_id, person);
  }

  // starting-slot order (non-bench) from roster_positions
  const startSlots = (league.roster_positions || []).filter((p) => p !== "BN" && p !== "IR" && p !== "TAXI");

  // player id resolution with non-colliding numeric ids
  const outPlayers = {}; // id(number) -> name
  const defIds = new Map(); // abbrev -> synthetic id
  let defSeq = 0;
  function resolvePlayer(pid) {
    if (/^\d+$/.test(pid)) {
      const id = Number(pid) + 100000000;
      if (!outPlayers[id]) {
        const p = playersNfl[pid];
        outPlayers[id] = p ? `${p.first_name} ${p.last_name}`.trim() : `#${pid}`;
      }
      return id;
    }
    // D/ST are keyed by team abbrev (e.g. "PIT")
    if (!defIds.has(pid)) { defIds.set(pid, 200000000 + defSeq++); }
    const id = defIds.get(pid);
    outPlayers[id] = `${pid} D/ST`;
    return id;
  }
  const isDef = (pid) => !/^\d+$/.test(pid);

  const weeks = {};
  const maxWeek = 17;
  process.stdout.write(`2024 Sleeper weeks 1-${maxWeek}: `);
  for (let wk = 1; wk <= maxWeek; wk++) {
    const matchups = await get(`${B}/league/${SLEEPER_LEAGUE_ID}/matchups/${wk}`);
    const anyPts = matchups.some((m) => (m.points || 0) > 0);
    if (!anyPts) { process.stdout.write("x"); continue; }
    const wkOut = {};
    for (const m of matchups) {
      const person = personByRoster.get(m.roster_id);
      const teamId = TEAM_ID_BY_PERSON[person];
      if (!teamId) continue;
      const starters = new Set(m.starters || []);
      const pp = m.players_points || {};
      const rows = [];
      // starters keep their lineup slot (ordered), rest go to bench
      (m.starters || []).forEach((pid, i) => {
        if (!pid || pid === "0") return;
        const label = startSlots[i] || (isDef(pid) ? "DEF" : "FLEX");
        const slot = SLOT_ID[label] ?? 23;
        rows.push([resolvePlayer(pid), slot, round2(pp[pid])]);
      });
      for (const pid of m.players || []) {
        if (starters.has(pid) || !pid || pid === "0") continue;
        rows.push([resolvePlayer(pid), BENCH, round2(pp[pid])]);
      }
      if (rows.length) wkOut[teamId] = rows;
    }
    weeks[wk] = wkOut;
    process.stdout.write(".");
  }

  // merge into existing boxscores.json
  const box = JSON.parse(fs.readFileSync(BOX, "utf8"));
  Object.assign(box.players, outPlayers);
  box.seasons[SEASON] = weeks;
  fs.writeFileSync(BOX, JSON.stringify(box));
  const kb = (fs.statSync(BOX).size / 1024).toFixed(0);
  console.log(`\nmerged ${SEASON}; boxscores.json now ${kb} KB, ${Object.keys(box.players).length} players`);
}

main().catch((e) => { console.error("\nERROR:", e.message); process.exit(1); });
