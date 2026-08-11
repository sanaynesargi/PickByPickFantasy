// Trade analyses. Outputs: trade-skill (avg net PPG/trade per manager), best-trades
// (most lopsided), and the most fair trade.
//   node analysis/trades.mjs

import { detectTrades, tradeValue, teamSeason, schedule, hasBox } from "./lib/data.mjs";
import { svg, save, GREEN, RED, FG, SEASON_COLOR, esc } from "./lib/plot.mjs";

const trades = detectTrades().map((t) => ({ ...t, value: tradeValue(t) })); // value = A's perspective
const short = (arr) => arr.map((p) => { const w = p.name.split(" "); return w.length > 1 ? w[0][0] + ". " + w.slice(1).join(" ") : p.name; }).join(", ");

// ---- per-manager avg net PPG per trade ----
const perM = {};
for (const t of trades) { (perM[t.a] = perM[t.a] || []).push(t.value); (perM[t.b] = perM[t.b] || []).push(-t.value); }
const skill = Object.entries(perM).map(([p, v]) => ({ p, n: v.length, avg: v.reduce((a, b) => a + b, 0) / v.length })).sort((a, b) => b.avg - a.avg);
console.log(`${trades.length} trades. Avg net PPG per trade:`);
skill.forEach((r) => console.log(`  ${r.p.padEnd(9)} ${r.avg >= 0 ? "+" : ""}${r.avg.toFixed(1)} (n=${r.n})`));

// most fair + best
const fair = [...trades].sort((a, b) => Math.abs(a.value) - Math.abs(b.value))[0];
const fairGot = fair.value >= 0 ? fair.aGot : fair.bGot, fairGave = fair.value >= 0 ? fair.bGot : fair.aGot;
const fairWin = fair.value >= 0 ? fair.a : fair.b, fairLose = fair.value >= 0 ? fair.b : fair.a;
console.log(`\nMost fair: ${fair.season} wk${fair.week} — ${fairWin} (${short(fairGot)}) <-> ${fairLose} (${short(fairGave)}), net ${Math.abs(fair.value).toFixed(2)} PPG`);

// ---- plot: trade skill (diverging bars) ----
async function plotSkill() {
  const W = 940, H = 640, ml = 110, mr = 90, mt = 76, mb = 96, pw = W - ml - mr, ph = H - mt - mb;
  const maxV = Math.ceil(Math.max(...skill.map((r) => Math.abs(r.avg))) / 2) * 2 + 2;
  const cx = ml + pw / 2, X = (v) => cx + v / maxV * (pw / 2), rowH = ph / skill.length;
  const s = svg({ W, H, title: "Who wins their trades?", titleX: ml - 60, subtitle: "Average net PPG per trade (post-trade points of players received minus given). In-season trades, 2022-2025." });
  for (let t = -maxV; t <= maxV; t += 2) { s.line(X(t), mt, X(t), mt + ph, { opacity: t === 0 ? 0.22 : 0.05 }); s.text(X(t), mt + ph + 20, (t > 0 ? "+" : "") + t, { fill: "#9a9084", size: 10.5, anchor: "middle" }); }
  s.text(cx, mt + ph + 40, "Avg net PPG per trade  (right = won value, left = lost value)", { fill: "#c9bfb2", size: 12.5, anchor: "middle", weight: 700 });
  skill.forEach((r, i) => {
    const y = mt + i * rowH + rowH / 2, bh = Math.min(rowH - 8, 22), pos = r.avg >= 0;
    s.text(ml - 14, y + 4, r.p, { fill: "#f5efe6", size: 13.5, weight: 700, anchor: "end", family: s.display });
    s.text(ml - 14, y + 17, `${r.n} trade${r.n > 1 ? "s" : ""}`, { fill: "#7d7367", size: 9, anchor: "end", cls: "num" });
    const x0 = Math.min(cx, X(r.avg)), wbar = Math.abs(X(r.avg) - cx);
    s.rect(x0, y - bh / 2, wbar, bh, pos ? GREEN : RED, { rx: 4, opacity: 0.85 });
    s.text(pos ? X(r.avg) + 8 : X(r.avg) - 8, y + 4, `${pos ? "+" : ""}${r.avg.toFixed(1)}`, { fill: pos ? GREEN : RED, size: 12.5, weight: 800, anchor: pos ? "start" : "end", cls: "num" });
  });
  const fy = mt + ph + 62;
  s.rect(ml - 60, fy, W - ml - mr + 90, 30, "#242019", { rx: 8, stroke: "#ffffff", so: 0.1 });
  s.push(`<text x="${ml - 48}" y="${fy + 20}" fill="#f5efe6" font-size="12"><tspan font-weight="800" fill="#c9a94a">Most fair trade ever:</tspan> ${fair.season} wk${fair.week} — ${esc(fairWin)} (${esc(short(fairGot))}) &#8596; ${esc(fairLose)} (${esc(short(fairGave))}) &#183; net ${Math.abs(fair.value).toFixed(2)} PPG</text>`);
  await save("trade-skill", s.str());
}

// ---- plot: best trades (horizontal bars, most lopsided) ----
async function plotBest() {
  const top = [...trades].map((t) => ({ ...t, margin: Math.abs(t.value), winner: t.value >= 0 ? t.a : t.b, got: t.value >= 0 ? t.aGot : t.bGot, gave: t.value >= 0 ? t.bGot : t.aGot })).sort((a, b) => b.margin - a.margin).slice(0, 12);
  const W = 1000, H = 700, ml = 250, mr = 70, mt = 76, mb = 54, pw = W - ml - mr, ph = H - mt - mb;
  const maxM = Math.ceil(Math.max(...top.map((t) => t.margin)) / 5) * 5, X = (v) => ml + v / maxM * pw, rowH = ph / top.length;
  const s = svg({ W, H, title: "Best trades — who won, by production", titleX: ml - 190, subtitle: "Net post-trade PPG (points the players you got scored, minus the players you gave). In-season, 2022-2025." });
  for (let t = 0; t <= maxM; t += 5) { s.line(X(t), mt, X(t), mt + ph, { opacity: 0.06 }); s.text(X(t), mt + ph + 20, "+" + t, { fill: "#9a9084", size: 11, anchor: "middle" }); }
  s.text(ml + pw / 2, H - 14, "Net PPG advantage to the winner", { fill: "#c9bfb2", size: 12.5, anchor: "middle", weight: 700 });
  top.forEach((t, i) => {
    const y = mt + i * rowH + rowH / 2, bh = Math.min(rowH - 10, 26);
    s.push(`<text x="${ml - 12}" y="${y - 2}" fill="#f5efe6" font-size="14" font-weight="800" text-anchor="end" font-family="${s.display}">${esc(t.winner)} <tspan fill="#7d7367" font-size="10" font-weight="600">'${String(t.season).slice(2)} wk${t.week}</tspan></text>`);
    s.text(ml - 12, y + 12, "+ " + short(t.got), { fill: "#8fd0b0", size: 9.5, anchor: "end" });
    s.rect(ml, y - bh / 2, X(t.margin) - ml, bh, SEASON_COLOR[t.season], { rx: 4, opacity: 0.85 });
    s.text(X(t.margin) + 8, y + 4, "+" + t.margin.toFixed(1), { fill: "#f5efe6", size: 13, weight: 800, cls: "num" });
    s.text(ml + 6, y + 4, "gave " + short(t.gave), { fill: "#1a1611", size: 9, weight: 700, opacity: 0.75 });
  });
  let lx = ml - 190; const ly = H - 30;
  for (const yr of [2022, 2023, 2024, 2025]) { s.circle(lx, ly, 5, SEASON_COLOR[yr]); s.text(lx + 10, ly + 4, String(yr), { fill: "#c9bfb2", size: 11 }); lx += 66; }
  await save("best-trades", s.str());
}

// ---- plot: team reg-season PPG before vs after each trade (slope chart) ----
async function plotBeforeAfter() {
  // per trade, each of the two teams' reg PPG split at the trade week
  const gamePts = (yr, teamId) => { const m = {}; for (const gm of schedule(yr)) { if (gm.isPlayoff || gm.winner === "UNDECIDED") continue; if (gm.homeId === teamId) m[gm.week] = gm.homePts; else if (gm.awayId === teamId) m[gm.week] = gm.awayPts; } return m; };
  const obs = [];
  for (const t of trades) {
    if (!hasBox(t.season)) continue;
    for (const teamId of [t.teamA, t.teamB]) {
      const g = gamePts(t.season, teamId);
      const wks = Object.keys(g).map(Number);
      const before = wks.filter((w) => w < t.week), after = wks.filter((w) => w >= t.week);
      if (before.length >= 2 && after.length >= 2) {
        obs.push({ season: t.season, before: before.reduce((s, w) => s + g[w], 0) / before.length, after: after.reduce((s, w) => s + g[w], 0) / after.length });
      }
    }
  }
  const mb = obs.reduce((a, r) => a + r.before, 0) / obs.length, ma = obs.reduce((a, r) => a + r.after, 0) / obs.length;
  const up = obs.filter((r) => r.after > r.before).length;
  console.log(`\nbefore/after PPG: ${mb.toFixed(1)} -> ${ma.toFixed(1)} (${(ma - mb).toFixed(1)}); ${up}/${obs.length} improved`);
  const W = 820, H = 580, ml = 76, mr = 120, mt = 70, mb2 = 64, pw = W - ml - mr, ph = H - mt - mb2;
  const ymin = 80, ymax = 160, Y = (v) => mt + (1 - (v - ymin) / (ymax - ymin)) * ph;
  const xB = ml + pw * 0.30, xA = ml + pw * 0.70;
  const s = svg({ W, H, title: "Does a trade change your scoring?", titleX: ml - 30, subtitle: "Each line = a team that traded: its reg-season PPG before vs after the trade. 2022-2025." });
  for (let t = 90; t <= 150; t += 15) { s.line(ml, Y(t), ml + pw, Y(t), { opacity: 0.06 }); s.text(ml - 12, Y(t) + 4, String(t), { fill: "#9a9084", size: 11, anchor: "end", cls: "num" }); }
  s.push(`<text transform="translate(24 ${mt + ph / 2}) rotate(-90)" fill="#c9bfb2" font-size="13" text-anchor="middle" font-weight="700">Regular-season points / game</text>`);
  s.line(xB, mt, xB, mt + ph, { opacity: 0.12 }); s.line(xA, mt, xA, mt + ph, { opacity: 0.12 });
  s.text(xB, mt + ph + 28, "Before trade", { fill: FG, size: 14, weight: 700, anchor: "middle", family: s.display });
  s.text(xA, mt + ph + 28, "After trade", { fill: FG, size: 14, weight: 700, anchor: "middle", family: s.display });
  for (const r of obs) { s.line(xB, Y(r.before), xA, Y(r.after), { stroke: SEASON_COLOR[r.season], width: 1.4, opacity: 0.5 }); s.circle(xB, Y(r.before), 3, SEASON_COLOR[r.season], { opacity: 0.8 }); s.circle(xA, Y(r.after), 3, SEASON_COLOR[r.season], { opacity: 0.8 }); }
  s.line(xB, Y(mb), xA, Y(ma), { stroke: FG, width: 3.5, opacity: 1 });
  s.circle(xB, Y(mb), 6, FG); s.circle(xA, Y(ma), 6, FG);
  s.text(xB - 12, Y(mb) + 4, mb.toFixed(1), { fill: FG, size: 13, weight: 800, anchor: "end", cls: "num" });
  s.text(xA + 12, Y(ma) + 4, ma.toFixed(1), { fill: FG, size: 13, weight: 800, cls: "num" });
  s.rect(ml + 8, mt + 6, 212, 46, "#242019", { rx: 8, stroke: "#ffffff", so: 0.1 });
  s.text(ml + 20, mt + 26, `mean ${(ma - mb).toFixed(1)} PPG after trading`, { fill: FG, size: 13, weight: 800 });
  s.text(ml + 20, mt + 44, `${up}/${obs.length} (${(up / obs.length * 100).toFixed(0)}%) scored more after`, { fill: "#9a9084", size: 10.5 });
  let ly = mt + 8; for (const yr of [2022, 2023, 2024, 2025]) { s.circle(ml + pw + 22, ly, 5, SEASON_COLOR[yr]); s.text(ml + pw + 34, ly + 4, String(yr), { fill: "#c9bfb2", size: 12 }); ly += 22; }
  await save("trade-before-after", s.str());
}

await plotSkill();
await plotBest();
await plotBeforeAfter();
console.log("wrote analysis/plots/trade-skill.png, best-trades.png, trade-before-after.png");
