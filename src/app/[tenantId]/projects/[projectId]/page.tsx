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
} from "@mui/material";
import Link from "next/link";
import { getProjectById } from "@/lib/firebase/firestore";
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
        <Link href={`/${tenantId}/dashboard`} passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">
            Dashboard
          </MuiLink>
        </Link>
        <Link href={`/${tenantId}/projects`} passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">
            Projects
          </MuiLink>
        </Link>
        <Typography color="text.primary">{project.name}</Typography>
      </Breadcrumbs>

      {/* Project header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {project.name}
        </Typography>
        {project.description && (
          <Typography variant="body1" color="text.secondary">
            {project.description}
          </Typography>
        )}
      </Box>

      {/* Story board */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <StoryBoard
          projectId={projectId}
          epics={epics}
          issuesByParent={issuesByParent}
          releases={releases}
          loading={boardLoading}
          error={boardError}
          onAddEpic={addEpic}
          onAddStory={addStory}
          onAddRelease={addRelease}
        />
      </Paper>
    </Box>
  );
}
