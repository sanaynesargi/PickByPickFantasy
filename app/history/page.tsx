"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Card,
  Typography,
  Stack,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import { HISTORY, winPct, recordStr, type StandingRow } from "@/lib/history-data";
import { careers, correlations } from "@/lib/history-stats";
import PickAverages from "../components/PickAverages";

function pctStr(r: StandingRow) {
  return winPct(r).toFixed(3).replace(/^0/, ""); // .643 style
}
function pct3(n: number) {
  return n.toFixed(3).replace(/^0/, "");
}
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function recStr(c: { wins: number; losses: number; ties: number }) {
  return c.ties > 0 ? `${c.wins}-${c.losses}-${c.ties}` : `${c.wins}-${c.losses}`;
}

export default function HistoryPage() {
  const [view, setView] = useState<number | "all">("all");
  const seasonData = typeof view === "number"
    ? HISTORY.find((h) => h.season === view) ?? HISTORY[0]
    : null;

  return (
    <Box sx={{ minHeight: "100dvh", pb: 6 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(10,10,10,0.8)" }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton component={Link} href="/" color="inherit" edge="start">
            <ArrowBackIcon />
          </IconButton>
          <HistoryIcon color="primary" />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            League History
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* View picker: all-time + each season */}
          <Box sx={{ overflowX: "auto", pb: 0.5 }}>
            <ToggleButtonGroup exclusive value={view} color="primary"
              onChange={(_, v) => v != null && setView(v)} size="small">
              <ToggleButton value="all" sx={{ px: 2, fontWeight: 700 }}>All-time</ToggleButton>
              {HISTORY.map((h) => (
                <ToggleButton key={h.season} value={h.season} sx={{ px: 2, fontWeight: 700 }}>
                  {h.season}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {seasonData ? (
            <SeasonView data={seasonData} />
          ) : (
            <AllTimeView />
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function SeasonView({ data }: { data: (typeof HISTORY)[number] }) {
  const rows = data.draftOrder.map((p) => ({
    ...p,
    s: data.standings.find((st) => st.team === p.team),
  }));
  return (
    <>
      <Box>
        <Typography variant="h5" fontWeight={800}>{data.season} season</Typography>
        <Typography variant="body2" color="text.secondary">
          {data.league} · {data.format} · via {data.source}
        </Typography>
      </Box>

      <Box>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h6">Draft order &amp; results</Typography>
          <Typography variant="caption" color="text.secondary">pick # · reg. season</Typography>
        </Stack>
        <Stack spacing={1}>
          {rows.map(({ pick, team, manager, s }) => (
            <Card key={pick} variant="outlined"
              sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.1 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14,
                bgcolor: "rgba(255,122,24,0.15)", color: "primary.main",
              }}>
                {pick}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Typography noWrap fontWeight={700}>{team}</Typography>
                  {s?.division && (
                    <Chip size="small" label={s.division} variant="outlined"
                      sx={{ height: 18, fontSize: 10, flexShrink: 0 }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {manager ?? "—"}
                  {s?.pointsFor !== undefined && (
                    <> · {s.pointsFor.toFixed(1)} PF · {s.pointsAgainst?.toFixed(1)} PA</>
                  )}
                </Typography>
              </Box>
              {s && (
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography fontWeight={700}>{recordStr(s)}</Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {ordinal(s.rank)}
                    {s.playoffRank ? ` · 🏆 ${ordinal(s.playoffRank)}` : ""} · {pctStr(s)}
                  </Typography>
                </Box>
              )}
            </Card>
          ))}
        </Stack>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Rows are in draft-pick order; the record &amp; rank on the right are that
        team&apos;s <b>regular-season</b> finish. &ldquo;—&rdquo; = past team not
        yet mapped to a person. PF/PA only exported for 2024; playoff finishes
        (🏆) added later.
      </Typography>
    </>
  );
}

function AllTimeView() {
  const people = careers();
  const corrs = correlations();

  return (
    <>
      {/* Career table */}
      <Box>
        <Typography variant="h6" gutterBottom>Career — by person</Typography>
        <Stack spacing={1}>
          {people.map((c, i) => (
            <Card key={c.manager} variant="outlined"
              sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.1 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13,
                bgcolor: i === 0 ? "primary.main" : "rgba(255,255,255,0.06)",
                color: i === 0 ? "#0a0a0a" : "text.secondary",
              }}>
                {i + 1}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography noWrap fontWeight={700}>{c.manager}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {c.seasons} {c.seasons === 1 ? "season" : "seasons"} · avg pick{" "}
                  {c.avgPick.toFixed(1)} · avg finish {c.avgFinish.toFixed(1)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                <Typography fontWeight={700}>{recStr(c)}</Typography>
                <Typography variant="caption" color="text.secondary" component="div">
                  {pct3(c.winPct)}{c.firsts > 0 ? ` · 🥇${c.firsts}` : ""}
                </Typography>
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* Correlations */}
      <Box>
        <Typography variant="h6" gutterBottom>Draft pick vs. outcome</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          Pearson r between draft-slot number and each stat. Negative = earlier
          picks (lower #) tend to do better.
        </Typography>
        <Stack spacing={1}>
          {corrs.map((c) => (
            <Card key={c.label} variant="outlined"
              sx={{ display: "flex", alignItems: "center", px: 2, py: 1.1 }}>
              <Typography sx={{ flexGrow: 1 }} fontWeight={600}>{c.label}</Typography>
              <Box sx={{ textAlign: "right" }}>
                <Typography fontWeight={800}
                  color={c.r == null ? "text.secondary" : c.r < 0 ? "success.main" : "error.main"}>
                  {c.r == null ? "n/a" : (c.r > 0 ? "+" : "") + c.r.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">n = {c.n}</Typography>
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* Per-pick averages */}
      <Box>
        <Typography variant="h6" gutterBottom>Average by draft slot</Typography>
        <PickAverages />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Wins &amp; finish average all seasons; PF/PA/PD from 2024 only (the one
          season with points data).
        </Typography>
      </Box>
    </>
  );
}
