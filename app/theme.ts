"use client";

import { createTheme } from "@mui/material/styles";

// Broadcast / scoreboard aesthetic: warm near-black, hot orange, metal medals.
export const INK = "#0c0a08"; // near-black, used as text on bright fills
export const MEDAL = {
  gold: "#e8b64c",
  silver: "#c2c7cf",
  bronze: "#c9824a",
} as const;

const display = 'var(--font-display), "Bricolage Grotesque", system-ui, sans-serif';
const body = 'var(--font-body), "Hanken Grotesk", system-ui, sans-serif';

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff6a1a", light: "#ff8c45", contrastText: INK },
    secondary: { main: "#ffb020", contrastText: INK },
    background: { default: "#0d0b09", paper: "#151210" },
    success: { main: "#37b981" },
    error: { main: "#e5533d" },
    text: { primary: "#f4efe8", secondary: "#a89e91" },
    divider: "rgba(255,255,255,0.08)",
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
          border: "1px solid rgba(255,255,255,0.07)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
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
