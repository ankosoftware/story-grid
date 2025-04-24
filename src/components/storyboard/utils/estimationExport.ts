import { Issue, Release } from "@/lib/firebase/models/types";
import ExcelJS from "exceljs";

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
  activities: Issue[];
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
 * Sanitizes HTML content for safe inclusion in markdown or HTML exports
 * Removes HTML tags and converts common entities to their text equivalents
 * @param text Text that may contain HTML
 * @returns Sanitized text
 */
const sanitizeHtml = (text: string | undefined | null): string => {
  if (!text) {
    return "";
  }

  // Create a temporary div element to handle HTML parsing
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = text;

  // Get the text content (strips all HTML tags)
  let sanitized = tempDiv.textContent || tempDiv.innerText || "";

  // Replace common HTML entities with their text equivalents
  sanitized = sanitized
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Escape characters that have special meaning in markdown tables
  sanitized = sanitized
    .replace(/\|/g, "\\|") // Escape pipe characters for markdown tables
    .replace(/\n/g, " ") // Replace newlines with spaces to prevent breaking markdown tables
    .replace(/\r/g, ""); // Remove carriage returns

  return sanitized;
};

/**
 * Sanitizes a string to be used as a valid Excel worksheet name
 * Excel worksheet names cannot contain: * ? : \ / [ ]
 * @param name The original name to sanitize
 * @returns A sanitized name valid for Excel worksheets
 */
const sanitizeWorksheetName = (name: string): string => {
  // Replace invalid characters with underscores
  const sanitized = name
    .replace(/[\*\?\:\\/\[\]]/g, "_") // Replace Excel's invalid chars with underscore
    .trim(); // Remove leading/trailing whitespace

  // Excel worksheet names are limited to 31 characters
  return sanitized.substring(0, 31);
};

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
          markupContent += `**Description:** ${sanitizeHtml(epic.issue.description)}\n\n`;
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
  <p><strong>Description:</strong> ${sanitizeHtml(epic.issue.description)}</p>`;
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
              story.issue && story.issue.description ? sanitizeHtml(story.issue.description) : "";

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
  const filename = `estimation-export-${data.projectName}-${new Date().toISOString().slice(0, 10)}.md`;
  downloadMarkup(markupContent, filename);
  return filename;
};

/**
 * Exports estimation data to Excel format with separate tabs for each release
 * @param data Estimation export data
 * @param selectedReleaseIds Array of release IDs to include in the export
 * @returns Filename of the exported Excel
 */
export const exportEstimationToExcel = (
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

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Storyboard App";
  workbook.lastModifiedBy = "Storyboard App";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create a summary sheet
  const summarySheet = workbook.addWorksheet("Summary");

  // Set column widths
  summarySheet.columns = [
    { width: 45 }, // Column A (Names/Descriptions)
    { width: 15 }, // Column B (Story Points/Values)
    { width: 15 }, // Column C (Hours)
    { width: 25 }, // Column D (Cost/Description)
    { width: 15 }, // Column E (Additional data if present)
    { width: 15 }, // Column F (Additional data if present)
    { width: 15 }, // Column G (Additional data if present)
  ];

  // Get summary data
  const summaryData = generateSummarySheetData(
    data,
    filteredReleases,
    storyPointToHours,
    overheadPercentage,
    dailyBurnRate,
    blendedHourlyRate
  );

  // Add data to summary sheet
  summaryData.forEach(row => {
    summarySheet.addRow(row);
  });

  // Apply styling to the summary sheet
  applySummarySheetStyling(summarySheet, filteredReleases.length);

  // Create a sheet for each release
  filteredReleases.forEach(release => {
    // Sanitize the release name for use as a worksheet name
    const worksheetName = sanitizeWorksheetName(release.name);

    // Add worksheet with sanitized name
    const releaseSheet = workbook.addWorksheet(worksheetName);

    // Set column widths
    releaseSheet.columns = [
      { width: 45 }, // Column A (Names/Descriptions)
      { width: 15 }, // Column B (Story Points)
      { width: 15 }, // Column C (Hours)
      { width: 25 }, // Column D (Description)
    ];

    // Get release data
    const releaseData = generateReleaseSheetData(release, storyPointToHours, overheadPercentage);

    // Add data to release sheet
    releaseData.forEach(row => {
      releaseSheet.addRow(row);
    });

    // Apply styling to the release sheet
    applyReleaseSheetStyling(releaseSheet);
  });

  // Generate a filename with date and time
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Format time as HH-MM-SS
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "-");

  const filename = `estimation-export-${projectName.replace(/[^a-z0-9]/gi, "-")}-${dateStr}-${timeStr}.xlsx`;

  // Write the workbook to file and initiate download
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  });

  return filename;
};

/**
 * Apply styling to the summary sheet
 * @param worksheet ExcelJS worksheet to style
 * @param releaseCount Number of releases
 */
const applySummarySheetStyling = (worksheet: ExcelJS.Worksheet, releaseCount: number): void => {
  // Title styles
  worksheet.getCell("A1").font = {
    bold: true,
    color: { argb: "FF2F5496" },
    size: 14,
  };

  // Export date styling
  worksheet.getCell("A2").font = {
    italic: true,
    color: { argb: "FF666666" },
  };

  // "Project Summary" subtitle
  worksheet.getCell("A4").font = {
    bold: true,
    color: { argb: "FF2F5496" },
    size: 12,
  };

  // Main summary table headers (row 6)
  const headerRow = worksheet.getRow(6);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2F5496" },
    };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Main summary table (rows 6-11)
  for (let i = 6; i <= 11; i++) {
    // Label cells (first column)
    const labelCell = worksheet.getCell(`A${i}`);
    labelCell.font = { bold: true };
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };
    labelCell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };

    // Value cells (second column)
    const valueCell = worksheet.getCell(`B${i}`);
    valueCell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // Configuration section headers
  worksheet.getCell("A14").font = {
    bold: true,
    color: { argb: "FF2F5496" },
    size: 12,
  };

  // "Effort Calculation" subtitle
  worksheet.getCell("A16").font = {
    bold: true,
    color: { argb: "FF2F5496" },
  };

  // Effort calculation table (rows 16-17)
  for (let i = 16; i <= 17; i++) {
    // Label cells
    const labelCell = worksheet.getCell(`A${i}`);
    labelCell.font = { bold: true };
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };
    labelCell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };

    // Value cells
    const valueCell = worksheet.getCell(`B${i}`);
    valueCell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // "Timeline & Cost Calculation" subtitle
  worksheet.getCell("A20").font = {
    bold: true,
    color: { argb: "FF2F5496" },
  };

  // Timeline calculation table (rows 20-21)
  for (let i = 20; i <= 21; i++) {
    // Label cells
    const labelCell = worksheet.getCell(`A${i}`);
    labelCell.font = { bold: true };
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };
    labelCell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };

    // Value cells
    const valueCell = worksheet.getCell(`B${i}`);
    valueCell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // "Release Summary" subtitle
  worksheet.getCell("A24").font = {
    bold: true,
    color: { argb: "FF2F5496" },
    size: 12,
  };

  // Release summary table header (row 26)
  const releaseHeaderRow = worksheet.getRow(26);
  releaseHeaderRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2F5496" },
    };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Release summary table data
  for (let i = 27; i <= 26 + releaseCount; i++) {
    const row = worksheet.getRow(i);

    row.eachCell((cell, colNumber) => {
      // Apply borders to all cells
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };

      // First column (release name) should be bold
      if (colNumber === 1) {
        cell.font = { bold: true };
      }

      // Hours and cost columns should be right-aligned
      if (colNumber === 3 || colNumber === 4) {
        cell.alignment = { horizontal: "right" };
      }
    });
  }
};

/**
 * Apply styling to a release sheet
 * @param worksheet ExcelJS worksheet to style
 */
const applyReleaseSheetStyling = (worksheet: ExcelJS.Worksheet): void => {
  // Release title (row 1)
  worksheet.getCell("A1").font = {
    bold: true,
    color: { argb: "FF2F5496" },
    size: 14,
  };

  // Release summary (rows 3-7)
  for (let i = 3; i <= 7; i++) {
    // Label cells
    const labelCell = worksheet.getCell(`A${i}`);
    labelCell.font = { bold: true };
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };
    labelCell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };

    // Value cells
    const valueCell = worksheet.getCell(`B${i}`);
    valueCell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // Breakdown title (row 9)
  worksheet.getCell("A9").font = {
    bold: true,
    color: { argb: "FF2F5496" },
    size: 12,
  };

  // Table headers (row 11)
  const headerRow = worksheet.getRow(11);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2F5496" },
    };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Style hierarchical data (activity/epic/story)
  let currentRow = 12; // Start after headers

  while (worksheet.getRow(currentRow).getCell(1).value) {
    const row = worksheet.getRow(currentRow);
    const cellValue = row.getCell(1).value?.toString() || "";

    // Apply borders to all cells in the row
    row.eachCell(cell => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Apply specific styling based on indentation
    if (cellValue.trim().startsWith("  ")) {
      // Story level - regular styling with borders already applied
      // No bold font for stories
    } else if (cellValue.trim().startsWith(" ")) {
      // Epic level - italic
      row.eachCell(cell => {
        cell.font = { italic: true };
      });
    } else if (cellValue.trim() !== "") {
      // Activity level - bold, colored, with background
      row.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FF1F3864" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE7E6E6" },
        };
      });
    }

    currentRow++;
  }
};

/**
 * Generates data for the summary sheet
 */
const generateSummarySheetData = (
  data: EstimationExportData,
  filteredReleases: ReleaseEstimation[],
  storyPointToHours: number,
  overheadPercentage: number,
  dailyBurnRate: number,
  blendedHourlyRate: number
): any[][] => {
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

  // Get current date and time for export metadata
  const exportDate = new Date().toLocaleString();

  // Start building the data array for the summary sheet
  const summaryData: any[][] = [
    [`${data.projectName} Estimation Report`],
    [`Generated on: ${exportDate}`],
    [],
    ["Project Summary"],
    [],
    ["Metric", "Value"],
    ["Timeline", `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`],
    ["Working Days to Complete", `${selectedTotalDaysToComplete} days`],
    ["Total Story Points", selectedTotalStoryPoints],
    ["Total Hours (Including Overhead)", selectedTotalHours],
    ["Blended Hourly Rate", `$${blendedHourlyRate}`],
    ["Total Estimated Cost", `$${selectedTotalCost.toLocaleString()}`],
    [],
    ["Estimation Configuration"],
    [],
    ["Effort Calculation", ""],
    ["Story Point to Hours Conversion", `${storyPointToHours} hours per story point`],
    ["Overhead Percentage (QA/PM)", `${overheadPercentage}%`],
    [],
    ["Timeline & Cost Calculation", ""],
    ["Daily Burn Rate", `${dailyBurnRate} hours/day`],
    ["Blended Hourly Rate", `$${blendedHourlyRate}/hour`],
    [],
    ["Release Summary"],
    [],
    ["Release", "Story Points", "Hours", "Cost", "Days to Complete", "Start Date", "End Date"],
  ];

  // Add each release to the summary
  filteredReleases.forEach(release => {
    summaryData.push([
      release.name,
      release.storyPoints,
      release.hours,
      `$${release.cost.toLocaleString()}`,
      release.daysToComplete,
      formatDate(release.startDate),
      formatDate(release.endDate),
    ]);
  });

  return summaryData;
};

/**
 * Generates data for a release sheet with hierarchical structure
 */
const generateReleaseSheetData = (
  release: ReleaseEstimation,
  storyPointToHours: number,
  overheadPercentage: number
): any[][] => {
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

  // Start building the data array for the release sheet
  const releaseData: any[][] = [
    [`${release.name} Release Estimation`],
    [],
    ["Timeline", `${formatDate(release.startDate)} - ${formatDate(release.endDate)}`],
    ["Working Days to Complete", `${release.daysToComplete} days`],
    ["Total Story Points", release.storyPoints],
    ["Total Hours (Including Overhead)", release.hours],
    ["Estimated Cost", `$${release.cost.toLocaleString()}`],
    [],
    ["Activity / Epic / Story Breakdown"],
    [],
    ["Item", "Story Points", "Hours", "Description"],
  ];

  // Group epics by their parent activity
  const epicsByActivity: { [activityId: string]: EpicEstimation[] } = {};

  release.epics.forEach(epic => {
    const activityId = epic.issue.parentId || "unknown";
    if (!epicsByActivity[activityId]) {
      epicsByActivity[activityId] = [];
    }
    epicsByActivity[activityId].push(epic);
  });

  // For simplicity, we'll just use the activity IDs for sorting
  // Since we don't have parentDisplayOrder directly available
  const activityOrder = Object.keys(epicsByActivity);

  // Add activities, epics, and stories to the sheet in a hierarchical format
  activityOrder.forEach(activityId => {
    const epics = epicsByActivity[activityId];
    if (epics.length > 0) {
      // Try to get a more meaningful activity name
      // If the activityId is "unknown", use a generic name
      // Otherwise, use the full activityId which is better than a truncated version
      const activityName =
        release.activities?.find(activity => activity.id === activityId)?.name ||
        `Activity ${activityId}`;

      // Add activity row - no story points or hours at this level
      releaseData.push([activityName, "", "", ""]);

      // Process each epic within this activity
      epics
        .sort((a, b) => a.issue.displayOrder - b.issue.displayOrder)
        .forEach(epic => {
          // Add epic row - no story points or hours at this level
          releaseData.push([`  ${epic.name}`, "", "", sanitizeHtml(epic.issue.description)]);

          // Process each story within this epic
          epic.stories
            .sort((a, b) => a.issue.displayOrder - b.issue.displayOrder)
            .forEach(story => {
              // Add story row - include story points and hours only at this level
              releaseData.push([
                `    ${story.name}`,
                story.storyPoints,
                story.hours,
                sanitizeHtml(story.issue.description),
              ]);
            });
        });
    }
  });

  return releaseData;
};
