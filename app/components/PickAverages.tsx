"use client";

import { Box } from "@mui/material";
import { perPick } from "@/lib/history-stats";

// Compact historical average table by draft slot. Used on the draft board (to
// inform which slot to claim) and in the all-time history view.
export default function PickAverages({ highlight }: { highlight?: number }) {
  const rows = perPick();
  const num = (v: number | undefined, d = 1) => (v === undefined ? "—" : v.toFixed(d));

  const th = {
    textAlign: "right" as const,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 700,
    color: "text.secondary",
    whiteSpace: "nowrap" as const,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  };
  const td = {
    textAlign: "right" as const,
    padding: "5px 8px",
    fontSize: 13,
    whiteSpace: "nowrap" as const,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  };

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
        <Box component="thead">
          <Box component="tr">
            <Box component="th" sx={{ ...th, textAlign: "left" }}>Pick</Box>
            <Box component="th" sx={th}>Avg W</Box>
            <Box component="th" sx={th}>Avg fin</Box>
            <Box component="th" sx={th}>PF</Box>
            <Box component="th" sx={th}>PA</Box>
            <Box component="th" sx={th}>PD</Box>
          </Box>
        </Box>
        <Box component="tbody">
          {rows.map((r) => {
            const on = highlight === r.pick;
            return (
              <Box component="tr" key={r.pick}
                sx={{ bgcolor: on ? "rgba(255,122,24,0.14)" : "transparent" }}>
                <Box component="td" sx={{ ...td, textAlign: "left", fontWeight: 700,
                  color: on ? "primary.main" : "text.primary" }}>
                  #{r.pick}
                </Box>
                <Box component="td" sx={td}>{num(r.avgWins)}</Box>
                <Box component="td" sx={td}>{num(r.avgFinish)}</Box>
                <Box component="td" sx={td}>{num(r.avgPf, 0)}</Box>
                <Box component="td" sx={td}>{num(r.avgPa, 0)}</Box>
                <Box component="td" sx={{ ...td,
                  color: r.avgPd === undefined ? "text.secondary"
                    : r.avgPd >= 0 ? "success.main" : "error.main" }}>
                  {r.avgPd !== undefined && r.avgPd > 0 ? "+" : ""}{num(r.avgPd, 0)}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
