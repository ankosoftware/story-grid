import { useState, useMemo, useEffect } from "react";
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
import { exportEstimationToMarkup, EstimationExportData } from "./utils";
import ExportEstimationDialog from "./dialogs/ExportEstimationDialog";

// Interface for component props
interface EstimationPanelProps {
  projectId: string;
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

  // State for export dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // State for snackbar feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Use memo to calculate estimations only when inputs change
  const estimations = useMemo(() => {
    if (loading || error) {
      return {
        totalEstimation: {
          storyPoints: 0,
          hours: 0,
          cost: 0,
          startDate: null,
          endDate: null,
          daysToComplete: 0,
        },
        releaseEstimations: [],
      };
    }

    // Sort activities by displayOrder
    const sortedActivities = [...activities].sort((a, b) => a.displayOrder - b.displayOrder);

    // Sort and calculate estimations for each story
    const storyEstimations: Record<string, StoryEstimation> = {};
    Object.entries(issues).forEach(([epicId, epicStories]) => {
      // Sort stories by displayOrder to maintain consistent ordering across the application
      const sortedStories = [...epicStories].sort((a, b) => a.displayOrder - b.displayOrder);

      sortedStories.forEach(story => {
        if (story.storyPoints) {
          const hours = story.storyPoints * storyPointToHours * (1 + overheadPercentage / 100);
          storyEstimations[story.id] = {
            id: story.id,
            name: story.name,
            storyPoints: story.storyPoints,
            hours,
            issue: story,
          };
        } else {
          storyEstimations[story.id] = {
            id: story.id,
            name: story.name,
            storyPoints: 0,
            hours: 0,
            issue: story,
          };
        }
      });
    });

    // Sort and calculate estimations for each epic, respecting activity order
    const epicEstimations: Record<string, EpicEstimation> = {};

    // First, collect all epics and associate them with their parent activity for proper sorting
    const allSortedEpics: { epic: Issue; activityOrder: number }[] = [];

    sortedActivities.forEach((activity, activityIndex) => {
      const activityEpics = epics[activity.id] || [];
      // Sort epics within each activity by their display order
      const sortedEpics = [...activityEpics].sort((a, b) => a.displayOrder - b.displayOrder);

      // Add activity index for global sort
      sortedEpics.forEach(epic => {
        allSortedEpics.push({
          epic,
          activityOrder: activityIndex,
        });
      });
    });

    // Process epics in activity + display order
    allSortedEpics.forEach(({ epic }) => {
      const epicStories = issues[epic.id] || [];
      // Sort stories within each epic by displayOrder
      const sortedEpicStories = [...epicStories].sort((a, b) => a.displayOrder - b.displayOrder);

      const epicStoriesEstimations = sortedEpicStories
        .map(story => storyEstimations[story.id])
        .filter(Boolean);

      const storyPoints = epicStoriesEstimations.reduce(
        (sum, story) => sum + (story?.storyPoints || 0),
        0
      );
      const hours = epicStoriesEstimations.reduce((sum, story) => sum + (story?.hours || 0), 0);

      epicEstimations[epic.id] = {
        id: epic.id,
        name: epic.name,
        storyPoints,
        hours,
        stories: epicStoriesEstimations,
        issue: epic,
      };
    });

    // Sort releases by displayOrder
    const sortedReleases = [...releases].sort((a, b) => a.displayOrder - b.displayOrder);

    // Calculate estimations for each release
    let startDate: Date | null = new Date(); // Start from today for the first release
    const releaseEstimations: ReleaseEstimation[] = [];

    sortedReleases.forEach(release => {
      // Find all stories in this release
      const releaseStories: Issue[] = [];
      Object.values(issues).forEach(epicStories => {
        // Sort stories by displayOrder for consistent presentation
        const sortedEpicStories = [...epicStories].sort((a, b) => a.displayOrder - b.displayOrder);

        sortedEpicStories
          .filter(story => story.releaseId === release.id)
          .forEach(story => releaseStories.push(story));
      });

      // Calculate story points and hours for all stories in the release
      const storyPoints = releaseStories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
      const hours = releaseStories.reduce(
        (sum, story) => sum + (storyEstimations[story.id]?.hours || 0),
        0
      );
      const cost = hours * blendedHourlyRate;

      // Calculate days to complete based on daily burn rate
      const daysToComplete = dailyBurnRate ? Math.ceil(hours / dailyBurnRate) : 0;

      // Calculate end date
      const endDate = startDate ? new Date(startDate) : null;
      if (endDate && daysToComplete > 0) {
        // Add working days (skip weekends)
        let daysAdded = 0;
        while (daysAdded < daysToComplete) {
          endDate.setDate(endDate.getDate() + 1);
          // Skip weekends (0 = Sunday, 6 = Saturday)
          if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
            daysAdded++;
          }
        }
      }

      // Calculate epics in this release
      const releaseEpics: EpicEstimation[] = [];
      Object.values(epicEstimations).forEach(epic => {
        // Check if any stories from this epic are in the current release
        const epicStoriesInRelease = epic.stories.filter(story =>
          releaseStories.some(releaseStory => releaseStory.id === story.id)
        );

        if (epicStoriesInRelease.length > 0) {
          const epicStoryPoints = epicStoriesInRelease.reduce(
            (sum, story) => sum + story.storyPoints,
            0
          );
          const epicHours = epicStoriesInRelease.reduce((sum, story) => sum + story.hours, 0);

          releaseEpics.push({
            id: epic.id,
            name: epic.name,
            storyPoints: epicStoryPoints,
            hours: epicHours,
            stories: epicStoriesInRelease,
            issue: epic.issue,
          });
        }
      });

      // Sort epics by activity order first, then by epic display order within each activity
      releaseEpics.sort((a, b) => {
        // Find the corresponding epics in the allSortedEpics array to get activity orders
        const epicA = allSortedEpics.find(item => item.epic.id === a.issue.id);
        const epicB = allSortedEpics.find(item => item.epic.id === b.issue.id);

        // If both epics have an activity order, compare them
        if (epicA && epicB) {
          // First sort by activity order
          if (epicA.activityOrder !== epicB.activityOrder) {
            return epicA.activityOrder - epicB.activityOrder;
          }
          // If same activity, sort by epic display order
          return a.issue.displayOrder - b.issue.displayOrder;
        } else if (epicA) {
          // A has activity info but B doesn't, prioritize A
          return -1;
        } else if (epicB) {
          // B has activity info but A doesn't, prioritize B
          return 1;
        }

        // Fallback to just epic display order if activity info is missing for both
        return a.issue.displayOrder - b.issue.displayOrder;
      });

      releaseEstimations.push({
        id: release.id,
        name: release.name,
        storyPoints,
        hours,
        cost,
        startDate,
        endDate,
        daysToComplete,
        epics: releaseEpics,
      });

      // Next release starts after this one ends
      startDate = endDate;
    });

    // Calculate total estimation for the project
    const totalStoryPoints = releaseEstimations.reduce(
      (sum, release) => sum + release.storyPoints,
      0
    );
    const totalHours = releaseEstimations.reduce((sum, release) => sum + release.hours, 0);
    const totalCost = releaseEstimations.reduce((sum, release) => sum + release.cost, 0);
    const totalDaysToComplete = releaseEstimations.reduce(
      (sum, release) => sum + release.daysToComplete,
      0
    );

    // Calculate project start and end dates
    const projectStartDate = releaseEstimations.length > 0 ? releaseEstimations[0].startDate : null;
    const projectEndDate =
      releaseEstimations.length > 0
        ? releaseEstimations[releaseEstimations.length - 1].endDate
        : null;

    return {
      totalEstimation: {
        storyPoints: totalStoryPoints,
        hours: totalHours,
        cost: totalCost,
        startDate: projectStartDate,
        endDate: projectEndDate,
        daysToComplete: totalDaysToComplete,
      },
      releaseEstimations,
    };
  }, [
    activities,
    issues,
    epics,
    releases,
    storyPointToHours,
    overheadPercentage,
    dailyBurnRate,
    blendedHourlyRate,
    loading,
    error,
  ]);

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

  // Format number with commas as thousands separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  // Handle the click on an epic to edit it
  const handleEpicClick = (event: React.MouseEvent, epic: Issue) => {
    if (onEditEpic) {
      event.stopPropagation();
      onEditEpic(epic);
    }
  };

  // Handle the click on a story to edit it
  const handleStoryClick = (event: React.MouseEvent, story: Issue) => {
    if (onEditStory) {
      event.stopPropagation();
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
  const handleExportEstimation = (selectedReleaseIds: string[]) => {
    // Create export data object
    const exportData: EstimationExportData = {
      totalEstimation: estimations.totalEstimation,
      releaseEstimations: estimations.releaseEstimations,
      storyPointToHours,
      overheadPercentage,
      dailyBurnRate,
      blendedHourlyRate,
      projectName: `Project ${projectId}`,
    };

    // Export to markup
    exportEstimationToMarkup(exportData, selectedReleaseIds);

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
                                fontWeight="medium"
                                sx={{ textAlign: "left", textDecoration: "none" }}
                                variant="body1"
                                onClick={e => handleEpicClick(e, epic.issue)}
                              >
                                {epic.name}
                              </Link>
                            ) : (
                              <Typography fontWeight="medium">{epic.name}</Typography>
                            )}
                          </Box>
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Chip
                              color="secondary"
                              label={`${formatNumber(epic.storyPoints)} SP`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              color="secondary"
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
                                <TableCell width="50%">Story</TableCell>
                                <TableCell align="right" width="25%">
                                  Story Points
                                </TableCell>
                                <TableCell align="right" width="25%">
                                  Hours
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {epic.stories.map(story => (
                                <TableRow key={story.id} hover={!!onEditStory}>
                                  <TableCell component="th" scope="row">
                                    {onEditStory ? (
                                      <Link
                                        component="button"
                                        sx={{ textAlign: "left", textDecoration: "none" }}
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
