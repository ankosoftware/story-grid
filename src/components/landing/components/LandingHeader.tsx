"use client";

import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import Link from "next/link";
import { ThemeToggle } from "@/components/common/ThemeToggle";

interface LandingHeaderProps {
  solidBackground?: boolean;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ solidBackground = false }) => {
  const theme = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Use solid background styling when prop is true or when scrolled
  const useSolidStyle = solidBackground || scrolled;

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Open Source", href: "#open-source" },
  ];

  return (
    <AppBar
      elevation={useSolidStyle ? 2 : 0}
      position="fixed"
      sx={{
        backgroundColor: useSolidStyle ? alpha(theme.palette.background.paper, 0.9) : "transparent",
        backdropFilter: useSolidStyle ? "blur(10px)" : "none",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Typography
            component={Link}
            href="/"
            sx={{
              fontWeight: 700,
              fontSize: "1.5rem",
              color: useSolidStyle ? theme.palette.text.primary : "white",
              textDecoration: "none",
              mr: 4,
            }}
          >
            Story Board
          </Typography>

          <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
            {navItems.map(item => (
              <Button
                key={item.label}
                component="a"
                href={item.href}
                sx={{
                  color: useSolidStyle ? theme.palette.text.primary : "white",
                  "&:hover": {
                    backgroundColor: alpha(
                      useSolidStyle ? theme.palette.primary.main : theme.palette.common.white,
                      0.1
                    ),
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ThemeToggle
              size="small"
              sx={{
                color: useSolidStyle ? theme.palette.text.primary : "white",
              }}
            />
            <Button
              component={Link}
              href="/login"
              sx={{
                color: useSolidStyle ? theme.palette.text.primary : "white",
                borderColor: useSolidStyle
                  ? theme.palette.divider
                  : alpha(theme.palette.common.white, 0.5),
                "&:hover": {
                  borderColor: useSolidStyle ? theme.palette.primary.main : "white",
                  backgroundColor: alpha(
                    useSolidStyle ? theme.palette.primary.main : theme.palette.common.white,
                    0.1
                  ),
                },
              }}
              variant="outlined"
            >
              Sign In
            </Button>
            <Button
              component={Link}
              href="/register"
              sx={{
                backgroundColor: useSolidStyle ? theme.palette.primary.main : "white",
                color: useSolidStyle ? theme.palette.primary.contrastText : theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: useSolidStyle
                    ? theme.palette.primary.dark
                    : alpha(theme.palette.common.white, 0.9),
                },
              }}
              variant="contained"
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default LandingHeader;
