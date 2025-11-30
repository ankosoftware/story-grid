import { createTheme, responsiveFontSizes, Theme } from "@mui/material/styles";
import { lightPalette, darkPalette } from "./palette";
import { getComponentOverrides } from "./components";

/**
 * Typography configuration shared between light and dark themes
 */
const typography = {
  fontFamily: "var(--font-geist-sans)",
  h1: {
    fontSize: "2.25rem",
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: "-0.025em",
  },
  h2: {
    fontSize: "1.875rem",
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: "-0.025em",
  },
  h3: {
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1.35,
  },
  h5: {
    fontSize: "1.125rem",
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: "1rem",
    fontWeight: 600,
    lineHeight: 1.5,
  },
  subtitle1: {
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: "1rem",
    lineHeight: 1.6,
  },
  body2: {
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  caption: {
    fontSize: "0.75rem",
    lineHeight: 1.4,
    letterSpacing: "0.025em",
  },
  overline: {
    fontSize: "0.625rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
  button: {
    textTransform: "none" as const,
    fontWeight: 500,
  },
};

/**
 * Shape configuration
 */
const shape = {
  borderRadius: 8,
};

/**
 * Create a theme based on the mode (light/dark)
 */
export const createAppTheme = (mode: "light" | "dark"): Theme => {
  const palette = mode === "light" ? lightPalette : darkPalette;

  let theme = createTheme({
    palette,
    typography,
    shape,
    components: getComponentOverrides(mode),
  });

  // Apply responsive font sizes
  theme = responsiveFontSizes(theme);

  return theme;
};

/**
 * Default light theme (for backwards compatibility)
 */
export const theme = createAppTheme("light");

/**
 * Light and dark theme exports
 */
export const lightTheme = createAppTheme("light");
export const darkTheme = createAppTheme("dark");
