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
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import { HISTORY, winPct, recordStr, type StandingRow } from "@/lib/history-data";

function pctStr(r: StandingRow) {
  return winPct(r).toFixed(3).replace(/^0/, ""); // .643 style
}

export default function HistoryPage() {
  const [season, setSeason] = useState(HISTORY[0].season);
  const data = HISTORY.find((h) => h.season === season) ?? HISTORY[0];
  const hasPoints = data.standings.some((s) => s.pointsFor !== undefined);

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

          {/* Draft order */}
          <Box>
            <Typography variant="h6" gutterBottom>Draft order</Typography>
            <Stack spacing={1}>
              {data.draftOrder.map((p) => (
                <Card key={p.pick} variant="outlined"
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.1 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14,
                    bgcolor: "rgba(255,122,24,0.15)", color: "primary.main",
                  }}>
                    {p.pick}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap fontWeight={700}>{p.team}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.manager ?? "—"}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* Final standings */}
          <Box>
            <Typography variant="h6" gutterBottom>Final standings</Typography>
            <Stack spacing={1}>
              {data.standings.map((s) => (
                <Card key={s.rank} variant="outlined"
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.1 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14,
                    bgcolor: s.rank === 1 ? "primary.main" : "rgba(255,255,255,0.06)",
                    color: s.rank === 1 ? "#0a0a0a" : "text.secondary",
                  }}>
                    {s.rank}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography noWrap fontWeight={700}>
                      {s.team}
                      {s.division && (
                        <Chip size="small" label={s.division} variant="outlined"
                          sx={{ ml: 1, height: 18, fontSize: 10 }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap component="div">
                      {s.manager ?? "—"}
                      {hasPoints && s.pointsFor !== undefined && (
                        <> · {s.pointsFor.toFixed(1)} PF · {s.pointsAgainst?.toFixed(1)} PA</>
                      )}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                    <Typography fontWeight={700}>{recordStr(s)}</Typography>
                    <Typography variant="caption" color="text.secondary">{pctStr(s)}</Typography>
                  </Box>
                </Card>
              ))}
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary">
            &ldquo;—&rdquo; managers are unmapped past teams (names change yearly).
            Points-for/against only exported for 2024.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
