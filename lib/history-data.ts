// League history. Most of this is generated from ESPN (lib/league.json, built
// by scripts/espn-import.mjs) — authoritative standings, PF/PA, reg + playoff
// ranks, the real draft with players, and weekly scores. 2024 was played on
// Sleeper (not ESPN), so that one season is kept as hand-entered data below.

import leagueRaw from "./league.json";

// ---- Shapes the app renders (kept stable across the ESPN migration) ----
export type DraftPick = { pick: number; team: string; manager?: string };

export type StandingRow = {
  rank: number; // regular-season finish
  team: string;
  manager?: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor?: number;
  pointsAgainst?: number;
  division?: string;
  playoffRank?: number; // final playoff finish
};

export type HistorySeason = {
  season: number;
  league: string;
  format: string;
  source: string;
  draftOrder: DraftPick[];
  standings: StandingRow[];
};

// ---- Rich ESPN data (for player/score/head-to-head views) ----
export type LeagueTeam = {
  id: number; name: string; abbrev: string; person: string;
  regRank: number; playoffRank: number;
  wins: number; losses: number; ties: number;
  pointsFor: number; pointsAgainst: number; division?: string;
};
export type LeagueDraftPick = {
  round: number; overall: number; teamId: number; team: string; person: string;
  player: string; pos: string;
};
export type LeagueGame = {
  week: number; isPlayoff: boolean;
  homeId: number; homePts: number; awayId: number; awayPts: number; winner: string;
};
export type LeagueSeason = {
  season: number; league: string; size: number; regWeeks: number;
  divisions: string[]; teams: LeagueTeam[]; draftPicks: LeagueDraftPick[]; schedule: LeagueGame[];
};
export type LeagueData = { activeManagers: string[]; currentSeason: number; seasons: LeagueSeason[] };

export const LEAGUE = leagueRaw as unknown as LeagueData;

// Current roster (drives the Active vs All-time toggle).
export const ACTIVE_MANAGERS = LEAGUE.activeManagers;

export function winPct(r: { wins: number; losses: number; ties: number }) {
  const games = r.wins + r.losses + r.ties;
  return games === 0 ? 0 : (r.wins + r.ties * 0.5) / games;
}
export function recordStr(r: { wins: number; losses: number; ties: number }) {
  return r.ties > 0 ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
}

// Look up a rich season (for score/player views). Includes the ESPN seasons
// plus the hand-built Sleeper 2024 (weekly scores, no player-level draft).
export function leagueSeason(season: number): LeagueSeason | undefined {
  return RICH_SEASONS.find((s) => s.season === season);
}

function fromEspn(s: LeagueSeason): HistorySeason {
  const multiDiv = s.divisions.length > 1;
  const draftOrder: DraftPick[] = s.draftPicks
    .filter((p) => p.round === 1)
    .sort((a, b) => a.overall - b.overall)
    .map((p) => ({ pick: p.overall, team: p.team, manager: p.person }));
  const standings: StandingRow[] = s.teams
    .map((t) => ({
      rank: t.regRank,
      team: t.name,
      manager: t.person,
      wins: t.wins,
      losses: t.losses,
      ties: t.ties,
      pointsFor: t.pointsFor,
      pointsAgainst: t.pointsAgainst,
      division: multiDiv ? t.division : undefined,
      playoffRank: t.playoffRank || undefined,
    }))
    .sort((a, b) => a.rank - b.rank);
  const format =
    `Snake · ${s.size} teams · ${s.regWeeks} games` + (multiDiv ? ` · ${s.divisions.length} divisions` : "");
  return { season: s.season, league: s.league, format, source: "ESPN", draftOrder, standings };
}

// 2024 was on Sleeper — kept as hand-entered data (ESPN has only a ghost league).
const SLEEPER_2024: HistorySeason = {
  season: 2024,
  league: "No Punt Intended",
  format: "Snake · 10 teams · 14 games",
  source: "Sleeper",
  draftOrder: [
    { pick: 1, team: "Lil Fetus Fantasy", manager: "Sami" },
    { pick: 2, team: "Dat N*bba", manager: "Ahan" },
    { pick: 3, team: "Last Place Race", manager: "Cyrus" },
    { pick: 4, team: "Saquons Big Fat Brock", manager: "Arav" },
    { pick: 5, team: "Ceedeez Nuts", manager: "Ansuman" },
    { pick: 6, team: "Teeth", manager: "Viraaj" },
    { pick: 7, team: "Project X", manager: "Aarav" },
    { pick: 8, team: "Olive Garden", manager: "Jai" },
    { pick: 9, team: "Mr. Morningstar", manager: "Sanay" },
    { pick: 10, team: "Team 7", manager: "Charles" },
  ],
  standings: [
    { rank: 1, team: "Dat N*bba", manager: "Ahan", wins: 10, losses: 4, ties: 0, pointsFor: 1792.38, pointsAgainst: 1539.7, playoffRank: 1 },
    { rank: 2, team: "Ceedeez Nuts", manager: "Ansuman", wins: 9, losses: 5, ties: 0, pointsFor: 1699.94, pointsAgainst: 1590.42, playoffRank: 2 },
    { rank: 3, team: "Teeth", manager: "Viraaj", wins: 8, losses: 6, ties: 0, pointsFor: 1759.76, pointsAgainst: 1746.6, playoffRank: 6 },
    { rank: 4, team: "Olive Garden", manager: "Jai", wins: 7, losses: 7, ties: 0, pointsFor: 1732.12, pointsAgainst: 1725.36, playoffRank: 3 },
    { rank: 5, team: "Project X", manager: "Aarav", wins: 7, losses: 7, ties: 0, pointsFor: 1728.86, pointsAgainst: 1723.08, playoffRank: 5 },
    { rank: 6, team: "Team 7", manager: "Charles", wins: 7, losses: 7, ties: 0, pointsFor: 1612.5, pointsAgainst: 1695.22, playoffRank: 4 },
    { rank: 7, team: "Lil Fetus Fantasy", manager: "Sami", wins: 7, losses: 7, ties: 0, pointsFor: 1605.7, pointsAgainst: 1678.36, playoffRank: 7 },
    { rank: 8, team: "Mr. Morningstar", manager: "Sanay", wins: 6, losses: 8, ties: 0, pointsFor: 1677.28, pointsAgainst: 1705.76, playoffRank: 8 },
    { rank: 9, team: "Last Place Race", manager: "Cyrus", wins: 5, losses: 9, ties: 0, pointsFor: 1450.46, pointsAgainst: 1604.12, playoffRank: 9 },
    { rank: 10, team: "Saquons Big Fat Brock", manager: "Arav", wins: 4, losses: 10, ties: 0, pointsFor: 1729.08, pointsAgainst: 1779.46, playoffRank: 10 },
  ],
};

// Most recent first.
export const HISTORY: HistorySeason[] = [
  ...LEAGUE.seasons.map(fromEspn),
  SLEEPER_2024,
].sort((a, b) => b.season - a.season);

// 2024 rich data (Sleeper). Weekly scores manually transcribed from the league
// screenshots (weeks 5 and 13 weren't captured). No player-level draft on
// Sleeper, so draftPicks is empty and 2024 shows Board + Scores (no Full draft).
const g = (week: number, homeId: number, homePts: number, awayId: number, awayPts: number): LeagueGame => ({
  week, isPlayoff: false, homeId, homePts, awayId, awayPts,
  winner: homePts > awayPts ? "HOME" : awayPts > homePts ? "AWAY" : "TIE",
});
// playoff/bracket game (championship + toilet bowl), weeks 15-17
const p = (week: number, homeId: number, homePts: number, awayId: number, awayPts: number): LeagueGame => ({
  ...g(week, homeId, homePts, awayId, awayPts), isPlayoff: true,
});
// person -> team id: Ahan 1, Ansuman 2, Viraaj 3, Jai 4, Aarav 5, Charles 6,
// Sami 7, Sanay 8, Cyrus 9, Arav 10.
const SLEEPER_2024_RICH: LeagueSeason = {
  season: 2024,
  league: "No Punt Intended",
  size: 10,
  regWeeks: 14,
  divisions: [],
  teams: [
    { id: 1, name: "Dat N*bba", abbrev: "", person: "Ahan", regRank: 1, playoffRank: 1, wins: 10, losses: 4, ties: 0, pointsFor: 1792.38, pointsAgainst: 1539.7 },
    { id: 2, name: "Ceedeez Nuts", abbrev: "", person: "Ansuman", regRank: 2, playoffRank: 2, wins: 9, losses: 5, ties: 0, pointsFor: 1699.94, pointsAgainst: 1590.42 },
    { id: 3, name: "Teeth", abbrev: "", person: "Viraaj", regRank: 3, playoffRank: 6, wins: 8, losses: 6, ties: 0, pointsFor: 1759.76, pointsAgainst: 1746.6 },
    { id: 4, name: "Olive Garden", abbrev: "", person: "Jai", regRank: 4, playoffRank: 3, wins: 7, losses: 7, ties: 0, pointsFor: 1732.12, pointsAgainst: 1725.36 },
    { id: 5, name: "Project X", abbrev: "", person: "Aarav", regRank: 5, playoffRank: 5, wins: 7, losses: 7, ties: 0, pointsFor: 1728.86, pointsAgainst: 1723.08 },
    { id: 6, name: "Team 7", abbrev: "", person: "Charles", regRank: 6, playoffRank: 4, wins: 7, losses: 7, ties: 0, pointsFor: 1612.5, pointsAgainst: 1695.22 },
    { id: 7, name: "Lil Fetus Fantasy", abbrev: "", person: "Sami", regRank: 7, playoffRank: 7, wins: 7, losses: 7, ties: 0, pointsFor: 1605.7, pointsAgainst: 1678.36 },
    { id: 8, name: "Mr. Morningstar", abbrev: "", person: "Sanay", regRank: 8, playoffRank: 8, wins: 6, losses: 8, ties: 0, pointsFor: 1677.28, pointsAgainst: 1705.76 },
    { id: 9, name: "Last Place Race", abbrev: "", person: "Cyrus", regRank: 9, playoffRank: 9, wins: 5, losses: 9, ties: 0, pointsFor: 1450.46, pointsAgainst: 1604.12 },
    { id: 10, name: "Saquons Big Fat Brock", abbrev: "", person: "Arav", regRank: 10, playoffRank: 10, wins: 4, losses: 10, ties: 0, pointsFor: 1729.08, pointsAgainst: 1779.46 },
  ],
  draftPicks: [],
  schedule: [
    g(1, 8, 130.26, 6, 131.28), g(1, 1, 145.66, 10, 116.48), g(1, 9, 117.30, 3, 124.64), g(1, 4, 153.72, 5, 105.88), g(1, 7, 77.66, 2, 85.82),
    g(2, 8, 112.00, 2, 117.42), g(2, 1, 114.42, 3, 106.74), g(2, 9, 116.96, 10, 138.46), g(2, 6, 160.36, 5, 150.04), g(2, 4, 116.58, 7, 107.32),
    g(3, 8, 106.30, 5, 89.68), g(3, 1, 107.26, 9, 67.82), g(3, 10, 125.38, 3, 129.90), g(3, 4, 137.68, 2, 111.24), g(3, 6, 139.32, 7, 95.16),
    g(4, 8, 114.60, 7, 112.98), g(4, 1, 133.54, 5, 88.88), g(4, 4, 113.24, 10, 89.84), g(4, 6, 118.70, 3, 141.80), g(4, 2, 139.60, 9, 127.22),
    g(5, 1, 116.88, 4, 141.52), g(5, 5, 144.30, 10, 129.34), g(5, 3, 119.44, 8, 133.34), g(5, 7, 149.78, 9, 112.06), g(5, 2, 140.96, 6, 105.74),
    g(6, 8, 142.38, 10, 131.10), g(6, 1, 97.92, 6, 97.40), g(6, 7, 95.32, 3, 145.30), g(6, 4, 103.92, 9, 124.22), g(6, 2, 117.88, 5, 128.46),
    g(7, 8, 81.04, 1, 115.02), g(7, 7, 101.94, 10, 166.76), g(7, 2, 133.36, 3, 129.56), g(7, 9, 78.90, 5, 104.00), g(7, 4, 120.84, 6, 90.54),
    g(8, 8, 138.10, 4, 115.46), g(8, 1, 134.82, 7, 150.96), g(8, 2, 131.84, 10, 115.12), g(8, 3, 141.38, 5, 120.08), g(8, 6, 143.24, 9, 106.04),
    g(9, 8, 111.14, 9, 118.30), g(9, 1, 135.70, 2, 146.50), g(9, 6, 114.36, 10, 108.50), g(9, 4, 125.70, 3, 133.92), g(9, 7, 115.74, 5, 91.36),
    g(10, 8, 111.28, 6, 97.38), g(10, 1, 130.90, 10, 94.84), g(10, 9, 86.00, 3, 91.74), g(10, 4, 121.90, 5, 134.64), g(10, 7, 137.02, 2, 113.28),
    g(11, 8, 120.08, 2, 136.34), g(11, 1, 150.48, 3, 107.84), g(11, 9, 105.68, 10, 101.50), g(11, 6, 91.84, 5, 159.98), g(11, 4, 117.38, 7, 120.74),
    g(12, 8, 105.28, 5, 134.00), g(12, 1, 87.88, 9, 88.66), g(12, 10, 124.18, 3, 124.06), g(12, 4, 112.48, 2, 109.46), g(12, 6, 129.70, 7, 114.28),
    g(13, 1, 138.52, 5, 118.60), g(13, 4, 119.28, 10, 159.20), g(13, 3, 99.84, 6, 149.54), g(13, 2, 97.92, 9, 108.60), g(13, 7, 123.76, 8, 118.68),
    g(14, 8, 152.80, 3, 163.60), g(14, 1, 183.38, 4, 132.42), g(14, 10, 128.38, 5, 158.96), g(14, 7, 103.04, 9, 92.70), g(14, 6, 43.10, 2, 118.32),
    // --- Playoffs (championship bracket + toilet bowl), from Sleeper brackets ---
    // Wk15 R1: Ahan had a first-round bye
    p(15, 4, 123.80, 5, 115.46), p(15, 2, 146.50, 7, 142.24), p(15, 3, 117.86, 6, 121.54),
    p(15, 10, 120.14, 9, 100.72), // toilet bowl final (last place): Arav over Cyrus
    // Wk16 semis + 5th-place semi
    p(16, 1, 130.76, 4, 122.98), p(16, 2, 171.14, 6, 134.82), p(16, 7, 126.08, 3, 143.90),
    // Wk17 finals: championship, 3rd place, 5th place
    p(17, 1, 145.58, 2, 142.88), p(17, 4, 148.32, 6, 91.88), p(17, 5, 122.84, 3, 119.10),
  ],
};

// All seasons with rich (schedule/player) data: ESPN + Sleeper 2024.
export const RICH_SEASONS: LeagueSeason[] = [...LEAGUE.seasons, SLEEPER_2024_RICH];
