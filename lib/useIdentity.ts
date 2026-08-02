"use client";

import { useCallback, useEffect, useState } from "react";

// Name-only "login": each person claims a team on their own device. The claim
// is just the team id kept in localStorage — no password, trusted-league style.
const KEY = "pfp_team_id";

export function useIdentity() {
  const [teamId, setTeamId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    setTeamId(raw ? Number(raw) : null);
    setReady(true);
  }, []);

  const claim = useCallback((id: number) => {
    localStorage.setItem(KEY, String(id));
    setTeamId(id);
  }, []);

  const release = useCallback(() => {
    localStorage.removeItem(KEY);
    setTeamId(null);
  }, []);

  return { teamId, ready, claim, release };
}
