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

// Look up the rich ESPN season (for player/score views); undefined for 2024.
export function leagueSeason(season: number): LeagueSeason | undefined {
  return LEAGUE.seasons.find((s) => s.season === season);
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
