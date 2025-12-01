"use client";

import React from "react";
import { Box, Container, Typography, Button, Paper, useTheme, alpha } from "@mui/material";
import Grid from "@mui/material/Grid";
import GitHubIcon from "@mui/icons-material/GitHub";
import CodeIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";
import GroupsIcon from "@mui/icons-material/Groups";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { FeatureCard } from "../components";

const OpenSourceSection: React.FC = () => {
  const theme = useTheme();

  const benefits = [
    {
      icon: <CodeIcon fontSize="large" />,
      title: "MIT Licensed",
      description: "Use it, modify it, ship it. No strings attached.",
    },
    {
      icon: <StorageIcon fontSize="large" />,
      title: "Self-Host Option",
      description: "Deploy on your own infrastructure for complete data control.",
    },
    {
      icon: <GroupsIcon fontSize="large" />,
      title: "Active Community",
      description: "Built in public with a community-driven roadmap.",
    },
    {
      icon: <LockOpenIcon fontSize="large" />,
      title: "No Vendor Lock-in",
      description: "Your data is yours. Export everything, anytime.",
    },
  ];

  return (
    <Box
      id="open-source"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography color="primary" sx={{ fontWeight: 600, mb: 1 }} variant="overline">
            Open Source
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "2.5rem" },
              mb: 3,
            }}
          >
            Open Source. Open Roadmap. Open to You.
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: "1.1rem", md: "1.25rem" },
              maxWidth: 700,
              mx: "auto",
            }}
          >
            We believe the best tools are built in the open. Story Board is free to use, free to
            inspect, and free to contribute to. No vendor lock-in. Self-host for complete control.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {benefits.map(benefit => (
            <Grid key={benefit.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <FeatureCard
                description={benefit.description}
                icon={benefit.icon}
                title={benefit.title}
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            component="a"
            href="https://github.com"
            rel="noopener noreferrer"
            size="large"
            startIcon={<GitHubIcon />}
            sx={{ px: 4 }}
            target="_blank"
            variant="contained"
          >
            Star on GitHub
          </Button>
          <Button component="a" href="#" size="large" sx={{ px: 4 }} variant="outlined">
            Read the Docs
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default OpenSourceSection;
