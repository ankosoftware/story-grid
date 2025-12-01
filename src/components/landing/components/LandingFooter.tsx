"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  Link as MuiLink,
  Divider,
  IconButton,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import GitHubIcon from "@mui/icons-material/GitHub";
import Link from "next/link";
import { ThemeToggle } from "@/components/common/ThemeToggle";

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

const FooterLink: React.FC<FooterLinkProps> = ({ href, children, external }) => {
  const linkProps = external
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { component: Link, href };

  return (
    <MuiLink
      color="text.secondary"
      sx={{
        textDecoration: "none",
        "&:hover": { color: "primary.main" },
        display: "block",
        mb: 1,
      }}
      {...linkProps}
    >
      {children}
    </MuiLink>
  );
};

const LandingFooter: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Roadmap", href: "#", external: false },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#", external: false },
        {
          label: "GitHub",
          href: "https://github.com",
          external: true,
        },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#", external: false },
        { label: "Terms of Service", href: "#", external: false },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: "auto",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography sx={{ fontWeight: 700, mb: 2 }} variant="h6">
              Story Board
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2, maxWidth: 280 }} variant="body2">
              The open-source story mapping tool for agile teams. Visualize user journeys, plan
              releases, and estimate with confidence.
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                aria-label="GitHub"
                component="a"
                href="https://github.com"
                rel="noopener noreferrer"
                size="small"
                target="_blank"
              >
                <GitHubIcon />
              </IconButton>
            </Box>
          </Grid>

          {footerSections.map(section => (
            <Grid key={section.title} size={{ xs: 6, sm: 4, md: 2 }}>
              <Typography color="text.primary" sx={{ fontWeight: 600, mb: 2 }} variant="subtitle2">
                {section.title}
              </Typography>
              {section.links.map(link => (
                <FooterLink key={link.label} external={link.external} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography color="text.secondary" variant="body2">
            © {currentYear} Story Board. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ThemeToggle size="small" />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingFooter;
