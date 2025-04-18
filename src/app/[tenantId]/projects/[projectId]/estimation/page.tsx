"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from "@mui/material";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getProjectById, updateIssue } from "@/lib/firebase/firestore";
import { Project, Issue, IssueType } from "@/lib/firebase/models/types";
import { useStoryBoard } from "@/lib/hooks/useStoryBoard";
import EstimationPanel from "@/components/storyboard/EstimationPanel";
import { useTenant } from "@/lib/context/TenantContext";

export default function ProjectEstimationPage() {
  const { projectId, tenantId } = useParams() as { projectId: string; tenantId: string };
  const router = useRouter();
  const { tenant } = useTenant();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // State for edit dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Issue | null>(null);
  const [editingItemType, setEditingItemType] = useState<"epic" | "story" | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editItemStoryPoints, setEditItemStoryPoints] = useState<number | string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const {
    activities,
    epics,
    issues,
    releases,
    loading: boardLoading,
    error: boardError,
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

  // Handle back navigation
  const handleBackToProject = () => {
    router.push(`/${tenantId}/projects/${projectId}`);
  };

  // Handle opening the edit dialog for an epic
  const handleEditEpic = useCallback((epic: Issue) => {
    setEditingItem(epic);
    setEditingItemType("epic");
    setEditItemName(epic.name);
    setEditItemDescription(epic.description || "");
    setEditItemStoryPoints("");
    setEditDialogOpen(true);
  }, []);

  // Handle opening the edit dialog for a story
  const handleEditStory = useCallback((story: Issue) => {
    setEditingItem(story);
    setEditingItemType("story");
    setEditItemName(story.name);
    setEditItemDescription(story.description || "");
    setEditItemStoryPoints(story.storyPoints || "");
    setEditDialogOpen(true);
  }, []);

  // Handle closing the edit dialog
  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditingItem(null);
    setEditingItemType(null);
  }, []);

  // Handle updating the item
  const handleUpdateItem = useCallback(async () => {
    if (!editingItem || !editingItemType) {
      return;
    }

    try {
      setIsUpdating(true);

      // Prepare the update data
      const updateData: Partial<Issue> = {
        name: editItemName.trim(),
      };

      if (editItemDescription.trim()) {
        updateData.description = editItemDescription.trim();
      }

      // Add story points for stories
      if (editingItemType === "story" && editItemStoryPoints !== "") {
        updateData.storyPoints = Number(editItemStoryPoints);
      }

      // Call the Firestore update function
      await updateIssue(editingItem.id, updateData);

      // Show success message
      setSnackbarMessage(`${editingItemType === "epic" ? "Epic" : "Story"} updated successfully`);
      setSnackbarOpen(true);

      // Close the dialog
      handleCloseEditDialog();
    } catch (error) {
      console.error("Error updating item:", error);
      setSnackbarMessage(`Error updating ${editingItemType}: ${(error as Error).message}`);
      setSnackbarOpen(true);
    } finally {
      setIsUpdating(false);
    }
  }, [
    editingItem,
    editingItemType,
    editItemName,
    editItemDescription,
    editItemStoryPoints,
    handleCloseEditDialog,
  ]);

  // Handle numeric input validation for story points
  const handleNumericInput = (value: string) => {
    // Allow empty string or valid numbers
    if (value === "" || !isNaN(Number(value))) {
      setEditItemStoryPoints(value);
    }
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
        <Link legacyBehavior passHref href={`/${tenantId}/projects/${projectId}`}>
          <MuiLink color="inherit" underline="hover">
            {project.name}
          </MuiLink>
        </Link>
        <Typography color="text.primary">Estimation</Typography>
      </Breadcrumbs>

      {/* Page header */}
      <Box
        sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <Box>
          <Typography gutterBottom component="h1" variant="h4">
            {project.name} - Estimation
          </Typography>
          <Typography color="text.secondary" variant="body1">
            Timeline, effort, and cost estimations based on story points and configuration
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ ml: 2 }}
          variant="outlined"
          onClick={handleBackToProject}
        >
          Back to Project
        </Button>
      </Box>

      {/* Estimation content */}
      <Paper sx={{ p: 3 }}>
        <EstimationPanel
          activities={activities}
          blendedHourlyRate={project.blendedHourlyRate}
          dailyBurnRate={project.dailyBurnRate}
          epics={epics}
          error={boardError}
          issues={issues}
          loading={boardLoading}
          overheadPercentage={project.overheadPercentage}
          projectId={projectId}
          releases={releases}
          storyPointToHours={project.storyPointToHours}
          onEditEpic={handleEditEpic}
          onEditStory={handleEditStory}
        />
      </Paper>

      {/* Edit Dialog */}
      <Dialog fullWidth maxWidth="sm" open={editDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>{editingItemType === "epic" ? "Edit Epic" : "Edit Story"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            required
            id="itemName"
            label={editingItemType === "epic" ? "Epic Name" : "Story Name"}
            margin="dense"
            value={editItemName}
            variant="outlined"
            onChange={e => setEditItemName(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            id="itemDescription"
            label="Description"
            margin="dense"
            rows={3}
            value={editItemDescription}
            variant="outlined"
            onChange={e => setEditItemDescription(e.target.value)}
          />
          {editingItemType === "story" && (
            <TextField
              fullWidth
              id="storyPoints"
              label="Story Points"
              margin="dense"
              type="text"
              value={editItemStoryPoints}
              variant="outlined"
              onChange={e => handleNumericInput(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={isUpdating} onClick={handleCloseEditDialog}>
            Cancel
          </Button>
          <Button
            disabled={isUpdating || !editItemName.trim()}
            variant="contained"
            onClick={handleUpdateItem}
          >
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={4000}
        message={snackbarMessage}
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
      />
    </Box>
  );
}
