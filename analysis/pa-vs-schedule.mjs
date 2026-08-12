// Is a team's Points Against explained by WHO it was scheduled against, or by
// noise? For each team-season, estimated PA = sum of each week's opponent's
// season-average points (the PA you'd "expect" from your schedule's strength).
// Plot that against actual PA. A high correlation means the schedule drives PA;
// a low one means PA is mostly opponents randomly running hot/cold against you.
//   node analysis/pa-vs-schedule.mjs

import { SEASONS, teams, schedule, personOf, teamSeason, pearson } from "./lib/data.mjs";
import { svg, save, SEASON_COLOR, ORANGE, MUTED, placeLabels } from "./lib/plot.mjs";

// season-average points per game for every team-season
const ppg = new Map(); // `${season}:${teamId}` -> ppg
for (const s of SEASONS) for (const t of teams(s.season)) ppg.set(`${s.season}:${t.id}`, teamSeason(s.season, t.id).ppg);

const rows = [];
for (const s of SEASONS) {
  for (const t of teams(s.season)) {
    let estPA = 0, weeks = 0;
    for (const g of schedule(s.season)) {
      if (g.isPlayoff || g.winner === "UNDECIDED") continue;
      const oppId = g.homeId === t.id ? g.awayId : g.awayId === t.id ? g.homeId : null;
      if (oppId == null) continue;
      estPA += ppg.get(`${s.season}:${oppId}`); // opponent's season-average score
      weeks++;
    }
    const actualPA = teamSeason(s.season, t.id).pa;
    rows.push({ season: s.season, person: personOf(s.season, t.id), estPA, actualPA, weeks });
  }
}

const m = pearson(rows.map((r) => r.estPA), rows.map((r) => r.actualPA));
console.log(`estimated PA (schedule strength) vs actual PA, n=${rows.length}`);
console.log(`  r = ${m.r.toFixed(3)}  (r² = ${m.r2.toFixed(3)})`);
const estSD = Math.sqrt(rows.reduce((a, r) => a + (r.estPA - rows.reduce((x, y) => x + y.estPA, 0) / rows.length) ** 2, 0) / rows.length);
const actSD = Math.sqrt(rows.reduce((a, r) => a + (r.actualPA - rows.reduce((x, y) => x + y.actualPA, 0) / rows.length) ** 2, 0) / rows.length);
console.log(`  spread of estimated PA (schedule): SD ${estSD.toFixed(0)} pts`);
console.log(`  spread of actual PA:               SD ${actSD.toFixed(0)} pts`);

// ---- plot: estimated vs actual PA ----
const W = 820, H = 600, ml = 78, mr = 30, mt = 76, mb = 60, pw = W - ml - mr, ph = H - mt - mb;
const all = rows.flatMap((r) => [r.estPA, r.actualPA]);
const lo = Math.floor(Math.min(...all) / 100) * 100, hi = Math.ceil(Math.max(...all) / 100) * 100;
const X = (v) => ml + (v - lo) / (hi - lo) * pw, Y = (v) => mt + (1 - (v - lo) / (hi - lo)) * ph;
const s = svg({ W, H, title: "Is Points Against schedule or luck?", subtitle: "Estimated PA (sum of opponents' season-average scores) vs actual PA. Each dot = one team-season." });
for (let t = lo; t <= hi + 1e-9; t += 200) {
  s.line(ml, Y(t), ml + pw, Y(t), { opacity: 0.06 }); s.line(X(t), mt, X(t), mt + ph, { opacity: 0.06 });
  s.text(ml - 8, Y(t) + 4, String(t), { fill: MUTED, size: 10, anchor: "end" }); s.text(X(t), mt + ph + 18, String(t), { fill: MUTED, size: 10, anchor: "middle" });
}
s.text(ml + pw / 2, H - 14, "Estimated PA — strength of schedule faced", { fill: "#c9bfb2", size: 12.5, anchor: "middle", weight: 700 });
s.push(`<text transform="translate(22 ${mt + ph / 2}) rotate(-90)" fill="#c9bfb2" font-size="12.5" text-anchor="middle" font-weight="700">Actual points against</text>`);
// y = x reference (what you'd score against if opponents hit their average exactly)
s.line(X(lo), Y(lo), X(hi), Y(hi), { stroke: "#ffffff", opacity: 0.16, dash: "4 4" });
// regression
s.line(X(lo), Y(m.slope * lo + m.intercept), X(hi), Y(m.slope * hi + m.intercept), { stroke: ORANGE, width: 2, dash: "6 5", opacity: 0.85 });
for (const r of rows) s.circle(X(r.estPA), Y(r.actualPA), 5, SEASON_COLOR[r.season], { opacity: 0.9, stroke: "#1a1611", sw: 0.8 });
for (const L of placeLabels(rows.map((r) => ({ x: X(r.estPA), y: Y(r.actualPA), text: r.person.slice(0, 3) + "’" + String(r.season).slice(2) })), ml + pw)) { s.text(L.x, L.y, L.text, { fill: "#d8cec0", size: 8, anchor: L.anchor }); }
s.rect(ml + 8, mt + 8, 200, 46, "#242019", { rx: 8, stroke: "#ffffff", so: 0.1 });
s.text(ml + 20, mt + 28, `r = ${m.r.toFixed(2)}  (r² = ${m.r2.toFixed(2)})`, { fill: "#f5efe6", size: 13, weight: 800 });
s.text(ml + 20, mt + 45, m.r2 < 0.15 ? "schedule barely predicts PA — it's noise" : "schedule explains some PA", { fill: MUTED, size: 10.5 });
let lx = ml + pw - 4; for (const yr of [2025, 2024, 2023, 2022]) { s.text(lx, mt + 12, String(yr), { fill: SEASON_COLOR[yr], size: 11, anchor: "end", weight: 700 }); lx -= 42; }
await save("pa-vs-schedule", s.str());
console.log("\nwrote analysis/plots/pa-vs-schedule.png");
