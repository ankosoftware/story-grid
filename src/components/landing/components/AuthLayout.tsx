"use client";

import React from "react";
import { Box } from "@mui/material";
import LandingHeader from "./LandingHeader";
import LandingFooter from "./LandingFooter";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      <LandingHeader solidBackground />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          pt: 8, // Account for fixed header
        }}
      >
        {children}
      </Box>
      <LandingFooter />
    </Box>
  );
};

export default AuthLayout;
