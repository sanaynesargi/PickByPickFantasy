"use client";

import { Box, Dialog, Typography, IconButton, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { rivalry } from "@/lib/history-stats";

const GREEN = "#46c48c";
const RED = "#ec6650";

// Full rivalry series between two people. Shared by the head-to-head matrix
// and the Rivalry Week generator.
export default function RivalryDialog({
  pair,
  onClose,
}: {
  pair: { a: string; b: string } | null;
  onClose: () => void;
}) {
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
          {r.games.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
              No games yet — this would be their first-ever meeting.
            </Typography>
          ) : (
            <>
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
            </>
          )}
        </Box>
      )}
    </Dialog>
  );
}
