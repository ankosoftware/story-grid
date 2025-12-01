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

const StoryMappingSection: React.FC = () => {
  const theme = useTheme();

  const features = [
    {
      title: "Hierarchical organization",
      description: "Activities → Epics → Stories in a visual hierarchy",
    },
    {
      title: "Drag-and-drop reordering",
      description: "Reorganize your backlog with intuitive interactions",
    },
    {
      title: "Release swimlanes",
      description: "Slice your map into shippable releases",
    },
    {
      title: "Real-time collaboration",
      description: "See changes as your team makes them",
    },
  ];

  return (
    <Box
      id="features"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Container maxWidth="lg">
        <Grid container alignItems="center" spacing={{ xs: 4, md: 8 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography color="primary" sx={{ fontWeight: 600, mb: 1 }} variant="overline">
              Story Mapping
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.75rem", md: "2.25rem" },
                mb: 3,
              }}
            >
              Story Mapping That Actually Maps
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, fontSize: "1.1rem" }}>
              Organize your product backlog visually with a user story map that shows the complete
              user journey. Based on Jeff Patton&apos;s story mapping methodology.
            </Typography>
            <List disablePadding>
              {features.map(feature => (
                <ListItem key={feature.title} disableGutters sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CheckCircleIcon color="primary" />
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
          <Grid size={{ xs: 12, md: 6 }}>
            <ScreenshotDisplay
              alt="Story mapping interface showing activities, epics, and stories"
              src="/screenshots/storyboard-mapping.png"
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StoryMappingSection;
