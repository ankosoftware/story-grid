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
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Link from "next/link";
import { ThemeToggle } from "@/components/common/ThemeToggle";

interface LandingHeaderProps {
  solidBackground?: boolean;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ solidBackground = false }) => {
  const theme = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <AppBar
        elevation={0}
        position="fixed"
        sx={{
          backgroundColor: useSolidStyle
            ? alpha(theme.palette.background.paper, 0.85)
            : "transparent",
          backdropFilter: useSolidStyle ? "blur(20px)" : "none",
          borderBottom: useSolidStyle ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : "none",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1.5, minHeight: { xs: 64, md: 72 } }}>
            {/* Logo */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                textDecoration: "none",
                mr: { xs: 2, md: 6 },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: useSolidStyle
                    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    : "linear-gradient(135deg, #fff, #e0e0e0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: useSolidStyle
                    ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                    : "0 2px 8px rgba(255,255,255,0.3)",
                  transition: "all 0.3s ease",
                }}
              >
                <DashboardOutlinedIcon
                  sx={{
                    fontSize: 20,
                    color: useSolidStyle ? "#fff" : theme.palette.primary.main,
                  }}
                />
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.25rem", md: "1.4rem" },
                  color: useSolidStyle ? theme.palette.text.primary : "white",
                  letterSpacing: "-0.02em",
                  transition: "color 0.3s ease",
                }}
              >
                Story Board
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ flexGrow: 1, display: "flex", gap: 0.5 }}>
                {navItems.map(item => (
                  <Button
                    key={item.label}
                    component="a"
                    href={item.href}
                    sx={{
                      color: useSolidStyle ? theme.palette.text.secondary : "rgba(255,255,255,0.9)",
                      fontWeight: 500,
                      fontSize: "0.95rem",
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        color: useSolidStyle ? theme.palette.primary.main : "white",
                        backgroundColor: alpha(
                          useSolidStyle ? theme.palette.primary.main : theme.palette.common.white,
                          0.08
                        ),
                      },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: 6,
                        left: "50%",
                        width: 0,
                        height: 2,
                        backgroundColor: useSolidStyle ? theme.palette.primary.main : "white",
                        borderRadius: 1,
                        transition: "all 0.3s ease",
                        transform: "translateX(-50%)",
                      },
                      "&:hover::after": {
                        width: "40%",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Spacer for mobile */}
            {isMobile && <Box sx={{ flexGrow: 1 }} />}

            {/* Desktop Actions */}
            {!isMobile && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <ThemeToggle
                  size="small"
                  sx={{
                    color: useSolidStyle ? theme.palette.text.secondary : "rgba(255,255,255,0.8)",
                    "&:hover": {
                      color: useSolidStyle ? theme.palette.primary.main : "white",
                      backgroundColor: alpha(
                        useSolidStyle ? theme.palette.primary.main : theme.palette.common.white,
                        0.1
                      ),
                    },
                  }}
                />
                <Button
                  component={Link}
                  href="/login"
                  sx={{
                    color: useSolidStyle ? theme.palette.text.primary : "white",
                    fontWeight: 500,
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: useSolidStyle
                      ? alpha(theme.palette.divider, 0.3)
                      : alpha(theme.palette.common.white, 0.3),
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: useSolidStyle ? theme.palette.primary.main : "white",
                      backgroundColor: alpha(
                        useSolidStyle ? theme.palette.primary.main : theme.palette.common.white,
                        0.08
                      ),
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  sx={{
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    background: useSolidStyle
                      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                      : "linear-gradient(135deg, #fff, #f5f5f5)",
                    color: useSolidStyle ? "#fff" : theme.palette.primary.main,
                    boxShadow: useSolidStyle
                      ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                      : "0 4px 14px rgba(0,0,0,0.15)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: useSolidStyle
                        ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                        : "linear-gradient(135deg, #f5f5f5, #e8e8e8)",
                      boxShadow: useSolidStyle
                        ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`
                        : "0 6px 20px rgba(0,0,0,0.2)",
                      transform: "translateY(-2px)",
                    },
                  }}
                  variant="contained"
                >
                  Get Started
                </Button>
              </Box>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ThemeToggle
                  size="small"
                  sx={{
                    color: useSolidStyle ? theme.palette.text.secondary : "rgba(255,255,255,0.8)",
                  }}
                />
                <IconButton
                  aria-label="menu"
                  edge="end"
                  sx={{
                    color: useSolidStyle ? theme.palette.text.primary : "white",
                    "&:hover": {
                      backgroundColor: alpha(
                        useSolidStyle ? theme.palette.primary.main : theme.palette.common.white,
                        0.1
                      ),
                    },
                  }}
                  onClick={handleMobileMenuToggle}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 320,
            backgroundColor: theme.palette.background.paper,
            backgroundImage: "none",
          },
        }}
        onClose={handleMobileMenuToggle}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
          >
            <Typography fontWeight={700} variant="h6">
              Menu
            </Typography>
            <IconButton onClick={handleMobileMenuToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List disablePadding>
            {navItems.map(item => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  component="a"
                  href={item.href}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                  onClick={handleNavClick}
                >
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              fullWidth
              component={Link}
              href="/login"
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 500,
              }}
              variant="outlined"
              onClick={handleNavClick}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              component={Link}
              href="/register"
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                },
              }}
              variant="contained"
              onClick={handleNavClick}
            >
              Get Started
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default LandingHeader;
