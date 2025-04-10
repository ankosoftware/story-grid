import React from "react";
import { Box, CssBaseline } from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title = "ANKO Storyboard" }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <Header title={title} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 64px)", // Subtract approximate height of the AppBar
        }}
      >
        <Box sx={{ flexGrow: 1, mb: 4 }}>{children}</Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default MainLayout;
