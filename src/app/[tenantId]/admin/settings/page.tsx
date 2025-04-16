"use client";

import React from "react";
import { Paper, Typography, Box, Alert } from "@mui/material";

export default function SettingsPage() {
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Workspace Settings</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Workspace settings functionality will be available in a future update.
      </Alert>

      <Typography variant="body1">
        This page will allow administrators to configure workspace-wide settings, including:
      </Typography>

      <ul>
        <li>Workspace name and branding</li>
        <li>Default user permissions</li>
        <li>Integration settings</li>
        <li>Notification preferences</li>
      </ul>
    </Paper>
  );
}
