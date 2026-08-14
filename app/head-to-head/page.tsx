"use client";

import { AppBar, Toolbar, Container, Box, Typography, Stack } from "@mui/material";
import { careers } from "@/lib/history-stats";
import { ACTIVE_MANAGERS } from "@/lib/history-data";
import HeadToHead from "../components/HeadToHead";
import PageNav from "../components/PageNav";
import { CONTENT_MAXW } from "../theme";

export default function HeadToHeadPage() {
  const activeSet = new Set(ACTIVE_MANAGERS);
  const matrixPeople = careers()
    .filter((c) => activeSet.has(c.manager))
    .map((c) => c.manager);

  return (
    <Box sx={{ minHeight: "100dvh", pb: 7 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.07)", bgcolor: "rgba(26,22,17,0.7)" }}>
        <Toolbar sx={{ gap: 1, px: { xs: 1.5, sm: 3 } }}>
          <PageNav />
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ pt: 3, maxWidth: CONTENT_MAXW, mx: "auto" }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Head-to-Head</Typography>
            <Typography variant="body2" color="text.secondary">
              Every active manager&apos;s all-time record against each other. Tap any
              cell for the full series, game by game.
            </Typography>
          </Box>

          <HeadToHead people={matrixPeople} />
        </Stack>
      </Container>
    </Box>
  );
}
