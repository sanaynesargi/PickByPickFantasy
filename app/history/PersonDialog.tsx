"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { personSeasons, careers, headToHead, gameLog } from "@/lib/history-stats";

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
        {[1, 5, 10].map((f) => (
          <g key={f}>
            <line x1={padL} x2={W - padR} y1={yFor(f)} y2={yFor(f)} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
            <text x={padL - 6} y={yFor(f) + 3} textAnchor="end" fontSize={9} fill="#bcb2a4" fontFamily="var(--font-body)">
              {ordinal(f)}
            </text>
          </g>
        ))}
        {seasons.map((s, i) => (
          <text key={s.season} x={xFor(i)} y={H - 8} textAnchor="middle" fontSize={9.5} fill="#bcb2a4" fontFamily="var(--font-body)">
            {s.season}
          </text>
        ))}
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
    <Box sx={{ flex: 1, textAlign: "center", py: 1.1, px: 0.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.10)" }}>
      <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}

const th = {
  fontSize: 10, fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.06em",
  textTransform: "uppercase" as const, color: "text.secondary", textAlign: "right" as const,
  padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", whiteSpace: "nowrap" as const,
};
const td = {
  fontSize: 13.5, textAlign: "right" as const, padding: "9px 8px",
  borderBottom: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap" as const,
  fontVariantNumeric: "tabular-nums" as const,
};

export default function PersonDialog({
  manager,
  onClose,
}: {
  manager: string | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "games" | "h2h">("overview");
  useEffect(() => setTab("overview"), [manager]); // reset when a new player opens

  const open = manager !== null;
  const seasons = manager ? personSeasons(manager) : [];
  const c = manager ? careers().find((x) => x.manager === manager) : undefined;
  const h2h = manager ? headToHead(manager) : [];
  const games = manager ? gameLog(manager) : [];

  const resultColor = (r: "W" | "L" | "T") => (r === "W" ? "success.main" : r === "L" ? "error.main" : "text.secondary");

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      slotProps={{ paper: { sx: { bgcolor: "#201b16", backgroundImage: "none", m: { xs: 1, sm: 4 } } } }}>
      {manager && c && (
        <Box>
          {/* Sticky header */}
          <Box sx={{ position: "sticky", top: 0, zIndex: 1, bgcolor: "#201b16", px: 2.5, pt: 2.5, pb: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Stack direction="row" alignItems="flex-start">
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1 }}>
                  {manager}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="num">
                  {rec(c)} · {c.winPct.toFixed(3).replace(/^0/, "")} · {c.seasons} {c.seasons === 1 ? "season" : "seasons"}
                  {"  "}🏆 {c.titles} · 🥈 {c.seconds} · 🥉 {c.thirds}
                </Typography>
              </Box>
              <IconButton onClick={onClose} size="medium" edge="end"><CloseIcon /></IconButton>
            </Stack>
            <ToggleButtonGroup exclusive value={tab} size="small" onChange={(_, v) => v && setTab(v)}
              sx={{
                mt: 1.5,
                "& .MuiToggleButton-root": {
                  border: "1px solid rgba(255,255,255,0.14)", borderRadius: "999px !important",
                  px: 2, py: 0.5, fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "none",
                },
                "& .Mui-selected": { bgcolor: "primary.main !important", color: "#0c0a08 !important" },
                gap: 0.6,
              }}>
              <ToggleButton value="overview">Overview</ToggleButton>
              <ToggleButton value="games">Games</ToggleButton>
              <ToggleButton value="h2h">Head-to-head</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ p: 2.5, pt: 2 }}>
            {tab === "overview" && (
              <>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Tile label="Avg pick" value={c.avgPick.toFixed(1)} />
                  <Tile label="Best reg" value={ordinal(c.bestFinish)} />
                  <Tile label="Avg reg" value={c.avgFinish.toFixed(1)} />
                  <Tile label="Avg PO" value={c.avgPlayoff !== undefined ? c.avgPlayoff.toFixed(1) : "·"} />
                </Stack>
                <Typography variant="overline" sx={{ color: "primary.main", display: "block", mb: 0.5 }}>
                  Finish by season
                </Typography>
                <FinishChart seasons={seasons} />
                <Box sx={{ overflowX: "auto", mt: 2 }}>
                  <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
                    <Box component="thead">
                      <Box component="tr">
                        <Box component="th" sx={{ ...th, textAlign: "left" }}>Year</Box>
                        <Box component="th" sx={{ ...th, textAlign: "left" }}>Team</Box>
                        <Box component="th" sx={th}>Rec</Box>
                        <Box component="th" sx={th}>Reg</Box>
                        <Box component="th" sx={th}>PO</Box>
                        <Box component="th" sx={th}>PF</Box>
                        <Box component="th" sx={th}>Pk</Box>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {seasons.map((s) => (
                        <Box component="tr" key={s.season}>
                          <Box component="td" className="num" sx={{ ...td, textAlign: "left", fontFamily: "var(--font-display)", fontWeight: 700 }}>{s.season}</Box>
                          <Box component="td" sx={{ ...td, textAlign: "left", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{s.team}</Box>
                          <Box component="td" sx={td}>{rec(s)}</Box>
                          <Box component="td" sx={td}>{ordinal(s.rank)}</Box>
                          <Box component="td" sx={td}>{s.po !== undefined ? ordinal(s.po) : "·"}</Box>
                          <Box component="td" sx={td}>{s.pf !== undefined ? s.pf.toFixed(0) : "·"}</Box>
                          <Box component="td" sx={td}>{s.pick}</Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </>
            )}

            {tab === "games" && (
              games.length === 0 ? (
                <Typography color="text.secondary" variant="body2">No game scores available (ESPN seasons only).</Typography>
              ) : (
                <Stack spacing={0.5}>
                  {games.map((g, i) => {
                    const newSeason = i === 0 || games[i - 1].season !== g.season;
                    return (
                      <Box key={`${g.season}-${g.week}`}>
                        {newSeason && (
                          <Typography variant="overline" sx={{ color: "primary.main", display: "block", mt: i ? 1.5 : 0 }} className="num">
                            {g.season}
                          </Typography>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.9, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <Typography sx={{ width: 48, flexShrink: 0, fontSize: 11, color: g.isPlayoff ? "primary.light" : "text.secondary", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                            {g.isPlayoff ? "PO " : "WK "}{g.week}
                          </Typography>
                          <Box sx={{
                            width: 22, height: 22, borderRadius: 1, flexShrink: 0, display: "grid", placeItems: "center",
                            fontSize: 11, fontWeight: 800, color: "#0c0a08",
                            bgcolor: g.result === "W" ? "success.main" : g.result === "L" ? "error.main" : "text.secondary",
                          }}>
                            {g.result}
                          </Box>
                          <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, width: 52, flexShrink: 0 }}>
                            {g.pts.toFixed(1)}
                          </Typography>
                          <Typography noWrap sx={{ flexGrow: 1, fontSize: 13, color: "text.secondary", minWidth: 0 }}>
                            vs {g.opp}
                          </Typography>
                          <Typography className="num" sx={{ fontSize: 13, color: "text.secondary", flexShrink: 0 }}>
                            {g.oppPts.toFixed(1)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )
            )}

            {tab === "h2h" && (
              h2h.length === 0 ? (
                <Typography color="text.secondary" variant="body2">No head-to-head data (ESPN seasons only).</Typography>
              ) : (
                <>
                  <Box sx={{ overflowX: "auto" }}>
                    <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
                      <Box component="thead">
                        <Box component="tr">
                          <Box component="th" sx={{ ...th, textAlign: "left" }}>Vs</Box>
                          <Box component="th" sx={th}>Record</Box>
                          <Box component="th" sx={th}>Diff</Box>
                          <Box component="th" sx={th}>PF/g</Box>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {h2h.map((h) => {
                          const diff = h.wins - h.losses;
                          return (
                            <Box component="tr" key={h.opponent}>
                              <Box component="td" sx={{ ...td, textAlign: "left", fontWeight: 700 }}>{h.opponent}</Box>
                              <Box component="td" sx={td}>{h.wins}-{h.losses}{h.ties ? `-${h.ties}` : ""}</Box>
                              <Box component="td" sx={{ ...td, color: diff > 0 ? "success.main" : diff < 0 ? "error.main" : "text.secondary", fontWeight: 700 }}>
                                {diff > 0 ? "+" : ""}{diff}
                              </Box>
                              <Box component="td" sx={td}>{(h.pointsFor / h.games).toFixed(0)}</Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                    From ESPN seasons with game scores (2022, 2023, 2025).
                  </Typography>
                </>
              )
            )}
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
