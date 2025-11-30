import { Components, Theme } from "@mui/material/styles";

/**
 * MUI component style overrides
 * Provides consistent styling across all components with smooth transitions
 */
export const getComponentOverrides = (mode: "light" | "dark"): Components<Theme> => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarColor: mode === "dark" ? "#334155 #1e293b" : "#cbd5e1 #f1f5f9",
        "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
          width: 8,
          height: 8,
        },
        "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
          borderRadius: 8,
          backgroundColor: mode === "dark" ? "#334155" : "#cbd5e1",
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
        "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
          backgroundColor: mode === "dark" ? "#475569" : "#94a3b8",
        },
        "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
          backgroundColor: mode === "dark" ? "#1e293b" : "#f1f5f9",
        },
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: "8px 16px",
        fontWeight: 500,
        textTransform: "none",
        transition: "all 0.2s ease-in-out",
      },
      contained: {
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      },
      outlined: {
        borderWidth: 1.5,
        "&:hover": {
          borderWidth: 1.5,
          backgroundColor: mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(37, 99, 235, 0.04)",
        },
      },
      text: {
        "&:hover": {
          backgroundColor: mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(37, 99, 235, 0.04)",
        },
      },
      sizeSmall: {
        padding: "6px 12px",
        fontSize: "0.8125rem",
      },
      sizeLarge: {
        padding: "12px 24px",
        fontSize: "1rem",
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: mode === "dark" ? "rgba(59, 130, 246, 0.12)" : "rgba(37, 99, 235, 0.08)",
          transform: "scale(1.05)",
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow:
          mode === "dark"
            ? "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)"
            : "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
        transition: "box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out",
        backgroundImage: "none", // Remove default gradient in dark mode
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none", // Remove default gradient in dark mode
      },
      rounded: {
        borderRadius: 12,
      },
      elevation1: {
        boxShadow:
          mode === "dark" ? "0 1px 3px rgba(0, 0, 0, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.08)",
      },
      elevation2: {
        boxShadow:
          mode === "dark" ? "0 2px 6px rgba(0, 0, 0, 0.35)" : "0 2px 6px rgba(0, 0, 0, 0.1)",
      },
      elevation3: {
        boxShadow:
          mode === "dark" ? "0 4px 12px rgba(0, 0, 0, 0.4)" : "0 4px 12px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: "outlined",
      size: "small",
    },
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 8,
          transition: "all 0.2s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: mode === "dark" ? "#3b82f6" : "#2563eb",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
          },
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: mode === "dark" ? "#3b82f6" : "#2563eb",
        },
      },
      notchedOutline: {
        borderColor: mode === "dark" ? "#334155" : "#e2e8f0",
        transition: "border-color 0.2s ease",
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
        boxShadow:
          mode === "dark" ? "0 1px 3px rgba(0, 0, 0, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: 64,
        "@media (min-width: 600px)": {
          minHeight: 64,
        },
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        boxShadow:
          mode === "dark" ? "0 4px 20px rgba(0, 0, 0, 0.5)" : "0 4px 20px rgba(0, 0, 0, 0.15)",
        marginTop: 8,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        margin: "2px 8px",
        padding: "8px 12px",
        transition: "background-color 0.15s ease",
        "&:hover": {
          backgroundColor: mode === "dark" ? "rgba(59, 130, 246, 0.12)" : "rgba(37, 99, 235, 0.08)",
        },
        "&.Mui-selected": {
          backgroundColor: mode === "dark" ? "rgba(59, 130, 246, 0.16)" : "rgba(37, 99, 235, 0.12)",
          "&:hover": {
            backgroundColor:
              mode === "dark" ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.16)",
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
        transition: "all 0.2s ease",
      },
      filled: {
        "&:hover": {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        },
      },
      outlined: {
        borderWidth: 1.5,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: mode === "dark" ? "#334155" : "#1e293b",
        color: "#f1f5f9",
        fontSize: "0.75rem",
        fontWeight: 500,
        padding: "6px 12px",
        borderRadius: 6,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      },
      arrow: {
        color: mode === "dark" ? "#334155" : "#1e293b",
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        boxShadow:
          mode === "dark" ? "0 24px 48px rgba(0, 0, 0, 0.5)" : "0 24px 48px rgba(0, 0, 0, 0.2)",
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: "1.25rem",
        fontWeight: 600,
        padding: "20px 24px 16px",
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: "16px 24px",
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: "16px 24px 20px",
        gap: 12,
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontWeight: 600,
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontWeight: 600,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: 500,
        fontSize: "0.9375rem",
        minHeight: 48,
        transition: "color 0.2s ease",
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: "3px 3px 0 0",
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 10,
      },
      standardSuccess: {
        backgroundColor: mode === "dark" ? "rgba(34, 197, 94, 0.15)" : "rgba(22, 163, 74, 0.1)",
      },
      standardError: {
        backgroundColor: mode === "dark" ? "rgba(239, 68, 68, 0.15)" : "rgba(220, 38, 38, 0.1)",
      },
      standardWarning: {
        backgroundColor: mode === "dark" ? "rgba(245, 158, 11, 0.15)" : "rgba(217, 119, 6, 0.1)",
      },
      standardInfo: {
        backgroundColor: mode === "dark" ? "rgba(6, 182, 212, 0.15)" : "rgba(8, 145, 178, 0.1)",
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
      },
    },
  },
});
