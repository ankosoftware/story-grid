"use client";

import { Box, Typography, Paper, Grid, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTenant } from "@/lib/context/TenantContext";

export default function ProjectsPage() {
  const { tenant } = useTenant();

  // This would normally be fetched from an API
  const mockProjects = [
    { id: "1", name: "Storyboard Project 1", description: "First project description" },
    { id: "2", name: "Storyboard Project 2", description: "Second project description" },
    { id: "3", name: "Storyboard Project 3", description: "Third project description" },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mockProjects.map(project => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Paper
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                height: 200,
                "&:hover": {
                  boxShadow: 6,
                },
                cursor: "pointer",
              }}
            >
              <Typography variant="h6" component="h2" gutterBottom>
                {project.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {project.description}
              </Typography>
              <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end" }}>
                <Button size="small">Open Project</Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
