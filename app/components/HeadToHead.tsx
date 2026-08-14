"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { headToHead } from "@/lib/history-stats";
import RivalryDialog from "./RivalryDialog";

const GREEN = "#46c48c";
const RED = "#ec6650";

// Interactive all-time head-to-head matrix. Tap a cell for the full rivalry.
export default function HeadToHead({ people }: { people: string[] }) {
  const [pair, setPair] = useState<{ a: string; b: string } | null>(null);

  // record[a][b] = { w, l } from a's perspective
  const record: Record<string, Record<string, { w: number; l: number; t: number }>> = {};
  for (const a of people) {
    record[a] = {};
    for (const h of headToHead(a)) record[a][h.opponent] = { w: h.wins, l: h.losses, t: h.ties };
  }

  const cell = {
    minWidth: { xs: 46, md: 58 }, width: { xs: 46, md: 58 }, height: { xs: 40, md: 50 },
    textAlign: "center" as const,
    padding: 0, fontVariantNumeric: "tabular-nums" as const,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  };
  const short = (n: string) => n.slice(0, 3);

  return (
    <Box>
      <Typography variant="overline" sx={{ color: "primary.main", display: "block" }}>
        Head-to-head
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Row&apos;s record vs column. Tap any cell for the full series. Seasons with game scores (2022 to 2025).
      </Typography>
      <Box sx={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, width: "fit-content", maxWidth: "100%", mx: "auto" }}>
        <Box component="table" sx={{ borderCollapse: "collapse" }}>
          <Box component="thead">
            <Box component="tr">
              <Box component="th" sx={{ ...cell, position: "sticky", left: 0, zIndex: 2, bgcolor: "#1a1611", textAlign: "left", pl: 1, minWidth: { xs: 64, md: 88 }, width: { xs: 64, md: 88 } }} />
              {people.map((p) => (
                <Box component="th" key={p} sx={{ ...cell, fontSize: { xs: 10, md: 12 }, fontFamily: "var(--font-display)", fontWeight: 700, color: "text.secondary", letterSpacing: "0.04em" }}>
                  {short(p)}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {people.map((a) => (
              <Box component="tr" key={a}>
                <Box component="th" sx={{ ...cell, position: "sticky", left: 0, zIndex: 1, bgcolor: "#1a1611", textAlign: "left", pl: 1, fontSize: { xs: 12, md: 14 }, fontWeight: 700, minWidth: { xs: 64, md: 88 }, width: { xs: 64, md: 88 } }}>
                  {a}
                </Box>
                {people.map((b) => {
                  if (a === b) return <Box component="td" key={b} sx={{ ...cell, bgcolor: "rgba(255,255,255,0.03)" }} />;
                  const r = record[a]?.[b];
                  if (!r || r.w + r.l + r.t === 0) return <Box component="td" key={b} sx={{ ...cell, color: "text.secondary" }}>·</Box>;
                  const diff = r.w - r.l;
                  const bg = diff > 0 ? "rgba(70,196,140,0.16)" : diff < 0 ? "rgba(236,102,80,0.16)" : "transparent";
                  return (
                    <Box component="td" key={b} onClick={() => setPair({ a, b })}
                      sx={{ ...cell, cursor: "pointer", bgcolor: bg, fontSize: { xs: 12, md: 14 }, fontWeight: 700,
                        color: diff > 0 ? GREEN : diff < 0 ? RED : "text.primary",
                        "&:hover": { outline: "1px solid rgba(255,106,26,0.6)", outlineOffset: -1 } }}>
                      {r.w}-{r.l}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <RivalryDialog pair={pair} onClose={() => setPair(null)} />
    </Box>
  );
}
