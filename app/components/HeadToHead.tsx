"use client";

import { useState } from "react";
import { Box, Dialog, Typography, IconButton, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { headToHead, rivalry } from "@/lib/history-stats";

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
    minWidth: 46, width: 46, height: 40, textAlign: "center" as const,
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
        Row&apos;s record vs column. Tap any cell for the full series. ESPN seasons (2022, 2023, 2025).
      </Typography>
      <Box sx={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
        <Box component="table" sx={{ borderCollapse: "collapse" }}>
          <Box component="thead">
            <Box component="tr">
              <Box component="th" sx={{ ...cell, position: "sticky", left: 0, zIndex: 2, bgcolor: "#1a1611", textAlign: "left", pl: 1, minWidth: 64, width: 64 }} />
              {people.map((p) => (
                <Box component="th" key={p} sx={{ ...cell, fontSize: 10, fontFamily: "var(--font-display)", fontWeight: 700, color: "text.secondary", letterSpacing: "0.04em" }}>
                  {short(p)}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {people.map((a) => (
              <Box component="tr" key={a}>
                <Box component="th" sx={{ ...cell, position: "sticky", left: 0, zIndex: 1, bgcolor: "#1a1611", textAlign: "left", pl: 1, fontSize: 12, fontWeight: 700, minWidth: 64, width: 64 }}>
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
                      sx={{ ...cell, cursor: "pointer", bgcolor: bg, fontSize: 12, fontWeight: 700,
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

function RivalryDialog({ pair, onClose }: { pair: { a: string; b: string } | null; onClose: () => void }) {
  const r = pair ? rivalry(pair.a, pair.b) : null;
  return (
    <Dialog open={!!pair} onClose={onClose} fullWidth maxWidth="xs"
      slotProps={{ paper: { sx: { bgcolor: "#201b16", backgroundImage: "none", m: { xs: 1.5, sm: 4 } } } }}>
      {r && (
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center">
            <Typography sx={{ flexGrow: 1, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>
              {r.a} vs {r.b}
            </Typography>
            <IconButton onClick={onClose} size="small" edge="end"><CloseIcon /></IconButton>
          </Stack>
          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5, mb: 2 }}>
            <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, color: r.aWins >= r.bWins ? GREEN : RED }}>
              {r.aWins}-{r.bWins}{r.ties ? `-${r.ties}` : ""}
            </Typography>
            <Typography variant="caption" color="text.secondary" className="num">
              {r.games.length} games · {r.a} {(r.aPf / (r.games.length || 1)).toFixed(0)} PF/g · {r.b} {(r.bPf / (r.games.length || 1)).toFixed(0)} PF/g
            </Typography>
          </Stack>
          <Stack spacing={0.4}>
            {r.games.map((g, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.7, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Typography sx={{ width: 78, flexShrink: 0, fontSize: 11, color: g.isPlayoff ? "primary.light" : "text.secondary", fontFamily: "var(--font-display)", fontWeight: 700 }} className="num">
                  {g.season} {g.isPlayoff ? "PO" : "wk"}{g.week}
                </Typography>
                <Typography className="num" sx={{ flexGrow: 1, textAlign: "right", fontWeight: g.winner === "A" ? 800 : 500, color: g.winner === "A" ? GREEN : "text.primary" }}>
                  {g.aPts.toFixed(1)}
                </Typography>
                <Typography sx={{ fontSize: 10, color: "text.secondary" }}>-</Typography>
                <Typography className="num" sx={{ flexGrow: 1, fontWeight: g.winner === "B" ? 800 : 500, color: g.winner === "B" ? GREEN : "text.primary" }}>
                  {g.bPts.toFixed(1)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Dialog>
  );
}
