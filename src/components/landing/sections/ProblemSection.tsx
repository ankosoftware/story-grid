"use client";

import React from "react";
import { Box, Container, Typography, useTheme } from "@mui/material";

const ProblemSection: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center" }}>
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "2.5rem" },
              mb: 3,
            }}
          >
            Your Backlog Shouldn&apos;t Be a Black Hole
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: "1.1rem", md: "1.25rem" },
              lineHeight: 1.7,
              maxWidth: 700,
              mx: "auto",
            }}
          >
            Flat backlogs lose context. Teams sprint through tickets without seeing the bigger
            picture. Users end up with features that don&apos;t connect.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: "1.1rem", md: "1.25rem" },
              lineHeight: 1.7,
              maxWidth: 700,
              mx: "auto",
              mt: 3,
              fontWeight: 500,
            }}
          >
            Story Board brings the user journey back into focus. See activities, epics, and stories
            in their natural hierarchy. Know what you&apos;re building and why.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ProblemSection;
