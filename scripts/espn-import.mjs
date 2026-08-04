// Local ESPN Fantasy importer for "No Punt Intended" (leagueId 1732369750).
// Pulls every completed season + the current roster from ESPN's v3 API and
// writes lib/league.json (authoritative data: standings, PF/PA, reg + playoff
// ranks, full draft with players, weekly scores). NO secrets are written.
//
// Auth: reads swid + espn_s2 from a local cookies file (never committed).
//   ESPN_COOKIES=/path/to/cookies.txt node scripts/espn-import.mjs
// Default path is the sibling EspnFantasyCompanion.py/cookies.txt.
//
// Re-run whenever a season completes (or names change), then commit lib/league.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEAGUE_ID = 1732369750;
const HISTORY_SEASONS = [2022, 2023, 2024, 2025]; // completed seasons
const CURRENT_SEASON = 2026; // upcoming, used only for the active roster
const BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl";
const OUT = path.join(__dirname, "..", "lib", "league.json");

// ESPN username (member displayName / historical member id) -> friendly name.
// Verified by joining each season's team owners with the known team↔person map.
const PERSON_BY_USERNAME = {
  "ESPNfan0062251936": "Sanay",
  "ESPNFAN7393510857": "Viraaj",
  "jai shenoy": "Jai",
  "espnfan3064298021": "Cyrus",
  "ESPNFAN6110508923": "Advik",
  "ESPNFAN7680253117": "Ahan",
  "ESPNFAN7233776940": "Aarav",
  "ANanda69": "Arav",
  "SexySami": "Sami",
  "AHopefulBaylorFan": "Ansuman",
  "ESPNfan6469348560": "Vansh",
  "ESPNFAN9536502422": "Charles",
  "ESPNFAN7766910109": "Cyril",
  "ESPNfan5891962340": "Adhi",
};

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

async function get(url, extraHeaders = {}) {
  const res = await fetch(url, {
    headers: { Cookie: COOKIE, Accept: "application/json", ...extraHeaders },
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function fetchLeague(season, isCurrent) {
  const views =
    "view=mTeam&view=mSettings&view=mMatchup&view=mDraftDetail&view=mRoster";
  const url = isCurrent
    ? `${BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${views}`
    : `${BASE}/leagueHistory/${LEAGUE_ID}?seasonId=${season}&${views}`;
  const j = await get(url);
  return Array.isArray(j) ? j[0] : j;
}

async function fetchPlayers(season) {
  const url = `${BASE}/seasons/${season}/players?scoringPeriodId=0&view=players_wl`;
  const arr = await get(url, { "x-fantasy-filter": JSON.stringify({ players: { limit: 2000 } }) });
  const byId = {};
  for (const p of arr) {
    const id = p.id ?? p.player?.id;
    const nm = p.fullName ?? p.player?.fullName;
    const pos = POS[(p.defaultPositionId ?? p.player?.defaultPositionId)] || "";
    if (id) byId[id] = { name: nm, pos };
  }
  return byId;
}

const POS = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST" };
const unmapped = new Set();

function personFor(username) {
  const person = PERSON_BY_USERNAME[username];
  if (!person) unmapped.add(username);
  return person || username;
}

function buildSeason(o, players) {
  const members = {};
  for (const m of o.members || []) members[m.id] = m.displayName || `${m.firstName || ""} ${m.lastName || ""}`.trim();
  const divisions = {};
  for (const d of o.settings?.scheduleSettings?.divisions || []) divisions[d.id] = d.name;
  const regWeeks = o.settings?.scheduleSettings?.matchupPeriodCount || 14;

  const teams = o.teams.map((t) => {
    const username = members[t.primaryOwner] || t.primaryOwner;
    const r = t.record?.overall || {};
    return {
      id: t.id,
      name: t.name,
      abbrev: t.abbrev,
      person: personFor(username),
      regRank: t.playoffSeed, // ESPN's official reg-season seeding
      playoffRank: t.rankCalculatedFinal, // final placement after playoffs
      wins: r.wins ?? 0,
      losses: r.losses ?? 0,
      ties: r.ties ?? 0,
      pointsFor: round2(r.pointsFor),
      pointsAgainst: round2(r.pointsAgainst),
      division: divisions[t.divisionId],
    };
  });
  const teamName = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const teamPerson = Object.fromEntries(teams.map((t) => [t.id, t.person]));

  const draftPicks = (o.draftDetail?.picks || [])
    .slice()
    .sort((a, b) => a.overallPickNumber - b.overallPickNumber)
    .map((p) => ({
      round: p.roundId,
      overall: p.overallPickNumber,
      teamId: p.teamId,
      team: teamName[p.teamId],
      person: teamPerson[p.teamId],
      player: players[p.playerId]?.name || `#${p.playerId}`,
      pos: players[p.playerId]?.pos || "",
    }));

  const schedule = (o.schedule || [])
    .filter((g) => g.home && g.away)
    .map((g) => ({
      week: g.matchupPeriodId,
      isPlayoff: g.matchupPeriodId > regWeeks,
      homeId: g.home.teamId,
      homePts: round2(g.home.totalPoints),
      awayId: g.away.teamId,
      awayPts: round2(g.away.totalPoints),
      winner: g.winner, // HOME | AWAY | UNDECIDED | TIE
    }));

  const games = regWeeks + (o.settings?.scheduleSettings?.playoffMatchupPeriodCount || 3) * 0 + 0;
  return {
    season: o.seasonId,
    league: o.settings?.name || "",
    size: o.settings?.size || teams.length,
    regWeeks,
    divisions: Object.values(divisions),
    teams,
    draftPicks,
    schedule,
  };
}

const round2 = (n) => (typeof n === "number" ? Math.round(n * 100) / 100 : n);

async function main() {
  const seasons = [];
  for (const yr of HISTORY_SEASONS) {
    process.stderr.write(`Fetching ${yr}... `);
    const [o, players] = await Promise.all([fetchLeague(yr, false), fetchPlayers(yr)]);
    const built = buildSeason(o, players);
    // Skip "ghost" seasons: an ESPN league instance that was created but never
    // played (all 0-0, no scored games). 2024 lived on Sleeper, not ESPN.
    const played = built.teams.some((t) => t.wins + t.losses + t.ties > 0);
    if (!played) {
      process.stderr.write(`SKIP (ghost / never played on ESPN)\n`);
      continue;
    }
    seasons.push(built);
    process.stderr.write(`ok (${o.teams.length} teams, ${built.draftPicks.length} picks)\n`);
  }

  // Current roster (active managers) from the upcoming season.
  process.stderr.write(`Fetching ${CURRENT_SEASON} roster... `);
  const cur = await fetchLeague(CURRENT_SEASON, true);
  const curMembers = {};
  for (const m of cur.members || []) curMembers[m.id] = m.displayName || `${m.firstName || ""} ${m.lastName || ""}`.trim();
  const activeManagers = cur.teams.map((t) => personFor(curMembers[t.primaryOwner] || t.primaryOwner));
  process.stderr.write(`ok (${activeManagers.length} active)\n`);

  const out = {
    generatedFrom: "ESPN v3 API",
    leagueId: LEAGUE_ID,
    currentSeason: CURRENT_SEASON,
    activeManagers,
    seasons,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  process.stderr.write(`\nWrote ${OUT}\n`);
  if (unmapped.size) {
    process.stderr.write(`\n⚠ Unmapped ESPN usernames (add to PERSON_BY_USERNAME): ${[...unmapped].join(", ")}\n`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
