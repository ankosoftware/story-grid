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
        projectDescription.trim() ? projectDescription : undefined,
        null,
        null
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
        <Typography component="h1" variant="h4">
          Projects
        </Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={handleClickOpen}>
          New Project
        </Button>
      </Box>

      {/* Project creation dialog */}
      <Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            id="name"
            label="Project Name"
            margin="dense"
            sx={{ mb: 2 }}
            type="text"
            value={projectName}
            variant="outlined"
            onChange={e => setProjectName(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            id="description"
            label="Description (optional)"
            margin="dense"
            rows={4}
            type="text"
            value={projectDescription}
            variant="outlined"
            onChange={e => setProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={creating} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={creating}
            startIcon={creating ? <CircularProgress size={20} /> : null}
            variant="contained"
            onClick={handleCreateProject}
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
          <Typography gutterBottom color="text.secondary" variant="h6">
            No projects yet
          </Typography>
          <Typography paragraph color="text.secondary" variant="body2">
            Create your first project to get started with story mapping.
          </Typography>
          <Button startIcon={<AddIcon />} variant="contained" onClick={handleClickOpen}>
            Create Project
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map(project => (
            <Grid key={project.id} size={{ xs: 12, sm: 6, md: 4 }}>
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
                <Typography gutterBottom component="h2" variant="h6">
                  {project.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
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
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={5000}
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Project created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
