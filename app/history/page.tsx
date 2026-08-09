"use client";

import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Card,
  Typography,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { HISTORY, leagueSeason, recordStr, type StandingRow, type LeagueSeason } from "@/lib/history-data";
import { hasBoxscores } from "@/lib/boxscore-stats";
import { MEDAL } from "../theme";
import PageNav from "../components/PageNav";
import PersonDialog from "./PersonDialog";
import BoxScoreDialog, { type BoxTarget } from "../components/BoxScoreDialog";

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
  const [season, setSeason] = useState<number>(HISTORY[0].season);
  const [person, setPerson] = useState<string | null>(null);
  const seasonData = HISTORY.find((h) => h.season === season) ?? HISTORY[0];

  return (
    <Box sx={{ minHeight: "100dvh", pb: 7 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.07)", bgcolor: "rgba(26,22,17,0.7)" }}>
        <Toolbar sx={{ gap: 1, px: { xs: 1.5, sm: 3 } }}>
          <PageNav />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ overflowX: "auto", pb: 0.5, mx: -0.5, px: 0.5 }}>
            <ToggleButtonGroup exclusive value={season} color="primary"
              onChange={(_, v) => v != null && setSeason(v)} size="small"
              sx={{
                gap: 0.75,
                "& .MuiToggleButton-root": {
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "999px !important",
                  px: 2, py: 0.6, fontFamily: "var(--font-display)", fontWeight: 700,
                },
                "& .Mui-selected": { bgcolor: "primary.main !important", color: "#0c0a08 !important" },
              }}>
              {HISTORY.map((h) => (
                <ToggleButton key={h.season} value={h.season} className="num">{h.season}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <SeasonView data={seasonData} onPerson={setPerson} />
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
  const espn = leagueSeason(data.season); // rich data (schedule/players)
  const hasDraft = !!espn && espn.draftPicks.length > 0;
  const hasScores = !!espn && espn.schedule.length > 0;
  const [tab, setTab] = useState<"board" | "draft" | "scores">("board");
  const view = tab === "draft" && hasDraft ? "draft" : tab === "scores" && hasScores ? "scores" : "board";

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

      {(hasDraft || hasScores) && (
        <ToggleButtonGroup exclusive value={view} fullWidth
          onChange={(_, v) => v && setTab(v)}
          sx={{
            "& .MuiToggleButton-root": {
              border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px !important",
              py: 1.1, fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "none",
            },
            "& .Mui-selected": { bgcolor: "primary.main !important", color: "#0c0a08 !important" },
            gap: 0.75,
          }}>
          <ToggleButton value="board">Board</ToggleButton>
          {hasDraft && <ToggleButton value="draft">Full draft</ToggleButton>}
          {hasScores && <ToggleButton value="scores">Scores</ToggleButton>}
        </ToggleButtonGroup>
      )}

      {view === "draft" && espn && <SeasonDraft season={espn} onPerson={onPerson} />}
      {view === "scores" && espn && <SeasonScores season={espn} onPerson={onPerson} />}

      {view === "board" && (<>
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
      </>)}
    </>
  );
}

function SeasonDraft({ season, onPerson }: { season: LeagueSeason; onPerson: (m: string) => void }) {
  const [by, setBy] = useState<"round" | "team">("round");
  const picks = season.draftPicks;
  const rounds = [...new Set(picks.map((p) => p.round))].sort((a, b) => a - b);
  // team draft slot order (round 1 overall order)
  const teamOrder = picks.filter((p) => p.round === 1).sort((a, b) => a.overall - b.overall).map((p) => p.teamId);
  const teamMeta = new Map(season.teams.map((t) => [t.id, t]));

  const posColor: Record<string, string> = { QB: "#e8b64c", RB: "#46c48c", WR: "#4f9dd6", TE: "#c98cff", K: "#bcb2a4", "D/ST": "#ec6650" };
  const PlayerLine = ({ label, player, pos }: { label: string; player: string; pos: string }) => (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, py: 0.35 }}>
      <Typography className="num" sx={{ width: 34, flexShrink: 0, fontSize: 11, color: "text.secondary", fontFamily: "var(--font-display)", fontWeight: 700 }}>{label}</Typography>
      <Typography noWrap sx={{ flexGrow: 1, fontSize: 13.5, minWidth: 0 }}>{player}</Typography>
      {pos && <Typography sx={{ fontSize: 10, fontWeight: 700, color: posColor[pos] || "text.secondary", flexShrink: 0 }}>{pos}</Typography>}
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="overline" sx={{ color: "primary.main", flexGrow: 1 }}>
          Full draft · {picks.length} picks
        </Typography>
        <ToggleButtonGroup exclusive value={by} size="small" onChange={(_, v) => v && setBy(v)}
          sx={{ "& .MuiToggleButton-root": { border: "1px solid rgba(255,255,255,0.14)", borderRadius: "999px !important", px: 1.3, py: 0.2, fontSize: 11, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "none" }, "& .Mui-selected": { bgcolor: "primary.main !important", color: "#0c0a08 !important" }, gap: 0.5 }}>
          <ToggleButton value="round">By round</ToggleButton>
          <ToggleButton value="team">By team</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack spacing={1}>
        {by === "round"
          ? rounds.map((rd) => (
              <Card key={rd} sx={{ px: 1.75, py: 1.25 }}>
                <Typography variant="caption" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "text.secondary", letterSpacing: "0.08em" }}>
                  ROUND {rd}
                </Typography>
                {picks.filter((p) => p.round === rd).sort((a, b) => a.overall - b.overall).map((p) => (
                  <Box key={p.overall} onClick={() => onPerson(p.person)} sx={{ display: "flex", alignItems: "baseline", gap: 0.75, py: 0.35, cursor: "pointer", "&:hover": { color: "primary.light" } }}>
                    <Typography className="num" sx={{ width: 42, flexShrink: 0, fontSize: 11, color: "text.secondary", fontFamily: "var(--font-display)", fontWeight: 700 }}>{p.round}.{String(p.overall - (p.round - 1) * season.size).padStart(2, "0")}</Typography>
                    <Typography noWrap sx={{ flexGrow: 1, fontSize: 13.5, minWidth: 0 }}>{p.player}{p.pos ? <Box component="span" sx={{ ml: 0.75, fontSize: 10, fontWeight: 700, color: posColor[p.pos] || "text.secondary" }}>{p.pos}</Box> : null}</Typography>
                    <Typography noWrap sx={{ fontSize: 11.5, color: "text.secondary", maxWidth: 120, flexShrink: 0 }}>{p.person}</Typography>
                  </Box>
                ))}
              </Card>
            ))
          : teamOrder.map((tid) => {
              const t = teamMeta.get(tid);
              return (
                <Card key={tid} sx={{ px: 1.75, py: 1.25, cursor: "pointer" }} onClick={() => t && onPerson(t.person)}>
                  <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
                    {t?.name} <Box component="span" sx={{ color: "text.secondary", fontSize: 12, fontWeight: 500 }}>· {t?.person}</Box>
                  </Typography>
                  {picks.filter((p) => p.teamId === tid).sort((a, b) => a.round - b.round).map((p) => (
                    <PlayerLine key={p.overall} label={`R${p.round}`} player={p.player} pos={p.pos} />
                  ))}
                </Card>
              );
            })}
      </Stack>
    </Box>
  );
}

function SeasonScores({ season, onPerson }: { season: LeagueSeason; onPerson: (m: string) => void }) {
  const meta = new Map(season.teams.map((t) => [t.id, t]));
  const played = season.schedule.filter((g) => g.winner !== "UNDECIDED" && (g.homePts > 0 || g.awayPts > 0));
  const weeks = [...new Set(played.map((g) => g.week))].sort((a, b) => a - b);
  const boxAvailable = hasBoxscores(season.season);
  const [box, setBox] = useState<BoxTarget | null>(null);

  // season highlights
  let topScore = { pts: 0, person: "", week: 0 };
  let blowout = { margin: 0, person: "", opp: "", week: 0 };
  for (const g of played) {
    for (const side of [["home", g.homePts, g.homeId, g.awayId] as const, ["away", g.awayPts, g.awayId, g.homeId] as const]) {
      const pts = side[1];
      if (pts > topScore.pts) topScore = { pts, person: meta.get(side[2])?.person || "", week: g.week };
    }
    const m = Math.abs(g.homePts - g.awayPts);
    if (m > blowout.margin) {
      const winId = g.homePts > g.awayPts ? g.homeId : g.awayId;
      const loseId = g.homePts > g.awayPts ? g.awayId : g.homeId;
      blowout = { margin: m, person: meta.get(winId)?.person || "", opp: meta.get(loseId)?.person || "", week: g.week };
    }
  }

  return (
    <Box>
      <Typography variant="overline" sx={{ color: "primary.main", display: "block" }}>Weekly scores</Typography>
      {boxAvailable && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Tap a matchup for the full box score · tap a name for their career.
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Card sx={{ flex: 1, px: 1.5, py: 1 }}>
          <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", color: "text.secondary" }}>TOP SCORE</Typography>
          <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>{topScore.pts.toFixed(1)}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{topScore.person} · wk {topScore.week}</Typography>
        </Card>
        <Card sx={{ flex: 1, px: 1.5, py: 1 }}>
          <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", color: "text.secondary" }}>BIGGEST BLOWOUT</Typography>
          <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>+{blowout.margin.toFixed(1)}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{blowout.person} over {blowout.opp}</Typography>
        </Card>
      </Stack>

      <Stack spacing={1}>
        {weeks.map((wk) => {
          const games = played.filter((g) => g.week === wk);
          const isPo = games[0]?.isPlayoff;
          return (
            <Card key={wk} sx={{ px: 1.75, py: 1.25, borderColor: isPo ? "rgba(255,106,26,0.35)" : undefined }}>
              <Typography variant="caption" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, color: isPo ? "primary.light" : "text.secondary", letterSpacing: "0.08em" }}>
                WEEK {wk}{isPo ? " · PLAYOFFS" : ""}
              </Typography>
              {games.map((g, i) => {
                const homeWin = g.winner === "HOME";
                const awayWin = g.winner === "AWAY";
                const cell = (id: number, pts: number, win: boolean) => (
                  <Box onClick={(e) => { e.stopPropagation(); onPerson(meta.get(id)?.person || ""); }} sx={{ display: "flex", justifyContent: "space-between", flex: 1, minWidth: 0, cursor: "pointer", opacity: win ? 1 : 0.62, "&:hover .nm": { textDecoration: "underline" } }}>
                    <Typography className="nm" noWrap sx={{ fontSize: 13, fontWeight: win ? 700 : 500, minWidth: 0 }}>{meta.get(id)?.person}</Typography>
                    <Typography className="num" sx={{ fontSize: 13, fontWeight: 700, ml: 1, color: win ? "primary.light" : "text.primary" }}>{pts.toFixed(1)}</Typography>
                  </Box>
                );
                const openBox = boxAvailable
                  ? () => setBox({ season: season.season, week: g.week, isPlayoff: g.isPlayoff, homeId: g.homeId, awayId: g.awayId, homePerson: meta.get(g.homeId)?.person || "", awayPerson: meta.get(g.awayId)?.person || "" })
                  : undefined;
                return (
                  <Box key={i} onClick={openBox} sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.4, borderRadius: 1, cursor: openBox ? "pointer" : "default", "&:hover": openBox ? { bgcolor: "rgba(255,255,255,0.04)" } : undefined }}>
                    {cell(g.homeId, g.homePts, homeWin)}
                    <Typography sx={{ fontSize: 10, color: "text.secondary", flexShrink: 0 }}>vs</Typography>
                    {cell(g.awayId, g.awayPts, awayWin)}
                  </Box>
                );
              })}
            </Card>
          );
        })}
      </Stack>

      <BoxScoreDialog target={box} onClose={() => setBox(null)} />
    </Box>
  );
}
