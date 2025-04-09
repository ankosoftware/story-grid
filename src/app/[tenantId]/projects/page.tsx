"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/context/TenantContext";
import { useProjects } from "@/lib/hooks/useProjects";

export default function ProjectsPage() {
  const { tenant } = useTenant();
  const router = useRouter();
  const { projects, loading, error, createNewProject } = useProjects();

  // Dialog state
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setProjectName("");
    setProjectDescription("");
    setCreateError(null);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setCreateError("Project name is required");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const projectId = await createNewProject(
        projectName,
        projectDescription.trim() ? projectDescription : undefined
      );

      setShowSuccess(true);
      handleClose();

      // Navigate to the new project's storyboard after a brief delay
      setTimeout(() => {
        router.push(`/${tenant?.id}/projects/${projectId}`);
      }, 1000);
    } catch (err) {
      setCreateError((err as Error).message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleClickOpen}>
          New Project
        </Button>
      </Box>

      {/* Project creation dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description (optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={projectDescription}
            onChange={e => setProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={creating}
            startIcon={creating ? <CircularProgress size={20} /> : null}
          >
            {creating ? "Creating..." : "Create Project"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Projects grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading projects: {error.message}
        </Alert>
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first project to get started with story mapping.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleClickOpen}>
            Create Project
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map(project => (
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
                onClick={() => router.push(`/${tenant?.id}/projects/${project.id}`)}
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
      )}

      {/* Success message */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={5000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success">
          Project created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
