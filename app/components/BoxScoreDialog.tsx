"use client";

import { Box, Dialog, Typography, IconButton, Stack, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { boxscore, type BoxPlayer } from "@/lib/boxscore-stats";

const GREEN = "#46c48c";

const POS_COLOR: Record<string, string> = {
  QB: "#c98bdb", RB: "#5cc4a0", WR: "#e0a54f", TE: "#5f9fd6", FLEX: "#9aa0a6", "D/ST": "#c76b6b", K: "#b0a68f",
};

export type BoxTarget = { season: number; week: number; isPlayoff: boolean; homeId: number; awayId: number; homePerson: string; awayPerson: string };

// Full box score for a single matchup: both starting lineups + benches, with
// per-player points. Data from lib/boxscores.json (ESPN seasons only).
export default function BoxScoreDialog({ target, onClose }: { target: BoxTarget | null; onClose: () => void }) {
  const home = target ? boxscore(target.season, target.week, target.homeId) : null;
  const away = target ? boxscore(target.season, target.week, target.awayId) : null;

  return (
    <Dialog open={!!target} onClose={onClose} fullWidth maxWidth="sm"
      slotProps={{ paper: { sx: { bgcolor: "#201b16", backgroundImage: "none", m: { xs: 1, sm: 4 } } } }}>
      {target && (
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography sx={{ flexGrow: 1, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>
              {target.season} · {target.isPlayoff ? "Playoffs" : `Week ${target.week}`}
            </Typography>
            <IconButton onClick={onClose} size="small" edge="end"><CloseIcon /></IconButton>
          </Stack>

          {!home || !away ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No box score available for this matchup (2024 was on Sleeper — no player data).
            </Typography>
          ) : (
            <>
              {/* header with totals */}
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
                <TeamHead person={target.homePerson} total={home.total} win={home.total >= away.total} />
                <Typography sx={{ fontSize: 11, color: "text.secondary" }}>vs</Typography>
                <TeamHead person={target.awayPerson} total={away.total} win={away.total > home.total} align="right" />
              </Stack>

              <Lineups home={home.starters} away={away.starters} />

              <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.08)" }}>
                <Typography sx={{ fontSize: 9.5, letterSpacing: "0.1em", color: "text.secondary", fontWeight: 700 }}>BENCH</Typography>
              </Divider>
              <Lineups home={home.bench} away={away.bench} dim />
            </>
          )}
        </Box>
      )}
    </Dialog>
  );
}

function TeamHead({ person, total, win, align }: { person: string; total: number; win: boolean; align?: "right" }) {
  return (
    <Box sx={{ flex: 1, textAlign: align === "right" ? "right" : "left", minWidth: 0 }}>
      <Typography noWrap sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: win ? GREEN : "text.primary" }}>
        {person}
      </Typography>
      <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, lineHeight: 1, color: win ? GREEN : "text.primary" }}>
        {total.toFixed(1)}
      </Typography>
    </Box>
  );
}

// Two columns of players, aligned row-by-row (starters share slot order).
function Lineups({ home, away, dim }: { home: BoxPlayer[]; away: BoxPlayer[]; dim?: boolean }) {
  const n = Math.max(home.length, away.length);
  return (
    <Stack spacing={0.3}>
      {Array.from({ length: n }).map((_, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, opacity: dim ? 0.6 : 1 }}>
          <PlayerCell p={home[i]} />
          <PlayerCell p={away[i]} align="right" />
        </Box>
      ))}
    </Stack>
  );
}

function PlayerCell({ p, align }: { p?: BoxPlayer; align?: "right" }) {
  if (!p) return <Box sx={{ flex: 1 }} />;
  const right = align === "right";
  const slot = (
    <Typography sx={{ fontSize: 8.5, fontWeight: 800, color: POS_COLOR[p.slot] || "text.secondary", width: 30, flexShrink: 0, textAlign: "center", fontFamily: "var(--font-display)" }}>
      {p.slot}
    </Typography>
  );
  const name = (
    <Typography noWrap sx={{ fontSize: 12, flexGrow: 1, minWidth: 0, textAlign: right ? "right" : "left" }}>{p.name}</Typography>
  );
  const pts = (
    <Typography className="num" sx={{ fontSize: 12, fontWeight: 700, width: 34, flexShrink: 0, textAlign: right ? "left" : "right" }}>{p.pts.toFixed(1)}</Typography>
  );
  return (
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 0.5 }}>
      {right ? <>{pts}{name}{slot}</> : <>{slot}{name}{pts}</>}
    </Box>
  );
}
