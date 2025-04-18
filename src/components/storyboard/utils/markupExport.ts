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
  // Calculate total project story points
  const calculateTotalProjectPoints = (): number => {
    let total = 0;
    Object.keys(issues).forEach(epicId => {
      issues[epicId].forEach(story => {
        if (story.storyPoints) {
          total += story.storyPoints;
        }
      });
    });
    return total;
  };

  // Get current date and time for export metadata
  const exportDate = new Date().toLocaleString();
  const totalProjectPoints = calculateTotalProjectPoints();

  // Start building the markup content
  let markupContent = `# ${projectName} Storyboard\n\n`;

  // Add export metadata
  markupContent += `*Generated on: ${exportDate}*\n\n`;
  markupContent += `**Total Project Story Points: ${totalProjectPoints}**\n\n`;

  // Add table of contents
  markupContent += `## Table of Contents\n\n`;
  markupContent += `1. [Releases Summary](#releases-summary)\n`;
  markupContent += `2. [Activities by Release](#activities-by-release)\n`;

  // Add releases to table of contents
  releases.forEach(release => {
    markupContent += `   - [${release.name}](#${release.name.toLowerCase().replace(/\s+/g, "-")})\n`;
  });
  markupContent += `   - [Unassigned](#unassigned)\n`;

  markupContent += `\n---\n\n`;

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
  markupContent += `<a id="releases-summary"></a>\n`;
  markupContent += `# Releases Summary\n\n`;

  releases.forEach(release => {
    const totalPoints = calculateReleaseStoryPoints(release.id);
    const anchor = release.name.toLowerCase().replace(/\s+/g, "-");

    markupContent += `<a id="${anchor}"></a>\n`;
    markupContent += `## ${release.name}\n\n`;
    markupContent += `${release.description || "*No description provided*"}\n\n`;

    // Add release dates if available
    if (release.startDate || release.endDate) {
      markupContent += `**Timeline:** `;
      if (release.startDate) {
        markupContent += `Start: ${new Date(release.startDate).toLocaleDateString()}`;
      }
      if (release.startDate && release.endDate) {
        markupContent += ` | `;
      }
      if (release.endDate) {
        markupContent += `End: ${new Date(release.endDate).toLocaleDateString()}`;
      }
      markupContent += `\n\n`;
    }

    markupContent += `**Estimated Points:** ${totalPoints}\n\n`;

    // Add a horizontal rule between releases
    markupContent += `---\n\n`;
  });

  // Add unassigned section
  const unassignedPoints = calculateReleaseStoryPoints("unassigned");
  markupContent += `<a id="unassigned"></a>\n`;
  markupContent += `## Unassigned\n\n`;
  markupContent += `*Stories not assigned to any release*\n\n`;
  markupContent += `**Estimated Points:** ${unassignedPoints}\n\n`;
  markupContent += `---\n\n`;

  // Section 2: Activities grouped by Release
  markupContent += `<a id="activities-by-release"></a>\n`;
  markupContent += `# Activities by Release\n\n`;

  // Helper function to check if an activity has stories in a specific release
  const activityHasStoriesInRelease = (activity: Issue, releaseId: string | null): boolean => {
    const activityEpics = epics[activity.id] || [];

    return activityEpics.some(epic => {
      const epicStories = issues[epic.id] || [];
      return epicStories.some(story =>
        releaseId === null ? !story.releaseId : story.releaseId === releaseId
      );
    });
  };

  // Process each release
  releases.forEach(release => {
    const anchor = release.name.toLowerCase().replace(/\s+/g, "-");
    markupContent += `<a id="${anchor}-activities"></a>\n`;
    markupContent += `## ${release.name} Activities\n\n`;

    let hasActivitiesInRelease = false;

    // For each activity, check if it has stories in this release
    activities.forEach(activity => {
      if (!activityHasStoriesInRelease(activity, release.id)) {
        return;
      }

      hasActivitiesInRelease = true;
      const activityEpics = epics[activity.id] || [];
      const activityPointsInRelease = activityEpics.reduce((total, epic) => {
        return total + calculateEpicStoryPoints(epic.id, release.id);
      }, 0);

      const anchor = `${release.name.toLowerCase().replace(/\s+/g, "-")}-${activity.name.toLowerCase().replace(/\s+/g, "-")}`;

      markupContent += `<a id="${anchor}"></a>\n`;
      markupContent += `### ${activity.name}\n\n`;
      markupContent += `${activity.description || "*No description provided*"}\n\n`;
      markupContent += `**Estimated Points in ${release.name}:** ${activityPointsInRelease}\n\n`;

      // For each epic in the activity
      activityEpics.forEach(epic => {
        const epicStories = (issues[epic.id] || []).filter(story => story.releaseId === release.id);

        // Skip epics with no stories in this release
        if (epicStories.length === 0) {
          return;
        }

        const epicPointsInRelease = calculateEpicStoryPoints(epic.id, release.id);

        markupContent += `#### Epic: ${epic.name}\n\n`;
        markupContent += `${epic.description || "*No description provided*"}\n\n`;
        markupContent += `**Estimated Points in ${release.name}:** ${epicPointsInRelease}\n\n`;

        // Create a table for stories
        markupContent += `| Story | Description | Points | Status |\n`;
        markupContent += `| ----- | ----------- | ------ | ------ |\n`;

        // For each story in the epic that belongs to this release
        epicStories.forEach(story => {
          const storyStatus = story.status || "To Do";
          const storyPoints = story.storyPoints || 0;

          // Escape pipe characters in markdown table
          const escapedName = story.name.replace(/\|/g, "\\|");
          const escapedDescription = (story.description || "No description").replace(/\|/g, "\\|");

          markupContent += `| ${escapedName} | ${escapedDescription} | ${storyPoints} | ${storyStatus} |\n`;
        });

        markupContent += `\n`;
      });

      // Add a horizontal rule between activities
      markupContent += `---\n\n`;
    });

    if (!hasActivitiesInRelease) {
      markupContent += `*No activities assigned to this release*\n\n`;
      markupContent += `---\n\n`;
    }
  });

  // Add unassigned activities section
  markupContent += `<a id="unassigned-activities"></a>\n`;
  markupContent += `## Unassigned Activities\n\n`;

  let hasUnassignedActivities = false;

  // For each activity, check if it has unassigned stories
  activities.forEach(activity => {
    if (!activityHasStoriesInRelease(activity, null)) {
      return;
    }

    hasUnassignedActivities = true;
    const activityEpics = epics[activity.id] || [];
    const unassignedActivityPoints = activityEpics.reduce((total, epic) => {
      return total + calculateEpicStoryPoints(epic.id, null);
    }, 0);

    const anchor = `unassigned-${activity.name.toLowerCase().replace(/\s+/g, "-")}`;

    markupContent += `<a id="${anchor}"></a>\n`;
    markupContent += `### ${activity.name}\n\n`;
    markupContent += `${activity.description || "*No description provided*"}\n\n`;
    markupContent += `**Estimated Points (Unassigned):** ${unassignedActivityPoints}\n\n`;

    // For each epic in the activity
    activityEpics.forEach(epic => {
      const unassignedEpicStories = (issues[epic.id] || []).filter(story => !story.releaseId);

      // Skip epics with no unassigned stories
      if (unassignedEpicStories.length === 0) {
        return;
      }

      const unassignedEpicPoints = calculateEpicStoryPoints(epic.id, null);

      markupContent += `#### Epic: ${epic.name}\n\n`;
      markupContent += `${epic.description || "*No description provided*"}\n\n`;
      markupContent += `**Estimated Points (Unassigned):** ${unassignedEpicPoints}\n\n`;

      // Create a table for stories
      markupContent += `| Story | Description | Points | Status |\n`;
      markupContent += `| ----- | ----------- | ------ | ------ |\n`;

      // For each unassigned story in the epic
      unassignedEpicStories.forEach(story => {
        const storyStatus = story.status || "To Do";
        const storyPoints = story.storyPoints || 0;

        // Escape pipe characters in markdown table
        const escapedName = story.name.replace(/\|/g, "\\|");
        const escapedDescription = (story.description || "No description").replace(/\|/g, "\\|");

        markupContent += `| ${escapedName} | ${escapedDescription} | ${storyPoints} | ${storyStatus} |\n`;
      });

      markupContent += `\n`;
    });

    // Add a horizontal rule between activities
    markupContent += `---\n\n`;
  });

  if (!hasUnassignedActivities) {
    markupContent += `*No unassigned activities*\n\n`;
    markupContent += `---\n\n`;
  }

  // Add export footer
  markupContent += `\n\n*This document was exported from ${projectName} Storyboard on ${exportDate}*\n`;

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
