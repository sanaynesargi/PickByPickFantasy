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
  IconButton,
  TextField,
  LinearProgress,
  Divider,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { api, type DraftState, type StandingTeam } from "@/lib/api";
import { INK } from "../theme";

function record(t: StandingTeam) {
  return t.ties > 0 ? `${t.wins}-${t.losses}-${t.ties}` : `${t.wins}-${t.losses}`;
}

export default function Admin() {
  const [state, setState] = useState<DraftState | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);
  const [form, setForm] = useState({
    name: "", owner: "", wins: "", losses: "", ties: "", pf: "", pa: "", finish: "",
  });

  const load = useCallback(async () => {
    try {
      setState(await api.state());
    } catch {
      setToast({ msg: "Couldn't load teams.", sev: "error" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const draftStarted = (state?.picks.length ?? 0) > 0;

  async function addTeam() {
    if (!form.name.trim()) {
      setToast({ msg: "Enter a team name.", sev: "error" });
      return;
    }
    setBusy(true);
    try {
      await api.addTeam({
        name: form.name.trim(),
        owner: form.owner.trim(),
        wins: Number(form.wins) || 0,
        losses: Number(form.losses) || 0,
        ties: Number(form.ties) || 0,
        pointsFor: Number(form.pf) || 0,
        pointsAgainst: Number(form.pa) || 0,
        finishRank: Number(form.finish) || 0,
      });
      setForm({ name: "", owner: "", wins: "", losses: "", ties: "", pf: "", pa: "", finish: "" });
      await load();
      setToast({ msg: "Team added.", sev: "success" });
    } catch (e) {
      setToast({ msg: (e as Error).message, sev: "error" });
    } finally {
      setBusy(false);
    }
  }

  type EditableField =
    | "owner" | "wins" | "losses" | "ties" | "pointsFor" | "pointsAgainst" | "finishRank";

  async function patch(id: number, field: EditableField, value: string) {
    const v: string | number =
      field === "owner" ? value.trim() : Math.max(0, Number(value) || 0);
    setState((s) =>
      s
        ? { ...s, teams: s.teams.map((t) => (t.id === id ? { ...t, [field]: v } : t)) }
        : s
    );
    try {
      await api.updateTeam(id, { [field]: v });
    } catch {
      setToast({ msg: "Update failed.", sev: "error" });
      load();
    }
  }

  async function remove(id: number) {
    setBusy(true);
    try {
      await api.deleteTeam(id);
      await load();
      setToast({ msg: "Team removed.", sev: "success" });
    } finally {
      setBusy(false);
    }
  }

  async function seed() {
    setBusy(true);
    try {
      await api.seed();
      await load();
      setToast({ msg: "Loaded last year's standings.", sev: "success" });
    } finally {
      setBusy(false);
    }
  }

  const teams = state?.teams ?? [];

  return (
    <Box sx={{ minHeight: "100dvh", pb: 6 }}>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(26,22,17,0.7)" }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton component={Link} href="/" color="inherit" edge="start">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Teams & Standings
          </Typography>
        </Toolbar>
        {busy && <LinearProgress color="primary" />}
      </AppBar>

      <Container maxWidth={false} sx={{ pt: 3, maxWidth: { xs: "100%", sm: 600, md: 820 }, mx: "auto" }}>
        <Stack spacing={3}>
          <Card variant="outlined" sx={{ borderColor: "rgba(255,106,26,0.4)" }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                Enter last year&apos;s standings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add each team and its final record from last season (currently
                seeded with <b>2025</b>). The draft order is these standings
                <b> reversed</b>, so last place picks first. Set <b>Finish</b> (1
                = 1st) to lock the exact order when records tie.
              </Typography>
            </CardContent>
          </Card>

          {draftStarted && (
            <Alert severity="info" variant="outlined">
              The draft has started. Editing records won&apos;t change slots already
              claimed; reset the draft on the home screen to re-run it.
            </Alert>
          )}

          {/* Add a team */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Add a team</Typography>
              <Stack spacing={1.5}>
                <TextField label="Team name" size="small" fullWidth value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addTeam()} />
                <TextField label="Manager (optional)" size="small" fullWidth value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                <Stack direction="row" spacing={1}>
                  <TextField label="Wins" size="small" type="number" value={form.wins}
                    onChange={(e) => setForm({ ...form, wins: e.target.value })}
                    inputProps={{ min: 0 }} sx={{ flex: 1 }} />
                  <TextField label="Losses" size="small" type="number" value={form.losses}
                    onChange={(e) => setForm({ ...form, losses: e.target.value })}
                    inputProps={{ min: 0 }} sx={{ flex: 1 }} />
                  <TextField label="Ties" size="small" type="number" value={form.ties}
                    onChange={(e) => setForm({ ...form, ties: e.target.value })}
                    inputProps={{ min: 0 }} sx={{ flex: 1 }} />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField label="Points for" size="small" type="number" value={form.pf}
                    onChange={(e) => setForm({ ...form, pf: e.target.value })}
                    inputProps={{ min: 0, step: "0.01" }} sx={{ flex: 1 }} />
                  <TextField label="Points against" size="small" type="number" value={form.pa}
                    onChange={(e) => setForm({ ...form, pa: e.target.value })}
                    inputProps={{ min: 0, step: "0.01" }} sx={{ flex: 1 }} />
                  <TextField label="Finish" size="small" type="number" value={form.finish}
                    onChange={(e) => setForm({ ...form, finish: e.target.value })}
                    inputProps={{ min: 0 }} sx={{ flex: 1 }}
                    helperText="1 = 1st" />
                </Stack>
                <Button variant="contained" color="primary" startIcon={<AddIcon />}
                  onClick={addTeam} disabled={busy} sx={{ color: INK, alignSelf: "flex-start" }}>
                  Add team
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Standings ordered by last year's finish. Draft runs in reverse. */}
          <Box>
            <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Standings ({teams.length})
              </Typography>
              {teams.length === 0 && (
                <Button size="small" onClick={seed} disabled={busy}>Load our league</Button>
              )}
            </Stack>

            {teams.length === 0 ? (
              <Typography color="text.secondary">
                No teams yet. Add one above, or load last year&apos;s
                &ldquo;No Punt Intended&rdquo; standings.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {teams.map((t) => (
                  <Card key={t.id} variant="outlined">
                    <Box sx={{ p: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13,
                          bgcolor: "rgba(255,106,26,0.15)", color: "primary.main",
                        }}>
                          {t.rank}
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography noWrap fontWeight={700}>{t.name}</Typography>
                          {t.owner && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {t.owner}
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {record(t)}
                        </Typography>
                        <Tooltip title="Remove team">
                          <IconButton size="small" color="error" onClick={() => remove(t.id)} disabled={busy}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                      <TextField label="Manager" size="small" fullWidth defaultValue={t.owner}
                        onBlur={(e) => patch(t.id, "owner", e.target.value)} sx={{ mb: 1 }} />
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <TextField label="W" size="small" type="number" defaultValue={t.wins}
                          onBlur={(e) => patch(t.id, "wins", e.target.value)}
                          inputProps={{ min: 0 }} sx={{ flex: 1 }} />
                        <TextField label="L" size="small" type="number" defaultValue={t.losses}
                          onBlur={(e) => patch(t.id, "losses", e.target.value)}
                          inputProps={{ min: 0 }} sx={{ flex: 1 }} />
                        <TextField label="T" size="small" type="number" defaultValue={t.ties}
                          onBlur={(e) => patch(t.id, "ties", e.target.value)}
                          inputProps={{ min: 0 }} sx={{ flex: 1 }} />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField label="Points for" size="small" type="number" defaultValue={t.pointsFor}
                          onBlur={(e) => patch(t.id, "pointsFor", e.target.value)}
                          inputProps={{ min: 0, step: "0.01" }} sx={{ flex: 1 }} />
                        <TextField label="Points against" size="small" type="number" defaultValue={t.pointsAgainst}
                          onBlur={(e) => patch(t.id, "pointsAgainst", e.target.value)}
                          inputProps={{ min: 0, step: "0.01" }} sx={{ flex: 1 }} />
                        <TextField label="Finish" size="small" type="number" defaultValue={t.finishRank || ""}
                          onBlur={(e) => patch(t.id, "finishRank", e.target.value)}
                          inputProps={{ min: 0 }} sx={{ flex: 1 }} />
                      </Stack>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

          {teams.length > 0 && (
            <>
              <Divider />
              <Button component={Link} href="/" variant="contained" color="primary"
                sx={{ color: INK }}>
                Go to the draft board
              </Button>
            </>
          )}
        </Stack>
      </Container>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)}
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
