import { useState, useEffect } from "react";
import {
  createProject,
  getProjects,
  getProjectById,
  getAllIssuesByProject,
  getCommentsForIssue,
  createIssue,
  addComment,
  getReleases,
  createRelease,
  updateIssue,
  updateProject,
} from "../firebase/firestore";
import { Project, Issue, IssueType, IssueComment, Release } from "../firebase/models/types";
import { useAuth } from "../auth/AuthProvider";

/**
 * Custom hook to manage projects for the current tenant
 */
export const useProjects = () => {
  const { user, currentTenant, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch projects when the tenant changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !currentTenant) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const fetchedProjects = await getProjects(currentTenant.id);
        setProjects(fetchedProjects);
        setError(null);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, currentTenant, authLoading]);

  /**
   * Create a new project
   *
   * @param name - Project name
   * @param description - Optional project description
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Promise that resolves to the ID of the created project
   */
  const createNewProject = async (
    name: string,
    description?: string,
    startDate?: Date | null,
    endDate?: Date | null
  ): Promise<string> => {
    if (!user || !currentTenant) {
      throw new Error("User must be logged in and have an active tenant to create a project");
    }

    try {
      // Create the project in Firestore
      const projectId = await createProject(
        currentTenant.id,
        name,
        user.uid,
        description,
        startDate,
        endDate
      );

      // Refresh the projects list
      const updatedProjects = await getProjects(currentTenant.id);
      setProjects(updatedProjects);

      return projectId;
    } catch (err) {
      console.error("Error creating project:", err);
      throw err;
    }
  };

  /**
   * Clone an existing project with all its activities, epics, stories and optionally comments
   *
   * @param sourceProjectId - The ID of the project to clone
   * @param newProjectName - The name for the new project
   * @param includeComments - Whether to include comments in the clone
   * @param onProgress - Optional callback to report progress (0-100)
   * @returns Promise that resolves to the ID of the cloned project
   */
  const cloneProject = async (
    sourceProjectId: string,
    newProjectName: string,
    includeComments: boolean = false,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    if (!user || !currentTenant) {
      throw new Error("User must be logged in and have an active tenant to clone a project");
    }

    try {
      // Report initial progress
      if (onProgress) {
        onProgress(0);
      }

      // 1. Get source project data
      const sourceProject = await getProjectById(sourceProjectId);
      if (!sourceProject) {
        throw new Error("Source project not found");
      }

      // 2. Create new project with all properties
      const newProjectId = await createProject(
        currentTenant.id,
        newProjectName,
        user.uid,
        sourceProject.description,
        sourceProject.startDate ? new Date(sourceProject.startDate.toDate()) : null,
        sourceProject.endDate ? new Date(sourceProject.endDate.toDate()) : null
      );

      // 3. Copy additional project properties if they exist
      if (
        sourceProject.storyPointToHours ||
        sourceProject.overheadPercentage ||
        sourceProject.dailyBurnRate ||
        sourceProject.blendedHourlyRate
      ) {
        const updateData: Partial<Project> = {};

        if (sourceProject.storyPointToHours) {
          updateData.storyPointToHours = sourceProject.storyPointToHours;
        }
        if (sourceProject.overheadPercentage) {
          updateData.overheadPercentage = sourceProject.overheadPercentage;
        }
        if (sourceProject.dailyBurnRate) {
          updateData.dailyBurnRate = sourceProject.dailyBurnRate;
        }
        if (sourceProject.blendedHourlyRate) {
          updateData.blendedHourlyRate = sourceProject.blendedHourlyRate;
        }

        await updateProject(newProjectId, updateData);
      }

      // Report progress after project creation
      if (onProgress) {
        onProgress(5);
      }

      // 4. Get all releases from source project
      const sourceReleases = await getReleases(sourceProjectId);

      // Report progress after fetching releases
      if (onProgress) {
        onProgress(8);
      }

      // 5. Get all issues from source project
      const sourceIssues = await getAllIssuesByProject(sourceProjectId);
      const { backbones, epicsByBackbone, storiesByEpic, allIssues } = sourceIssues;

      // Create maps to store old ID to new ID mappings
      const idMap = new Map<string, string>();
      const releaseIdMap = new Map<string, string>();

      // Calculate progress increments - now including releases
      const totalItems =
        allIssues.length + sourceReleases.length + (includeComments ? allIssues.length : 0);
      let completedItems = 0;
      const progressStep = 85 / totalItems; // 5% for project creation, 8% for data loading, 2% for finalization

      // 6. Clone releases
      for (const release of sourceReleases) {
        const newReleaseId = await createRelease(newProjectId, release.name, user.uid, {
          description: release.description,
          startDate: release.startDate ? new Date(release.startDate.toDate()) : null,
          endDate: release.endDate ? new Date(release.endDate.toDate()) : null,
          displayOrder: release.displayOrder,
        });

        releaseIdMap.set(release.id, newReleaseId);
        completedItems++;
        if (onProgress) {
          onProgress(8 + completedItems * progressStep);
        }
      }

      // 7. Clone backbones (activities)
      for (const backbone of backbones) {
        const newBackboneId = await createIssue(
          newProjectId,
          backbone.name,
          IssueType.BACKBONE,
          user.uid,
          {
            description: backbone.description,
            status: backbone.status,
            priority: backbone.priority,
            displayOrder: backbone.displayOrder,
            storyPoints: backbone.storyPoints,
          }
        );

        idMap.set(backbone.id, newBackboneId);
        completedItems++;
        if (onProgress) {
          onProgress(8 + completedItems * progressStep);
        }
      }

      // 8. Clone epics with correct parent references
      for (const backbone of backbones) {
        const epics = epicsByBackbone[backbone.id] || [];
        const newBackboneId = idMap.get(backbone.id);

        if (!newBackboneId) {
          continue;
        }

        for (const epic of epics) {
          const newEpicId = await createIssue(newProjectId, epic.name, IssueType.EPIC, user.uid, {
            parentId: newBackboneId,
            description: epic.description,
            status: epic.status,
            priority: epic.priority,
            displayOrder: epic.displayOrder,
            storyPoints: epic.storyPoints,
          });

          idMap.set(epic.id, newEpicId);
          completedItems++;
          if (onProgress) {
            onProgress(8 + completedItems * progressStep);
          }
        }
      }

      // 9. Clone stories with correct parent references and release mappings
      for (const epic of allIssues.filter(issue => issue.type === IssueType.EPIC)) {
        const stories = storiesByEpic[epic.id] || [];
        const newEpicId = idMap.get(epic.id);

        if (!newEpicId) {
          continue;
        }

        for (const story of stories) {
          // Map the release ID if this story is assigned to a release
          const mappedReleaseId = story.releaseId
            ? releaseIdMap.get(story.releaseId) || null
            : null;

          const newStoryId = await createIssue(
            newProjectId,
            story.name,
            IssueType.STORY,
            user.uid,
            {
              parentId: newEpicId,
              description: story.description,
              status: story.status,
              priority: story.priority,
              displayOrder: story.displayOrder,
              acceptanceCriteria: story.acceptanceCriteria,
              storyPoints: story.storyPoints,
              releaseId: mappedReleaseId,
              assignee: null, // Reset assignee for cloned stories
            }
          );

          idMap.set(story.id, newStoryId);
          completedItems++;
          if (onProgress) {
            onProgress(8 + completedItems * progressStep);
          }
        }
      }

      // 10. Optionally clone comments
      if (includeComments) {
        for (const issue of allIssues) {
          const newIssueId = idMap.get(issue.id);

          if (!newIssueId) {
            continue;
          }

          // Get comments for this issue
          const comments = await getCommentsForIssue(issue.id);

          for (const comment of comments) {
            await addComment(newIssueId, comment.text, user.uid);
          }

          completedItems++;
          if (onProgress) {
            onProgress(8 + completedItems * progressStep);
          }
        }
      }

      // Refresh the projects list
      const updatedProjects = await getProjects(currentTenant.id);
      setProjects(updatedProjects);

      // Report completion
      if (onProgress) {
        onProgress(100);
      }

      return newProjectId;
    } catch (err) {
      console.error("Error cloning project:", err);
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    createNewProject,
    cloneProject,
  };
};
