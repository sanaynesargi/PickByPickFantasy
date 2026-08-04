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
import { HISTORY, ACTIVE_MANAGERS, leagueSeason, winPct, recordStr, type StandingRow } from "@/lib/history-data";
import { careers, correlations, medalTally } from "@/lib/history-stats";
import { MEDAL } from "../theme";
import PickAverages from "../components/PickAverages";
import PersonDialog from "./PersonDialog";

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
  const [person, setPerson] = useState<string | null>(null);
  const seasonData = typeof view === "number"
    ? HISTORY.find((h) => h.season === view) ?? HISTORY[0]
    : null;

  return (
    <Box sx={{ minHeight: "100dvh", pb: 7 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.07)", bgcolor: "rgba(26,22,17,0.7)" }}>
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

          {seasonData ? (
            <SeasonView data={seasonData} onPerson={setPerson} />
          ) : (
            <AllTimeView onPerson={setPerson} />
          )}
        </Stack>
      </Container>

      <PersonDialog manager={person} onClose={() => setPerson(null)} />
    </Box>
  );
}

function SeasonView({ data, onPerson }: { data: (typeof HISTORY)[number]; onPerson: (m: string) => void }) {
  // Round-1 player each team drafted (from ESPN; absent for the Sleeper 2024 season).
  const r1 = new Map<number, { player: string; pos: string }>();
  leagueSeason(data.season)?.draftPicks
    .filter((p) => p.round === 1)
    .forEach((p) => r1.set(p.overall, { player: p.player, pos: p.pos }));
  const rows = data.draftOrder.map((p) => ({
    ...p,
    s: data.standings.find((st) => st.team === p.team),
    drafted: r1.get(p.pick),
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
          {rows.map(({ pick, team, manager, s, drafted }) => {
            const medal = medalColor(s?.playoffRank);
            return (
              <Card key={pick}
                onClick={() => manager && onPerson(manager)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5, pr: 2, pl: 0,
                  overflow: "hidden", cursor: manager ? "pointer" : "default",
                  borderColor: medal ? `${medal}66` : undefined,
                  "&:hover": manager ? { borderColor: "primary.main", bgcolor: "rgba(255,255,255,0.06)" } : undefined,
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
                  {drafted && (
                    <Typography variant="caption" noWrap component="div"
                      sx={{ color: "primary.light", fontWeight: 600 }}>
                      1.{String(pick).padStart(2, "0")} · {drafted.player}
                      {drafted.pos ? ` · ${drafted.pos}` : ""}
                    </Typography>
                  )}
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

function AllTimeView({ onPerson }: { onPerson: (m: string) => void }) {
  const [roster, setRoster] = useState<"active" | "all">("active");
  const corrs = correlations();
  // "Active" = the current roster; everyone else (incl. archived Charles) is former.
  const activeSet = new Set(ACTIVE_MANAGERS);
  const people = careers().filter((c) => roster === "all" || activeSet.has(c.manager));

  return (
    <>
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography variant="overline" sx={{ color: "primary.main", flexGrow: 1 }}>
            Career by person
          </Typography>
          <ToggleButtonGroup exclusive value={roster} size="small"
            onChange={(_, v) => v && setRoster(v)}
            sx={{
              "& .MuiToggleButton-root": {
                border: "1px solid rgba(255,255,255,0.14)", borderRadius: "999px !important",
                px: 1.4, py: 0.3, fontSize: 11.5, fontFamily: "var(--font-display)", fontWeight: 700,
                textTransform: "none", lineHeight: 1.4,
              },
              "& .Mui-selected": { bgcolor: "primary.main !important", color: "#0c0a08 !important" },
              gap: 0.5,
            }}>
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="all">All-time</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Tap a name for their season-by-season timeline. reg fin = regular-season
          · PO fin = playoff finish · 🏆 = title
        </Typography>
        <Stack spacing={1}>
          {people.map((c, i) => (
            <Card key={c.manager}
              onClick={() => onPerson(c.manager)}
              sx={{
                display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.2, cursor: "pointer",
                "&:hover": { borderColor: "primary.main", bgcolor: "rgba(255,255,255,0.06)" },
              }}>
              <Typography className="num" sx={{
                width: 26, textAlign: "center", flexShrink: 0,
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15,
                color: i === 0 ? "primary.light" : "text.secondary",
              }}>
                {i + 1}
              </Typography>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
                    {c.manager}{medalTally(c) ? ` ${medalTally(c)}` : ""}
                  </Typography>
                  {roster === "all" && !activeSet.has(c.manager) && (
                    <Chip size="small" label="former" variant="outlined"
                      sx={{ height: 16, fontSize: 9, flexShrink: 0 }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" component="div">
                  {c.seasons} {c.seasons === 1 ? "season" : "seasons"} · pick{" "}
                  <span className="num">{c.avgPick.toFixed(1)}</span> · reg fin{" "}
                  <span className="num">{c.avgFinish.toFixed(1)}</span> · PO fin{" "}
                  <span className="num">{c.avgPlayoff !== undefined ? c.avgPlayoff.toFixed(1) : "·"}</span>
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                  {recStr(c)}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div" className="num">
                  {pct3(c.winPct)}
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
