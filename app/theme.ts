"use client";

import { createTheme } from "@mui/material/styles";

// Dark, "under the Friday-night lights" palette. Green field + gold accent.
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#2e7d32" }, // field green
    secondary: { main: "#ffc93c" }, // yardline gold
    background: { default: "#0a0f0d", paper: "#121a16" },
    success: { main: "#4caf50" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'var(--font-inter), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid rgba(255,255,255,0.06)" },
      },
    },
  },
});

export default theme;
