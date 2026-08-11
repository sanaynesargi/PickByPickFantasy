// Win% vs scoring. Shows how well points explain wins, and fits the Pythagorean
// exponent for the league. Outputs: win-vs-ppg, win-vs-differential.
//   node analysis/win-vs-scoring.mjs

import { allTeamSeasons, pearson } from "./lib/data.mjs";
import { svg, save, legend, statBox, SEASON_COLOR, ORANGE, placeLabels } from "./lib/plot.mjs";

const rows = allTeamSeasons();
const ab = (p) => p.person.slice(0, 3) + "’" + String(p.season).slice(2);

// ---- models ----
const ys = rows.map((r) => r.winPct);
const mPF = pearson(rows.map((r) => r.ppg), ys);
const mDiff = pearson(rows.map((r) => r.diff), ys);
// two-way PF+PA via normal equations
function twoWay() {
  let S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], T = [0, 0, 0];
  rows.forEach((r, i) => { const x = [1, r.ppg, r.papg]; for (let a = 0; a < 3; a++) { T[a] += x[a] * ys[i]; for (let b = 0; b < 3; b++) S[a][b] += x[a] * x[b]; } });
  const A = S.map((row, i) => [...row, T[i]]);
  for (let c = 0; c < 3; c++) { let piv = c; for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;[A[c], A[piv]] = [A[piv], A[c]]; const d = A[c][c]; for (let j = c; j < 4; j++) A[c][j] /= d; for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c]; for (let j = c; j < 4; j++) A[r][j] -= f * A[c][j]; } }
  const beta = [A[0][3], A[1][3], A[2][3]], pred = rows.map((r) => beta[0] + beta[1] * r.ppg + beta[2] * r.papg);
  const my = ys.reduce((a, b) => a + b) / ys.length, ssT = ys.reduce((s, y) => s + (y - my) ** 2, 0), ssR = ys.reduce((s, y, i) => s + (y - pred[i]) ** 2, 0);
  return 1 - ssR / ssT;
}
// Pythagorean gamma (NLS grid)
function pythGamma() {
  const my = ys.reduce((a, b) => a + b) / ys.length, ssT = ys.reduce((s, y) => s + (y - my) ** 2, 0);
  let best = 1, bestR2 = -1e9;
  for (let g = 0.5; g <= 12; g += 0.01) {
    const ssR = rows.reduce((s, r) => { const p = r.ppg ** g / (r.ppg ** g + r.papg ** g); return s + (r.winPct - p) ** 2; }, 0);
    const r2 = 1 - ssR / ssT; if (r2 > bestR2) { bestR2 = r2; best = g; }
  }
  return { gamma: best, r2: bestR2 };
}
const g = pythGamma();
console.log(`win% models (n=${rows.length}):`);
console.log(`  PF only            r=${mPF.r.toFixed(3)}  r2=${mPF.r2.toFixed(3)}`);
console.log(`  point differential r2=${mDiff.r2.toFixed(3)}`);
console.log(`  two-way PF+PA      r2=${twoWay().toFixed(3)}`);
console.log(`  Pythagorean        gamma=${g.gamma.toFixed(2)}  r2=${g.r2.toFixed(3)}`);

// ---- plot 1: win% vs ppg ----
async function plotWinPPG() {
  const ml = 70, mr = 120, mt = 68, mb = 58, W = 860, H = 560, pw = W - ml - mr, ph = H - mt - mb;
  const xmin = 90, xmax = 142, ymin = 0, ymax = 0.85;
  const X = (v) => ml + (v - xmin) / (xmax - xmin) * pw, Y = (v) => mt + (1 - (v - ymin) / (ymax - ymin)) * ph;
  const s = svg({ W, H, title: "Win% vs. points per game", subtitle: "Each dot = one team-season, regular season only (2022-2025)." });
  for (let t = 0; t <= 0.8; t += 0.2) { s.line(ml, Y(t), ml + pw, Y(t), { opacity: 0.07 }); s.text(ml - 10, Y(t) + 4, "." + (t * 1000).toFixed(0).padStart(3, "0"), { fill: "#9a9084", size: 11, anchor: "end" }); }
  for (let t = 90; t <= 140; t += 10) { s.line(X(t), mt, X(t), mt + ph, { opacity: 0.05 }); s.text(X(t), mt + ph + 20, String(t), { fill: "#9a9084", size: 11, anchor: "middle" }); }
  s.text(ml + pw / 2, H - 16, "Average points per game", { fill: "#c9bfb2", size: 13, anchor: "middle", weight: 700 });
  s.push(`<text transform="translate(20 ${mt + ph / 2}) rotate(-90)" fill="#c9bfb2" font-size="13" text-anchor="middle" font-weight="700">Regular-season win%</text>`);
  s.line(X(91), Y(mPF.slope * 91 + mPF.intercept), X(141), Y(mPF.slope * 141 + mPF.intercept), { stroke: ORANGE, width: 2, dash: "6 5", opacity: 0.85 });
  for (const r of rows) s.circle(X(r.ppg), Y(r.winPct), 5, SEASON_COLOR[r.season], { opacity: 0.92, stroke: "#1a1611", sw: 0.8 });
  for (const L of placeLabels(rows.map((r) => ({ x: X(r.ppg), y: Y(r.winPct), text: ab(r) })), ml + pw)) { if (L.leader) s.line(L.leader.x, L.leader.y, L.x, L.y - 3, { stroke: "#ffffff", opacity: 0.14 }); s.text(L.x, L.y, L.text, { fill: "#d8cec0", size: 8.5, anchor: L.anchor }); }
  legend(s, ml + pw + 22, mt + 8);
  statBox(s, ml + 8, mt + 8, [{ text: `r = ${mPF.r.toFixed(2)}  (r² = ${mPF.r2.toFixed(2)})` }, { text: "strong positive correlation", fill: "#9a9084", size: 10.5, weight: 400 }], 155);
  await save("win-vs-ppg", s.str());
}

// ---- plot 2: win% vs point differential (with pythagorean note) ----
async function plotDiff() {
  const ml = 72, mr = 120, mt = 68, mb = 58, W = 860, H = 560, pw = W - ml - mr, ph = H - mt - mb;
  const dmin = Math.min(...rows.map((r) => r.diff)), dmax = Math.max(...rows.map((r) => r.diff));
  const xmin = Math.floor((dmin - 2) / 5) * 5, xmax = Math.ceil((dmax + 2) / 5) * 5, ymin = 0, ymax = 0.85;
  const X = (v) => ml + (v - xmin) / (xmax - xmin) * pw, Y = (v) => mt + (1 - (v - ymin) / (ymax - ymin)) * ph;
  const s = svg({ W, H, title: "Win% vs. point differential per game", subtitle: "PF minus PA. Regular season only (2022-2025)." });
  for (let t = 0; t <= 0.8; t += 0.2) { s.line(ml, Y(t), ml + pw, Y(t), { opacity: 0.07 }); s.text(ml - 10, Y(t) + 4, "." + (t * 1000).toFixed(0).padStart(3, "0"), { fill: "#9a9084", size: 11, anchor: "end" }); }
  for (let t = xmin; t <= xmax; t += 5) { s.line(X(t), mt, X(t), mt + ph, { opacity: t === 0 ? 0.22 : 0.05 }); s.text(X(t), mt + ph + 20, (t > 0 ? "+" : "") + t, { fill: "#9a9084", size: 11, anchor: "middle" }); }
  s.text(ml + pw / 2, H - 16, "Point differential per game (PF − PA)", { fill: "#c9bfb2", size: 13, anchor: "middle", weight: 700 });
  s.push(`<text transform="translate(20 ${mt + ph / 2}) rotate(-90)" fill="#c9bfb2" font-size="13" text-anchor="middle" font-weight="700">Regular-season win%</text>`);
  s.line(X(xmin + 1), Y(mDiff.slope * (xmin + 1) + mDiff.intercept), X(xmax - 1), Y(mDiff.slope * (xmax - 1) + mDiff.intercept), { stroke: ORANGE, width: 2, dash: "6 5", opacity: 0.85 });
  for (const r of rows) s.circle(X(r.diff), Y(r.winPct), 5, SEASON_COLOR[r.season], { opacity: 0.92, stroke: "#1a1611", sw: 0.8 });
  for (const L of placeLabels(rows.map((r) => ({ x: X(r.diff), y: Y(r.winPct), text: ab(r) })), ml + pw)) { if (L.leader) s.line(L.leader.x, L.leader.y, L.x, L.y - 3, { stroke: "#ffffff", opacity: 0.14 }); s.text(L.x, L.y, L.text, { fill: "#d8cec0", size: 8.5, anchor: L.anchor }); }
  legend(s, ml + pw + 22, mt + 8);
  statBox(s, ml + 8, mt + 8, [{ text: `R² = ${mDiff.r2.toFixed(2)} (differential)` }, { text: `Pythagorean γ = ${g.gamma.toFixed(1)}, R² = ${g.r2.toFixed(2)}`, fill: "#c9bfb2", size: 11, weight: 400 }], 200);
  await save("win-vs-differential", s.str());
}

// ---- plot 3: residuals (over/underachievers vs scoring-predicted win%) ----
async function plotResiduals() {
  const withRes = rows.map((r) => ({ ...r, pred: mPF.slope * r.ppg + mPF.intercept })).map((r) => ({ ...r, resid: r.winPct - r.pred }));
  const sd = Math.sqrt(withRes.reduce((a, r) => a + r.resid ** 2, 0) / withRes.length);
  const ml = 76, mr = 120, mt = 68, mb = 58, W = 860, H = 560, pw = W - ml - mr, ph = H - mt - mb;
  const xmin = 90, xmax = 142, ymin = -0.3, ymax = 0.3;
  const X = (v) => ml + (v - xmin) / (xmax - xmin) * pw, Y = (v) => mt + (1 - (v - ymin) / (ymax - ymin)) * ph;
  const s = svg({ W, H, title: "Residuals: win% above / below what scoring predicts", subtitle: "Positive = won more than the points deserved (clutch/lucky). Negative = scored but lost." });
  for (let t = -0.3; t <= 0.3 + 1e-9; t += 0.1) { const z = Math.abs(t) < 1e-9; s.line(ml, Y(t), ml + pw, Y(t), { stroke: z ? ORANGE : "#ffffff", opacity: z ? 0.5 : 0.07, width: z ? 1.5 : 1 }); s.text(ml - 10, Y(t) + 4, (t > 1e-9 ? "+" : "") + t.toFixed(1), { fill: "#9a9084", size: 11, anchor: "end" }); }
  for (let t = 90; t <= 140; t += 10) { s.line(X(t), mt, X(t), mt + ph, { opacity: 0.05 }); s.text(X(t), mt + ph + 20, String(t), { fill: "#9a9084", size: 11, anchor: "middle" }); }
  s.text(ml + pw / 2, H - 16, "Average points per game", { fill: "#c9bfb2", size: 13, anchor: "middle", weight: 700 });
  s.push(`<text transform="translate(20 ${mt + ph / 2}) rotate(-90)" fill="#c9bfb2" font-size="13" text-anchor="middle" font-weight="700">Residual (win% − predicted)</text>`);
  for (const r of withRes) s.circle(X(r.ppg), Y(r.resid), 5, SEASON_COLOR[r.season], { opacity: 0.92, stroke: "#1a1611", sw: 0.8 });
  for (const L of placeLabels(withRes.map((r) => ({ x: X(r.ppg), y: Y(r.resid), text: ab(r) })), ml + pw)) { if (L.leader) s.line(L.leader.x, L.leader.y, L.x, L.y - 3, { stroke: "#ffffff", opacity: 0.14 }); s.text(L.x, L.y, L.text, { fill: "#d8cec0", size: 8.5, anchor: L.anchor }); }
  const ly = legend(s, ml + pw + 22, mt + 8);
  s.text(ml + pw + 16, ly + 8, `resid SD = ${sd.toFixed(3)}`, { fill: "#7d7367", size: 9.5 });
  await save("win-residuals", s.str());
}

await plotWinPPG();
await plotDiff();
await plotResiduals();
console.log("wrote analysis/plots/win-vs-ppg.png, win-vs-differential.png, win-residuals.png");
