import { useState, useEffect } from "react";
import {
  getIssuesByProject,
  getEpicsByProject,
  getReleases,
  createIssue,
  createRelease,
} from "../firebase/firestore";
import { Issue, Release, IssueStatus, IssuePriority, IssueType } from "../firebase/models/types";
import { useAuth } from "../auth/AuthProvider";

/**
 * Custom hook to manage the story board for a specific project
 * @param projectId - The ID of the project to load the story board for
 */
export const useStoryBoard = (projectId: string) => {
  const { user } = useAuth();
  const [epics, setEpics] = useState<Issue[]>([]);
  const [issuesByParent, setIssuesByParent] = useState<Record<string, Issue[]>>({});
  const [releases, setReleases] = useState<Release[]>([]);
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
          getIssuesByProject(projectId),
          getReleases(projectId),
        ]);

        setEpics(issuesData.epics);
        setIssuesByParent(issuesData.issuesByParent);
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
   * Create a new epic
   *
   * @param name - Epic name
   * @param description - Optional epic description
   * @returns Promise that resolves to the ID of the created epic
   */
  const addEpic = async (name: string, description?: string): Promise<string> => {
    if (!user) {
      throw new Error("User must be logged in to create an epic");
    }

    try {
      const epicId = await createIssue(projectId, name, IssueType.EPIC, user.uid, {
        description,
        status: IssueStatus.TO_DO,
        priority: IssuePriority.MEDIUM,
      });

      // Refresh issues data
      const issuesData = await getIssuesByProject(projectId);
      setEpics(issuesData.epics);
      setIssuesByParent(issuesData.issuesByParent);

      return epicId;
    } catch (err) {
      console.error("Error creating epic:", err);
      throw err;
    }
  };

  /**
   * Create a new story under an epic
   *
   * @param parentId - The ID of the epic to add the story to
   * @param name - Story name
   * @param options - Optional story properties
   * @returns Promise that resolves to the ID of the created story
   */
  const addStory = async (
    parentId: string,
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
        parentId,
        description: options?.description,
        acceptanceCriteria: options?.acceptanceCriteria,
        status: options?.status || IssueStatus.TO_DO,
        priority: options?.priority || IssuePriority.MEDIUM,
        assignee: options?.assignee,
        releaseId: options?.releaseId,
      });

      // Refresh issues data
      const issuesData = await getIssuesByProject(projectId);
      setEpics(issuesData.epics);
      setIssuesByParent(issuesData.issuesByParent);

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

      // Refresh releases
      const updatedReleases = await getReleases(projectId);
      setReleases(updatedReleases);

      return releaseId;
    } catch (err) {
      console.error("Error creating release:", err);
      throw err;
    }
  };

  return {
    epics,
    issuesByParent,
    releases,
    loading,
    error,
    addEpic,
    addStory,
    addRelease,
  };
};
