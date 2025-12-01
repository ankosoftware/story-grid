"use client";

import React from "react";
import { Box, Container, Typography, Button, useTheme, alpha } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";
import { ScreenshotDisplay } from "../components";

const HeroSection: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        pt: { xs: 12, md: 16 },
        pb: { xs: 8, md: 12 },
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          opacity: 0.5,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            alignItems: "center",
            gap: { xs: 6, lg: 8 },
          }}
        >
          <Box
            sx={{
              flex: 1,
              textAlign: { xs: "center", lg: "left" },
            }}
          >
            <Typography
              component="h1"
              sx={{
                color: "white",
                fontWeight: 800,
                fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
                lineHeight: 1.1,
                mb: 3,
              }}
            >
              See Your Product&apos;s Story.
              <br />
              Plan It Together.
            </Typography>
            <Typography
              sx={{
                color: alpha(theme.palette.common.white, 0.9),
                fontSize: { xs: "1.1rem", md: "1.25rem" },
                mb: 4,
                maxWidth: 540,
                mx: { xs: "auto", lg: 0 },
              }}
            >
              The open-source story mapping tool that helps agile teams visualize user journeys,
              plan releases, and estimate with confidence.
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                justifyContent: { xs: "center", lg: "flex-start" },
              }}
            >
              <Button
                component={Link}
                endIcon={<ArrowForwardIcon />}
                href="/register"
                size="large"
                sx={{
                  backgroundColor: "white",
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.common.white, 0.9),
                  },
                }}
                variant="contained"
              >
                Start Mapping Free
              </Button>
              <Button
                component="a"
                href="https://github.com"
                rel="noopener noreferrer"
                size="large"
                startIcon={<GitHubIcon />}
                sx={{
                  color: "white",
                  borderColor: alpha(theme.palette.common.white, 0.5),
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                  },
                }}
                target="_blank"
                variant="outlined"
              >
                View on GitHub
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              width: "100%",
              maxWidth: { xs: "100%", lg: 600 },
            }}
          >
            <ScreenshotDisplay
              priority
              alt="Story Board application screenshot showing story mapping interface"
              src="/screenshots/storyboard-hero.png"
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
