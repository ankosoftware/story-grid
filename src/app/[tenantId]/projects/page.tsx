"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  FormControlLabel,
  Checkbox,
  LinearProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/context/TenantContext";
import { useProjects } from "@/lib/hooks/useProjects";

export default function ProjectsPage() {
  const { tenant } = useTenant();
  const router = useRouter();
  const { projects, loading, error, createNewProject, cloneProject } = useProjects();

  // Dialog state
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Project created successfully!");

  // Clone dialog state
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneProjectId, setCloneProjectId] = useState<string | null>(null);
  const [cloneProjectName, setCloneProjectName] = useState("");
  const [includeComments, setIncludeComments] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [cloneProgress, setCloneProgress] = useState(0);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setProjectName("");
    setProjectDescription("");
    setCreateError(null);
  };

  const handleCloneDialogOpen = (projectId: string, projectName: string) => {
    setCloneProjectId(projectId);
    setCloneProjectName(`Copy of ${projectName}`);
    setIncludeComments(false);
    setCloneDialogOpen(true);
  };

  const handleCloneDialogClose = () => {
    setCloneDialogOpen(false);
    setCloneProjectId(null);
    setCloneProjectName("");
    setCloneError(null);
    setCloneProgress(0);
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

      setSuccessMessage("Project created successfully!");
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

  const handleCloneProject = async () => {
    if (!cloneProjectName.trim()) {
      setCloneError("Project name is required");
      return;
    }

    if (!cloneProjectId) {
      setCloneError("No project selected for cloning");
      return;
    }

    try {
      setCloning(true);
      setCloneError(null);
      setCloneProgress(0);

      // Report progress from the cloning operation
      const onProgress = (progress: number) => {
        setCloneProgress(progress);
      };

      const newProjectId = await cloneProject(
        cloneProjectId,
        cloneProjectName,
        includeComments,
        onProgress
      );

      handleCloneDialogClose();
      setSuccessMessage("Project cloned successfully!");
      setShowSuccess(true);

      // Navigate to the new project's storyboard after a brief delay
      setTimeout(() => {
        router.push(`/${tenant?.id}/projects/${newProjectId}`);
      }, 1000);
    } catch (err) {
      setCloneError((err as Error).message || "Failed to clone project");
      setCloning(false);
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

      {/* Project clone dialog */}
      <Dialog fullWidth maxWidth="sm" open={cloneDialogOpen} onClose={handleCloneDialogClose}>
        <DialogTitle>Clone Project</DialogTitle>
        <DialogContent>
          {cloneError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cloneError}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            id="cloneName"
            label="New Project Name"
            margin="dense"
            sx={{ mb: 2 }}
            type="text"
            value={cloneProjectName}
            variant="outlined"
            onChange={e => setCloneProjectName(e.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={includeComments}
                name="includeComments"
                onChange={e => setIncludeComments(e.target.checked)}
              />
            }
            label="Include comments"
          />
          {cloning && (
            <Box sx={{ width: "100%", mt: 2 }}>
              <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                Cloning progress: {Math.round(cloneProgress)}%
              </Typography>
              <LinearProgress value={cloneProgress} variant="determinate" />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={cloning} onClick={handleCloneDialogClose}>
            Cancel
          </Button>
          <Button
            disabled={cloning}
            startIcon={cloning ? <CircularProgress size={20} /> : null}
            variant="contained"
            onClick={handleCloneProject}
          >
            {cloning ? "Cloning..." : "Clone Project"}
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
                }}
              >
                <Typography gutterBottom component="h2" variant="h6">
                  {project.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
                  {project.description}
                </Typography>
                <Box sx={{ mt: "auto", display: "flex", justifyContent: "space-between" }}>
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={e => {
                      e.stopPropagation(); // Prevent opening the project
                      handleCloneDialogOpen(project.id, project.name);
                    }}
                  >
                    Clone
                  </Button>
                  <Button
                    size="small"
                    onClick={() => router.push(`/${tenant?.id}/projects/${project.id}`)}
                  >
                    Open Project
                  </Button>
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
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
