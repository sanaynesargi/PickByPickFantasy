// Historical league archive: immutable reference data transcribed from the
// league exports in /images. Extend by adding a season object below.
//
// `manager` is the stable identity across seasons (team names change yearly).
// Manager per team-season is taken from each season's ESPN/Sleeper "Final
// Standings" export (authoritative; team names get reused across people).
// pointsFor/Against are the full regular-season totals for every season.

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
  playoffRank?: number; // final playoff finish (added later, for history only)
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
      { rank: 1, team: "Teeth", manager: "Viraaj", wins: 9, losses: 5, ties: 0, pointsFor: 1799.48, pointsAgainst: 1551.52, playoffRank: 2 },
      { rank: 2, team: "Dat N*bba", manager: "Ahan", wins: 8, losses: 6, ties: 0, pointsFor: 1894.94, pointsAgainst: 1830.5, playoffRank: 7 },
      { rank: 3, team: "Saquons Big Fat Brock", manager: "Arav", wins: 8, losses: 6, ties: 0, pointsFor: 1738.24, pointsAgainst: 1659.02, playoffRank: 6 },
      { rank: 4, team: "Chris olave", manager: "Charles", wins: 7, losses: 7, ties: 0, pointsFor: 1683.04, pointsAgainst: 1626.46, playoffRank: 5 },
      { rank: 5, team: "Mr. Morningstar", manager: "Sanay", wins: 7, losses: 7, ties: 0, pointsFor: 1662.34, pointsAgainst: 1489.9, playoffRank: 3 },
      { rank: 6, team: "Lil Fetus Fantasy", manager: "Sami", wins: 7, losses: 7, ties: 0, pointsFor: 1598.14, pointsAgainst: 1739.34, playoffRank: 1 },
      { rank: 7, team: "Last Place Race", manager: "Cyrus", wins: 7, losses: 7, ties: 0, pointsFor: 1574.24, pointsAgainst: 1627.76, playoffRank: 4 },
      { rank: 8, team: "Olive Garden", manager: "Jai", wins: 7, losses: 7, ties: 0, pointsFor: 1555.8, pointsAgainst: 1594.8, playoffRank: 10 },
      { rank: 9, team: "Ceedeez Nuts", manager: "Ansuman", wins: 6, losses: 8, ties: 0, pointsFor: 1486.28, pointsAgainst: 1655.98, playoffRank: 8 },
      { rank: 10, team: "Project X", manager: "Aarav", wins: 4, losses: 10, ties: 0, pointsFor: 1490.2, pointsAgainst: 1707.42, playoffRank: 9 },
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
  },
  {
    season: 2023,
    league: "No Punt Intended",
    format: "Snake · 10 teams · 14 games",
    source: "ESPN",
    draftOrder: [
      { pick: 1, team: "KC SingleSami", manager: "Sami" },
      { pick: 2, team: "Jit Tripping", manager: "Viraaj" },
      { pick: 3, team: "Last Place Race", manager: "Cyrus" },
      { pick: 4, team: "Team Patel", manager: "Vansh" },
      { pick: 5, team: "Dat N*bba", manager: "Ahan" },
      { pick: 6, team: "Just-In Case", manager: "Arav" },
      { pick: 7, team: "Ceedeez Nuts", manager: "Aarav" },
      { pick: 8, team: "Olive Garden", manager: "Jai" },
      { pick: 9, team: "Double D DeRozan", manager: "Sanay" },
      { pick: 10, team: "Chris olave ur face", manager: "Charles" },
    ],
    standings: [
      { rank: 1, team: "Jit Tripping", manager: "Viraaj", wins: 10, losses: 4, ties: 0, pointsFor: 1970.12, pointsAgainst: 1645.54, playoffRank: 3 },
      { rank: 2, team: "Team Patel", manager: "Vansh", wins: 9, losses: 5, ties: 0, pointsFor: 1666.7, pointsAgainst: 1625.92, playoffRank: 7 },
      { rank: 3, team: "Double D DeRozan", manager: "Sanay", wins: 9, losses: 5, ties: 0, pointsFor: 1793.5, pointsAgainst: 1711.9, playoffRank: 1 },
      { rank: 4, team: "Ceedeez Nuts", manager: "Aarav", wins: 7, losses: 7, ties: 0, pointsFor: 1782.6, pointsAgainst: 1733.6, playoffRank: 6 },
      { rank: 5, team: "Olive Garden", manager: "Jai", wins: 7, losses: 7, ties: 0, pointsFor: 1627.06, pointsAgainst: 1696.18, playoffRank: 2 },
      { rank: 6, team: "Just-In Case", manager: "Arav", wins: 7, losses: 7, ties: 0, pointsFor: 1772.42, pointsAgainst: 1716.48, playoffRank: 5 },
      { rank: 7, team: "Last Place Race", manager: "Cyrus", wins: 6, losses: 8, ties: 0, pointsFor: 1647.02, pointsAgainst: 1717.54, playoffRank: 4 },
      { rank: 8, team: "Chris olave ur face", manager: "Charles", wins: 6, losses: 8, ties: 0, pointsFor: 1435.78, pointsAgainst: 1597.88, playoffRank: 10 },
      { rank: 9, team: "Dat N*bba", manager: "Ahan", wins: 5, losses: 9, ties: 0, pointsFor: 1559.62, pointsAgainst: 1644.34, playoffRank: 9 },
      { rank: 10, team: "KC SingleSami", manager: "Sami", wins: 4, losses: 10, ties: 0, pointsFor: 1500.38, pointsAgainst: 1665.82, playoffRank: 8 },
    ],
  },
  {
    season: 2022,
    league: "Guess who's Dak",
    format: "Snake · 10 teams · 2 divisions · 15 games",
    source: "ESPN",
    draftOrder: [
      { pick: 1, team: "Bang Bang", manager: "Sanay" },
      { pick: 2, team: "Ceedeez Nuts", manager: "Aarav" },
      { pick: 3, team: "Micah god 11 from heaven", manager: "Ahan" },
      { pick: 4, team: "Henry Ruggs Driving School", manager: "Arav" },
      { pick: 5, team: "Jit Tripping", manager: "Viraaj" },
      { pick: 6, team: "New England Jit", manager: "Charles" },
      { pick: 7, team: "W SuperCyrus", manager: "Cyrus" },
      { pick: 8, team: "Myagi Malladi", manager: "Adhi" },
      { pick: 9, team: "Team Cyril", manager: "Cyril" },
      { pick: 10, team: "Lower house Ben Dover", manager: "Vansh" },
    ],
    standings: [
      { rank: 1, team: "Ceedeez Nuts", manager: "Aarav", wins: 11, losses: 3, ties: 1, division: "East", pointsFor: 1907.08, pointsAgainst: 1709.0, playoffRank: 5 },
      { rank: 2, team: "Henry Ruggs Driving School", manager: "Arav", wins: 11, losses: 4, ties: 0, division: "East", pointsFor: 2021.7, pointsAgainst: 1658.54, playoffRank: 2 },
      { rank: 3, team: "Bang Bang", manager: "Sanay", wins: 10, losses: 5, ties: 0, division: "East", pointsFor: 1962.36, pointsAgainst: 1825.84, playoffRank: 1 },
      { rank: 4, team: "New England Jit", manager: "Charles", wins: 8, losses: 7, ties: 0, division: "West", pointsFor: 1843.2, pointsAgainst: 1696.58, playoffRank: 4 },
      { rank: 5, team: "Lower house Ben Dover", manager: "Vansh", wins: 7, losses: 7, ties: 1, division: "East", pointsFor: 1805.3, pointsAgainst: 1746.96, playoffRank: 7 },
      { rank: 6, team: "Jit Tripping", manager: "Viraaj", wins: 7, losses: 7, ties: 1, division: "East", pointsFor: 1792.16, pointsAgainst: 1921.94, playoffRank: 6 },
      { rank: 7, team: "W SuperCyrus", manager: "Cyrus", wins: 6, losses: 8, ties: 1, division: "West", pointsFor: 1677.8, pointsAgainst: 1682.12, playoffRank: 8 },
      { rank: 8, team: "Micah god 11 from heaven", manager: "Ahan", wins: 6, losses: 9, ties: 0, division: "West", pointsFor: 1671.0, pointsAgainst: 1883.12, playoffRank: 3 },
      { rank: 9, team: "Myagi Malladi", manager: "Adhi", wins: 6, losses: 9, ties: 0, division: "West", pointsFor: 1713.58, pointsAgainst: 1808.32, playoffRank: 9 },
      { rank: 10, team: "Team Cyril", manager: "Cyril", wins: 1, losses: 14, ties: 0, division: "West", pointsFor: 1389.34, pointsAgainst: 1851.1, playoffRank: 10 },
    ],
  },
];
