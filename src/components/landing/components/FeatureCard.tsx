"use client";

import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        height: "100%",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.1)"}`,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: 2,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          mb: 3,
        }}
      >
        {icon}
      </Box>
      <Typography gutterBottom sx={{ fontWeight: 600 }} variant="h6">
        {title}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {description}
      </Typography>
    </Paper>
  );
};

export default FeatureCard;
