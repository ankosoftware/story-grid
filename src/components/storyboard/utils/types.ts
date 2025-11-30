import { Issue, Release, IssueStatus, IssuePriority, IssueType } from "@/lib/firebase/models/types";

// Define drag item types
export const ItemTypes = {
  STORY: "story",
  EPIC: "epic",
  ACTIVITY: "activity",
};

// Define draggable item interface
export interface DragItem {
  type: string;
  id: string;
  parentId: string | null;
  originalIndex: number;
  originalReleaseId?: string | null;
}

// Define props for the main story map component
export interface StoryMapProps {
  projectId: string;
  projectName: string;
  activities: Issue[]; // Backbone items – User Activities/Goals
  epics: Record<string, Issue[]>; // Epics by activity (backbone) ID (User Tasks)
  issues: Record<string, Issue[]>; // Stories by epic ID
  releases: Release[];
  loading: boolean;
  error: Error | null;
  onAddActivity: (name: string, description?: string) => Promise<string>;
  onAddEpic: (backboneId: string, name: string, description?: string) => Promise<string>;
  onAddStory: (
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
  ) => Promise<string>;
  onAddRelease: (
    name: string,
    options?: {
      description?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) => Promise<string>;
  onMoveIssue?: (issueId: string, releaseId: string | null) => Promise<void>;
  onUpdateIssueOptimistic?: (
    issueId: string,
    updates: Partial<Omit<Issue, "id" | "projectId" | "type" | "createdAt" | "createdBy">>
  ) => Promise<void>;
}

// Create a mock release for the unassigned section
export const createUnassignedReleaseObject = (projectId: string): Partial<Release> => ({
  id: "unassigned",
  name: "Unassigned",
  description: "Unassigned stories",
  startDate: null,
  endDate: null,
  displayOrder: 99999,
  projectId: projectId,
});
