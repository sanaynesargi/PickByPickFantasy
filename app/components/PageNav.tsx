"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Stack, Typography } from "@mui/material";

const TABS = [
  { href: "/", label: "Draft" },
  { href: "/history", label: "Seasons" },
  { href: "/all-time", label: "All-Time" },
];

// Shared top-level nav shown on the Seasons and All-Time pages.
export default function PageNav() {
  const path = usePathname();
  return (
    <Stack direction="row" spacing={0.75} sx={{ flexGrow: 1 }}>
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Box key={t.href} component={Link} href={t.href}
            sx={{
              px: 1.6, py: 0.6, borderRadius: "999px", textDecoration: "none",
              border: "1px solid",
              borderColor: active ? "primary.main" : "rgba(255,255,255,0.12)",
              bgcolor: active ? "primary.main" : "transparent",
              color: active ? "#0c0a08" : "text.primary",
              transition: "all .15s ease",
              "&:hover": { borderColor: "primary.main", bgcolor: active ? "primary.main" : "rgba(255,106,26,0.12)" },
            }}>
            <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>
              {t.label}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}
