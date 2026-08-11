# analysis/

Reproducible league analyses over the ESPN + Sleeper data the importers produce.
No network calls — everything reads the committed data files.

## Data sources

| File | Contents | Refreshed by |
|---|---|---|
| `lib/league.json` | ESPN seasons 2022/2023/2025 (standings, schedule, draft) | `scripts/espn-import.mjs` |
| `lib/boxscores.json` | Per-week lineups + per-player points, all 4 seasons | `scripts/espn-boxscores.mjs` + `scripts/sleeper-boxscores.mjs` |
| `lib/history-data.ts` → `SLEEPER_2024_RICH` | Hand/Sleeper 2024 season (ESPN was a ghost that year) | manual + Sleeper |

## Run

```bash
node analysis/run-all.mjs        # regenerate every plot
node analysis/win-vs-scoring.mjs # or run one analysis
```

Plots (PNG @ 2x + SVG source) are written to `analysis/plots/`.

## Shared library (`analysis/lib/`)

- **`data.mjs`** — the single source of truth for derived data: `allTeamSeasons()`,
  `teamSeason()`, `personOf()` (honors the 2022 handoff), `roster()`, `playerPPG()`
  (full production, bench included), `activityBySeason()`, `detectTrades()` /
  `tradeValue()`, `pearson()`. Import from here — don't re-derive.
- **`plot.mjs`** — SVG chart helpers matching the app's look (season colors,
  scatter/bar primitives, label de-collision, `save()` → PNG via sharp).

## Analyses

| Script | Outputs | Headline |
|---|---|---|
| `win-vs-scoring.mjs` | `win-vs-ppg`, `win-vs-differential` | PPG explains ~63% of win%; PF+PA ~75%; Pythagorean γ≈5.3 |
| `activity.mjs` | `activity-vs-winpct` | Roster churn barely predicts winning (r≈0.2) |
| `trades.mjs` | `trade-skill`, `best-trades` | Who wins their trades (net PPG); most fair trade |

## Adding an analysis

Create `analysis/<name>.mjs`, import from `./lib/data.mjs` and `./lib/plot.mjs`,
build an SVG and `await save("<plot-name>", svg.str())`. `run-all.mjs` picks it up
automatically.

## Caveats

- Trade detection is a **heuristic** (ESPN exposes no transaction log): reciprocal
  week-to-week roster crossings, confirmed by a stickiness check. It can't see
  pre-season/draft-day trades or players traded-then-dropped within a week. 2024
  trades could be made authoritative from Sleeper's transaction endpoint.
- 2024 regular season is complete (weeks 5 & 13 backfilled from Sleeper); all four
  seasons' records match the official standings.
