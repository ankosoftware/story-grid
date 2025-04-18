import { Issue, Release } from "@/lib/firebase/models/types";

interface ActivityEpicMap {
  [activityId: string]: Issue[];
}

interface EpicIssueMap {
  [epicId: string]: Issue[];
}

/**
 * Generates a structured markup document from storyboard data
 * @param activities List of activities
 * @param epics Map of epics by activity ID
 * @param issues Map of issues by epic ID
 * @param releases List of releases
 * @param projectName Optional project name (defaults to "Project")
 * @returns Markup content as string
 */
export const generateStoryboardMarkup = (
  activities: Issue[],
  epics: ActivityEpicMap,
  issues: EpicIssueMap,
  releases: Release[],
  projectName: string = "Project"
): string => {
  let markupContent = `# ${projectName}\n\n`;

  // Calculate total story points for a release
  const calculateReleaseStoryPoints = (releaseId: string): number => {
    let total = 0;
    Object.keys(issues).forEach(epicId => {
      issues[epicId].forEach(story => {
        if (story.releaseId === releaseId && story.storyPoints) {
          total += story.storyPoints;
        }
      });
    });
    return total;
  };

  // Calculate story points for an epic in a specific release (or all releases if releaseId is null)
  const calculateEpicStoryPoints = (epicId: string, releaseId: string | null = null): number => {
    if (!issues[epicId]) {
      return 0;
    }

    return issues[epicId].reduce((total, story) => {
      if (releaseId === null || story.releaseId === releaseId) {
        return total + (story.storyPoints || 0);
      }
      return total;
    }, 0);
  };

  // Calculate total story points for an activity
  const calculateActivityStoryPoints = (activityId: string): number => {
    let total = 0;
    const activityEpics = epics[activityId] || [];

    activityEpics.forEach(epic => {
      total += calculateEpicStoryPoints(epic.id);
    });

    return total;
  };

  // Section 1: Releases summary
  markupContent += "# Releases Summary\n\n";

  releases.forEach(release => {
    const totalPoints = calculateReleaseStoryPoints(release.id);

    markupContent += `## ${release.name}\n`;
    markupContent += `${release.description || "No description provided"}\n`;
    markupContent += `Estimated Points: ${totalPoints}\n\n`;
  });

  // Add unassigned section
  const unassignedPoints = calculateReleaseStoryPoints("unassigned");
  markupContent += `## Unassigned\n`;
  markupContent += `Stories not assigned to any release\n`;
  markupContent += `Estimated Points: ${unassignedPoints}\n\n`;

  // Section 2: Activities, Epics, and Stories
  markupContent += "# Activities\n\n";

  activities.forEach(activity => {
    const activityPoints = calculateActivityStoryPoints(activity.id);
    const activityEpics = epics[activity.id] || [];

    markupContent += `## ${activity.name}\n`;
    markupContent += `${activity.description || "No description provided"}\n`;
    markupContent += `Total Estimated Points: ${activityPoints}\n\n`;

    // For each epic in the activity
    activityEpics.forEach(epic => {
      const epicPoints = calculateEpicStoryPoints(epic.id);
      const epicStories = issues[epic.id] || [];

      markupContent += `### Epic: ${epic.name}\n`;
      markupContent += `${epic.description || "No description provided"}\n`;
      markupContent += `Total Estimated Points: ${epicPoints}\n\n`;

      // For each story in the epic
      epicStories.forEach(story => {
        const releaseName = story.releaseId
          ? releases.find(r => r.id === story.releaseId)?.name || "Unknown Release"
          : "Unassigned";

        markupContent += `#### Story: ${story.name}\n`;
        markupContent += `${story.description || "No description provided"}\n`;
        markupContent += `Story Points: ${story.storyPoints || 0}\n`;
        markupContent += `Release: ${releaseName}\n\n`;
      });
    });
  });

  return markupContent;
};

/**
 * Downloads markup data as a Markdown file
 * @param markupContent Markup content as string
 * @param filename The name of the file to download
 */
export const downloadMarkup = (markupContent: string, filename: string = "export.md"): void => {
  const blob = new Blob([markupContent], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports storyboard data to Markdown and triggers download
 * @param activities List of activities
 * @param epics Map of epics by activity ID
 * @param issues Map of issues by epic ID
 * @param releases List of releases
 * @param projectName Optional project name
 * @returns Filename of the exported Markdown
 */
export const exportStoryboardToMarkup = (
  activities: Issue[],
  epics: ActivityEpicMap,
  issues: EpicIssueMap,
  releases: Release[],
  projectName?: string
): string => {
  const markupContent = generateStoryboardMarkup(activities, epics, issues, releases, projectName);
  const filename = `storyboard-export-${new Date().toISOString().slice(0, 10)}.md`;
  downloadMarkup(markupContent, filename);
  return filename;
};
