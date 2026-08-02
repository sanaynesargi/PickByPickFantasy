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
import { api, type DraftState, type StandingTeam } from "@/lib/api";

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

  async function claim(pickNumber: number) {
    if (!state?.onTheClockTeamId) return;
    setBusy(true);
    try {
      const next = await api.pick(state.onTheClockTeamId, pickNumber);
      setState(next);
      setToast({ msg: `Locked in pick #${pickNumber}!`, sev: "success" });
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

  const onClock = teamById(state?.onTheClockTeamId ?? null);
  const madeCount = state ? state.picks.length : 0;

  return (
    <Box sx={{ minHeight: "100dvh", pb: 6 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(10,15,13,0.75)" }}>
        <Toolbar sx={{ gap: 1 }}>
          <SportsFootballIcon color="secondary" />
          <Box sx={{ flexGrow: 1, lineHeight: 1 }}>
            <Typography variant="h6" component="h1" sx={{ lineHeight: 1.1 }}>
              Pick for Pick
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Reverse-standings draft order
            </Typography>
          </Box>
          <Tooltip title="Manage teams & standings">
            <IconButton component={Link} href="/admin" color="inherit" edge="end">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        {(loading || busy) && <LinearProgress color="secondary" />}
      </AppBar>

      <Container maxWidth="sm" sx={{ pt: 3 }}>
        {state && state.totalTeams === 0 && (
          <EmptyState onSeed={seed} busy={busy} />
        )}

        {state && state.totalTeams > 0 && (
          <Stack spacing={3}>
            {/* Progress */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip size="small" color="secondary" variant="outlined"
                label={`${madeCount} / ${state.totalTeams} picked`} />
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress variant="determinate"
                  value={state.totalTeams ? (madeCount / state.totalTeams) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </Stack>

            {/* On the clock */}
            {state.complete ? (
              <Card sx={{ border: "1px solid", borderColor: "secondary.main" }}>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <EmojiEventsIcon color="secondary" sx={{ fontSize: 48 }} />
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
                  border: "1px solid", borderColor: "secondary.main",
                  background: "linear-gradient(160deg, rgba(255,201,60,0.12), rgba(46,125,50,0.10))",
                }}>
                  <CardContent>
                    <Typography variant="overline" color="secondary" fontWeight={800}>
                      On the clock
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1, mb: 0.5 }}>
                      {onClock.name}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
                      <Chip size="small" label={`Finished ${ordinal(onClock.rank)} last year`} />
                      <Chip size="small" variant="outlined" label={record(onClock)} />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Choose your draft slot
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {state.availableSlots.map((n) => (
                        <Button key={n} variant="contained" color="secondary"
                          disabled={busy} onClick={() => claim(n)}
                          sx={{ minWidth: 64, color: "#0a0f0d" }}>
                          #{n}
                        </Button>
                      ))}
                    </Box>
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
                      rank={team?.rank} rec={team ? record(team) : undefined} />
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
                  return (
                    <Stack key={id} direction="row" alignItems="center" spacing={1}
                      sx={{
                        px: 1.5, py: 1, borderRadius: 2,
                        bgcolor: isNow ? "rgba(255,201,60,0.12)" : "transparent",
                        border: isNow ? "1px solid rgba(255,201,60,0.5)" : "1px solid transparent",
                      }}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 24 }}>
                        {i + 1}.
                      </Typography>
                      <Typography sx={{ flexGrow: 1, fontWeight: isNow ? 700 : 500 }}>
                        {t.name}
                      </Typography>
                      {picked ? (
                        <Chip size="small" color="success" variant="outlined"
                          icon={<CheckCircleIcon />} label={`Pick #${picked}`} />
                      ) : isNow ? (
                        <Chip size="small" color="secondary" label="On the clock" />
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

function SlotRow(props: {
  filled: boolean;
  slotNumber: number;
  teamName?: string;
  rank?: number;
  rec?: string;
}) {
  return (
    <Card variant="outlined"
      sx={{
        display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25,
        opacity: props.filled ? 1 : 0.55,
        borderColor: props.filled ? "rgba(76,175,80,0.4)" : undefined,
      }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        display: "grid", placeItems: "center", fontWeight: 800,
        bgcolor: props.filled ? "success.main" : "rgba(255,255,255,0.06)",
        color: props.filled ? "#0a0f0d" : "text.secondary",
      }}>
        {props.slotNumber}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        {props.teamName ? (
          <>
            <Typography noWrap fontWeight={700}>{props.teamName}</Typography>
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
        <SportsFootballIcon color="secondary" sx={{ fontSize: 56, mb: 1 }} />
        <Typography variant="h5" fontWeight={800} gutterBottom>
          No teams yet
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: "auto" }}>
          Load a sample league to try the draft, or add your own teams and last
          year&apos;s records.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
          <Button variant="contained" color="secondary" onClick={onSeed} disabled={busy}
            sx={{ color: "#0a0f0d" }}>
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
