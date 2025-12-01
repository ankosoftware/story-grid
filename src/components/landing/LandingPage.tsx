"use client";

import React from "react";
import { Box } from "@mui/material";
import { LandingHeader, LandingFooter } from "./components";
import {
  HeroSection,
  ProblemSection,
  StoryMappingSection,
  EstimationSection,
  OpenSourceSection,
  HowItWorksSection,
  CTASection,
} from "./sections";

const LandingPage: React.FC = () => {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <LandingHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <HeroSection />
        <ProblemSection />
        <StoryMappingSection />
        <EstimationSection />
        <OpenSourceSection />
        <HowItWorksSection />
        <CTASection />
      </Box>
      <LandingFooter />
    </Box>
  );
};

export default LandingPage;
