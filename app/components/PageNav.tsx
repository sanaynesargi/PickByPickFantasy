"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Stack, Typography } from "@mui/material";

const TABS = [
  { href: "/", label: "Draft" },
  { href: "/history", label: "Seasons" },
  { href: "/all-time", label: "All-Time" },
  { href: "/head-to-head", label: "H2H" },
];

// Shared top-level nav. Pills stay a fixed size and the row scrolls
// horizontally on narrow screens instead of crunching together.
export default function PageNav() {
  const path = usePathname();
  return (
    <Stack
      direction="row"
      spacing={{ xs: 0.5, sm: 0.75 }}
      sx={{
        flexGrow: 1,
        minWidth: 0,
        overflowX: "auto",
        flexWrap: "nowrap",
        py: 0.5,
        // hide the scrollbar but keep scrollability
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Box key={t.href} component={Link} href={t.href}
            sx={{
              flexShrink: 0,
              px: { xs: 1.25, sm: 1.6 }, py: 0.6, borderRadius: "999px", textDecoration: "none",
              border: "1px solid",
              borderColor: active ? "primary.main" : "rgba(255,255,255,0.12)",
              bgcolor: active ? "primary.main" : "transparent",
              color: active ? "#0c0a08" : "text.primary",
              transition: "all .15s ease",
              "&:hover": { borderColor: "primary.main", bgcolor: active ? "primary.main" : "rgba(255,106,26,0.12)" },
            }}>
            <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: { xs: 13, sm: 14 }, lineHeight: 1.4, whiteSpace: "nowrap" }}>
              {t.label}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}
