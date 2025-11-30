"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "storyboard-theme-mode";

/**
 * Get the initial theme mode based on:
 * 1. Stored preference in localStorage
 * 2. System preference (prefers-color-scheme)
 * 3. Default to 'light'
 */
const getInitialMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  // Check localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  // Check system preference
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeModeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setModeState(getInitialMode());
    setMounted(true);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setModeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState(prev => {
      const newMode = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, newMode);
      return newMode;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      setMode,
    }),
    [mode, toggleTheme, setMode]
  );

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }
  return context;
}
