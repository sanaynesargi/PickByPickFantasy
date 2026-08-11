// Manager activity (roster churn) vs winning. Outputs: activity-vs-winpct.
//   node analysis/activity.mjs

import { activityBySeason, pearson } from "./lib/data.mjs";
import { svg, save, legend, statBox, SEASON_COLOR, ORANGE, placeLabels, jitter } from "./lib/plot.mjs";

const rows = activityBySeason();
const m = pearson(rows.map((r) => r.addsPerWeek), rows.map((r) => r.winPct));
console.log(`activity vs win% (n=${rows.length}): r=${m.r.toFixed(3)} r2=${m.r2.toFixed(3)}`);
const ab = (r) => r.person.slice(0, 3) + "’" + String(r.season).slice(2);

const W = 860, H = 560, ml = 70, mr = 120, mt = 68, mb = 58, pw = W - ml - mr, ph = H - mt - mb;
const xmax = Math.ceil(Math.max(...rows.map((r) => r.addsPerWeek))), ymin = 0, ymax = 0.85;
const X = (v) => ml + v / xmax * pw, Y = (v) => mt + (1 - (v - ymin) / (ymax - ymin)) * ph;
const s = svg({ W, H, title: "Manager activity vs. win%", subtitle: "Roster moves per week (adds) vs regular-season win%. All four seasons 2022-2025." });
for (let t = 0; t <= 0.8; t += 0.2) { s.line(ml, Y(t), ml + pw, Y(t), { opacity: 0.07 }); s.text(ml - 10, Y(t) + 4, "." + (t * 1000).toFixed(0).padStart(3, "0"), { fill: "#9a9084", size: 11, anchor: "end" }); }
for (let t = 0; t <= xmax; t += 1) { s.line(X(t), mt, X(t), mt + ph, { opacity: 0.05 }); s.text(X(t), mt + ph + 20, String(t), { fill: "#9a9084", size: 11, anchor: "middle" }); }
s.text(ml + pw / 2, H - 16, "Roster moves per week (adds)", { fill: "#c9bfb2", size: 13, anchor: "middle", weight: 700 });
s.push(`<text transform="translate(20 ${mt + ph / 2}) rotate(-90)" fill="#c9bfb2" font-size="13" text-anchor="middle" font-weight="700">Regular-season win%</text>`);
s.line(X(0.1), Y(m.slope * 0.1 + m.intercept), X(xmax - 0.2), Y(m.slope * (xmax - 0.2) + m.intercept), { stroke: ORANGE, width: 2, dash: "6 5", opacity: 0.8 });
rows.forEach((r, i) => s.circle(X(r.addsPerWeek) + jitter(i, 6), Y(r.winPct), 4, SEASON_COLOR[r.season], { opacity: 0.75, stroke: "#1a1611", sw: 0.6 }));
for (const L of placeLabels(rows.map((r, i) => ({ x: X(r.addsPerWeek) + jitter(i, 6), y: Y(r.winPct), text: ab(r) })), ml + pw)) { if (L.leader) s.line(L.leader.x, L.leader.y, L.x, L.y - 3, { stroke: "#ffffff", opacity: 0.14 }); s.text(L.x, L.y, L.text, { fill: "#d8cec0", size: 8.5, anchor: L.anchor }); }
legend(s, ml + pw + 22, mt + 8);
statBox(s, ml + 8, mt + 8, [{ text: `r = ${m.r.toFixed(2)} (r² = ${m.r2.toFixed(2)})` }, { text: "activity barely predicts winning", fill: "#9a9084", size: 10.5, weight: 400 }], 180);
await save("activity-vs-winpct", s.str());
console.log("wrote analysis/plots/activity-vs-winpct.png");
