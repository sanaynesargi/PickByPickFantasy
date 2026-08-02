// Historical league archive — immutable reference data transcribed from the
// league exports in /images. Extend by adding a season object below.
//
// `manager` is the stable identity across seasons (team names change yearly).
// Where a past team couldn't be mapped to a person with confidence it's left
// undefined and shown as "—" (fill these in as they're confirmed).
// pointsFor/Against only exist for seasons exported from Sleeper (2024).

export type DraftPick = { pick: number; team: string; manager?: string };

export type StandingRow = {
  rank: number;
  team: string;
  manager?: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor?: number;
  pointsAgainst?: number;
  division?: string;
};

export type HistorySeason = {
  season: number;
  league: string;
  format: string;
  source: string;
  draftOrder: DraftPick[];
  standings: StandingRow[];
};

export function winPct(r: { wins: number; losses: number; ties: number }) {
  const games = r.wins + r.losses + r.ties;
  return games === 0 ? 0 : (r.wins + r.ties * 0.5) / games;
}

export function recordStr(r: { wins: number; losses: number; ties: number }) {
  return r.ties > 0 ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
}

// Most recent first.
export const HISTORY: HistorySeason[] = [
  {
    season: 2025,
    league: "No Punt Intended",
    format: "Snake · 10 teams · 14 games",
    source: "ESPN",
    draftOrder: [
      { pick: 1, team: "Mr. Morningstar", manager: "Sanay" },
      { pick: 2, team: "Lil Fetus Fantasy", manager: "Sami" },
      { pick: 3, team: "Saquons Big Fat Brock", manager: "Arav" },
      { pick: 4, team: "Last Place Race", manager: "Cyrus" },
      { pick: 5, team: "Chris olave", manager: "Charles" },
      { pick: 6, team: "Ceedeez Nuts", manager: "Ansuman" },
      { pick: 7, team: "Dat N*bba", manager: "Ahan" },
      { pick: 8, team: "Teeth", manager: "Viraaj" },
      { pick: 9, team: "Olive Garden", manager: "Jai" },
      { pick: 10, team: "Project X", manager: "Aarav" },
    ],
    standings: [
      { rank: 1, team: "Teeth", manager: "Viraaj", wins: 9, losses: 5, ties: 0 },
      { rank: 2, team: "Dat N*bba", manager: "Ahan", wins: 8, losses: 6, ties: 0 },
      { rank: 3, team: "Saquons Big Fat Brock", manager: "Arav", wins: 8, losses: 6, ties: 0 },
      { rank: 4, team: "Chris olave", manager: "Charles", wins: 7, losses: 7, ties: 0 },
      { rank: 5, team: "Mr. Morningstar", manager: "Sanay", wins: 7, losses: 7, ties: 0 },
      { rank: 6, team: "Lil Fetus Fantasy", manager: "Sami", wins: 7, losses: 7, ties: 0 },
      { rank: 7, team: "Last Place Race", manager: "Cyrus", wins: 7, losses: 7, ties: 0 },
      { rank: 8, team: "Olive Garden", manager: "Jai", wins: 7, losses: 7, ties: 0 },
      { rank: 9, team: "Ceedeez Nuts", manager: "Ansuman", wins: 6, losses: 8, ties: 0 },
      { rank: 10, team: "Project X", manager: "Aarav", wins: 4, losses: 10, ties: 0 },
    ],
  },
  {
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
      { rank: 1, team: "Dat N*bba", manager: "Ahan", wins: 10, losses: 4, ties: 0, pointsFor: 1792.38, pointsAgainst: 1539.7 },
      { rank: 2, team: "Ceedeez Nuts", manager: "Ansuman", wins: 9, losses: 5, ties: 0, pointsFor: 1699.94, pointsAgainst: 1590.42 },
      { rank: 3, team: "Teeth", manager: "Viraaj", wins: 8, losses: 6, ties: 0, pointsFor: 1759.76, pointsAgainst: 1746.6 },
      { rank: 4, team: "Olive Garden", manager: "Jai", wins: 7, losses: 7, ties: 0, pointsFor: 1732.12, pointsAgainst: 1725.36 },
      { rank: 5, team: "Project X", manager: "Aarav", wins: 7, losses: 7, ties: 0, pointsFor: 1728.86, pointsAgainst: 1723.08 },
      { rank: 6, team: "Team 7", manager: "Charles", wins: 7, losses: 7, ties: 0, pointsFor: 1612.5, pointsAgainst: 1695.22 },
      { rank: 7, team: "Lil Fetus Fantasy", manager: "Sami", wins: 7, losses: 7, ties: 0, pointsFor: 1605.7, pointsAgainst: 1678.36 },
      { rank: 8, team: "Mr. Morningstar", manager: "Sanay", wins: 6, losses: 8, ties: 0, pointsFor: 1677.28, pointsAgainst: 1705.76 },
      { rank: 9, team: "Last Place Race", manager: "Cyrus", wins: 5, losses: 9, ties: 0, pointsFor: 1450.46, pointsAgainst: 1604.12 },
      { rank: 10, team: "Saquons Big Fat Brock", manager: "Arav", wins: 4, losses: 10, ties: 0, pointsFor: 1729.08, pointsAgainst: 1779.46 },
    ],
  },
  {
    season: 2023,
    league: "No Punt Intended",
    format: "Snake · 10 teams · 14 games",
    source: "ESPN",
    draftOrder: [
      { pick: 1, team: "KC SingleSami", manager: "Sami" }, // guess (Sami)
      { pick: 2, team: "Jit Tripping" },
      { pick: 3, team: "Last Place Race", manager: "Cyrus" },
      { pick: 4, team: "Team Patel" },
      { pick: 5, team: "Dat N*bba", manager: "Ahan" },
      { pick: 6, team: "Just-In Case" },
      { pick: 7, team: "Ceedeez Nuts", manager: "Ansuman" },
      { pick: 8, team: "Olive Garden", manager: "Jai" },
      { pick: 9, team: "Double D DeRozan" },
      { pick: 10, team: "Chris olave ur face", manager: "Charles" },
    ],
    standings: [
      { rank: 1, team: "Jit Tripping", wins: 10, losses: 4, ties: 0 },
      { rank: 2, team: "Team Patel", wins: 9, losses: 5, ties: 0 },
      { rank: 3, team: "Double D DeRozan", wins: 9, losses: 5, ties: 0 },
      { rank: 4, team: "Ceedeez Nuts", manager: "Ansuman", wins: 7, losses: 7, ties: 0 },
      { rank: 5, team: "Olive Garden", manager: "Jai", wins: 7, losses: 7, ties: 0 },
      { rank: 6, team: "Just-In Case", wins: 7, losses: 7, ties: 0 },
      { rank: 7, team: "Last Place Race", manager: "Cyrus", wins: 6, losses: 8, ties: 0 },
      { rank: 8, team: "Chris olave ur face", manager: "Charles", wins: 6, losses: 8, ties: 0 },
      { rank: 9, team: "Dat N*bba", manager: "Ahan", wins: 5, losses: 9, ties: 0 },
      { rank: 10, team: "KC SingleSami", manager: "Sami", wins: 4, losses: 10, ties: 0 }, // guess
    ],
  },
  {
    season: 2022,
    league: "Guess who's Dak",
    format: "Snake · 10 teams · 2 divisions · 15 games",
    source: "ESPN",
    draftOrder: [
      { pick: 1, team: "Bang Bang" },
      { pick: 2, team: "Ceedeez Nuts", manager: "Ansuman" },
      { pick: 3, team: "Micah god 11 from heaven" },
      { pick: 4, team: "Henry Ruggs Driving School" },
      { pick: 5, team: "Jit Tripping" },
      { pick: 6, team: "New England Jit" },
      { pick: 7, team: "W SuperCyrus", manager: "Cyrus" },
      { pick: 8, team: "Myagi Malladi" },
      { pick: 9, team: "Team Cyril" },
      { pick: 10, team: "Lower house Ben Dover" },
    ],
    standings: [
      { rank: 1, team: "Ceedeez Nuts", manager: "Ansuman", wins: 11, losses: 3, ties: 1, division: "East" },
      { rank: 2, team: "Henry Ruggs Driving School", wins: 11, losses: 4, ties: 0, division: "East" },
      { rank: 3, team: "Bang Bang", wins: 10, losses: 5, ties: 0, division: "East" },
      { rank: 4, team: "New England Jit", wins: 8, losses: 7, ties: 0, division: "West" },
      { rank: 5, team: "Lower house Ben Dover", wins: 7, losses: 7, ties: 1, division: "East" },
      { rank: 6, team: "Jit Tripping", wins: 7, losses: 7, ties: 1, division: "East" },
      { rank: 7, team: "W SuperCyrus", manager: "Cyrus", wins: 6, losses: 8, ties: 1, division: "West" },
      { rank: 8, team: "Micah god 11 from heaven", wins: 6, losses: 9, ties: 0, division: "West" },
      { rank: 9, team: "Myagi Malladi", wins: 6, losses: 9, ties: 0, division: "West" },
      { rank: 10, team: "Team Cyril", wins: 1, losses: 14, ties: 0, division: "West" },
    ],
  },
];
