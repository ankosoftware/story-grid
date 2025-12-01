"use client";

import React from "react";
import { Box, Container, Typography, Paper, useTheme, alpha } from "@mui/material";
import Grid from "@mui/material/Grid";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({ number, icon, title, description }) => {
  const theme = useTheme();

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
          }}
        >
          {icon}
        </Box>
        <Box
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.875rem",
          }}
        >
          {number}
        </Box>
      </Box>
      <Typography sx={{ fontWeight: 600, mb: 1 }} variant="h6">
        {title}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {description}
      </Typography>
    </Box>
  );
};

const HowItWorksSection: React.FC = () => {
  const theme = useTheme();

  const steps = [
    {
      icon: <WorkspacesIcon sx={{ fontSize: 40 }} />,
      title: "Create Your Workspace",
      description: "Set up your organization in one click",
    },
    {
      icon: <CreateNewFolderIcon sx={{ fontSize: 40 }} />,
      title: "Add Your First Project",
      description: "Name it, describe it, start mapping",
    },
    {
      icon: <AccountTreeIcon sx={{ fontSize: 40 }} />,
      title: "Build Your Story Map",
      description: "Add activities, epics, and stories",
    },
    {
      icon: <RocketLaunchIcon sx={{ fontSize: 40 }} />,
      title: "Plan Your Release",
      description: "Slice your map into shippable increments",
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
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography color="primary" sx={{ fontWeight: 600, mb: 1 }} variant="overline">
            Getting Started
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "2.5rem" },
              mb: 3,
            }}
          >
            Start Mapping in 60 Seconds
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {steps.map((step, index) => (
            <Grid key={step.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Step
                description={step.description}
                icon={step.icon}
                number={index + 1}
                title={step.title}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HowItWorksSection;
