"use client";

import { useState, useEffect } from "react";
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
} from "@mui/material";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getProjectById } from "@/lib/firebase/firestore";
import { Project } from "@/lib/firebase/models/types";
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
        />
      </Paper>
    </Box>
  );
}
