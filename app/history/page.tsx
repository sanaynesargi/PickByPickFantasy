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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import { HISTORY, winPct, recordStr, type StandingRow } from "@/lib/history-data";
import { careers, correlations } from "@/lib/history-stats";
import { MEDAL } from "../theme";
import PickAverages from "../components/PickAverages";

function pct3(n: number) {
  return n.toFixed(3).replace(/^0/, ""); // .643 style
}
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function medalColor(rank?: number): string | null {
  if (rank === 1) return MEDAL.gold;
  if (rank === 2) return MEDAL.silver;
  if (rank === 3) return MEDAL.bronze;
  return null;
}
function recStr(c: { wins: number; losses: number; ties: number }) {
  return c.ties > 0 ? `${c.wins}-${c.losses}-${c.ties}` : `${c.wins}-${c.losses}`;
}

// Small squared pill used for the reg / playoff finish tags.
function Tag({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: string;
  color?: string;
  strong?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 0.5,
        px: 0.9,
        py: 0.3,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: color ? `${color}66` : "rgba(255,255,255,0.12)",
        bgcolor: color ? `${color}1f` : "transparent",
      }}
    >
      <Typography component="span" sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: color ?? "text.secondary" }}>
        {label}
      </Typography>
      <Typography component="span" className="num" sx={{ fontSize: 12.5, fontWeight: 800, color: color ?? (strong ? "text.primary" : "text.secondary") }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function HistoryPage() {
  const [view, setView] = useState<number | "all">("all");
  const seasonData = typeof view === "number"
    ? HISTORY.find((h) => h.season === view) ?? HISTORY[0]
    : null;

  return (
    <Box sx={{ minHeight: "100dvh", pb: 7 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.07)", bgcolor: "rgba(13,11,9,0.72)" }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton component={Link} href="/" color="inherit" edge="start">
            <ArrowBackIcon />
          </IconButton>
          <HistoryIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            League History
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ overflowX: "auto", pb: 0.5, mx: -0.5, px: 0.5 }}>
            <ToggleButtonGroup exclusive value={view} color="primary"
              onChange={(_, v) => v != null && setView(v)} size="small"
              sx={{
                gap: 0.75,
                "& .MuiToggleButton-root": {
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "999px !important",
                  px: 2, py: 0.6, fontFamily: "var(--font-display)", fontWeight: 700,
                },
                "& .Mui-selected": { bgcolor: "primary.main !important", color: "#0c0a08 !important" },
              }}>
              <ToggleButton value="all">All-time</ToggleButton>
              {HISTORY.map((h) => (
                <ToggleButton key={h.season} value={h.season} className="num">{h.season}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {seasonData ? <SeasonView data={seasonData} /> : <AllTimeView />}
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
  const champ = data.standings.find((s) => s.playoffRank === 1);

  return (
    <>
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h3" sx={{ fontSize: 40 }} className="num">{data.season}</Typography>
          {champ && (
            <Box sx={{
              px: 1, py: 0.4, borderRadius: 1.5, alignSelf: "center",
              border: `1px solid ${MEDAL.gold}66`, bgcolor: `${MEDAL.gold}1f`,
            }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: MEDAL.gold }}>
                CHAMPION
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>
                {champ.manager ?? champ.team}
              </Typography>
            </Box>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {data.league} · {data.format} · via {data.source}
        </Typography>
      </Box>

      <Box>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
          <Typography variant="overline" sx={{ color: "primary.main" }}>Draft board</Typography>
          <Typography variant="caption" color="text.secondary">pick · reg / playoff finish</Typography>
        </Stack>
        <Stack spacing={1}>
          {rows.map(({ pick, team, manager, s }) => {
            const medal = medalColor(s?.playoffRank);
            return (
              <Card key={pick}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5, pr: 2, pl: 0,
                  overflow: "hidden",
                  borderColor: medal ? `${medal}66` : undefined,
                }}>
                <Box sx={{ width: 4, alignSelf: "stretch", bgcolor: medal ?? "transparent" }} />
                <Box sx={{
                  width: 42, height: 42, borderRadius: 2, flexShrink: 0, my: 1.1,
                  display: "grid", placeItems: "center",
                  bgcolor: "rgba(255,106,26,0.12)", border: "1px solid rgba(255,106,26,0.28)",
                }}>
                  <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, color: "primary.light", lineHeight: 1 }}>
                    {pick}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0, py: 1.1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
                      {team}
                    </Typography>
                    {medal && <Box component="span" sx={{ fontSize: 14 }}>{s?.playoffRank === 1 ? "🥇" : s?.playoffRank === 2 ? "🥈" : "🥉"}</Box>}
                    {s?.division && (
                      <Chip size="small" label={s.division} variant="outlined"
                        sx={{ height: 17, fontSize: 9.5, flexShrink: 0 }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {manager ?? "unmapped"}
                    {s?.pointsFor !== undefined && (
                      <> · <span className="num">{s.pointsFor.toFixed(0)}</span> PF</>
                    )}
                  </Typography>
                </Box>
                {s && (
                  <Stack alignItems="flex-end" spacing={0.6} sx={{ flexShrink: 0 }}>
                    <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, lineHeight: 1 }}>
                      {recordStr(s)}
                    </Typography>
                    <Stack direction="row" spacing={0.6}>
                      <Tag label="REG" value={ordinal(s.rank)} />
                      {s.playoffRank && (
                        <Tag label="PO" value={ordinal(s.playoffRank)} color={medal ?? undefined} strong />
                      )}
                    </Stack>
                  </Stack>
                )}
              </Card>
            );
          })}
        </Stack>
      </Box>

      <Typography variant="caption" color="text.secondary">
        In draft order. <b>REG</b> is regular-season finish, <b>PO</b> the playoff
        result; gold, silver and bronze mark the top three of the playoffs.
        {data.standings.every((s) => s.playoffRank === undefined) && " Playoff results not available for this season."}
      </Typography>
    </>
  );
}

function AllTimeView() {
  const people = careers();
  const corrs = correlations();

  return (
    <>
      <Box>
        <Typography variant="overline" sx={{ color: "primary.main", display: "block", mb: 1 }}>
          Career by person
        </Typography>
        <Stack spacing={1}>
          {people.map((c, i) => (
            <Card key={c.manager}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.2 }}>
              <Typography className="num" sx={{
                width: 26, textAlign: "center", flexShrink: 0,
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15,
                color: i === 0 ? "primary.light" : "text.secondary",
              }}>
                {i + 1}
              </Typography>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
                  {c.manager}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {c.seasons} {c.seasons === 1 ? "season" : "seasons"} · avg pick{" "}
                  <span className="num">{c.avgPick.toFixed(1)}</span> · avg finish{" "}
                  <span className="num">{c.avgFinish.toFixed(1)}</span>
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                  {recStr(c)}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div" className="num">
                  {pct3(c.winPct)}{c.firsts > 0 ? ` · 🥇${c.firsts}` : ""}
                </Typography>
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="overline" sx={{ color: "primary.main", display: "block" }}>
          Draft pick vs. outcome
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          Pearson r between draft-slot number and each stat. Negative means earlier
          picks (lower number) tend to do better.
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
          {corrs.map((c) => (
            <Card key={c.label} sx={{ px: 1.75, py: 1.4 }}>
              <Typography variant="caption" color="text.secondary" noWrap>{c.label}</Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.75}>
                <Typography className="num" sx={{
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1,
                  color: c.r == null ? "text.secondary" : c.r < 0 ? "success.main" : "error.main",
                }}>
                  {c.r == null ? "n/a" : (c.r > 0 ? "+" : "") + c.r.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" className="num">n={c.n}</Typography>
              </Stack>
            </Card>
          ))}
        </Box>
      </Box>

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
    </>
  );
}
