import { Issue, Release } from "@/lib/firebase/models/types";

interface ActivityEpicMap {
  [activityId: string]: Issue[];
}

interface EpicIssueMap {
  [epicId: string]: Issue[];
}

/**
 * Escapes CSV values by replacing double quotes with two double quotes
 * @param value The string value to escape
 * @returns Escaped string for CSV
 */
const escapeCSV = (value: string): string => {
  // Replace double quotes with two double quotes
  return value.replace(/"/g, '""');
};

/**
 * Generates CSV content from storyboard data
 * @param activities List of activities
 * @param epics Map of epics by activity ID
 * @param issues Map of issues by epic ID
 * @param releases List of releases
 * @returns CSV content as string
 */
export const generateStoryboardCSV = (
  activities: Issue[],
  epics: ActivityEpicMap,
  issues: EpicIssueMap,
  releases: Release[]
): string => {
  // Create CSV header
  let csvContent =
    "Activity Name,Activity Description,Epic Name,Epic Description,Story Name,Story Description,Story Points,Release Name\n";

  // Iterate through activities
  activities.forEach(activity => {
    const activityEpics = epics[activity.id] || [];

    // If no epics, add a row for just the activity
    if (activityEpics.length === 0) {
      csvContent += `"${escapeCSV(activity.name)}","${escapeCSV(activity.description || "")}","","","","","",""\n`;
    } else {
      // Iterate through epics for this activity
      activityEpics.forEach(epic => {
        const epicStories = issues[epic.id] || [];

        // If no stories, add a row for just the activity and epic
        if (epicStories.length === 0) {
          csvContent += `"${escapeCSV(activity.name)}","${escapeCSV(activity.description || "")}","${escapeCSV(epic.name)}","${escapeCSV(epic.description || "")}","","","",""\n`;
        } else {
          // Iterate through stories for this epic
          epicStories.forEach(story => {
            // Find release name if it exists
            const release = story.releaseId ? releases.find(r => r.id === story.releaseId) : null;
            const releaseName = release ? release.name : "Unassigned";

            // Add row for activity, epic, and story
            csvContent += `"${escapeCSV(activity.name)}","${escapeCSV(activity.description || "")}","${escapeCSV(epic.name)}","${escapeCSV(epic.description || "")}","${escapeCSV(story.name)}","${escapeCSV(story.description || "")}","${story.storyPoints || ""}","${escapeCSV(releaseName)}"\n`;
          });
        }
      });
    }
  });

  return csvContent;
};

/**
 * Downloads CSV data as a file
 * @param csvContent CSV content as string
 * @param filename The name of the file to download
 */
export const downloadCSV = (csvContent: string, filename: string = "export.csv"): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports storyboard data to CSV and triggers download
 * @param activities List of activities
 * @param epics Map of epics by activity ID
 * @param issues Map of issues by epic ID
 * @param releases List of releases
 * @returns Filename of the exported CSV
 */
export const exportStoryboardToCSV = (
  activities: Issue[],
  epics: ActivityEpicMap,
  issues: EpicIssueMap,
  releases: Release[],
  projectName: string
): string => {
  const csvContent = generateStoryboardCSV(activities, epics, issues, releases);
  const filename = `storyboard-export-${projectName}-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(csvContent, filename);
  return filename;
};
