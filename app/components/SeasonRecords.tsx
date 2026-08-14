"use client";

import { Box, Typography, Stack } from "@mui/material";
import { seasonRecords } from "@/lib/history-stats";

const GOLD = "#e8c260";
const RED = "#ec6650";

const rec = (r: { wins: number; losses: number; ties: number }) =>
  r.ties > 0 ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
const pct3 = (r: { wins: number; losses: number; ties: number }) =>
  (r.wins / (r.wins + r.losses + r.ties || 1)).toFixed(3).replace(/^0/, "");

export default function SeasonRecords() {
  const { bestRecord, biggestCollapse } = seasonRecords();

  return (
    <Box>
      <Typography variant="overline" sx={{ color: "primary.main", display: "block" }}>
        Single-season records
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        The best years the league has ever seen — and the hardest falls. 2022 to 2025.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, columnGap: 3 }}>
      <Box>
      {/* Best regular season */}
      <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, mb: 0.75 }}>
        🏆 Best regular season
      </Typography>
      <Stack spacing={0.75} sx={{ mb: { xs: 2.5, md: 0 } }}>
        {bestRecord.map((r, i) => (
          <Box key={`${r.person}-${r.season}`}
            sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1.5, py: 1, borderRadius: 2,
              border: "1px solid", borderColor: i === 0 ? "rgba(232,194,96,0.4)" : "rgba(255,255,255,0.08)",
              bgcolor: i === 0 ? "rgba(232,194,96,0.06)" : "rgba(255,255,255,0.02)" }}>
            <Typography className="num" sx={{ width: 20, textAlign: "center", flexShrink: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: i === 0 ? GOLD : "text.secondary" }}>
              {i + 1}
            </Typography>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
                {r.person} <span className="num" style={{ color: "var(--mui-palette-text-secondary)" }}>&apos;{String(r.season).slice(2)}</span>
              </Typography>
              <Typography variant="caption" color="text.secondary" className="num">
                #{r.regRank} seed
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
              <Typography className="num" sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, lineHeight: 1, color: i === 0 ? GOLD : "text.primary" }}>
                {rec(r)}
              </Typography>
              <Typography variant="caption" color="text.secondary" className="num">{pct3(r)}</Typography>
            </Box>
          </Box>
        ))}
      </Stack>
      </Box>
      <Box>
      {/* Biggest collapse */}
      <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, mb: 0.75 }}>
        💥 Biggest collapse
      </Typography>
      <Stack spacing={0.75}>
        {biggestCollapse.map((c, i) => (
          <Box key={`${c.person}-${c.to.season}`}
            sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1.5, py: 1, borderRadius: 2,
              border: "1px solid", borderColor: i === 0 ? "rgba(236,102,80,0.4)" : "rgba(255,255,255,0.08)",
              bgcolor: i === 0 ? "rgba(236,102,80,0.06)" : "rgba(255,255,255,0.02)" }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
                {c.person}
              </Typography>
              <Typography variant="caption" color="text.secondary" className="num">
                &apos;{String(c.from.season).slice(2)} {rec(c.from)} (#{c.from.regRank}) → &apos;{String(c.to.season).slice(2)} {rec(c.to)} (#{c.to.regRank})
              </Typography>
            </Box>
            <Typography className="num" sx={{ flexShrink: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: i === 0 ? RED : "text.primary" }}>
              −{c.drop}W
            </Typography>
          </Box>
        ))}
      </Stack>
      </Box>
      </Box>
    </Box>
  );
}
