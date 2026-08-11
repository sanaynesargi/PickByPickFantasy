// Minimal SVG chart helpers shared by the analyses, matching the app's look
// (warm-black bg, orange accent, per-season colors). Each analysis builds an SVG
// string and calls save() to rasterize it to analysis/plots/<name>.png via sharp.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PLOTS_DIR = path.resolve(HERE, "..", "plots");

export const BG = "#1a1611";
export const FG = "#f5efe6";
export const MUTED = "#9a9084";
export const ORANGE = "#ff6a1a";
export const GREEN = "#46c48c";
export const RED = "#ec6650";
export const SEASON_COLOR = { 2022: "#e8c260", 2023: "#46c48c", 2024: "#4f9dd6", 2025: "#ff7a30" };

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const DISPLAY = "Bricolage Grotesque, sans-serif";
const BODY = "Hanken Grotesk, system-ui, sans-serif";

// Start an SVG with a title/subtitle. Returns { push, str, W, H, ... }.
export function svg({ W = 860, H = 560, title, subtitle, titleX = 70 }) {
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${BODY}"><rect width="${W}" height="${H}" fill="${BG}"/>`];
  if (title) parts.push(`<text x="${titleX}" y="34" fill="${FG}" font-size="21" font-weight="800" font-family="${DISPLAY}">${esc(title)}</text>`);
  if (subtitle) parts.push(`<text x="${titleX}" y="52" fill="${MUTED}" font-size="12.5">${esc(subtitle)}</text>`);
  return {
    W, H,
    push: (s) => parts.push(s),
    text: (x, y, s, o = {}) => parts.push(`<text x="${x}" y="${y}" fill="${o.fill || FG}" font-size="${o.size || 12}" font-weight="${o.weight || 400}" text-anchor="${o.anchor || "start"}"${o.family ? ` font-family="${o.family}"` : ""}${o.cls ? ` class="${o.cls}"` : ""}>${esc(s)}</text>`),
    line: (x1, y1, x2, y2, o = {}) => parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || "#ffffff"}" stroke-opacity="${o.opacity ?? 0.06}" stroke-width="${o.width || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`),
    circle: (cx, cy, r, fill, o = {}) => parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${o.opacity ?? 1}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ""}/>`),
    rect: (x, y, w, h, fill, o = {}) => parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx || 0}" fill="${fill}" fill-opacity="${o.opacity ?? 1}"${o.stroke ? ` stroke="${o.stroke}" stroke-opacity="${o.so ?? 0.1}"` : ""}/>`),
    display: DISPLAY,
    str: () => parts.join("") + "</svg>",
  };
}

// Season-color legend at (x,y), stacked.
export function legend(s, x, y, years = [2022, 2023, 2024, 2025]) {
  let ly = y;
  for (const yr of years) { s.circle(x, ly, 5, SEASON_COLOR[yr]); s.text(x + 12, ly + 4, String(yr), { fill: "#c9bfb2", size: 12 }); ly += 22; }
  return ly;
}

// A small stat box (top-left annotation).
export function statBox(s, x, y, lines, w = 190) {
  s.rect(x, y, w, 12 + lines.length * 17, "#242019", { rx: 8, stroke: "#ffffff", so: 0.1 });
  lines.forEach((ln, i) => s.text(x + 12, y + 22 + i * 17, ln.text, { fill: ln.fill || FG, size: ln.size || 13, weight: ln.weight || 800 }));
}

// Deterministic jitter in [-amt, amt] from an integer key.
export const jitter = (i, amt) => (((i * 2654435761) >>> 0) % 1000 / 1000 - 0.5) * 2 * amt;

// Greedy label de-collision for scatter points. pts: [{x,y,text}], returns
// placements [{x,y,anchor,text,leader}].
export function placeLabels(pts, rightEdge) {
  const placed = [], out = [];
  const ov = (a, b) => !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
  for (const p of [...pts].sort((a, b) => a.x - b.x)) {
    const w = p.text.length * 4.7 + 3, right = p.x < rightEdge - 46;
    for (const off of [0, -11, 11, -22, 22, -33, 33, -44, 44]) {
      const ly = p.y + 3.5 + off, x1 = right ? p.x + 7 : p.x - 7 - w, box = { x1, y1: ly - 8, x2: x1 + w, y2: ly + 2 };
      if (!placed.some((q) => ov(box, q)) || off === 44) {
        placed.push(box);
        out.push({ x: right ? p.x + 7 : p.x - 7, y: ly, anchor: right ? "start" : "end", text: p.text, leader: Math.abs(off) > 11 ? { x: p.x, y: p.y } : null });
        break;
      }
    }
  }
  return out;
}

// Rasterize an SVG string to analysis/plots/<name>.png (2x) and the .svg source.
export async function save(name, svgStr) {
  fs.mkdirSync(PLOTS_DIR, { recursive: true });
  const svgPath = path.join(PLOTS_DIR, `${name}.svg`);
  const pngPath = path.join(PLOTS_DIR, `${name}.png`);
  fs.writeFileSync(svgPath, svgStr);
  await sharp(Buffer.from(svgStr), { density: 200 }).png().toFile(pngPath);
  return pngPath;
}
