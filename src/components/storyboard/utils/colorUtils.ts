import { Theme } from "@mui/material/styles";
import { IssueStatus, IssuePriority } from "@/lib/firebase/models/types";

/**
 * Returns a color for a given issue status using theme palette
 */
export const getThemedStatusColor = (status: IssueStatus, theme: Theme): string => {
  switch (status) {
    case IssueStatus.TO_DO:
      return theme.palette.status.todo;
    case IssueStatus.IN_PROGRESS:
      return theme.palette.status.inProgress;
    case IssueStatus.DONE:
      return theme.palette.status.done;
    default:
      return theme.palette.status.todo;
  }
};

/**
 * Returns a color for a given issue priority using theme palette
 */
export const getThemedPriorityColor = (
  priority: IssuePriority | undefined,
  theme: Theme
): string => {
  if (!priority) {
    return theme.palette.priority.medium;
  }

  switch (priority) {
    case IssuePriority.HIGH:
      return theme.palette.priority.high;
    case IssuePriority.MEDIUM:
      return theme.palette.priority.medium;
    case IssuePriority.LOW:
      return theme.palette.priority.low;
    default:
      return theme.palette.priority.medium;
  }
};

/**
 * Legacy function - returns a color for a given issue status
 * @deprecated Use getThemedStatusColor instead for dark mode support
 */
export const getStatusColor = (status: IssueStatus): string => {
  switch (status) {
    case IssueStatus.TO_DO:
      return "#e2e8f0"; // Updated to match new palette
    case IssueStatus.IN_PROGRESS:
      return "#bfdbfe";
    case IssueStatus.DONE:
      return "#bbf7d0";
    default:
      return "#e2e8f0";
  }
};

/**
 * Legacy function - returns a color for a given issue priority
 * @deprecated Use getThemedPriorityColor instead for dark mode support
 */
export const getPriorityColor = (priority?: IssuePriority): string => {
  if (!priority) {
    return "#f59e0b"; // Default to medium
  }

  switch (priority) {
    case IssuePriority.HIGH:
      return "#ef4444";
    case IssuePriority.MEDIUM:
      return "#f59e0b";
    case IssuePriority.LOW:
      return "#22c55e";
    default:
      return "#f59e0b";
  }
};
