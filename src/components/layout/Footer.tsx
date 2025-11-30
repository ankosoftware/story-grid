import React from "react";
import { Box, Container, Typography, Link, Divider } from "@mui/material";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
      }}
    >
      <Divider />
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Typography color="text.secondary" variant="body2">
            © {currentYear} Anko Storyboard App. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Link color="text.secondary" href="#" underline="hover">
              Privacy Policy
            </Link>
            <Link color="text.secondary" href="#" underline="hover">
              Terms of Service
            </Link>
            <Link color="text.secondary" href="#" underline="hover">
              Contact Us
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
