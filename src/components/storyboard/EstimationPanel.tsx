import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useTheme,
  Link,
  Button,
  Snackbar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TodayIcon from "@mui/icons-material/Today";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Issue, Release, IssueType } from "@/lib/firebase/models/types";
import Grid from "@mui/material/Grid";
import {
  estimateReleasesWithEpics,
  exportEstimationToMarkup,
  exportEstimationToHtml,
  EstimationExportData,
} from "./utils";
import ExportEstimationDialog, { ExportFormat } from "./dialogs/ExportEstimationDialog";

// Interface for component props
interface EstimationPanelProps {
  projectId: string;
  projectName: string;
  activities: Issue[]; // Backbone items
  epics: Record<string, Issue[]>; // Epics by activity ID
  issues: Record<string, Issue[]>; // Stories by epic ID
  releases: Release[];
  storyPointToHours?: number;
  overheadPercentage?: number;
  dailyBurnRate?: number;
  blendedHourlyRate?: number;
  loading: boolean;
  error: Error | null;
  onEditEpic?: (epic: Issue) => void;
  onEditStory?: (story: Issue) => void;
}

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
  issue: Issue; // Store the original issue object for editing
}

// Interface for epic estimation
interface EpicEstimation {
  id: string;
  name: string;
  storyPoints: number;
  hours: number;
  stories: StoryEstimation[];
  issue: Issue; // Store the original issue object for editing
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

const EstimationPanel: React.FC<EstimationPanelProps> = ({
  projectId,
  projectName,
  activities,
  epics,
  issues,
  releases,
  storyPointToHours = 8, // Default to 8 hours per story point
  overheadPercentage = 25, // Default to 25% overhead
  dailyBurnRate = 16, // Default to 16 hours per day
  blendedHourlyRate = 100, // Default to $100 per hour
  loading,
  error,
  onEditEpic,
  onEditStory,
}) => {
  const theme = useTheme();

  // State for storing the calculated estimations
  const [estimations, setEstimations] = useState<{
    totalEstimation: EstimationDetails;
    releaseEstimations: ReleaseEstimation[];
  }>({
    totalEstimation: {
      storyPoints: 0,
      hours: 0,
      cost: 0,
      startDate: null,
      endDate: null,
      daysToComplete: 0,
    },
    releaseEstimations: [],
  });

  // State for export dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // State for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Effect to calculate estimations when dependencies change
  useEffect(() => {
    // Skip calculation if data is loading or has errors
    if (loading || error) {
      return;
    }

    // Call the estimation function
    const { totalEstimation, releaseEstimations } = estimateReleasesWithEpics(
      releases,
      activities,
      epics,
      issues,
      storyPointToHours,
      overheadPercentage,
      dailyBurnRate,
      blendedHourlyRate
    );

    // Update state with the calculated estimations
    setEstimations({
      totalEstimation,
      releaseEstimations,
    });
  }, [
    releases,
    activities,
    epics,
    issues,
    storyPointToHours,
    overheadPercentage,
    dailyBurnRate,
    blendedHourlyRate,
    loading,
    error,
  ]);

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) {
      return "Not set";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Handle epic link click
  const handleEpicClick = (event: React.MouseEvent, epic: Issue) => {
    if (onEditEpic) {
      event.preventDefault();
      onEditEpic(epic);
    }
  };

  // Handle story link click
  const handleStoryClick = (event: React.MouseEvent, story: Issue) => {
    if (onEditStory) {
      event.preventDefault();
      onEditStory(story);
    }
  };

  // Handle opening the export dialog
  const handleOpenExportDialog = () => {
    setExportDialogOpen(true);
  };

  // Handle closing the export dialog
  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
  };

  // Handle exporting the estimation data
  const handleExportEstimation = (selectedReleaseIds: string[], format: ExportFormat) => {
    // Create export data object
    const exportData: EstimationExportData = {
      totalEstimation: estimations.totalEstimation,
      releaseEstimations: estimations.releaseEstimations,
      storyPointToHours,
      overheadPercentage,
      dailyBurnRate,
      blendedHourlyRate,
      projectName,
    };

    // Export based on selected format
    if (format === ExportFormat.MARKDOWN) {
      // Export to markdown
      exportEstimationToMarkup(exportData, selectedReleaseIds);
    } else {
      // Export to HTML
      exportEstimationToHtml(exportData, selectedReleaseIds);
    }

    // Show success message
    setSnackbarMessage("Estimation exported successfully!");
    setSnackbarOpen(true);
  };

  // Handle closing the snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton height={200} sx={{ mb: 2 }} variant="rectangular" width="100%" />
        <Skeleton height={400} variant="rectangular" width="100%" />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading estimation data: {error.message}</Alert>;
  }

  const { totalEstimation, releaseEstimations } = estimations;

  return (
    <Box>
      {/* Project Estimation Summary */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5">Project Estimation Summary</Typography>
          <Button
            disabled={releaseEstimations.length === 0}
            startIcon={<FileDownloadIcon />}
            variant="outlined"
            onClick={handleOpenExportDialog}
          >
            Export Estimation
          </Button>
        </Box>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <TodayIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Timeline</Typography>
                </Box>
                <Typography gutterBottom color="text.secondary" variant="body2">
                  Estimated Timeline
                </Typography>
                <Typography variant="body1">
                  {formatDate(totalEstimation.startDate)} - {formatDate(totalEstimation.endDate)}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
                  Working Days to Complete
                </Typography>
                <Typography variant="body1">{totalEstimation.daysToComplete} days</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Effort</Typography>
                </Box>
                <Typography gutterBottom color="text.secondary" variant="body2">
                  Total Story Points
                </Typography>
                <Typography variant="body1">{formatNumber(totalEstimation.storyPoints)}</Typography>
                <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
                  Total Hours (Including {overheadPercentage}% Overhead)
                </Typography>
                <Typography variant="body1">{formatNumber(totalEstimation.hours)} hours</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Cost</Typography>
                </Box>
                <Typography gutterBottom color="text.secondary" variant="body2">
                  Blended Hourly Rate
                </Typography>
                <Typography variant="body1">${formatNumber(blendedHourlyRate)}/hour</Typography>
                <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
                  Total Estimated Cost
                </Typography>
                <Typography variant="body1">${formatNumber(totalEstimation.cost)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Release Estimations */}
      <Box sx={{ mb: 4 }}>
        <Typography gutterBottom variant="h5">
          Release Estimations
        </Typography>
        {releaseEstimations.length === 0 ? (
          <Alert severity="info">No releases found. Add releases to see estimations.</Alert>
        ) : (
          releaseEstimations.map(release => (
            <Accordion key={release.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: "bold" }}>{release.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {formatDate(release.startDate)} - {formatDate(release.endDate)} (
                      {release.daysToComplete} working days)
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Chip
                      color="primary"
                      label={`${formatNumber(release.storyPoints)} SP`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      color="primary"
                      label={`${formatNumber(release.hours)} hours`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      color="primary"
                      label={`$${formatNumber(release.cost)}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Divider sx={{ my: 2 }} />

                {/* Epics in this release */}
                {release.epics.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No epics in this release
                  </Alert>
                ) : (
                  release.epics.map(epic => (
                    <Accordion
                      key={epic.id}
                      sx={{
                        mb: 2,
                        "&:before": { display: "none" },
                        boxShadow: "none",
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          background: theme.palette.background.default,
                          "&:hover": { background: theme.palette.action.hover },
                        }}
                      >
                        <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
                          <Box sx={{ flexGrow: 1 }}>
                            {onEditEpic ? (
                              <Link
                                component="button"
                                sx={{ fontWeight: "medium" }}
                                variant="subtitle1"
                                onClick={e => handleEpicClick(e, epic.issue)}
                              >
                                {epic.name}
                              </Link>
                            ) : (
                              <Typography sx={{ fontWeight: "medium" }} variant="subtitle1">
                                {epic.name}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Chip
                              label={`${formatNumber(epic.storyPoints)} SP`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${formatNumber(epic.hours)} hours`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Story</TableCell>
                                <TableCell align="right">Story Points</TableCell>
                                <TableCell align="right">Hours</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {epic.stories.map(story => (
                                <TableRow key={story.id}>
                                  <TableCell>
                                    {onEditStory ? (
                                      <Link
                                        component="button"
                                        variant="body2"
                                        onClick={e => handleStoryClick(e, story.issue)}
                                      >
                                        {story.name}
                                      </Link>
                                    ) : (
                                      <Typography variant="body2">{story.name}</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatNumber(story.storyPoints)}
                                  </TableCell>
                                  <TableCell align="right">{formatNumber(story.hours)}</TableCell>
                                </TableRow>
                              ))}
                              {epic.stories.length === 0 && (
                                <TableRow>
                                  <TableCell align="center" colSpan={3}>
                                    No stories in this epic
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      {/* Estimation Configuration */}
      <Box sx={{ mb: 4 }}>
        <Typography gutterBottom variant="h5">
          Estimation Configuration
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography gutterBottom variant="subtitle1">
                Effort Calculation
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Story Point to Hours Conversion:</Typography>
                <Typography variant="body2">{storyPointToHours} hours per story point</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Overhead Percentage (QA/PM):</Typography>
                <Typography variant="body2">{overheadPercentage}%</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography gutterBottom variant="subtitle1">
                Timeline & Cost Calculation
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Daily Burn Rate:</Typography>
                <Typography variant="body2">{dailyBurnRate} hours/day</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Blended Hourly Rate:</Typography>
                <Typography variant="body2">${blendedHourlyRate}/hour</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Export Dialog */}
      <ExportEstimationDialog
        open={exportDialogOpen}
        projectName={projectName}
        releases={releases}
        onClose={handleCloseExportDialog}
        onExport={handleExportEstimation}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        autoHideDuration={6000}
        message={snackbarMessage}
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
};

export default EstimationPanel;
