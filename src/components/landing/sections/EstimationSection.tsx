"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ScreenshotDisplay } from "../components";

const EstimationSection: React.FC = () => {
  const theme = useTheme();

  const features = [
    {
      title: "Story point estimation",
      description: "Estimate at the story level, roll up automatically",
    },
    {
      title: "Hours calculation",
      description: "Configure your story-point-to-hours ratio",
    },
    {
      title: "Overhead included",
      description: "Factor in QA, PM, and meetings with configurable overhead",
    },
    {
      title: "Cost projection",
      description: "Know what a release will cost before you commit",
    },
    {
      title: "Export options",
      description: "Export to CSV or Markdown for stakeholder reports",
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="lg">
        <Grid container alignItems="center" spacing={{ xs: 4, md: 8 }}>
          <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 2, md: 1 } }}>
            <ScreenshotDisplay
              alt="Estimation panel showing timeline, effort, and cost calculations"
              src="/screenshots/estimation-panel.png"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 2 } }}>
            <Typography color="secondary" sx={{ fontWeight: 600, mb: 1 }} variant="overline">
              Estimation & Planning
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.75rem", md: "2.25rem" },
                mb: 3,
              }}
            >
              From Story Points to Ship Date
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, fontSize: "1.1rem" }}>
              Stop guessing when things will ship. Story Board gives you the numbers to have honest
              conversations with stakeholders.
            </Typography>
            <List disablePadding>
              {features.map(feature => (
                <ListItem key={feature.title} disableGutters sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CheckCircleIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={feature.title}
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondary={feature.description}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default EstimationSection;
