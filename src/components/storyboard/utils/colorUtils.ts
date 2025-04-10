import { IssueStatus, IssuePriority } from "@/lib/firebase/models/types";

/**
 * Returns a color for a given issue status
 */
export const getStatusColor = (status: IssueStatus): string => {
  switch (status) {
    case IssueStatus.TO_DO:
      return "#e0e0e0";
    case IssueStatus.IN_PROGRESS:
      return "#bbdefb";
    case IssueStatus.DONE:
      return "#c8e6c9";
    default:
      return "#e0e0e0";
  }
};

/**
 * Returns a color for a given issue priority
 */
export const getPriorityColor = (priority?: IssuePriority): string => {
  if (!priority) {
    return "#ff9800"; // Default to medium
  }

  switch (priority) {
    case IssuePriority.HIGH:
      return "#f44336";
    case IssuePriority.MEDIUM:
      return "#ff9800";
    case IssuePriority.LOW:
      return "#4caf50";
    default:
      return "#ff9800";
  }
};
