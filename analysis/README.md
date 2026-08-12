# analysis/

Reproducible league analyses over the ESPN + Sleeper data the importers produce.
No network calls — everything reads the committed data files.

Two independent tools live here:
- The **`.mjs` analyses** (below) — historical league stats + plots (Node).
- **`analyze.py`** — the projection-gap tool for your live league (Python + pandas).

## Projection-gap tool (`analyze.py`)

Separates a weekly fantasy projection into stable **roster quality** (season
average) and **schedule luck** (week projection − season average), then converts
point gaps into standard deviations and win probabilities. Methodology and
reasoning: `projection-gap.skill` (a zip; `SKILL.md` inside).

Requires **pandas** (standard library otherwise). Paste your league's numbers by
hand — no ESPN scraping.

```bash
python analyze.py                     # analyze this week (ships with sample data)
python analyze.py --record --week 5   # append this week to the season history
python analyze.py --drift             # roster-quality drift over the season
python analyze.py --check             # run only the worked-example plumbing check
```

| File | Role |
|---|---|
| `league_week.csv` | this week's input — `team,week_proj,season_avg` (edit by hand) |
| `projection_history.csv` | season history — `week,team,week_proj,season_avg,actual`; fill `actual` after each week is played |

Once the history has **4+ weeks of actual scores**, the tool measures your
league's own weekly standard deviation (spread of `actual − week_proj`) and uses
it instead of the 17.0 default — printing which it used and why. The `--drift`
view distinguishes a team *underrated at draft* (roster estimate climbs) from one
that got *lucky early* (roster flat, positive early matchup luck). The shipped
CSVs are synthetic samples; replace them with your league's numbers.

---

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
| `win-vs-scoring.mjs` | `win-vs-ppg`, `win-vs-differential`, `win-residuals` | PPG explains ~63% of win%; PF+PA ~75%; Pythagorean γ≈5.3 |
| `activity.mjs` | `activity-vs-winpct` | Roster churn barely predicts winning (r≈0.2) |
| `trades.mjs` | `trade-skill`, `best-trades`, `trade-before-after` | Who wins their trades (net PPG); most fair trade |
| `skill-vs-luck.mjs` | `luck-adjusted-standings`, `scoring-vs-winning-persistence` | Standings are ~90% luck; scoring persists (r=0.36), winning doesn't (r=0.06); who won more than they deserved |
| `projected-winner.mjs` | `projected-winner` | Higher-projected team won 63% overall — but close games (0-3 pt margin) are 40% coin flips; validates the binomial model |

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
