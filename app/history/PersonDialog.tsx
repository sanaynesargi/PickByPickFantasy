"use client";

import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Stack,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { personSeasons, careers } from "@/lib/history-stats";

const REG = "#ff7a30"; // regular-season finish (brand orange)
const PO = "#4f9dd6"; // playoff finish (CVD-safe blue)
const N = 10; // league size

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function rec(r: { wins: number; losses: number; ties: number }) {
  return r.ties > 0 ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
}

function FinishChart({ seasons }: { seasons: ReturnType<typeof personSeasons> }) {
  const W = 320;
  const H = 176;
  const padL = 30;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = seasons.length;

  const xFor = (i: number) => (n === 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const yFor = (finish: number) => padT + ((finish - 1) / (N - 1)) * plotH;

  const line = (key: "rank" | "po") =>
    seasons
      .map((s, i) => ({ i, v: s[key] }))
      .filter((p) => p.v !== undefined)
      .map((p) => `${xFor(p.i)},${yFor(p.v as number)}`)
      .join(" ");

  return (
    <Box sx={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: "block", minWidth: 300 }} role="img"
        aria-label="Finish by season">
        {/* gridlines at 1st / 5th / 10th */}
        {[1, 5, 10].map((f) => (
          <g key={f}>
            <line x1={padL} x2={W - padR} y1={yFor(f)} y2={yFor(f)} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
            <text x={padL - 6} y={yFor(f) + 3} textAnchor="end" fontSize={9} fill="#bcb2a4" fontFamily="var(--font-body)">
              {ordinal(f)}
            </text>
          </g>
        ))}
        {/* x labels */}
        {seasons.map((s, i) => (
          <text key={s.season} x={xFor(i)} y={H - 8} textAnchor="middle" fontSize={9.5} fill="#bcb2a4" fontFamily="var(--font-body)">
            {s.season}
          </text>
        ))}
        {/* playoff line (dashed) then reg line on top */}
        {n > 1 && <polyline points={line("po")} fill="none" stroke={PO} strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />}
        {n > 1 && <polyline points={line("rank")} fill="none" stroke={REG} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
        {seasons.map((s, i) => (
          <g key={`m-${s.season}`}>
            {s.po !== undefined && (
              <circle cx={xFor(i)} cy={yFor(s.po)} r={4} fill={PO} stroke="#242019" strokeWidth={2}>
                <title>{`${s.season} · playoff ${ordinal(s.po)}`}</title>
              </circle>
            )}
            <circle cx={xFor(i)} cy={yFor(s.rank)} r={4} fill={REG} stroke="#242019" strokeWidth={2}>
              <title>{`${s.season} · reg ${ordinal(s.rank)} · ${s.team}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      {/* legend */}
      <Stack direction="row" spacing={2} sx={{ mt: 0.5, pl: `${padL}px` }}>
        <Stack direction="row" alignItems="center" spacing={0.6}>
          <Box sx={{ width: 16, height: 2, bgcolor: REG }} />
          <Typography variant="caption" color="text.secondary">Reg finish</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.6}>
          <Box sx={{ width: 16, height: 0, borderTop: `2px dashed ${PO}` }} />
          <Typography variant="caption" color="text.secondary">Playoff finish</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1, textAlign: "center", py: 1, px: 0.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.10)" }}>
      <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function PersonDialog({
  manager,
  onClose,
}: {
  manager: string | null;
  onClose: () => void;
}) {
  const open = manager !== null;
  const seasons = manager ? personSeasons(manager) : [];
  const c = manager ? careers().find((x) => x.manager === manager) : undefined;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      slotProps={{ paper: { sx: { bgcolor: "#201b16", backgroundImage: "none", m: { xs: 1.5, sm: 4 } } } }}>
      {manager && c && (
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="flex-start">
            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1 }}>
                {manager}{c.titles > 0 ? ` ${"🏆".repeat(c.titles)}` : ""}
              </Typography>
              <Typography variant="body2" color="text.secondary" className="num">
                {rec(c)} · {c.winPct.toFixed(3).replace(/^0/, "")} · {c.seasons} {c.seasons === 1 ? "season" : "seasons"}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" edge="end"><CloseIcon /></IconButton>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ my: 2 }}>
            <Tile label="Avg pick" value={c.avgPick.toFixed(1)} />
            <Tile label="Best reg" value={ordinal(c.bestFinish)} />
            <Tile label="Avg reg" value={c.avgFinish.toFixed(1)} />
            <Tile label="Avg PO" value={c.avgPlayoff !== undefined ? c.avgPlayoff.toFixed(1) : "·"} />
          </Stack>

          <Typography variant="overline" sx={{ color: "primary.main", display: "block", mb: 0.5 }}>
            Finish by season
          </Typography>
          <FinishChart seasons={seasons} />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 360, "& td, & th": { whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } }}>
              <Box component="thead">
                <Box component="tr" sx={{ "& th": { fontSize: 10, fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary", textAlign: "right", padding: "4px 7px", borderBottom: "1px solid rgba(255,255,255,0.12)" } }}>
                  <Box component="th" sx={{ textAlign: "left !important" }}>Year</Box>
                  <Box component="th" sx={{ textAlign: "left !important" }}>Team</Box>
                  <Box component="th">Rec</Box>
                  <Box component="th">Reg</Box>
                  <Box component="th">PO</Box>
                  <Box component="th">PF</Box>
                  <Box component="th">Pk</Box>
                </Box>
              </Box>
              <Box component="tbody">
                {seasons.map((s) => (
                  <Box component="tr" key={s.season} sx={{ "& td": { fontSize: 13, textAlign: "right", padding: "6px 7px", borderBottom: "1px solid rgba(255,255,255,0.05)" } }}>
                    <Box component="td" className="num" sx={{ textAlign: "left !important", fontFamily: "var(--font-display)", fontWeight: 700 }}>{s.season}</Box>
                    <Box component="td" sx={{ textAlign: "left !important", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{s.team}</Box>
                    <Box component="td">{rec(s)}</Box>
                    <Box component="td">{ordinal(s.rank)}</Box>
                    <Box component="td">{s.po !== undefined ? ordinal(s.po) : "·"}</Box>
                    <Box component="td">{s.pf !== undefined ? s.pf.toFixed(0) : "·"}</Box>
                    <Box component="td">{s.pick}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
