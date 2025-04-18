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
  Divider,
  InputAdornment,
  FormHelperText,
} from "@mui/material";
import Link from "next/link";
import EditIcon from "@mui/icons-material/Edit";
import TimelineIcon from "@mui/icons-material/Timeline";
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
  const [storyPointToHours, setStoryPointToHours] = useState<number | string>("");
  const [overheadPercentage, setOverheadPercentage] = useState<number | string>("");
  const [dailyBurnRate, setDailyBurnRate] = useState<number | string>("");
  const [blendedHourlyRate, setBlendedHourlyRate] = useState<number | string>("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
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
    if (project) {
      setEditProjectName(project.name);
      setEditProjectDescription(project.description || "");
      setStoryPointToHours(project.storyPointToHours || "");
      setOverheadPercentage(project.overheadPercentage || "");
      setDailyBurnRate(project.dailyBurnRate || "");
      setBlendedHourlyRate(project.blendedHourlyRate || "");
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

      // Parse numeric values
      const storyPointsValue = storyPointToHours === "" ? undefined : Number(storyPointToHours);
      const overheadValue = overheadPercentage === "" ? undefined : Number(overheadPercentage);
      const burnRateValue = dailyBurnRate === "" ? undefined : Number(dailyBurnRate);
      const hourlyRateValue = blendedHourlyRate === "" ? undefined : Number(blendedHourlyRate);

      await updateProject(projectId, {
        name: editProjectName,
        description: editProjectDescription.trim() ? editProjectDescription : "",
        storyPointToHours: storyPointsValue,
        overheadPercentage: overheadValue,
        dailyBurnRate: burnRateValue,
        blendedHourlyRate: hourlyRateValue,
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
          storyPointToHours: storyPointsValue,
          overheadPercentage: overheadValue,
          dailyBurnRate: burnRateValue,
          blendedHourlyRate: hourlyRateValue,
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

  // Helper function to validate numeric input
  const handleNumericInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<number | string>>
  ) => {
    // Allow empty string or valid numbers
    if (value === "" || !isNaN(Number(value))) {
      setter(value);
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
            sx={{ mb: 3 }}
            type="text"
            value={editProjectDescription}
            variant="outlined"
            onChange={e => setEditProjectDescription(e.target.value)}
          />

          {/* Estimation Configuration Section */}
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ mb: 2 }} variant="h6">
            Estimation Configuration
          </Typography>

          <TextField
            fullWidth
            disabled={updating}
            id="storyPointToHours"
            InputProps={{
              endAdornment: <InputAdornment position="end">hours/point</InputAdornment>,
            }}
            label="Story Point to Hours Conversion"
            margin="dense"
            sx={{ mb: 2 }}
            type="text"
            value={storyPointToHours}
            variant="outlined"
            onChange={e => handleNumericInput(e.target.value, setStoryPointToHours)}
          />
          <FormHelperText sx={{ mt: -1, mb: 2 }}>
            Enter the number of hours equivalent to 1 story point (e.g., 8)
          </FormHelperText>

          <TextField
            fullWidth
            disabled={updating}
            id="overheadPercentage"
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            label="Overhead Percentage"
            margin="dense"
            sx={{ mb: 2 }}
            type="text"
            value={overheadPercentage}
            variant="outlined"
            onChange={e => handleNumericInput(e.target.value, setOverheadPercentage)}
          />
          <FormHelperText sx={{ mt: -1, mb: 2 }}>
            Enter the percentage to add for QA/Project Management overhead (e.g., 25)
          </FormHelperText>

          <TextField
            fullWidth
            disabled={updating}
            id="dailyBurnRate"
            InputProps={{
              endAdornment: <InputAdornment position="end">hours/day</InputAdornment>,
            }}
            label="Daily Burn Rate"
            margin="dense"
            type="text"
            value={dailyBurnRate}
            variant="outlined"
            onChange={e => handleNumericInput(e.target.value, setDailyBurnRate)}
          />
          <FormHelperText sx={{ mt: -1, mb: 2 }}>
            Enter the number of hours the team can complete per day (e.g., 16 for two developers)
          </FormHelperText>

          <TextField
            fullWidth
            disabled={updating}
            id="blendedHourlyRate"
            InputProps={{
              endAdornment: <InputAdornment position="end">$/hour</InputAdornment>,
            }}
            label="Blended Hourly Rate"
            margin="dense"
            type="text"
            value={blendedHourlyRate}
            variant="outlined"
            onChange={e => handleNumericInput(e.target.value, setBlendedHourlyRate)}
          />
          <FormHelperText sx={{ mt: -1, mb: 2 }}>
            Enter the average hourly rate for cost calculations (e.g., 100 for $100/hour)
          </FormHelperText>
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
