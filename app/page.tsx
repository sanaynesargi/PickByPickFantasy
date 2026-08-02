"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  LinearProgress,
  Divider,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import SportsFootballIcon from "@mui/icons-material/SportsFootball";
import SettingsIcon from "@mui/icons-material/Settings";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SwitchAccountIcon from "@mui/icons-material/SwitchAccount";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { api, type DraftState, type StandingTeam } from "@/lib/api";
import { useIdentity } from "@/lib/useIdentity";
import { INK } from "./theme";

function record(t: StandingTeam) {
  return t.ties > 0 ? `${t.wins}-${t.losses}-${t.ties}` : `${t.wins}-${t.losses}`;
}
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function Home() {
  const [state, setState] = useState<DraftState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);
  const { teamId: myId, ready, claim, release } = useIdentity();

  const load = useCallback(async () => {
    try {
      setState(await api.state());
    } catch {
      setToast({ msg: "Couldn't reach the server.", sev: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Live board: poll so every drafter sees picks land in near real time.
  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  const teamById = (id: number | null) =>
    state?.teams.find((t) => t.id === id) ?? null;

  const myTeam = teamById(myId);
  const onClock = teamById(state?.onTheClockTeamId ?? null);
  const myTurn = !!myTeam && myTeam.id === state?.onTheClockTeamId;

  async function claimSlot(pickNumber: number) {
    if (!myTeam) return;
    setBusy(true);
    try {
      const next = await api.pick(myTeam.id, pickNumber);
      setState(next);
      setToast({ msg: `You locked in pick #${pickNumber}!`, sev: "success" });
    } catch (e) {
      setToast({ msg: (e as Error).message, sev: "error" });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function seed() {
    setBusy(true);
    try {
      await api.seed();
      await load();
      setToast({ msg: "Loaded the 8-team demo league.", sev: "success" });
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      await api.reset();
      await load();
      setToast({ msg: "Draft reset.", sev: "success" });
    } finally {
      setBusy(false);
    }
  }

  const madeCount = state ? state.picks.length : 0;
  const showGate = ready && state && state.totalTeams > 0 && !myTeam;

  return (
    <Box sx={{ minHeight: "100dvh", pb: 6 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(10,10,10,0.8)" }}>
        <Toolbar sx={{ gap: 1 }}>
          <SportsFootballIcon color="primary" />
          <Box sx={{ flexGrow: 1, lineHeight: 1 }}>
            <Typography variant="h6" component="h1" sx={{ lineHeight: 1.1 }}>
              Pick for Pick
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Reverse-standings draft order
            </Typography>
          </Box>
          {myTeam && (
            <Tooltip title="Switch team">
              <Chip color="primary" variant="outlined" onClick={release}
                icon={<SwitchAccountIcon />} label={myTeam.name}
                sx={{ maxWidth: 160, mr: 0.5 }} />
            </Tooltip>
          )}
          <Tooltip title="Manage teams & standings">
            <IconButton component={Link} href="/admin" color="inherit" edge="end">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        {(loading || busy) && <LinearProgress color="primary" />}
      </AppBar>

      <Container maxWidth="sm" sx={{ pt: 3 }}>
        {state && state.totalTeams === 0 && <EmptyState onSeed={seed} busy={busy} />}

        {showGate && (
          <JoinGate teams={state!.teams} onClaim={claim} />
        )}

        {state && state.totalTeams > 0 && myTeam && (
          <Stack spacing={3}>
            {/* Progress */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip size="small" color="primary" variant="outlined"
                label={`${madeCount} / ${state.totalTeams} picked`} />
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress variant="determinate"
                  value={state.totalTeams ? (madeCount / state.totalTeams) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </Stack>

            {/* On the clock */}
            {state.complete ? (
              <Card sx={{ border: "1px solid", borderColor: "primary.main" }}>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <EmojiEventsIcon color="primary" sx={{ fontSize: 48 }} />
                  <Typography variant="h5" fontWeight={800} mt={1}>
                    Draft order is set!
                  </Typography>
                  <Typography color="text.secondary">
                    Every team has claimed a slot. Good luck this season.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              onClock && (
                <Card sx={{
                  position: "relative", overflow: "hidden",
                  border: "1px solid", borderColor: myTurn ? "primary.main" : "rgba(255,255,255,0.12)",
                  background: myTurn
                    ? "linear-gradient(160deg, rgba(255,122,24,0.20), rgba(255,122,24,0.04))"
                    : "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                }}>
                  <CardContent>
                    <Typography variant="overline" color="primary" fontWeight={800}>
                      {myTurn ? "You're on the clock" : "On the clock"}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1, mb: 0.5 }}>
                      {onClock.name}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
                      <Chip size="small" label={`Finished ${ordinal(onClock.rank)} last year`} />
                      <Chip size="small" variant="outlined" label={record(onClock)} />
                    </Stack>

                    {myTurn ? (
                      <>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Choose your draft slot
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {state.availableSlots.map((n) => (
                            <Button key={n} variant="contained" color="primary"
                              disabled={busy} onClick={() => claimSlot(n)}
                              sx={{ minWidth: 64 }}>
                              #{n}
                            </Button>
                          ))}
                        </Box>
                      </>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                        <HourglassEmptyIcon fontSize="small" />
                        <Typography variant="body2">
                          Waiting for {onClock.name} to choose a slot…
                        </Typography>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              )
            )}

            {/* Draft board */}
            <Box>
              <Typography variant="h6" gutterBottom>Draft board</Typography>
              <Stack spacing={1}>
                {Array.from({ length: state.totalTeams }, (_, i) => i + 1).map((n) => {
                  const pick = state.picks.find((p) => p.pickNumber === n);
                  const team = teamById(pick?.teamId ?? null);
                  return (
                    <SlotRow key={n} filled={!!team}
                      slotNumber={n} teamName={team?.name}
                      rank={team?.rank} rec={team ? record(team) : undefined}
                      mine={!!team && team.id === myId} />
                  );
                })}
              </Stack>
            </Box>

            {/* Selection order */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Selection order
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  worst → best
                </Typography>
              </Typography>
              <Stack spacing={0.5}>
                {state.selectionOrder.map((id, i) => {
                  const t = teamById(id);
                  if (!t) return null;
                  const picked = state.picksByTeam[id];
                  const isNow = id === state.onTheClockTeamId;
                  const isMe = id === myId;
                  return (
                    <Stack key={id} direction="row" alignItems="center" spacing={1}
                      sx={{
                        px: 1.5, py: 1, borderRadius: 2,
                        bgcolor: isNow ? "rgba(255,122,24,0.12)" : "transparent",
                        border: isNow ? "1px solid rgba(255,122,24,0.5)" : "1px solid transparent",
                      }}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 24 }}>
                        {i + 1}.
                      </Typography>
                      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography noWrap sx={{ fontWeight: isNow || isMe ? 700 : 500 }}>
                          {t.name}
                        </Typography>
                        {isMe && (
                          <Chip size="small" label="You" color="primary" variant="outlined"
                            sx={{ height: 18, fontSize: 11 }} />
                        )}
                      </Box>
                      {picked ? (
                        <Chip size="small" color="primary" variant="outlined"
                          icon={<CheckCircleIcon />} label={`Pick #${picked}`} />
                      ) : isNow ? (
                        <Chip size="small" color="primary" label="On the clock" />
                      ) : (
                        <Chip size="small" variant="outlined" label="Waiting" />
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </Box>

            <Divider />
            <Stack direction="row" spacing={1}>
              <Button startIcon={<RestartAltIcon />} onClick={reset}
                color="inherit" variant="outlined" disabled={busy}>
                Reset draft
              </Button>
              <Button component={Link} href="/admin" color="inherit" variant="text">
                Edit teams
              </Button>
            </Stack>
          </Stack>
        )}
      </Container>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {toast ? (
          <Alert severity={toast.sev} variant="filled" onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

function JoinGate({
  teams,
  onClaim,
}: {
  teams: StandingTeam[];
  onClaim: (id: number) => void;
}) {
  return (
    <Card sx={{ mt: 4 }}>
      <CardContent sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <SportsFootballIcon color="primary" sx={{ fontSize: 44, mb: 1 }} />
          <Typography variant="h5" fontWeight={800}>Join the draft</Typography>
          <Typography color="text.secondary">
            Tap your team. You&apos;ll be able to pick when it&apos;s your turn.
          </Typography>
        </Box>
        <Stack spacing={1}>
          {[...teams]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((t) => (
              <Button key={t.id} onClick={() => onClaim(t.id)}
                variant="outlined" color="inherit" size="large"
                sx={{ justifyContent: "space-between", py: 1.25 }}
                endIcon={<Chip size="small" variant="outlined" label={record(t)} />}>
                {t.name}
              </Button>
            ))}
        </Stack>
        <Typography variant="caption" color="text.secondary"
          sx={{ display: "block", mt: 2, textAlign: "center" }}>
          Not on the list? Add teams on the settings screen.
        </Typography>
      </CardContent>
    </Card>
  );
}

function SlotRow(props: {
  filled: boolean;
  slotNumber: number;
  teamName?: string;
  rank?: number;
  rec?: string;
  mine?: boolean;
}) {
  return (
    <Card variant="outlined"
      sx={{
        display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25,
        opacity: props.filled ? 1 : 0.55,
        borderColor: props.mine
          ? "primary.main"
          : props.filled
          ? "rgba(255,122,24,0.4)"
          : undefined,
      }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        display: "grid", placeItems: "center", fontWeight: 800,
        bgcolor: props.filled ? "primary.main" : "rgba(255,255,255,0.06)",
        color: props.filled ? INK : "text.secondary",
      }}>
        {props.slotNumber}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        {props.teamName ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Typography noWrap fontWeight={700}>{props.teamName}</Typography>
              {props.mine && (
                <Chip size="small" label="You" color="primary" variant="outlined"
                  sx={{ height: 18, fontSize: 11 }} />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {ordinal(props.rank!)} last year · {props.rec}
            </Typography>
          </>
        ) : (
          <Typography color="text.secondary">Open slot</Typography>
        )}
      </Box>
    </Card>
  );
}

function EmptyState({ onSeed, busy }: { onSeed: () => void; busy: boolean }) {
  return (
    <Card sx={{ textAlign: "center", mt: 6 }}>
      <CardContent sx={{ py: 6 }}>
        <SportsFootballIcon color="primary" sx={{ fontSize: 56, mb: 1 }} />
        <Typography variant="h5" fontWeight={800} gutterBottom>
          No teams yet
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: "auto" }}>
          Load a sample league to try the draft, or add your own teams and last
          year&apos;s records.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
          <Button variant="contained" color="primary" onClick={onSeed} disabled={busy}>
            Load demo league
          </Button>
          <Button component={Link} href="/admin" variant="outlined" color="inherit">
            Add teams manually
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
