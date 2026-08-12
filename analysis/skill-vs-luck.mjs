// Skill vs luck in a redraft league. Two questions:
//   1. How much of the standings is skill vs variance?
//   2. Who won more (or fewer) games than their SCORING deserved? (schedule luck)
//
// Expected wins use the "all-play" method: each week, a team earns the fraction
// of the OTHER teams it outscored. Summed over the season that is the record a
// team's scoring earned regardless of which single opponent the schedule drew.
// actual wins - expected wins = schedule luck.
//
//   node analysis/skill-vs-luck.mjs

import { SEASONS, teams, schedule, personOf, allTeamSeasons, pearson } from "./lib/data.mjs";
import { svg, save, GREEN, RED, FG, ORANGE, MUTED, SEASON_COLOR, esc } from "./lib/plot.mjs";

// ---- weekly points per team, per season ----
function weeklyPoints(yr) {
  const byWeek = {}; // week -> { teamId: points }
  for (const g of schedule(yr)) {
    if (g.isPlayoff || g.winner === "UNDECIDED") continue;
    (byWeek[g.week] ||= {})[g.homeId] = g.homePts;
    byWeek[g.week][g.awayId] = g.awayPts;
  }
  return byWeek;
}

// ---- actual + expected (all-play) wins per team-season ----
function seasonRecords(yr) {
  const byWeek = weeklyPoints(yr);
  const out = {}; // teamId -> { actual, expected, games }
  for (const t of teams(yr)) out[t.id] = { actual: 0, expected: 0, games: 0 };

  // actual wins from head-to-head
  for (const g of schedule(yr)) {
    if (g.isPlayoff || g.winner === "UNDECIDED") continue;
    out[g.homeId].games++; out[g.awayId].games++;
    if (g.homePts > g.awayPts) out[g.homeId].actual++;
    else if (g.awayPts > g.homePts) out[g.awayId].actual++;
    else { out[g.homeId].actual += 0.5; out[g.awayId].actual += 0.5; }
  }

  // expected wins: each week, fraction of the other teams you outscored
  for (const week of Object.keys(byWeek)) {
    const scores = byWeek[week];
    const ids = Object.keys(scores).map(Number);
    for (const t of ids) {
      let beaten = 0, tied = 0;
      for (const o of ids) {
        if (o === t) continue;
        if (scores[t] > scores[o]) beaten++;
        else if (scores[t] === scores[o]) tied++;
      }
      out[t].expected += (beaten + tied * 0.5) / (ids.length - 1);
    }
  }
  return out;
}

// ============================================================================
// 1. SKILL vs LUCK IN THE STANDINGS
// ============================================================================
// Compare the real spread of win totals to the coin-flip baseline. Equal 50%
// teams over n games still scatter with variance n*0.25; any excess is skill.

console.log("=".repeat(64));
console.log("SKILL vs LUCK IN THE STANDINGS");
console.log("=".repeat(64));
console.log("season  games  obs SD(wins)  luck SD  skill share");
let sumObs = 0, sumLuck = 0, k = 0;
for (const s of SEASONS) {
  const recs = Object.values(seasonRecords(s.season)).filter((r) => r.games > 0);
  const n = Math.round(recs.reduce((a, r) => a + r.games, 0) / recs.length);
  const mean = recs.reduce((a, r) => a + r.actual, 0) / recs.length;
  const obsVar = recs.reduce((a, r) => a + (r.actual - mean) ** 2, 0) / recs.length;
  const luckVar = n * 0.25;
  const skill = Math.max(0, 1 - luckVar / obsVar);
  console.log(`  ${s.season}    ${String(n).padStart(2)}      ${Math.sqrt(obsVar).toFixed(2)}          ${Math.sqrt(luckVar).toFixed(2)}      ${(skill * 100).toFixed(0)}%`);
  sumObs += obsVar; sumLuck += luckVar; k++;
}
console.log(`  POOLED skill share of the standings: ${((1 - (sumLuck / k) / (sumObs / k)) * 100).toFixed(0)}%  (rest is luck)`);

// Year-over-year persistence (redraft -> pure manager skill, no roster carryover)
const ts = allTeamSeasons();
const byPerson = {};
for (const r of ts) (byPerson[r.person] ||= {})[r.season] = r;
const yrs = SEASONS.map((s) => s.season);
const pairs = [];
for (const p of Object.keys(byPerson)) for (let i = 0; i < yrs.length - 1; i++) {
  const a = byPerson[p][yrs[i]], b = byPerson[p][yrs[i + 1]];
  if (a && b) pairs.push({ person: p, from: yrs[i], ppgA: a.ppg, ppgB: b.ppg, wpA: a.winPct, wpB: b.winPct });
}
const ppgR = pearson(pairs.map((x) => x.ppgA), pairs.map((x) => x.ppgB));
const wpR = pearson(pairs.map((x) => x.wpA), pairs.map((x) => x.wpB));
console.log(`\nYear-over-year persistence (n=${pairs.length} manager pairs, redraft = pure skill):`);
console.log(`  win% : r=${wpR.r.toFixed(2)}  -- winning barely carries over`);
console.log(`  PPG  : r=${ppgR.r.toFixed(2)}  -- scoring (draft+management skill) carries over ~6x more`);

// ============================================================================
// 2. LUCK-ADJUSTED STANDINGS (career: actual wins vs deserved)
// ============================================================================
const careerLuck = {}; // person -> { actual, expected }
for (const s of SEASONS) {
  const recs = seasonRecords(s.season);
  for (const t of teams(s.season)) {
    const person = personOf(s.season, t.id);
    (careerLuck[person] ||= { actual: 0, expected: 0 });
    careerLuck[person].actual += recs[t.id].actual;
    careerLuck[person].expected += recs[t.id].expected;
  }
}
const rows = Object.entries(careerLuck)
  .map(([person, v]) => ({ person, actual: v.actual, expected: v.expected, luck: v.actual - v.expected }))
  .sort((a, b) => b.luck - a.luck);

console.log(`\n${"=".repeat(64)}`);
console.log("LUCK-ADJUSTED CAREER RECORD (actual wins vs what scoring deserved)");
console.log("=".repeat(64));
console.log(`  ${"manager".padEnd(12)}${"actual".padStart(8)}${"deserved".padStart(10)}${"luck".padStart(8)}`);
for (const r of rows) {
  const luck = (r.luck >= 0 ? "+" : "") + r.luck.toFixed(1);
  console.log(`  ${r.person.padEnd(12)}${r.actual.toFixed(1).padStart(8)}${r.expected.toFixed(1).padStart(10)}${luck.padStart(8)}`);
}
console.log("\n  luck = wins above/below the all-play record your scoring earned.");
console.log("  Positive = the schedule handed you wins; negative = you were robbed.");

// ---- plot: career luck (diverging bars) ----
const active = rows.filter((r) => r.actual + r.expected > 6); // drop 1-year cameos
const W = 900, H = 560, ml = 110, mr = 80, mt = 76, mb = 60, pw = W - ml - mr, ph = H - mt - mb;
const maxV = Math.ceil(Math.max(...active.map((r) => Math.abs(r.luck)))) + 1;
const cx = ml + pw / 2, X = (v) => cx + v / maxV * (pw / 2), rowH = ph / active.length;
const s = svg({ W, H, title: "Who got lucky? Career wins vs. what scoring deserved", titleX: ml - 60, subtitle: "actual wins minus all-play expected wins, 2022-2025. Right = schedule-lucky, left = robbed." });
for (let t = -maxV; t <= maxV; t += 2) { s.line(X(t), mt, X(t), mt + ph, { opacity: t === 0 ? 0.22 : 0.05 }); s.text(X(t), mt + ph + 20, (t > 0 ? "+" : "") + t, { fill: "#9a9084", size: 10.5, anchor: "middle" }); }
s.text(cx, mt + ph + 40, "Wins above / below deserved", { fill: "#c9bfb2", size: 12.5, anchor: "middle", weight: 700 });
active.forEach((r, i) => {
  const y = mt + i * rowH + rowH / 2, bh = Math.min(rowH - 8, 24), pos = r.luck >= 0;
  s.text(ml - 14, y + 1, r.person, { fill: FG, size: 13.5, weight: 700, anchor: "end", family: s.display });
  s.text(ml - 14, y + 15, `${r.actual.toFixed(0)} of ${r.expected.toFixed(0)}`, { fill: "#7d7367", size: 9, anchor: "end", cls: "num" });
  const x0 = Math.min(cx, X(r.luck)), wbar = Math.abs(X(r.luck) - cx);
  s.rect(x0, y - bh / 2, wbar, bh, pos ? GREEN : RED, { rx: 4, opacity: 0.85 });
  s.text(pos ? X(r.luck) + 8 : X(r.luck) - 8, y + 4, `${pos ? "+" : ""}${r.luck.toFixed(1)}`, { fill: pos ? GREEN : RED, size: 12.5, weight: 800, anchor: pos ? "start" : "end", cls: "num" });
});
await save("luck-adjusted-standings", s.str());

// ---- plot: year-over-year persistence, scoring vs winning (two panels) ----
async function plotPersistence() {
  const W = 1020, H = 560, mt = 80, mb = 64, gap = 90, ph = H - mt - mb;
  const pw = (W - 70 - 40 - gap) / 2; // two equal panels
  const s2 = svg({ W, H, title: "Scoring is skill; winning is luck", subtitle: "Each dot = one manager, a season (x) vs the next (y). Redraft league — no roster carryover, so this is pure repeatability." });

  // A panel: x = this year, y = next year, with the y=x diagonal ("same as last year").
  function panel(x0, lo, hi, step, fmt, get, model, xlabel) {
    const X = (v) => x0 + (v - lo) / (hi - lo) * pw;
    const Y = (v) => mt + (1 - (v - lo) / (hi - lo)) * ph;
    for (let t = lo; t <= hi + 1e-9; t += step) {
      s2.line(X(t), mt, X(t), mt + ph, { opacity: 0.05 });
      s2.line(x0, Y(t), x0 + pw, Y(t), { opacity: 0.05 });
      s2.text(X(t), mt + ph + 18, fmt(t), { fill: MUTED, size: 10, anchor: "middle" });
      s2.text(x0 - 8, Y(t) + 3, fmt(t), { fill: MUTED, size: 10, anchor: "end" });
    }
    // diagonal y = x: dots on it repeated exactly; above = improved, below = declined.
    s2.line(X(lo), Y(lo), X(hi), Y(hi), { stroke: "#ffffff", opacity: 0.14, dash: "4 4" });
    // regression line
    s2.line(X(lo), Y(model.slope * lo + model.intercept), X(hi), Y(model.slope * hi + model.intercept), { stroke: ORANGE, width: 2, dash: "6 5", opacity: 0.85 });
    for (const p of pairs) { const [x, y] = get(p); s2.circle(X(x), Y(y), 5, SEASON_COLOR[p.from], { opacity: 0.9, stroke: "#1a1611", sw: 0.8 }); }
    s2.text(x0 + pw / 2, mt + ph + 40, xlabel, { fill: "#c9bfb2", size: 12.5, anchor: "middle", weight: 700 });
    return { X, Y };
  }

  // left: PPG
  const lx = 70;
  panel(lx, 100, 145, 15, (t) => String(t), (p) => [p.ppgA, p.ppgB], ppgR, "Points/game");
  s2.rect(lx + 8, mt + 8, 150, 46, "#242019", { rx: 8, stroke: "#ffffff", so: 0.1 });
  s2.text(lx + 20, mt + 28, `SCORING: r = ${ppgR.r.toFixed(2)}`, { fill: GREEN, size: 13, weight: 800 });
  s2.text(lx + 20, mt + 45, "skill — it carries over", { fill: MUTED, size: 10.5 });

  // right: win%
  const rx = lx + pw + gap;
  panel(rx, 0, 0.85, 0.2, (t) => "." + (t * 1000).toFixed(0).padStart(3, "0"), (p) => [p.wpA, p.wpB], wpR, "Win%");
  s2.rect(rx + 8, mt + 8, 150, 46, "#242019", { rx: 8, stroke: "#ffffff", so: 0.1 });
  s2.text(rx + 20, mt + 28, `WINNING: r = ${wpR.r.toFixed(2)}`, { fill: RED, size: 13, weight: 800 });
  s2.text(rx + 20, mt + 45, "luck — it resets", { fill: MUTED, size: 10.5 });

  // shared axis note + season legend
  s2.text(70, H - 14, "dashed diagonal = exactly as good as last year · orange = trend · n=" + pairs.length + " manager-pairs", { fill: MUTED, size: 10.5 });
  let lxg = W - 250; for (const yr of [2022, 2023, 2024]) { s2.circle(lxg, 40, 5, SEASON_COLOR[yr]); s2.text(lxg + 10, 44, `${yr}→${yr + 1}`, { fill: "#c9bfb2", size: 11 }); lxg += 78; }
  await save("scoring-vs-winning-persistence", s2.str());
}
await plotPersistence();
console.log("\nwrote analysis/plots/luck-adjusted-standings.png, scoring-vs-winning-persistence.png");
