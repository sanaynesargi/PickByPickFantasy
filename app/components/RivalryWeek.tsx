"use client";

import { useMemo, useState } from "react";
import { Box, Typography, Stack, Chip } from "@mui/material";
import { rivalryWeek } from "@/lib/history-stats";
import RivalryDialog from "./RivalryDialog";

const GREEN = "#46c48c";
const RED = "#ec6650";

// Auto-generated "Rivalry Week": the most balanced possible set of matchups,
// computed as a min-cost perfect matching over head-to-head records.
export default function RivalryWeek({ people }: { people: string[] }) {
  const matchups = useMemo(() => rivalryWeek(people), [people]);
  const [pair, setPair] = useState<{ a: string; b: string } | null>(null);

  return (
    <Box>
      <Typography variant="overline" sx={{ color: "primary.main", display: "block" }}>
        Rivalry Week
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        The most evenly matched pairings by all-time head-to-head. Tap a card for the full series.
      </Typography>

      <Stack spacing={1.25}>
        {matchups.map((m) => {
          const leader = m.aWins === m.bWins ? null : m.aWins > m.bWins ? m.a : m.b;
          const record = m.isNew
            ? "no prior meetings"
            : leader
            ? `${leader} leads ${Math.max(m.aWins, m.bWins)}-${Math.min(m.aWins, m.bWins)}`
            : `all square ${m.aWins}-${m.bWins}`;
          const tag = m.isNew
            ? { label: "New rivalry", color: "#c9a94a", bg: "rgba(201,169,74,0.14)" }
            : m.gap === 0
            ? { label: "Dead even", color: GREEN, bg: "rgba(70,196,140,0.14)" }
            : m.gap === 1
            ? { label: "Tight", color: "#8fd0b0", bg: "rgba(70,196,140,0.08)" }
            : m.gap === 2
            ? { label: "Edge", color: "#d9a066", bg: "rgba(217,160,102,0.12)" }
            : { label: "Lopsided", color: RED, bg: "rgba(236,102,80,0.12)" };

          return (
            <Box
              key={`${m.a}-${m.b}`}
              onClick={() => setPair({ a: m.a, b: m.b })}
              sx={{
                cursor: "pointer", borderRadius: 2, p: 1.75,
                border: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.02)",
                transition: "border-color 120ms, background-color 120ms",
                "&:hover": { borderColor: "rgba(255,106,26,0.5)", bgcolor: "rgba(255,106,26,0.04)" },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ flex: 1, textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: leader === m.a ? GREEN : "text.primary" }}>
                  {m.a}
                </Typography>
                <Typography sx={{ px: 1, fontSize: 11, color: "text.secondary", fontWeight: 700, letterSpacing: "0.08em" }}>
                  VS
                </Typography>
                <Typography sx={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: leader === m.b ? GREEN : "text.primary" }}>
                  {m.b}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.25} sx={{ mt: 0.75 }}>
                <Typography className="num" sx={{ fontSize: 13, color: "text.secondary", fontWeight: 600 }}>
                  {record}
                </Typography>
                <Chip label={tag.label} size="small"
                  sx={{ height: 20, fontSize: 10.5, fontWeight: 700, color: tag.color, bgcolor: tag.bg, letterSpacing: "0.03em" }} />
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <RivalryDialog pair={pair} onClose={() => setPair(null)} />
    </Box>
  );
}
