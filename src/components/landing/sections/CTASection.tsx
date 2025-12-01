"use client";

import React from "react";
import { Box, Container, Typography, Button, useTheme, alpha } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";

const CTASection: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 10, md: 14 },
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        position: "relative",
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
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography
            component="h2"
            sx={{
              color: "white",
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "2.75rem" },
              mb: 3,
            }}
          >
            Ready to See the Whole Story?
          </Typography>
          <Typography
            sx={{
              color: alpha(theme.palette.common.white, 0.9),
              fontSize: { xs: "1.1rem", md: "1.25rem" },
              mb: 5,
              maxWidth: 600,
              mx: "auto",
            }}
          >
            Stop managing tickets. Start mapping journeys. Story Board is free to use and open
            source forever.
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              justifyContent: "center",
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
              href="#"
              size="large"
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
              variant="outlined"
            >
              Read the Docs
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CTASection;
