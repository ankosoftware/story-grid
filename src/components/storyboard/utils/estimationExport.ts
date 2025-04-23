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

export interface EstimationExportData {
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

      // Process each epic with detailed description instead of table
      release.epics.forEach(epic => {
        markupContent += `#### ${epic.name}\n\n`;

        // Add epic description if available
        if (epic.issue && epic.issue.description) {
          markupContent += `**Description:** ${epic.issue.description}\n\n`;
        }

        // Add epic metrics
        markupContent += `**Metrics:**\n`;
        markupContent += `- Story Points: ${epic.storyPoints.toLocaleString()}\n`;
        markupContent += `- Hours: ${epic.hours.toLocaleString()}\n\n`;

        // Process stories in the epic
        if (epic.stories.length === 0) {
          markupContent += `*No stories in this epic*\n\n`;
        } else {
          markupContent += `**Stories:**\n\n`;
          markupContent += `| Story | Story Points | Hours | Description |\n`;
          markupContent += `| ----- | ------------ | ----- | ----------- |\n`;

          epic.stories.forEach(story => {
            // Escape pipe characters in markdown table
            const escapedName = story.name.replace(/\|/g, "\\|");
            const escapedDescription =
              story.issue && story.issue.description
                ? story.issue.description.replace(/\|/g, "\\|")
                : "";

            markupContent += `| ${escapedName} | ${story.storyPoints.toLocaleString()} | ${story.hours.toLocaleString()} | ${escapedDescription} |\n`;
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
 * Generates a structured HTML document from estimation data with Word-compatible styling
 * @param data Estimation export data object
 * @param selectedReleaseIds Array of selected release IDs to include in the export
 * @returns HTML content as string
 */
export const generateEstimationHtml = (
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

  // Word-compatible CSS styling
  const wordCss = `
    <style>
      body {
        font-family: 'Calibri', 'Arial', sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        margin: 1in;
        color: #333;
      }
      h1 {
        font-size: 16pt;
        color: #2F5496;
        font-weight: bold;
        margin-top: 24pt;
        margin-bottom: 6pt;
        page-break-after: avoid;
      }
      h2 {
        font-size: 14pt;
        color: #2F5496;
        font-weight: bold;
        margin-top: 18pt;
        margin-bottom: 6pt;
        page-break-after: avoid;
      }
      h3 {
        font-size: 12pt;
        color: #1F3864;
        font-weight: bold;
        margin-top: 16pt;
        margin-bottom: 4pt;
        page-break-after: avoid;
      }
      h4 {
        font-size: 11pt;
        color: #1F3864;
        font-weight: bold;
        margin-top: 14pt;
        margin-bottom: 4pt;
        page-break-after: avoid;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 10pt;
        page-break-inside: avoid;
      }
      th {
        border: 1px solid #a5a5a5;
        background-color: #E7E6E6;
        padding: 6pt;
        font-weight: bold;
        text-align: left;
      }
      td {
        border: 1px solid #a5a5a5;
        padding: 6pt;
        vertical-align: top;
      }
      p {
        margin-top: 0;
        margin-bottom: 10pt;
      }
      ul, ol {
        margin-top: 0;
        margin-bottom: 10pt;
      }
      li {
        margin-bottom: 3pt;
      }
      .metadata {
        color: #666;
        font-style: italic;
        margin-bottom: 16pt;
      }
      .toc a {
        text-decoration: none;
        color: #2F5496;
      }
      hr {
        border: none;
        border-top: 1px solid #a5a5a5;
        margin: 20pt 0;
      }
      .footer {
        margin-top: 24pt;
        color: #666;
        font-style: italic;
        border-top: 1pt solid #a5a5a5;
        padding-top: 12pt;
      }
      @page {
        size: 8.5in 11in;
        margin: 1in;
      }
      @media print {
        a {
          text-decoration: none;
          color: #000;
        }
      }
    </style>
  `;

  // Start building the HTML content
  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} Estimation Report</title>
  ${wordCss}
</head>
<body>
  <h1>${projectName} Estimation Report</h1>
  <p class="metadata">Generated on: ${exportDate}</p>
  
  <h2>Table of Contents</h2>
  <div class="toc">
    <p><a href="#estimation-summary">1. Estimation Summary</a></p>
    <p><a href="#release-details">2. Release Details</a></p>`;

  // Add releases to table of contents
  filteredReleases.forEach((release, index) => {
    const anchor = release.name.toLowerCase().replace(/\s+/g, "-");
    htmlContent += `
    <p style="margin-left: 20pt;"><a href="#${anchor}">2.${index + 1} ${release.name}</a></p>`;
  });

  htmlContent += `
    <p><a href="#estimation-configuration">3. Estimation Configuration</a></p>
  </div>
  
  <hr>
  
  <h1 id="estimation-summary">Estimation Summary</h1>
  <h2>Project Totals</h2>
  <table>
    <tr>
      <th width="40%">Metric</th>
      <th width="60%">Value</th>
    </tr>
    <tr>
      <td>Timeline</td>
      <td>${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}</td>
    </tr>
    <tr>
      <td>Working Days to Complete</td>
      <td>${selectedTotalDaysToComplete} days</td>
    </tr>
    <tr>
      <td>Total Story Points</td>
      <td>${selectedTotalStoryPoints.toLocaleString()}</td>
    </tr>
    <tr>
      <td>Total Hours (Including ${overheadPercentage}% Overhead)</td>
      <td>${selectedTotalHours.toLocaleString()} hours</td>
    </tr>
    <tr>
      <td>Blended Hourly Rate</td>
      <td>$${blendedHourlyRate.toLocaleString()}/hour</td>
    </tr>
    <tr>
      <td>Total Estimated Cost</td>
      <td>$${selectedTotalCost.toLocaleString()}</td>
    </tr>
  </table>
  
  <h1 id="release-details">Release Details</h1>`;

  // Process each release
  filteredReleases.forEach((release, releaseIndex) => {
    const anchor = release.name.toLowerCase().replace(/\s+/g, "-");

    htmlContent += `
  <h2 id="${anchor}">${release.name}</h2>
  <table>
    <tr>
      <th width="40%">Metric</th>
      <th width="60%">Value</th>
    </tr>
    <tr>
      <td>Timeline</td>
      <td>${formatDate(release.startDate)} - ${formatDate(release.endDate)}</td>
    </tr>
    <tr>
      <td>Working Days to Complete</td>
      <td>${release.daysToComplete} days</td>
    </tr>
    <tr>
      <td>Story Points</td>
      <td>${release.storyPoints.toLocaleString()}</td>
    </tr>
    <tr>
      <td>Hours</td>
      <td>${release.hours.toLocaleString()} hours</td>
    </tr>
    <tr>
      <td>Cost</td>
      <td>$${release.cost.toLocaleString()}</td>
    </tr>
  </table>`;

    // Process epics in the release
    if (release.epics.length === 0) {
      htmlContent += `
  <p><em>No epics in this release</em></p>`;
    } else {
      htmlContent += `
  <h3>Epics in ${release.name}</h3>`;

      // Process each epic with detailed description
      release.epics.forEach(epic => {
        htmlContent += `
  <h4>${epic.name}</h4>`;

        // Add epic description if available
        if (epic.issue && epic.issue.description) {
          htmlContent += `
  <p><strong>Description:</strong> ${epic.issue.description}</p>`;
        }

        // Add epic metrics
        htmlContent += `
  <p><strong>Metrics:</strong></p>
  <ul>
    <li>Story Points: ${epic.storyPoints.toLocaleString()}</li>
    <li>Hours: ${epic.hours.toLocaleString()}</li>
  </ul>`;

        // Process stories in the epic
        if (epic.stories.length === 0) {
          htmlContent += `
  <p><em>No stories in this epic</em></p>`;
        } else {
          htmlContent += `
  <p><strong>Stories:</strong></p>
  <table>
    <tr>
      <th>Story</th>
      <th>Story Points</th>
      <th>Hours</th>
      <th>Description</th>
    </tr>`;

          epic.stories.forEach(story => {
            const escapedName = story.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const escapedDescription =
              story.issue && story.issue.description
                ? story.issue.description.replace(/</g, "&lt;").replace(/>/g, "&gt;")
                : "";

            htmlContent += `
    <tr>
      <td>${escapedName}</td>
      <td>${story.storyPoints.toLocaleString()}</td>
      <td>${story.hours.toLocaleString()}</td>
      <td>${escapedDescription}</td>
    </tr>`;
          });

          htmlContent += `
  </table>`;
        }
      });
    }

    // Add a horizontal rule between releases
    if (releaseIndex < filteredReleases.length - 1) {
      htmlContent += `
  <hr>`;
    }
  });

  // Section 3: Estimation Configuration
  htmlContent += `
  <h1 id="estimation-configuration">Estimation Configuration</h1>
  
  <h2>Effort Calculation</h2>
  <table>
    <tr>
      <th width="60%">Parameter</th>
      <th width="40%">Value</th>
    </tr>
    <tr>
      <td>Story Point to Hours Conversion</td>
      <td>${storyPointToHours} hours per story point</td>
    </tr>
    <tr>
      <td>Overhead Percentage (QA/PM)</td>
      <td>${overheadPercentage}%</td>
    </tr>
  </table>
  
  <h2>Timeline & Cost Calculation</h2>
  <table>
    <tr>
      <th width="60%">Parameter</th>
      <th width="40%">Value</th>
    </tr>
    <tr>
      <td>Daily Burn Rate</td>
      <td>${dailyBurnRate} hours/day</td>
    </tr>
    <tr>
      <td>Blended Hourly Rate</td>
      <td>$${blendedHourlyRate}/hour</td>
    </tr>
  </table>
  
  <div class="footer">
    <p>This document was exported from ${projectName} Estimation on ${exportDate}</p>
  </div>
</body>
</html>`;

  return htmlContent;
};

/**
 * Opens HTML content in a new window
 * @param htmlContent HTML content as string
 * @param windowName Optional window name
 */
export const openHtmlInNewWindow = (
  htmlContent: string,
  windowName: string = "EstimationReport"
): void => {
  // Open a new window
  const newWindow = window.open("", windowName, "width=1000,height=800,scrollbars=yes");

  if (newWindow) {
    // Write the HTML content to the new window
    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();

    // Add print button to the window
    const printButton = newWindow.document.createElement("button");
    printButton.innerHTML = "Print Report";
    printButton.style.cssText =
      "position: fixed; top: 10px; right: 10px; padding: 10px; background-color: #2F5496; color: white; border: none; border-radius: 4px; cursor: pointer; z-index: 1000;";
    printButton.onclick = () => {
      newWindow.print();
    };
    newWindow.document.body.appendChild(printButton);
  } else {
    alert("Please allow popups for this website to view the HTML report.");
  }
};

/**
 * Exports estimation data to HTML and opens in a new window
 * @param data Estimation export data
 * @param selectedReleaseIds Array of release IDs to include in the export
 * @param projectName Optional project name
 * @returns void
 */
export const exportEstimationToHtml = (
  data: EstimationExportData,
  selectedReleaseIds: string[],
  projectName?: string
): void => {
  // Update project name if provided
  if (projectName) {
    data.projectName = projectName;
  }

  const htmlContent = generateEstimationHtml(data, selectedReleaseIds);
  openHtmlInNewWindow(htmlContent, `${data.projectName} Estimation Report`);
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
