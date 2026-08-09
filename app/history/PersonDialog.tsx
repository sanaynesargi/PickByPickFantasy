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
import { personSeasons, careers, headToHead } from "@/lib/history-stats";
import { topPlayers, careerActivity, mostRostered, careerTrades } from "@/lib/boxscore-stats";

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
            {s.rank !== undefined && (
              <circle cx={xFor(i)} cy={yFor(s.rank)} r={4} fill={REG} stroke="#242019" strokeWidth={2}>
                <title>{`${s.season} · reg ${ordinal(s.rank)} · ${s.team}`}</title>
              </circle>
            )}
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

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Box sx={{ flex: 1, textAlign: "center", py: 1.1, px: 0.5, borderRadius: 2,
      border: "1px solid", borderColor: accent ? "rgba(255,106,26,0.45)" : "rgba(255,255,255,0.10)",
      bgcolor: accent ? "rgba(255,106,26,0.06)" : "transparent" }}>
      <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, lineHeight: 1.1, color: accent ? "primary.light" : "text.primary" }}>
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
  const [tab, setTab] = useState<"overview" | "h2h" | "trades">("overview");
  useEffect(() => setTab("overview"), [manager]); // reset when a new player opens

  const open = manager !== null;
  const seasons = manager ? personSeasons(manager) : [];
  const c = manager ? careers().find((x) => x.manager === manager) : undefined;
  const h2h = manager ? headToHead(manager) : [];
  const fav = manager ? topPlayers(manager, 5) : [];
  const loyal = manager ? mostRostered(manager, 3) : [];
  const trades = manager ? careerTrades(manager) : [];
  const activity = manager ? careerActivity(manager) : null;

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
              <ToggleButton value="h2h">Head-to-head</ToggleButton>
              {trades.length > 0 && <ToggleButton value="trades">Trades</ToggleButton>}
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
                  {activity && <Tile label="Moves/wk" value={activity.addsPerWeek.toFixed(1)} accent />}
                </Stack>
                <Typography variant="overline" sx={{ color: "primary.main", display: "block", mb: 0.5 }}>
                  Finish by season
                </Typography>
                <FinishChart seasons={seasons} />

                {fav.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="overline" sx={{ color: "primary.main", display: "block", mb: 0.75 }}>Franchise players</Typography>
                    <Stack spacing={0.5}>
                      {fav.map((p, i) => (
                        <Box key={p.name} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, py: 0.75, borderRadius: 1.5,
                          border: "1px solid", borderColor: i === 0 ? "rgba(255,106,26,0.35)" : "rgba(255,255,255,0.07)",
                          bgcolor: i === 0 ? "rgba(255,106,26,0.05)" : "rgba(255,255,255,0.02)" }}>
                          <Typography sx={{ fontSize: 14, flexShrink: 0, width: 16 }}>{i === 0 ? "⭐" : ""}</Typography>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography noWrap sx={{ fontFamily: "var(--font-display)", fontWeight: i === 0 ? 800 : 600, fontSize: 14, lineHeight: 1.2 }}>
                              {p.name}
                            </Typography>
                            <Typography className="num" sx={{ fontSize: 10, color: "text.secondary", letterSpacing: "0.02em" }}>
                              {p.seasons.map((y) => `’${String(y).slice(2)}`).join(" ")} · {p.starts} st · {p.ppg.toFixed(1)}/st
                            </Typography>
                          </Box>
                          <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, width: 52, textAlign: "right", flexShrink: 0, color: i === 0 ? "primary.light" : "text.primary" }}>
                            {p.pts.toFixed(0)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      Total points started (2022 to 2025). st = starts.
                    </Typography>
                  </Box>
                )}

                {loyal.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="overline" sx={{ color: "primary.main", display: "block", mb: 0.75 }}>
                      Most loyal to
                    </Typography>
                    <Stack spacing={0.5}>
                      {loyal.map((p, i) => (
                        <Box key={p.name} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, py: 0.6, borderRadius: 1.5,
                          border: "1px solid", borderColor: i === 0 ? "rgba(79,157,214,0.4)" : "rgba(255,255,255,0.07)",
                          bgcolor: i === 0 ? "rgba(79,157,214,0.06)" : "rgba(255,255,255,0.02)" }}>
                          <Typography sx={{ fontSize: 13, flexShrink: 0, width: 16 }}>{i === 0 ? "🤝" : ""}</Typography>
                          <Typography noWrap sx={{ flexGrow: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: i === 0 ? 800 : 600, fontSize: 14 }}>
                            {p.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" className="num" sx={{ flexShrink: 0 }}>
                            {p.seasons.map((y) => `’${String(y).slice(2)}`).join(" ")} · {p.weeks} wks
                          </Typography>
                          <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, width: 34, textAlign: "right", flexShrink: 0, color: i === 0 ? "#7bbce8" : "text.primary" }}>
                            {p.seasons.length}<span style={{ fontSize: 10, fontWeight: 600, color: "#9a9084" }}>y</span>
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      Seasons rostered (started or benched). y = seasons.
                    </Typography>
                  </Box>
                )}

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
                          <Box component="td" sx={td}>{s.rank !== undefined ? ordinal(s.rank) : "·"}</Box>
                          <Box component="td" sx={td}>{s.po !== undefined ? ordinal(s.po) : "·"}</Box>
                          <Box component="td" sx={td}>{s.pf !== undefined ? s.pf.toFixed(0) : "·"}</Box>
                          <Box component="td" sx={td}>{s.pick ?? "·"}</Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </>
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
                    From seasons with game scores (2022 to 2025).
                  </Typography>
                </>
              )
            )}

            {tab === "trades" && (
              <>
                <Stack spacing={0.75}>
                  {trades.map((t, i) => (
                    <Box key={i} sx={{ px: 1.25, py: 0.85, borderRadius: 1.5, border: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.02)" }}>
                      <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mb: 0.35 }}>
                        <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>
                          with {t.partner}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" className="num" sx={{ ml: "auto" }}>
                          &apos;{String(t.season).slice(2)} wk{t.week}
                        </Typography>
                      </Stack>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.05em", color: "#46c48c" }}>GOT</Typography>
                          <Typography sx={{ fontSize: 12, lineHeight: 1.35 }}>{t.got.join(", ")}</Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.05em", color: "#ec6650" }}>GAVE</Typography>
                          <Typography sx={{ fontSize: 12, lineHeight: 1.35, color: "text.secondary" }}>{t.gave.join(", ")}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                  {trades.length} in-season trade{trades.length === 1 ? "" : "s"}, detected from week-to-week roster moves. Pre-season / draft-day trades aren&apos;t captured.
                </Typography>
              </>
            )}
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
