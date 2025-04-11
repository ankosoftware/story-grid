"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Ensure theme is applied after hydration to avoid mismatch
  // between server and client rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
