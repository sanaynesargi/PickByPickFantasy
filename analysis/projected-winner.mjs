// How often did the higher-PROJECTED team actually win? A direct test of the
// coin-flip model: if evenly-matched games (small projected margin) land near
// 50%, the binomial approximation is justified for the teams that are bunched
// together — even though lopsided games stay predictable.
//   node analysis/projected-winner.mjs
//
// ESPN seasons only (2022/2023/2025); 2024 was Sleeper and has no projections.

import { SEASONS, schedule, BOX } from "./lib/data.mjs";
import { svg, save, SEASON_COLOR, ORANGE, GREEN, MUTED, FG } from "./lib/plot.mjs";

const isStarter = (slot) => slot !== 20 && slot !== 21;

// A team's projected + actual starter total for a week (null if no projections).
function totals(yr, wk, teamId) {
  const rows = BOX.seasons[yr]?.[wk]?.[teamId];
  if (!rows) return null;
  let proj = 0, act = 0, has = false;
  for (const r of rows) { if (!isStarter(r[1])) continue; act += r[2]; if (r[3] == null) continue; has = true; proj += r[3]; }
  return has ? { proj, act } : null;
}

// Collect every matchup with projections for both sides.
const games = [];
for (const s of SEASONS) {
  for (const g of schedule(s.season)) {
    if (g.winner === "UNDECIDED") continue;
    const h = totals(s.season, g.week, g.homeId), a = totals(s.season, g.week, g.awayId);
    if (!h || !a || h.proj === a.proj) continue;
    games.push({
      season: s.season,
      margin: Math.abs(h.proj - a.proj),
      favWon: (h.proj > a.proj) === (g.homePts > g.awayPts),
      // projection error, for the model curve
      homeErr: g.homePts - h.proj, awayErr: g.awayPts - a.proj,
    });
  }
}

const hit = games.filter((g) => g.favWon).length;
console.log(`Projected winner actually won: ${hit}/${games.length} = ${(hit / games.length * 100).toFixed(1)}%`);

// Team-level projection-error SD -> the combined spread the model uses.
const errs = games.flatMap((g) => [g.homeErr, g.awayErr]);
const meanErr = errs.reduce((a, b) => a + b, 0) / errs.length;
const sd = Math.sqrt(errs.reduce((a, e) => a + (e - meanErr) ** 2, 0) / (errs.length - 1));
const spread = Math.sqrt(2) * sd;
const normCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
console.log(`team projection-error SD = ${sd.toFixed(1)} (combined spread ${spread.toFixed(1)}); model favorite win-rate = ${(games.reduce((a, g) => a + normCdf(g.margin / spread), 0) / games.length * 100).toFixed(1)}%`);

// Empirical calibration by projected-margin bin.
const bins = [[0, 3], [3, 6], [6, 10], [10, 15], [15, 22], [22, 100]];
const binStats = bins.map(([lo, hi]) => {
  const gs = games.filter((g) => g.margin >= lo && g.margin < hi);
  const won = gs.filter((g) => g.favWon).length;
  return { lo, hi, n: gs.length, rate: gs.length ? won / gs.length : null, mid: gs.length ? gs.reduce((a, g) => a + g.margin, 0) / gs.length : (lo + hi) / 2 };
}).filter((b) => b.n > 0);
console.log("\nby projected margin:");
for (const b of binStats) console.log(`  ${(b.lo + "-" + (b.hi === 100 ? "+" : b.hi)).padEnd(6)} pts: ${(b.rate * 100).toFixed(0).padStart(3)}%  (n=${b.n})`);

// ---- plot: calibration curve ----
const W = 880, H = 560, ml = 72, mr = 30, mt = 76, mb = 60, pw = W - ml - mr, ph = H - mt - mb;
const xmax = 28, X = (v) => ml + Math.min(v, xmax) / xmax * pw, Y = (v) => mt + (1 - v) * ph;
const s = svg({ W, H, title: "How often the projected winner actually won", subtitle: "Actual win rate of the higher-projected team, by how big its projected margin was. ESPN 2022/23/25." });
for (let t = 0; t <= 1.0001; t += 0.25) { s.line(ml, Y(t), ml + pw, Y(t), { opacity: t === 0.5 ? 0.25 : 0.06 }); s.text(ml - 10, Y(t) + 4, (t * 100).toFixed(0) + "%", { fill: MUTED, size: 11, anchor: "end" }); }
for (let t = 0; t <= xmax; t += 5) { s.line(X(t), mt, X(t), mt + ph, { opacity: 0.05 }); s.text(X(t), mt + ph + 20, "+" + t, { fill: MUTED, size: 11, anchor: "middle" }); }
s.text(ml + pw / 2, H - 16, "Projected margin (points the favorite was projected to win by)", { fill: "#c9bfb2", size: 12.5, anchor: "middle", weight: 700 });
s.push(`<text transform="translate(20 ${mt + ph / 2}) rotate(-90)" fill="#c9bfb2" font-size="12.5" text-anchor="middle" font-weight="700">Actual win rate of the favorite</text>`);
// 50% coin-flip reference already drawn (the t===0.5 gridline); label it
s.text(ml + pw - 4, Y(0.5) - 6, "coin flip (50%)", { fill: MUTED, size: 10, anchor: "end" });
// model curve
let path = "";
for (let m = 0; m <= xmax; m += 0.5) path += (path ? " L" : "M") + X(m).toFixed(1) + "," + Y(normCdf(m / spread)).toFixed(1);
s.push(`<path d="${path}" fill="none" stroke="${ORANGE}" stroke-width="2" stroke-dasharray="6 5" opacity="0.85"/>`);
s.text(X(24), Y(normCdf(24 / spread)) - 8, "model", { fill: ORANGE, size: 10.5, anchor: "middle", weight: 700 });
// empirical points sized by n
for (const b of binStats) { const r = 4 + Math.sqrt(b.n); s.circle(X(b.mid), Y(b.rate), r, GREEN, { opacity: 0.85, stroke: "#1a1611", sw: 1 }); s.text(X(b.mid), Y(b.rate) - r - 5, (b.rate * 100).toFixed(0) + "%", { fill: FG, size: 11, weight: 800, anchor: "middle", cls: "num" }); s.text(X(b.mid), Y(b.rate) + r + 12, "n=" + b.n, { fill: MUTED, size: 8.5, anchor: "middle" }); }
s.rect(ml + 8, mt + 8, 250, 46, "#242019", { rx: 8, stroke: "#ffffff", so: 0.1 });
s.text(ml + 20, mt + 28, `overall ${(hit / games.length * 100).toFixed(0)}% — but close games are coin flips`, { fill: FG, size: 12.5, weight: 800 });
s.text(ml + 20, mt + 45, `dots = actual (sized by sample), dashed = model`, { fill: MUTED, size: 10 });
await save("projected-winner", s.str());
console.log("\nwrote analysis/plots/projected-winner.png");
