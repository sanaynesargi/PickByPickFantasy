"use client";

import { createTheme } from "@mui/material/styles";

// Orange & black. Vivid orange on near-black surfaces.
export const INK = "#0a0a0a"; // near-black, used as text on orange fills

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff7a18", contrastText: INK }, // orange
    secondary: { main: "#ff9d3c", contrastText: INK }, // lighter orange accent
    background: { default: "#0a0a0a", paper: "#161311" },
    success: { main: "#ff7a18" },
    text: { primary: "#f5f0ea", secondary: "#a99f95" },
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
