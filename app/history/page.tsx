"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import { HISTORY, winPct, recordStr, type StandingRow } from "@/lib/history-data";

function pctStr(r: StandingRow) {
  return winPct(r).toFixed(3).replace(/^0/, ""); // .643 style
}
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function HistoryPage() {
  const [season, setSeason] = useState(HISTORY[0].season);
  const data = HISTORY.find((h) => h.season === season) ?? HISTORY[0];
  // One combined row per draft slot, joined to that team's regular-season line.
  const rows = data.draftOrder.map((p) => ({
    ...p,
    s: data.standings.find((st) => st.team === p.team),
  }));

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
          {/* Season picker */}
          <Box sx={{ overflowX: "auto" }}>
            <ToggleButtonGroup exclusive value={season} color="primary"
              onChange={(_, v) => v && setSeason(v)} size="small">
              {HISTORY.map((h) => (
                <ToggleButton key={h.season} value={h.season} sx={{ px: 2, fontWeight: 700 }}>
                  {h.season}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Season meta */}
          <Box>
            <Typography variant="h5" fontWeight={800}>{data.season} season</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.league} · {data.format} · via {data.source}
            </Typography>
          </Box>

          {/* Combined: draft order joined with each team's regular-season line */}
          <Box>
            <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h6">Draft order &amp; results</Typography>
              <Typography variant="caption" color="text.secondary">
                pick # · reg. season
              </Typography>
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
            Rows are in draft-pick order; the record &amp; rank on the right are
            that team&apos;s <b>regular-season</b> finish. &ldquo;—&rdquo; = past
            team not yet mapped to a person. PF/PA only exported for 2024;
            playoff finishes (🏆) added later.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
