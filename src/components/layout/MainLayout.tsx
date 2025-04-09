import React, { useState } from "react";
import { Box, CssBaseline, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DRAWER_WIDTH = 240;

const MainLayout: React.FC<MainLayoutProps> = ({ children, title = "Anko Storyboard" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <Header title={title} onMenuToggle={handleDrawerToggle} />

      <Sidebar
        open={isMobile ? mobileOpen : true}
        width={DRAWER_WIDTH}
        onClose={handleDrawerToggle}
        variant={isMobile ? "temporary" : "permanent"}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Toolbar /> {/* This creates space under the AppBar */}
        <Box sx={{ flexGrow: 1, mb: 4 }}>{children}</Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default MainLayout;
