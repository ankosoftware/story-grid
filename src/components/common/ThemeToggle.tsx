"use client";

import React from "react";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "@/lib/theme/ThemeContext";

interface ThemeToggleProps {
  size?: "small" | "medium" | "large";
}

/**
 * Theme toggle button component
 * Switches between light and dark mode with smooth icon transition
 */
export function ThemeToggle({ size = "medium" }: ThemeToggleProps) {
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();

  const isDark = mode === "dark";

  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        color="inherit"
        size={size}
        sx={{
          transition: "transform 0.3s ease-in-out",
          "&:hover": {
            transform: "rotate(180deg)",
          },
        }}
        onClick={toggleTheme}
      >
        {isDark ? (
          <LightModeIcon
            sx={{
              color: theme.palette.warning.light,
            }}
          />
        ) : (
          <DarkModeIcon
            sx={{
              color: "white",
            }}
          />
        )}
      </IconButton>
    </Tooltip>
  );
}

export default ThemeToggle;
