"use client";

import { useState } from "react";
import {
  AppBar, Toolbar, Container, Box, Card, Typography, Stack, Chip,
  ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import { ACTIVE_MANAGERS } from "@/lib/history-data";
import { careers, correlations, medalTally } from "@/lib/history-stats";
import PickAverages from "../components/PickAverages";
import SeasonRecords from "../components/SeasonRecords";
import PageNav from "../components/PageNav";
import PersonDialog from "../history/PersonDialog";

function pct3(n: number) {
  return n.toFixed(3).replace(/^0/, "");
}
function recStr(c: { wins: number; losses: number; ties: number }) {
  return c.ties > 0 ? `${c.wins}-${c.losses}-${c.ties}` : `${c.wins}-${c.losses}`;
}

export default function AllTimePage() {
  const [person, setPerson] = useState<string | null>(null);
  const [roster, setRoster] = useState<"active" | "all">("active");
  const activeSet = new Set(ACTIVE_MANAGERS);
  const people = careers().filter((c) => roster === "all" || activeSet.has(c.manager));
  const corrs = correlations();

  return (
    <Box sx={{ minHeight: "100dvh", pb: 7 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.07)", bgcolor: "rgba(26,22,17,0.7)" }}>
        <Toolbar sx={{ gap: 1, px: { xs: 1.5, sm: 3 } }}>
          <PageNav />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ pt: 3 }}>
        <Stack spacing={3.5}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>All-Time</Typography>
            <Typography variant="body2" color="text.secondary">
              Careers and draft trends across every season. Tap a name for their full
              career. Head-to-head records live on their own tab.
            </Typography>
          </Box>

          {/* Career leaderboard */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="overline" sx={{ color: "primary.main", flexGrow: 1 }}>
                Career by person
              </Typography>
              <ToggleButtonGroup exclusive value={roster} size="small"
                onChange={(_, v) => v && setRoster(v)}
                sx={{
                  "& .MuiToggleButton-root": { border: "1px solid rgba(255,255,255,0.14)", borderRadius: "999px !important", px: 1.4, py: 0.3, fontSize: 11.5, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "none", lineHeight: 1.4 },
                  "& .Mui-selected": { bgcolor: "primary.main !important", color: "#0c0a08 !important" }, gap: 0.5,
                }}>
                <ToggleButton value="active">Active</ToggleButton>
                <ToggleButton value="all">All-time</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <Stack spacing={1}>
              {people.map((c, i) => (
                <Card key={c.manager} onClick={() => setPerson(c.manager)}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.2, cursor: "pointer",
                    "&:hover": { borderColor: "primary.main", bgcolor: "rgba(255,255,255,0.06)" } }}>
                  <Typography className="num" sx={{ width: 26, textAlign: "center", flexShrink: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: i === 0 ? "primary.light" : "text.secondary" }}>
                    {i + 1}
                  </Typography>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
                        {c.manager}{medalTally(c) ? ` ${medalTally(c)}` : ""}
                      </Typography>
                      {roster === "all" && !activeSet.has(c.manager) && (
                        <Chip size="small" label="former" variant="outlined" sx={{ height: 16, fontSize: 9, flexShrink: 0 }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" component="div">
                      {c.seasons} {c.seasons === 1 ? "season" : "seasons"} · pick{" "}
                      <span className="num">{c.avgPick.toFixed(1)}</span> · reg fin{" "}
                      <span className="num">{c.avgFinish.toFixed(1)}</span> · PO fin{" "}
                      <span className="num">{c.avgPlayoff !== undefined ? c.avgPlayoff.toFixed(1) : "·"}</span>
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                    <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{recStr(c)}</Typography>
                    <Typography variant="caption" color="text.secondary" component="div" className="num">{pct3(c.winPct)}</Typography>
                  </Box>
                </Card>
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              reg fin = regular-season finish · PO fin = playoff finish · 🏆/🥈/🥉 = playoff podiums
            </Typography>
          </Box>

          {/* Single-season records */}
          <SeasonRecords />

          {/* Draft-pick correlations */}
          <Box>
            <Typography variant="overline" sx={{ color: "primary.main", display: "block" }}>
              Draft pick vs. outcome
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              Pearson r between draft-slot number and each stat. Negative means earlier picks tend to do better.
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              {corrs.map((c) => (
                <Card key={c.label} sx={{ px: 1.75, py: 1.4 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>{c.label}</Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.75}>
                    <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1, color: c.r == null ? "text.secondary" : c.r < 0 ? "success.main" : "error.main" }}>
                      {c.r == null ? "n/a" : (c.r > 0 ? "+" : "") + c.r.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" className="num">n={c.n}</Typography>
                  </Stack>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Average by draft slot */}
          <Box>
            <Typography variant="overline" sx={{ color: "primary.main", display: "block", mb: 1 }}>
              Average by draft slot
            </Typography>
            <Card sx={{ px: 1.5, py: 1 }}>
              <PickAverages />
            </Card>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Averages across all four seasons, 2022 to 2025.
            </Typography>
          </Box>
        </Stack>
      </Container>

      <PersonDialog manager={person} onClose={() => setPerson(null)} />
    </Box>
  );
}
