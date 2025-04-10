import { useState, useEffect } from "react";
import {
  getIssuesByProject,
  getAllIssuesByProject,
  getReleases,
  createIssue,
  createRelease,
  updateIssue,
  issuesCollection,
  releasesCollection,
} from "../firebase/firestore";
import { Issue, Release, IssueStatus, IssuePriority, IssueType } from "../firebase/models/types";
import { useAuth } from "../auth/AuthProvider";
import { onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";

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

  // Set up real-time listener for issue changes
  useEffect(() => {
    if (!projectId) {
      return;
    }

    const issuesQuery = query(issuesCollection, where("projectId", "==", projectId));

    console.log("Setting up real-time listener for issues in project:", projectId);

    // Subscribe to changes in issues collection
    const unsubscribeIssues = onSnapshot(
      issuesQuery,
      snapshot => {
        // Process changes
        snapshot.docChanges().forEach(change => {
          const issueData = change.doc.data() as Issue;

          if (change.type === "modified") {
            console.log("Issue modified:", issueData.id);

            // Update the issue in our local state
            updateLocalIssueState(issueData);
          } else if (change.type === "added") {
            // If this is a new issue that wasn't in our initial fetch
            const isExisting = allIssues.some(issue => issue.id === issueData.id);
            if (!isExisting) {
              console.log("New issue added:", issueData.id);
              updateLocalIssueState(issueData);
            }
          } else if (change.type === "removed") {
            console.log("Issue removed:", issueData.id);
            // Remove the issue from all relevant state
            removeIssueFromState(issueData.id);
          }
        });
      },
      err => {
        console.error("Error in issues snapshot listener:", err);
        setError(err as Error);
      }
    );

    // Subscribe to changes in releases collection
    const releasesQuery = query(
      releasesCollection,
      where("projectId", "==", projectId),
      orderBy("displayOrder", "asc")
    );

    const unsubscribeReleases = onSnapshot(
      releasesQuery,
      snapshot => {
        // If there are changes, update the releases state
        if (!snapshot.empty) {
          const updatedReleases: Release[] = [];
          snapshot.forEach(doc => {
            updatedReleases.push(doc.data() as Release);
          });

          // Update releases state
          setReleases(updatedReleases);
        }
      },
      err => {
        console.error("Error in releases snapshot listener:", err);
      }
    );

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      console.log("Cleaning up issue and release listeners");
      unsubscribeIssues();
      unsubscribeReleases();
    };
  }, [projectId, allIssues]);

  /**
   * Helper function to remove an issue from all state variables
   */
  const removeIssueFromState = (issueId: string) => {
    // Remove from allIssues
    setAllIssues(prev => prev.filter(issue => issue.id !== issueId));

    // Remove from activities if it exists there
    setActivities(prev => prev.filter(activity => activity.id !== issueId));

    // Remove from epics
    setEpics(prev => {
      const newEpics = { ...prev };

      Object.keys(newEpics).forEach(activityId => {
        newEpics[activityId] = newEpics[activityId].filter(epic => epic.id !== issueId);
      });

      return newEpics;
    });

    // Remove from issues
    setIssues(prev => {
      const newIssues = { ...prev };

      Object.keys(newIssues).forEach(epicId => {
        newIssues[epicId] = newIssues[epicId].filter(issue => issue.id !== issueId);
      });

      return newIssues;
    });

    // Remove from issuesByRelease
    setIssuesByRelease(prev => {
      const newIssuesByRelease = { ...prev };

      Object.keys(newIssuesByRelease).forEach(releaseId => {
        newIssuesByRelease[releaseId] = newIssuesByRelease[releaseId].filter(
          issue => issue.id !== issueId
        );
      });

      return newIssuesByRelease;
    });
  };

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
        return; // Epic should have a parent
      }

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
    } else if (newIssue.type === IssueType.STORY) {
      if (!newIssue.parentId) {
        return; // Story should have a parent
      }

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

      // Handle release-related updates
      updateIssueInReleases(newIssue);
    }
  };

  /**
   * Helper function to update issue in releases
   * - Removes from old release if necessary
   * - Adds to new release if necessary
   */
  const updateIssueInReleases = (issue: Issue) => {
    // First get the current state of the issue
    const currentState = allIssues.find(i => i.id === issue.id);

    // If we found the issue in our current state and the releaseId has changed
    if (currentState && currentState.releaseId !== issue.releaseId) {
      setIssuesByRelease(prev => {
        const newIssuesByRelease = { ...prev };

        // Remove from old release if it was in one
        if (currentState.releaseId) {
          const oldReleaseId = currentState.releaseId;
          if (newIssuesByRelease[oldReleaseId]) {
            newIssuesByRelease[oldReleaseId] = newIssuesByRelease[oldReleaseId].filter(
              i => i.id !== issue.id
            );
          }
        }

        // Add to new release if it has one
        if (issue.releaseId) {
          const newReleaseId = issue.releaseId;
          if (!newIssuesByRelease[newReleaseId]) {
            newIssuesByRelease[newReleaseId] = [];
          }

          // Check if it's already in the new release
          const existingIndex = newIssuesByRelease[newReleaseId].findIndex(i => i.id === issue.id);

          if (existingIndex >= 0) {
            newIssuesByRelease[newReleaseId][existingIndex] = issue;
          } else {
            newIssuesByRelease[newReleaseId].push(issue);
          }
        }

        return newIssuesByRelease;
      });
    }
    // If this is a new issue being added to a release
    else if (issue.releaseId && (!currentState || !currentState.releaseId)) {
      setIssuesByRelease(prev => {
        const newIssuesByRelease = { ...prev };
        const releaseId = issue.releaseId as string;

        if (!newIssuesByRelease[releaseId]) {
          newIssuesByRelease[releaseId] = [];
        }

        const existingIndex = newIssuesByRelease[releaseId].findIndex(i => i.id === issue.id);

        if (existingIndex >= 0) {
          newIssuesByRelease[releaseId][existingIndex] = issue;
        } else {
          newIssuesByRelease[releaseId].push(issue);
        }

        return newIssuesByRelease;
      });
    }
    // If the issue is in the same release but has other updates
    else if (issue.releaseId && currentState?.releaseId === issue.releaseId) {
      setIssuesByRelease(prev => {
        const newIssuesByRelease = { ...prev };
        const releaseId = issue.releaseId as string;

        if (newIssuesByRelease[releaseId]) {
          const existingIndex = newIssuesByRelease[releaseId].findIndex(i => i.id === issue.id);

          if (existingIndex >= 0) {
            newIssuesByRelease[releaseId][existingIndex] = issue;
          }
        }

        return newIssuesByRelease;
      });
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
        createdAt: Timestamp.now(),
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
        createdAt: Timestamp.now(),
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
        createdAt: Timestamp.now(),
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
      storyPoints?: number;
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
        storyPoints: options?.storyPoints,
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
        storyPoints: options?.storyPoints,
        displayOrder:
          storiesForEpic.length > 0 ? Math.max(...storiesForEpic.map(s => s.displayOrder)) + 1 : 0,
        createdAt: Timestamp.now(),
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

      // The real-time listener will handle updating the UI
      // We no longer need to manually update the releases state here

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
        releaseId: releaseId || null,
      };

      // Update in Firebase
      await updateIssue(issueId, { releaseId: releaseId || null });

      // Local state will be updated via the real-time listener
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
