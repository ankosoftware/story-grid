"use client";

import { useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeModeProvider, useThemeMode } from "./ThemeContext";
import { createAppTheme } from "./theme";

/**
 * Inner component that applies the MUI theme based on current mode
 */
function ThemeProviderWithMode({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

/**
 * Theme registry component that wraps the application with theme providers
 * Includes both the theme mode context and MUI theme provider
 */
export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeModeProvider>
      <ThemeProviderWithMode>{children}</ThemeProviderWithMode>
    </ThemeModeProvider>
  );
}
