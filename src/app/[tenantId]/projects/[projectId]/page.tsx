"use client";

import { useState, useEffect, useCallback } from "react";
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
  Snackbar,
} from "@mui/material";
import Link from "next/link";
import EditIcon from "@mui/icons-material/Edit";
import TimelineIcon from "@mui/icons-material/Timeline";
import { getProjectById } from "@/lib/firebase/firestore";
import { Project } from "@/lib/firebase/models/types";
import { useStoryBoard } from "@/lib/hooks/useStoryBoard";
import StoryBoard from "@/components/storyboard/StoryBoard";
import { EditProjectDialog } from "@/components/storyboard/dialogs";
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
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  const {
    activities,
    epics,
    issues,
    releases,
    issuesByRelease,
    loading: boardLoading,
    error: boardError,
    addActivity,
    addEpic,
    addStory,
    addRelease,
    moveIssue,
  } = useStoryBoard(projectId);

  // Navigate to estimation page
  const handleNavigateToEstimation = () => {
    router.push(`/${tenantId}/projects/${projectId}/estimation`);
  };

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
    setEditDialogOpen(true);
  };

  // Handle project updated callback
  const handleProjectUpdated = useCallback((updatedProject: Project) => {
    setProject(updatedProject);
    setShowUpdateSuccess(true);
  }, []);

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
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            startIcon={<TimelineIcon />}
            variant="outlined"
            onClick={handleNavigateToEstimation}
          >
            View Estimation
          </Button>
          <Button startIcon={<EditIcon />} variant="outlined" onClick={handleOpenEditDialog}>
            Edit Project
          </Button>
        </Box>
      </Box>

      {/* Story Board */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <StoryBoard
          activities={activities}
          epics={epics}
          error={boardError}
          issues={issues}
          loading={boardLoading}
          projectId={projectId}
          releases={releases}
          onAddActivity={addActivity}
          onAddEpic={addEpic}
          onAddRelease={addRelease}
          onAddStory={addStory}
          onMoveIssue={moveIssue}
        />
      </Paper>

      {/* Edit Project Dialog */}
      {project && (
        <EditProjectDialog
          open={editDialogOpen}
          project={project}
          onClose={() => setEditDialogOpen(false)}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

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
