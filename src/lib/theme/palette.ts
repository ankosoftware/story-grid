/**
 * Color palette constants for light and dark themes
 * Uses Tailwind CSS color palette as inspiration for modern, accessible colors
 */

// Extend MUI palette with custom storyboard colors
declare module "@mui/material/styles" {
  interface Palette {
    storyboard: {
      activity: string;
      epic: string;
      story: string;
      release: string;
      blank: string;
    };
    priority: {
      high: string;
      medium: string;
      low: string;
    };
    status: {
      todo: string;
      inProgress: string;
      done: string;
    };
  }
  interface PaletteOptions {
    storyboard?: {
      activity: string;
      epic: string;
      story: string;
      release: string;
      blank: string;
    };
    priority?: {
      high: string;
      medium: string;
      low: string;
    };
    status?: {
      todo: string;
      inProgress: string;
      done: string;
    };
  }
}

export const lightPalette = {
  mode: "light" as const,
  primary: {
    main: "#2563eb", // Blue 600
    light: "#3b82f6", // Blue 500
    dark: "#1d4ed8", // Blue 700
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#7c3aed", // Violet 600
    light: "#8b5cf6", // Violet 500
    dark: "#6d28d9", // Violet 700
    contrastText: "#ffffff",
  },
  background: {
    default: "#f8fafc", // Slate 50
    paper: "#ffffff",
  },
  text: {
    primary: "#0f172a", // Slate 900
    secondary: "#475569", // Slate 600
    disabled: "#94a3b8", // Slate 400
  },
  divider: "#e2e8f0", // Slate 200
  action: {
    hover: "rgba(37, 99, 235, 0.04)",
    selected: "rgba(37, 99, 235, 0.08)",
    disabled: "rgba(0, 0, 0, 0.26)",
    disabledBackground: "rgba(0, 0, 0, 0.12)",
  },
  error: {
    main: "#dc2626", // Red 600
    light: "#ef4444", // Red 500
    dark: "#b91c1c", // Red 700
  },
  warning: {
    main: "#d97706", // Amber 600
    light: "#f59e0b", // Amber 500
    dark: "#b45309", // Amber 700
  },
  success: {
    main: "#16a34a", // Green 600
    light: "#22c55e", // Green 500
    dark: "#15803d", // Green 700
  },
  info: {
    main: "#0891b2", // Cyan 600
    light: "#06b6d4", // Cyan 500
    dark: "#0e7490", // Cyan 700
  },
  // Custom storyboard colors
  storyboard: {
    activity: "#2563eb", // Blue - matches primary
    epic: "#0891b2", // Cyan
    story: "#ffffff", // White
    release: "#f1f5f9", // Slate 100
    blank: "#f8fafc", // Slate 50
  },
  priority: {
    high: "#ef4444", // Red 500
    medium: "#f59e0b", // Amber 500
    low: "#22c55e", // Green 500
  },
  status: {
    todo: "#e2e8f0", // Slate 200
    inProgress: "#bfdbfe", // Blue 200
    done: "#bbf7d0", // Green 200
  },
};

export const darkPalette = {
  mode: "dark" as const,
  primary: {
    main: "#3b82f6", // Blue 500 - lighter for dark bg
    light: "#60a5fa", // Blue 400
    dark: "#2563eb", // Blue 600
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#8b5cf6", // Violet 500
    light: "#a78bfa", // Violet 400
    dark: "#7c3aed", // Violet 600
    contrastText: "#ffffff",
  },
  background: {
    default: "#0f172a", // Slate 900
    paper: "#1e293b", // Slate 800
  },
  text: {
    primary: "#f1f5f9", // Slate 100
    secondary: "#94a3b8", // Slate 400
    disabled: "#64748b", // Slate 500
  },
  divider: "#334155", // Slate 700
  action: {
    hover: "rgba(59, 130, 246, 0.08)",
    selected: "rgba(59, 130, 246, 0.16)",
    disabled: "rgba(255, 255, 255, 0.3)",
    disabledBackground: "rgba(255, 255, 255, 0.12)",
  },
  error: {
    main: "#ef4444", // Red 500 - lighter for dark bg
    light: "#f87171", // Red 400
    dark: "#dc2626", // Red 600
  },
  warning: {
    main: "#f59e0b", // Amber 500
    light: "#fbbf24", // Amber 400
    dark: "#d97706", // Amber 600
  },
  success: {
    main: "#22c55e", // Green 500
    light: "#4ade80", // Green 400
    dark: "#16a34a", // Green 600
  },
  info: {
    main: "#06b6d4", // Cyan 500
    light: "#22d3ee", // Cyan 400
    dark: "#0891b2", // Cyan 600
  },
  // Custom storyboard colors - adjusted for dark mode
  storyboard: {
    activity: "#3b82f6", // Blue 500
    epic: "#06b6d4", // Cyan 500
    story: "#1e293b", // Slate 800 - matches paper
    release: "#334155", // Slate 700
    blank: "#1e293b", // Slate 800
  },
  priority: {
    high: "#f87171", // Red 400 - lighter for dark bg
    medium: "#fbbf24", // Amber 400
    low: "#4ade80", // Green 400
  },
  status: {
    todo: "#334155", // Slate 700
    inProgress: "#1e3a5f", // Blue tinted dark
    done: "#14532d", // Green 900
  },
};
