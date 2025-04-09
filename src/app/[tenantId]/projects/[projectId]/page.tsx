"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from "@mui/material";
import Link from "next/link";
import EditIcon from "@mui/icons-material/Edit";
import { getProjectById, updateProject } from "@/lib/firebase/firestore";
import { Project } from "@/lib/firebase/models/types";
import { useStoryBoard } from "@/lib/hooks/useStoryBoard";
import StoryBoard from "@/components/storyboard/StoryBoard";
import { useTenant } from "@/lib/context/TenantContext";

export default function ProjectView() {
  const { projectId, tenantId } = useParams() as { projectId: string; tenantId: string };
  const router = useRouter();
  const { tenant } = useTenant();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Edit project dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  const {
    epics,
    issuesByParent,
    releases,
    loading: boardLoading,
    error: boardError,
    addEpic,
    addStory,
    addRelease,
  } = useStoryBoard(projectId);

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const projectData = await getProjectById(projectId);

        if (!projectData) {
          throw new Error("Project not found");
        }

        // Verify the project belongs to the current tenant
        if (projectData.tenantId !== tenantId) {
          throw new Error("Project not found in this tenant");
        }

        setProject(projectData);
        setError(null);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, tenantId]);

  // Open edit dialog with current project data
  const handleOpenEditDialog = () => {
    if (project) {
      setEditProjectName(project.name);
      setEditProjectDescription(project.description || "");
      setUpdateError(null);
      setEditDialogOpen(true);
    }
  };

  // Close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  // Handle project update
  const handleUpdateProject = async () => {
    if (!editProjectName.trim()) {
      setUpdateError("Project name is required");
      return;
    }

    try {
      setUpdating(true);
      setUpdateError(null);

      await updateProject(projectId, {
        name: editProjectName,
        description: editProjectDescription.trim() ? editProjectDescription : "",
      });

      // Update local project state
      setProject(prevProject => {
        if (!prevProject) {
          return null;
        }
        return {
          ...prevProject,
          name: editProjectName,
          description: editProjectDescription.trim() ? editProjectDescription : "",
        };
      });

      setShowUpdateSuccess(true);
      handleCloseEditDialog();
    } catch (err) {
      console.error("Error updating project:", err);
      setUpdateError((err as Error).message || "Failed to update project");
    } finally {
      setUpdating(false);
    }
  };

  // Close success snackbar
  const handleCloseSuccessSnackbar = () => {
    setShowUpdateSuccess(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error?.message || "Failed to load project"}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Breadcrumb navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link legacyBehavior passHref href={`/${tenantId}/dashboard`}>
          <MuiLink color="inherit" underline="hover">
            Dashboard
          </MuiLink>
        </Link>
        <Link legacyBehavior passHref href={`/${tenantId}/projects`}>
          <MuiLink color="inherit" underline="hover">
            Projects
          </MuiLink>
        </Link>
        <Typography color="text.primary">{project.name}</Typography>
      </Breadcrumbs>

      {/* Project header */}
      <Box
        sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <Box>
          <Typography gutterBottom component="h1" variant="h4">
            {project.name}
          </Typography>
          {project.description && (
            <Typography color="text.secondary" variant="body1">
              {project.description}
            </Typography>
          )}
        </Box>
        <Button
          startIcon={<EditIcon />}
          sx={{ ml: 2 }}
          variant="outlined"
          onClick={handleOpenEditDialog}
        >
          Edit Project
        </Button>
      </Box>

      {/* Story board */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <StoryBoard
          epics={epics}
          error={boardError}
          issuesByParent={issuesByParent}
          loading={boardLoading}
          projectId={projectId}
          releases={releases}
          onAddEpic={addEpic}
          onAddRelease={addRelease}
          onAddStory={addStory}
        />
      </Paper>

      {/* Edit Project Dialog */}
      <Dialog fullWidth maxWidth="sm" open={editDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          {updateError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateError}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            disabled={updating}
            id="projectName"
            label="Project Name"
            margin="dense"
            sx={{ mb: 2 }}
            type="text"
            value={editProjectName}
            variant="outlined"
            onChange={e => setEditProjectName(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            disabled={updating}
            id="projectDescription"
            label="Description (optional)"
            margin="dense"
            rows={4}
            type="text"
            value={editProjectDescription}
            variant="outlined"
            onChange={e => setEditProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={updating} onClick={handleCloseEditDialog}>
            Cancel
          </Button>
          <Button
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : null}
            variant="contained"
            onClick={handleUpdateProject}
          >
            {updating ? "Updating..." : "Update Project"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success message Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={3000}
        message="Project updated successfully"
        open={showUpdateSuccess}
        onClose={handleCloseSuccessSnackbar}
      />
    </Box>
  );
}
