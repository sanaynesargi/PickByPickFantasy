"use client";

import { createTheme } from "@mui/material/styles";

// Broadcast / scoreboard aesthetic: warm near-black, hot orange, metal medals.
export const INK = "#0c0a08"; // near-black, used as text on bright fills
export const MEDAL = {
  gold: "#e8b64c",
  silver: "#c2c7cf",
  bronze: "#c9824a",
} as const;

// Shared responsive page width: a phone-narrow column that opens up on desktop so
// the stat grids can breathe. Used as `<Container maxWidth={false} sx={{ maxWidth: CONTENT_MAXW, mx: "auto" }}>`.
export const CONTENT_MAXW = { xs: "100%", sm: 600, md: 900, lg: 1200 } as const;
// Grid that lays out a list of stat cards: 1 column on phones, more as space allows.
export const CARD_GRID = { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } as const;

const display = 'var(--font-display), "Bricolage Grotesque", system-ui, sans-serif';
const body = 'var(--font-body), "Hanken Grotesk", system-ui, sans-serif';

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff7a30", light: "#ff9a5a", contrastText: INK },
    secondary: { main: "#ffbc3d", contrastText: INK },
    background: { default: "#1a1611", paper: "#242019" },
    success: { main: "#46c48c" },
    error: { main: "#ec6650" },
    text: { primary: "#f6f1ea", secondary: "#bcb2a4" },
    divider: "rgba(255,255,255,0.11)",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: body,
    h1: { fontFamily: display, fontWeight: 800, letterSpacing: "-0.03em" },
    h2: { fontFamily: display, fontWeight: 800, letterSpacing: "-0.03em" },
    h3: { fontFamily: display, fontWeight: 800, letterSpacing: "-0.02em" },
    h4: { fontFamily: display, fontWeight: 800, letterSpacing: "-0.02em" },
    h5: { fontFamily: display, fontWeight: 800, letterSpacing: "-0.01em" },
    h6: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 700 },
    overline: {
      fontFamily: display,
      fontWeight: 700,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
    },
    button: { fontFamily: display, fontWeight: 700, letterSpacing: "0.01em", textTransform: "none" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.10)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(255,255,255,0.045)",
          border: "1px solid rgba(255,255,255,0.10)",
          transition: "border-color .18s ease, background-color .18s ease",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
        label: { letterSpacing: "0.01em" },
      },
    },
  },
});

export default theme;
