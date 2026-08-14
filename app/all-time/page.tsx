"use client";

import { useState } from "react";
import {
  AppBar, Toolbar, Container, Box, Card, Typography, Stack, Chip,
  ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import { ACTIVE_MANAGERS } from "@/lib/history-data";
import { careers, correlations, medalTally, luckAdjusted, luckSeasons } from "@/lib/history-stats";
import PickAverages from "../components/PickAverages";
import SeasonRecords from "../components/SeasonRecords";
import PageNav from "../components/PageNav";
import PersonDialog from "../history/PersonDialog";
import { CONTENT_MAXW, CARD_GRID } from "../theme";

function pct3(n: number) {
  return n.toFixed(3).replace(/^0/, "");
}
function recStr(c: { wins: number; losses: number; ties: number }) {
  return c.ties > 0 ? `${c.wins}-${c.losses}-${c.ties}` : `${c.wins}-${c.losses}`;
}
// One decimal, but show a whole number cleanly (expected wins are fractional).
function dec1(x: number) {
  return Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : x.toFixed(1);
}
function expStr(w: number, games: number) {
  return `${dec1(w)}-${dec1(games - w)}`;
}

export default function AllTimePage() {
  const [person, setPerson] = useState<string | null>(null);
  const [roster, setRoster] = useState<"active" | "all">("active");
  const [luckScope, setLuckScope] = useState<"all" | number>("all");
  const activeSet = new Set(ACTIVE_MANAGERS);
  const people = careers().filter((c) => roster === "all" || activeSet.has(c.manager));
  const seasons = luckSeasons();
  const luckRows = luckAdjusted(luckScope === "all" ? undefined : luckScope).filter(
    (l) => (roster === "all" || activeSet.has(l.manager)) && l.games > 0
  );
  const corrs = correlations();

  return (
    <Box sx={{ minHeight: "100dvh", pb: 7 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.07)", bgcolor: "rgba(26,22,17,0.7)" }}>
        <Toolbar sx={{ gap: 1, px: { xs: 1.5, sm: 3 } }}>
          <PageNav />
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ pt: 3, maxWidth: CONTENT_MAXW, mx: "auto" }}>
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
            <Box sx={{ display: "grid", gridTemplateColumns: CARD_GRID, gap: 1 }}>
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
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              reg fin = regular-season finish · PO fin = playoff finish · 🏆/🥈/🥉 = playoff podiums
            </Typography>
          </Box>

          {/* Luck-adjusted record (all-play expected wins) */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="overline" sx={{ color: "primary.main", flexGrow: 1 }}>
                Luck-adjusted record
              </Typography>
              <ToggleButtonGroup exclusive value={luckScope} size="small"
                onChange={(_, v) => v != null && setLuckScope(v)}
                sx={{
                  flexWrap: "wrap", justifyContent: "flex-end",
                  "& .MuiToggleButton-root": { border: "1px solid rgba(255,255,255,0.14)", borderRadius: "999px !important", px: 1.2, py: 0.3, fontSize: 11.5, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "none", lineHeight: 1.4 },
                  "& .Mui-selected": { bgcolor: "primary.main !important", color: "#0c0a08 !important" }, gap: 0.5,
                }}>
                <ToggleButton value="all">All-time</ToggleButton>
                {seasons.map((yr) => (
                  <ToggleButton key={yr} value={yr}>{yr}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              What each manager's <b>scoring</b> earned{luckScope === "all" ? "" : ` in ${luckScope}`}.
              Every week we swap the single opponent the schedule drew for the whole league: you get
              the fraction of all teams you outscored. Ranked by that expected win%.
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: CARD_GRID, gap: 1 }}>
              {luckRows.map((l, i) => {
                const robbed = l.luck < -0.05;
                const boosted = l.luck > 0.05;
                const luckColor = robbed ? "success.main" : boosted ? "warning.main" : "text.secondary";
                return (
                  <Card key={l.manager} onClick={() => setPerson(l.manager)}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.2, cursor: "pointer",
                      "&:hover": { borderColor: "primary.main", bgcolor: "rgba(255,255,255,0.06)" } }}>
                    <Typography className="num" sx={{ width: 26, textAlign: "center", flexShrink: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: i === 0 ? "primary.light" : "text.secondary" }}>
                      {i + 1}
                    </Typography>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
                        {l.manager}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        actual{" "}
                        <span className="num">{recStr(l)}</span>{" "}
                        · <span className="num">{pct3(l.actualPct)}</span>
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                        {expStr(l.expWins, l.games)}
                      </Typography>
                      <Typography variant="caption" component="div" className="num" color="text.secondary">
                        {pct3(l.expPct)} ·{" "}
                        <Box component="span" sx={{ color: luckColor, fontWeight: 700 }}>
                          {l.luck >= 0 ? "+" : ""}{l.luck.toFixed(1)}
                        </Box>
                      </Typography>
                    </Box>
                  </Card>
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Last number = luck (actual − deserved wins).{" "}
              <Box component="span" sx={{ color: "success.main" }}>green</Box> = the schedule cost
              you wins (better than your record);{" "}
              <Box component="span" sx={{ color: "warning.main" }}>orange</Box> = it handed you wins.
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
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1 }}>
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
