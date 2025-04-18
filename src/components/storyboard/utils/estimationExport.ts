import { Issue, Release } from "@/lib/firebase/models/types";

// Interface for estimation results
interface EstimationDetails {
  storyPoints: number;
  hours: number;
  cost: number;
  startDate: Date | null;
  endDate: Date | null;
  daysToComplete: number;
}

// Interface for story estimation
interface StoryEstimation {
  id: string;
  name: string;
  storyPoints: number;
  hours: number;
  issue: Issue;
}

// Interface for epic estimation
interface EpicEstimation {
  id: string;
  name: string;
  storyPoints: number;
  hours: number;
  stories: StoryEstimation[];
  issue: Issue;
}

// Interface for release estimation
interface ReleaseEstimation {
  id: string;
  name: string;
  storyPoints: number;
  hours: number;
  cost: number;
  startDate: Date | null;
  endDate: Date | null;
  daysToComplete: number;
  epics: EpicEstimation[];
}

interface EstimationExportData {
  totalEstimation: EstimationDetails;
  releaseEstimations: ReleaseEstimation[];
  storyPointToHours: number;
  overheadPercentage: number;
  dailyBurnRate: number;
  blendedHourlyRate: number;
  projectName?: string;
}

/**
 * Generates a structured markup document from estimation data
 * @param data Estimation export data object
 * @param selectedReleaseIds Array of selected release IDs to include in the export
 * @returns Markup content as string
 */
export const generateEstimationMarkup = (
  data: EstimationExportData,
  selectedReleaseIds: string[]
): string => {
  const {
    totalEstimation,
    releaseEstimations,
    storyPointToHours,
    overheadPercentage,
    dailyBurnRate,
    blendedHourlyRate,
    projectName = "Project",
  } = data;

  // Filter to only include selected releases
  const filteredReleases = releaseEstimations.filter(release =>
    selectedReleaseIds.includes(release.id)
  );

  // Calculate totals for the selected releases
  const selectedTotalStoryPoints = filteredReleases.reduce(
    (sum, release) => sum + release.storyPoints,
    0
  );
  const selectedTotalHours = filteredReleases.reduce((sum, release) => sum + release.hours, 0);
  const selectedTotalCost = filteredReleases.reduce((sum, release) => sum + release.cost, 0);
  const selectedTotalDaysToComplete = filteredReleases.reduce(
    (sum, release) => sum + release.daysToComplete,
    0
  );

  // Calculate selected releases start and end dates
  const selectedStartDate = filteredReleases.length > 0 ? filteredReleases[0].startDate : null;
  const selectedEndDate =
    filteredReleases.length > 0 ? filteredReleases[filteredReleases.length - 1].endDate : null;

  // Format date function
  const formatDate = (date: Date | null): string => {
    if (!date) {
      return "N/A";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get current date and time for export metadata
  const exportDate = new Date().toLocaleString();

  // Start building the markup content
  let markupContent = `# ${projectName} Estimation Report\n\n`;

  // Add export metadata
  markupContent += `*Generated on: ${exportDate}*\n\n`;

  // Add table of contents
  markupContent += `## Table of Contents\n\n`;
  markupContent += `1. [Estimation Summary](#estimation-summary)\n`;
  markupContent += `2. [Release Details](#release-details)\n`;
  markupContent += `3. [Estimation Configuration](#estimation-configuration)\n\n`;

  // Add releases to table of contents
  filteredReleases.forEach(release => {
    markupContent += `   - [${release.name}](#${release.name.toLowerCase().replace(/\s+/g, "-")})\n`;
  });

  markupContent += `\n---\n\n`;

  // Section 1: Estimation Summary
  markupContent += `<a id="estimation-summary"></a>\n`;
  markupContent += `# Estimation Summary\n\n`;

  // Add project totals summary
  markupContent += `## Project Totals\n\n`;
  markupContent += `| Metric | Value |\n`;
  markupContent += `| ------ | ----- |\n`;
  markupContent += `| Timeline | ${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)} |\n`;
  markupContent += `| Working Days to Complete | ${selectedTotalDaysToComplete} days |\n`;
  markupContent += `| Total Story Points | ${selectedTotalStoryPoints.toLocaleString()} |\n`;
  markupContent += `| Total Hours (Including ${overheadPercentage}% Overhead) | ${selectedTotalHours.toLocaleString()} hours |\n`;
  markupContent += `| Blended Hourly Rate | $${blendedHourlyRate.toLocaleString()}/hour |\n`;
  markupContent += `| Total Estimated Cost | $${selectedTotalCost.toLocaleString()} |\n\n`;

  // Section 2: Release Details
  markupContent += `<a id="release-details"></a>\n`;
  markupContent += `# Release Details\n\n`;

  // Process each release
  filteredReleases.forEach(release => {
    const anchor = release.name.toLowerCase().replace(/\s+/g, "-");

    markupContent += `<a id="${anchor}"></a>\n`;
    markupContent += `## ${release.name}\n\n`;

    markupContent += `| Metric | Value |\n`;
    markupContent += `| ------ | ----- |\n`;
    markupContent += `| Timeline | ${formatDate(release.startDate)} - ${formatDate(release.endDate)} |\n`;
    markupContent += `| Working Days to Complete | ${release.daysToComplete} days |\n`;
    markupContent += `| Story Points | ${release.storyPoints.toLocaleString()} |\n`;
    markupContent += `| Hours | ${release.hours.toLocaleString()} hours |\n`;
    markupContent += `| Cost | $${release.cost.toLocaleString()} |\n\n`;

    // Process epics in the release
    if (release.epics.length === 0) {
      markupContent += `*No epics in this release*\n\n`;
    } else {
      markupContent += `### Epics in ${release.name}\n\n`;
      markupContent += `| Epic | Story Points | Hours |\n`;
      markupContent += `| ---- | ------------ | ----- |\n`;

      release.epics.forEach(epic => {
        markupContent += `| ${epic.name} | ${epic.storyPoints.toLocaleString()} | ${epic.hours.toLocaleString()} |\n`;
      });

      markupContent += `\n`;

      // Process stories in each epic
      release.epics.forEach(epic => {
        markupContent += `#### ${epic.name} Stories\n\n`;

        if (epic.stories.length === 0) {
          markupContent += `*No stories in this epic*\n\n`;
        } else {
          markupContent += `| Story | Story Points | Hours |\n`;
          markupContent += `| ----- | ------------ | ----- |\n`;

          epic.stories.forEach(story => {
            // Escape pipe characters in markdown table
            const escapedName = story.name.replace(/\|/g, "\\|");
            markupContent += `| ${escapedName} | ${story.storyPoints.toLocaleString()} | ${story.hours.toLocaleString()} |\n`;
          });

          markupContent += `\n`;
        }
      });
    }

    // Add a horizontal rule between releases
    markupContent += `---\n\n`;
  });

  // Section 3: Estimation Configuration
  markupContent += `<a id="estimation-configuration"></a>\n`;
  markupContent += `# Estimation Configuration\n\n`;

  markupContent += `## Effort Calculation\n\n`;
  markupContent += `| Parameter | Value |\n`;
  markupContent += `| --------- | ----- |\n`;
  markupContent += `| Story Point to Hours Conversion | ${storyPointToHours} hours per story point |\n`;
  markupContent += `| Overhead Percentage (QA/PM) | ${overheadPercentage}% |\n\n`;

  markupContent += `## Timeline & Cost Calculation\n\n`;
  markupContent += `| Parameter | Value |\n`;
  markupContent += `| --------- | ----- |\n`;
  markupContent += `| Daily Burn Rate | ${dailyBurnRate} hours/day |\n`;
  markupContent += `| Blended Hourly Rate | $${blendedHourlyRate}/hour |\n\n`;

  // Add export footer
  markupContent += `\n\n*This document was exported from ${projectName} Estimation on ${exportDate}*\n`;

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
 * Exports estimation data to Markdown and triggers download
 * @param data Estimation export data
 * @param selectedReleaseIds Array of release IDs to include in the export
 * @param projectName Optional project name
 * @returns Filename of the exported Markdown
 */
export const exportEstimationToMarkup = (
  data: EstimationExportData,
  selectedReleaseIds: string[],
  projectName?: string
): string => {
  // Update project name if provided
  if (projectName) {
    data.projectName = projectName;
  }

  const markupContent = generateEstimationMarkup(data, selectedReleaseIds);
  const filename = `estimation-export-${new Date().toISOString().slice(0, 10)}.md`;
  downloadMarkup(markupContent, filename);
  return filename;
};
