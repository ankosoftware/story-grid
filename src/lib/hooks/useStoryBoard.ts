import { useState, useEffect } from "react";
import {
  getIssuesByProject,
  getAllIssuesByProject,
  getReleases,
  createIssue,
  createRelease,
  updateIssue,
} from "../firebase/firestore";
import { Issue, Release, IssueStatus, IssuePriority, IssueType } from "../firebase/models/types";
import { useAuth } from "../auth/AuthProvider";

/**
 * Custom hook to manage the story board for a specific project
 * Uses optimized data loading to reduce Firebase calls
 *
 * @param projectId - The ID of the project to load the story board for
 */
export const useStoryBoard = (projectId: string) => {
  const { user } = useAuth();

  // Data state
  const [activities, setActivities] = useState<Issue[]>([]);
  const [epics, setEpics] = useState<Record<string, Issue[]>>({});
  const [issues, setIssues] = useState<Record<string, Issue[]>>({});
  const [releases, setReleases] = useState<Release[]>([]);
  const [issuesByRelease, setIssuesByRelease] = useState<Record<string, Issue[]>>({});
  const [allIssues, setAllIssues] = useState<Issue[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch story board data when the project ID changes
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchStoryBoardData = async () => {
      try {
        setLoading(true);

        // Fetch issues and releases in parallel
        const [issuesData, fetchedReleases] = await Promise.all([
          getAllIssuesByProject(projectId),
          getReleases(projectId),
        ]);

        // Set all the data from our optimized query
        setActivities(issuesData.backbones);
        setEpics(issuesData.epicsByBackbone);
        setIssues(issuesData.storiesByEpic);
        setIssuesByRelease(issuesData.issuesByRelease);
        setAllIssues(issuesData.allIssues);
        setReleases(fetchedReleases);
        setError(null);
      } catch (err) {
        console.error("Error fetching story board data:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryBoardData();
  }, [projectId]);

  /**
   * Helper function to update local state after creating/updating an issue
   * Avoids unnecessary Firebase reads
   */
  const updateLocalIssueState = (newIssue: Issue) => {
    // Add to allIssues array
    setAllIssues(prev => {
      const updatedIssues = [...prev];
      const existingIndex = updatedIssues.findIndex(i => i.id === newIssue.id);

      if (existingIndex >= 0) {
        // Update existing issue
        updatedIssues[existingIndex] = newIssue;
      } else {
        // Add new issue
        updatedIssues.push(newIssue);
      }

      return updatedIssues;
    });

    // Handle different issue types
    if (newIssue.type === IssueType.BACKBONE) {
      // It's a backbone
      setActivities(prev => {
        const updatedActivities = [...prev];
        const existingIndex = updatedActivities.findIndex(a => a.id === newIssue.id);

        if (existingIndex >= 0) {
          updatedActivities[existingIndex] = newIssue;
        } else {
          updatedActivities.push(newIssue);
          // Sort by displayOrder
          updatedActivities.sort((a, b) => a.displayOrder - b.displayOrder);
        }

        return updatedActivities;
      });
    } else if (newIssue.type === IssueType.EPIC) {
      if (!newIssue.parentId) {
        // It's an activity (top-level epic)
        setActivities(prev => {
          const updatedActivities = [...prev];
          const existingIndex = updatedActivities.findIndex(a => a.id === newIssue.id);

          if (existingIndex >= 0) {
            updatedActivities[existingIndex] = newIssue;
          } else {
            updatedActivities.push(newIssue);
            // Sort by displayOrder
            updatedActivities.sort((a, b) => a.displayOrder - b.displayOrder);
          }

          return updatedActivities;
        });
      } else {
        // It's an epic under an activity
        setEpics(prev => {
          const newEpics = { ...prev };
          const parentId = newIssue.parentId as string;

          if (!newEpics[parentId]) {
            newEpics[parentId] = [];
          }

          const existingIndex = newEpics[parentId].findIndex(e => e.id === newIssue.id);

          if (existingIndex >= 0) {
            newEpics[parentId][existingIndex] = newIssue;
          } else {
            newEpics[parentId].push(newIssue);
            // Sort by displayOrder
            newEpics[parentId].sort((a, b) => a.displayOrder - b.displayOrder);
          }

          return newEpics;
        });
      }
    } else if (newIssue.type === IssueType.STORY && newIssue.parentId) {
      // Update stories by epic
      setIssues(prev => {
        const newIssues = { ...prev };
        const parentId = newIssue.parentId as string;

        if (!newIssues[parentId]) {
          newIssues[parentId] = [];
        }

        const existingIndex = newIssues[parentId].findIndex(s => s.id === newIssue.id);

        if (existingIndex >= 0) {
          newIssues[parentId][existingIndex] = newIssue;
        } else {
          newIssues[parentId].push(newIssue);
          // Sort by displayOrder
          newIssues[parentId].sort((a, b) => a.displayOrder - b.displayOrder);
        }

        return newIssues;
      });

      // Also update issues by release if needed
      if (newIssue.releaseId) {
        setIssuesByRelease(prev => {
          const newIssuesByRelease = { ...prev };
          const releaseId = newIssue.releaseId as string;

          if (!newIssuesByRelease[releaseId]) {
            newIssuesByRelease[releaseId] = [];
          }

          const existingIndex = newIssuesByRelease[releaseId].findIndex(i => i.id === newIssue.id);

          if (existingIndex >= 0) {
            newIssuesByRelease[releaseId][existingIndex] = newIssue;
          } else {
            newIssuesByRelease[releaseId].push(newIssue);
          }

          return newIssuesByRelease;
        });
      }
    }
  };

  /**
   * Create a new activity (top-level epic)
   *
   * @param name - Activity name
   * @param description - Optional activity description
   * @returns Promise that resolves to the ID of the created activity
   */
  const addActivity = async (name: string, description?: string): Promise<string> => {
    if (!user) {
      throw new Error("User must be logged in to create an activity");
    }

    try {
      const activityId = await createIssue(projectId, name, IssueType.BACKBONE, user.uid, {
        description,
        status: IssueStatus.TO_DO,
        priority: IssuePriority.MEDIUM,
      });

      // Get the newly created issue to update local state
      const newActivity: Issue = {
        id: activityId,
        projectId,
        name,
        description: description || "",
        type: IssueType.BACKBONE,
        status: IssueStatus.TO_DO,
        priority: IssuePriority.MEDIUM,
        displayOrder:
          activities.length > 0 ? Math.max(...activities.map(a => a.displayOrder)) + 1 : 0,
        createdAt: new Date(),
        createdBy: user.uid,
      };

      // Update local state
      updateLocalIssueState(newActivity);

      return activityId;
    } catch (err) {
      console.error("Error creating activity:", err);
      throw err;
    }
  };

  /**
   * Create a new backbone
   *
   * @param name - Backbone name
   * @param description - Optional backbone description
   * @returns Promise that resolves to the ID of the created backbone
   */
  const addBackbone = async (name: string, description?: string): Promise<string> => {
    if (!user) {
      throw new Error("User must be logged in to create a backbone");
    }

    try {
      const backboneId = await createIssue(projectId, name, IssueType.BACKBONE, user.uid, {
        description,
        status: IssueStatus.TO_DO,
        priority: IssuePriority.MEDIUM,
      });

      // Get the newly created issue to update local state
      const newBackbone: Issue = {
        id: backboneId,
        projectId,
        name,
        description: description || "",
        type: IssueType.BACKBONE,
        status: IssueStatus.TO_DO,
        priority: IssuePriority.MEDIUM,
        displayOrder:
          activities.length > 0 ? Math.max(...activities.map(a => a.displayOrder)) + 1 : 0,
        createdAt: new Date(),
        createdBy: user.uid,
      };

      // Update local state
      updateLocalIssueState(newBackbone);

      return backboneId;
    } catch (err) {
      console.error("Error creating backbone:", err);
      throw err;
    }
  };

  /**
   * Create a new epic under an activity
   *
   * @param activityId - The ID of the activity to add the epic to
   * @param name - Epic name
   * @param description - Optional epic description
   * @returns Promise that resolves to the ID of the created epic
   */
  const addEpic = async (
    activityId: string,
    name: string,
    description?: string
  ): Promise<string> => {
    if (!user) {
      throw new Error("User must be logged in to create an epic");
    }

    try {
      const epicId = await createIssue(projectId, name, IssueType.EPIC, user.uid, {
        parentId: activityId,
        description,
        status: IssueStatus.TO_DO,
        priority: IssuePriority.MEDIUM,
      });

      // Create new epic object for local state update
      const epicsForActivity = epics[activityId] || [];
      const newEpic: Issue = {
        id: epicId,
        projectId,
        name,
        description: description || "",
        type: IssueType.EPIC,
        parentId: activityId,
        status: IssueStatus.TO_DO,
        priority: IssuePriority.MEDIUM,
        displayOrder:
          epicsForActivity.length > 0
            ? Math.max(...epicsForActivity.map(e => e.displayOrder)) + 1
            : 0,
        createdAt: new Date(),
        createdBy: user.uid,
      };

      // Update local state
      updateLocalIssueState(newEpic);

      return epicId;
    } catch (err) {
      console.error("Error creating epic:", err);
      throw err;
    }
  };

  /**
   * Create a new story under an epic
   *
   * @param epicId - The ID of the epic to add the story to
   * @param name - Story name
   * @param options - Optional story properties
   * @returns Promise that resolves to the ID of the created story
   */
  const addStory = async (
    epicId: string,
    name: string,
    options?: {
      description?: string;
      acceptanceCriteria?: string;
      status?: IssueStatus;
      priority?: IssuePriority;
      assignee?: string;
      releaseId?: string;
    }
  ): Promise<string> => {
    if (!user) {
      throw new Error("User must be logged in to create a story");
    }

    try {
      const storyId = await createIssue(projectId, name, IssueType.STORY, user.uid, {
        parentId: epicId,
        description: options?.description,
        acceptanceCriteria: options?.acceptanceCriteria,
        status: options?.status || IssueStatus.TO_DO,
        priority: options?.priority || IssuePriority.MEDIUM,
        assignee: options?.assignee,
        releaseId: options?.releaseId,
      });

      // Create new story object for local state update
      const storiesForEpic = issues[epicId] || [];
      const newStory: Issue = {
        id: storyId,
        projectId,
        name,
        description: options?.description || "",
        acceptanceCriteria: options?.acceptanceCriteria || "",
        type: IssueType.STORY,
        parentId: epicId,
        status: options?.status || IssueStatus.TO_DO,
        priority: options?.priority || IssuePriority.MEDIUM,
        assignee: options?.assignee,
        releaseId: options?.releaseId,
        displayOrder:
          storiesForEpic.length > 0 ? Math.max(...storiesForEpic.map(s => s.displayOrder)) + 1 : 0,
        createdAt: new Date(),
        createdBy: user.uid,
      };

      // Update local state
      updateLocalIssueState(newStory);

      return storyId;
    } catch (err) {
      console.error("Error creating story:", err);
      throw err;
    }
  };

  /**
   * Create a new release
   *
   * @param name - Release name
   * @param options - Optional release properties
   * @returns Promise that resolves to the ID of the created release
   */
  const addRelease = async (
    name: string,
    options?: {
      description?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<string> => {
    if (!user) {
      throw new Error("User must be logged in to create a release");
    }

    try {
      const releaseId = await createRelease(projectId, name, user.uid, options);

      // Create new release for local state
      const newRelease: Release = {
        id: releaseId,
        projectId,
        name,
        description: options?.description || "",
        startDate: options?.startDate,
        endDate: options?.endDate,
        displayOrder: releases.length > 0 ? Math.max(...releases.map(r => r.displayOrder)) + 1 : 0,
        createdAt: new Date(),
        createdBy: user.uid,
      };

      // Update releases state
      setReleases(prev => [...prev, newRelease]);

      // Initialize empty array for this release in issuesByRelease
      setIssuesByRelease(prev => ({
        ...prev,
        [releaseId]: [],
      }));

      return releaseId;
    } catch (err) {
      console.error("Error creating release:", err);
      throw err;
    }
  };

  /**
   * Move an issue to a different release
   *
   * @param issueId - The ID of the issue to move
   * @param releaseId - The ID of the target release, or null to remove from any release
   */
  const moveIssue = async (issueId: string, releaseId: string | null): Promise<void> => {
    if (!user) {
      throw new Error("User must be logged in to move an issue");
    }

    try {
      // Find the issue in our local state
      const issue = allIssues.find(i => i.id === issueId);

      if (!issue) {
        throw new Error("Issue not found");
      }

      // Create an updated issue with the new releaseId
      const updatedIssue: Issue = {
        ...issue,
        releaseId: releaseId || undefined,
      };

      // Update in Firebase
      await updateIssue(issueId, { releaseId: releaseId || null });

      // Update local state
      updateLocalIssueState(updatedIssue);

      // Additionally, we need to handle the issue's removal from its previous release
      if (issue.releaseId && issue.releaseId !== releaseId) {
        setIssuesByRelease(prev => {
          const newState = { ...prev };

          if (newState[issue.releaseId as string]) {
            newState[issue.releaseId as string] = newState[issue.releaseId as string].filter(
              i => i.id !== issueId
            );
          }

          return newState;
        });
      }
    } catch (err) {
      console.error("Error moving issue:", err);
      throw err;
    }
  };

  return {
    activities,
    backbones: activities,
    epics,
    issues,
    releases,
    issuesByRelease,
    loading,
    error,
    addActivity,
    addBackbone,
    addEpic,
    addStory,
    addRelease,
    moveIssue,
  };
};
