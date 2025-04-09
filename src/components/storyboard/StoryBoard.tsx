import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Issue, Release, IssueStatus, IssuePriority, IssueType } from "@/lib/firebase/models/types";
import { styled } from "@mui/material/styles";

// Custom Grid components to avoid type errors
const GridItem = styled(Grid)(({ theme }) => ({}));
const GridContainer = styled(Grid)(({ theme }) => ({}));

interface StoryBoardProps {
  projectId: string;
  activities: Issue[]; // Backbone items - User Activities
  epics: Record<string, Issue[]>; // Epics by activity ID
  issues: Record<string, Issue[]>; // Stories by epic ID
  releases: Release[];
  loading: boolean;
  error: Error | null;
  onAddActivity: (name: string, description?: string) => Promise<string>;
  onAddEpic: (activityId: string, name: string, description?: string) => Promise<string>;
  onAddStory: (
    epicId: string,
    name: string,
    options?: {
      description?: string;
      acceptanceCriteria?: string;
      status?: IssueStatus;
      priority?: IssuePriority;
      assignee?: string;
      releaseId?: string;
    }
  ) => Promise<string>;
  onAddRelease: (
    name: string,
    options?: {
      description?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) => Promise<string>;
  onMoveIssue?: (issueId: string, releaseId: string | null) => Promise<void>;
}

export default function StoryBoard({
  projectId,
  activities,
  epics,
  issues,
  releases,
  loading,
  error,
  onAddActivity,
  onAddEpic,
  onAddStory,
  onAddRelease,
  onMoveIssue,
}: StoryBoardProps) {
  // State for add activity dialog
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // State for add epic dialog
  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [epicName, setEpicName] = useState("");
  const [epicDescription, setEpicDescription] = useState("");
  const [addingEpic, setAddingEpic] = useState(false);
  const [epicError, setEpicError] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // State for add story dialog
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [storyName, setStoryName] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [addingStory, setAddingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  // State for add release dialog
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseName, setReleaseName] = useState("");
  const [releaseDescription, setReleaseDescription] = useState("");
  const [addingRelease, setAddingRelease] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  // State for move story menu
  const [moveMenuAnchorEl, setMoveMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [movingStory, setMovingStory] = useState(false);

  // Function to handle opening move story menu
  const handleOpenMoveMenu = (event: React.MouseEvent<HTMLElement>, storyId: string) => {
    event.stopPropagation();
    setMoveMenuAnchorEl(event.currentTarget);
    setSelectedStoryId(storyId);
  };

  // Function to handle closing move story menu
  const handleCloseMoveMenu = () => {
    setMoveMenuAnchorEl(null);
    setSelectedStoryId(null);
  };

  // Function to handle moving a story to a release
  const handleMoveStory = async (releaseId: string | null) => {
    if (!selectedStoryId || !onMoveIssue) {
      handleCloseMoveMenu();
      return;
    }

    try {
      setMovingStory(true);
      await onMoveIssue(selectedStoryId, releaseId);
    } catch (error) {
      console.error("Failed to move story:", error);
    } finally {
      setMovingStory(false);
      handleCloseMoveMenu();
    }
  };

  // Function to handle opening activity dialog
  const handleOpenActivityDialog = () => {
    setActivityDialogOpen(true);
    setActivityName("");
    setActivityDescription("");
    setActivityError(null);
  };

  // Function to handle closing activity dialog
  const handleCloseActivityDialog = () => {
    setActivityDialogOpen(false);
  };

  // Function to handle creating new activity
  const handleCreateActivity = async () => {
    if (!activityName.trim()) {
      setActivityError("Activity name is required");
      return;
    }

    try {
      setAddingActivity(true);
      setActivityError(null);
      await onAddActivity(
        activityName,
        activityDescription.trim() ? activityDescription : undefined
      );
      handleCloseActivityDialog();
    } catch (err) {
      setActivityError((err as Error).message || "Failed to create activity");
    } finally {
      setAddingActivity(false);
    }
  };

  // Function to handle opening epic dialog
  const handleOpenEpicDialog = (activityId: string) => {
    setSelectedActivityId(activityId);
    setEpicDialogOpen(true);
    setEpicName("");
    setEpicDescription("");
    setEpicError(null);
  };

  // Function to handle closing epic dialog
  const handleCloseEpicDialog = () => {
    setEpicDialogOpen(false);
    setSelectedActivityId(null);
  };

  // Function to handle creating new epic
  const handleCreateEpic = async () => {
    if (!selectedActivityId) {
      setEpicError("No activity selected");
      return;
    }

    if (!epicName.trim()) {
      setEpicError("Epic name is required");
      return;
    }

    try {
      setAddingEpic(true);
      setEpicError(null);
      await onAddEpic(
        selectedActivityId,
        epicName,
        epicDescription.trim() ? epicDescription : undefined
      );
      handleCloseEpicDialog();
    } catch (err) {
      setEpicError((err as Error).message || "Failed to create epic");
    } finally {
      setAddingEpic(false);
    }
  };

  // Function to handle opening story dialog
  const handleOpenStoryDialog = (epicId: string) => {
    setSelectedParentId(epicId);
    setStoryDialogOpen(true);
    setStoryName("");
    setStoryDescription("");
    setStoryError(null);
  };

  // Function to handle closing story dialog
  const handleCloseStoryDialog = () => {
    setStoryDialogOpen(false);
    setSelectedParentId(null);
  };

  // Function to handle creating new story
  const handleCreateStory = async () => {
    if (!selectedParentId) {
      setStoryError("No epic selected");
      return;
    }

    if (!storyName.trim()) {
      setStoryError("Story name is required");
      return;
    }

    try {
      setAddingStory(true);
      setStoryError(null);
      await onAddStory(selectedParentId, storyName, {
        description: storyDescription.trim() ? storyDescription : undefined,
      });
      handleCloseStoryDialog();
    } catch (err) {
      setStoryError((err as Error).message || "Failed to create story");
    } finally {
      setAddingStory(false);
    }
  };

  // Function to handle opening release dialog
  const handleOpenReleaseDialog = () => {
    setReleaseDialogOpen(true);
    setReleaseName("");
    setReleaseDescription("");
    setReleaseError(null);
  };

  // Function to handle closing release dialog
  const handleCloseReleaseDialog = () => {
    setReleaseDialogOpen(false);
  };

  // Function to handle creating new release
  const handleCreateRelease = async () => {
    if (!releaseName.trim()) {
      setReleaseError("Release name is required");
      return;
    }

    try {
      setAddingRelease(true);
      setReleaseError(null);
      await onAddRelease(releaseName, {
        description: releaseDescription.trim() ? releaseDescription : undefined,
      });
      handleCloseReleaseDialog();
    } catch (err) {
      setReleaseError((err as Error).message || "Failed to create release");
    } finally {
      setAddingRelease(false);
    }
  };

  // Function to get status color
  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.TO_DO:
        return "#e0e0e0"; // Grey
      case IssueStatus.IN_PROGRESS:
        return "#bbdefb"; // Light blue
      case IssueStatus.DONE:
        return "#c8e6c9"; // Light green
      default:
        return "#e0e0e0";
    }
  };

  // Function to get priority color
  const getPriorityColor = (priority: IssuePriority) => {
    switch (priority) {
      case IssuePriority.HIGH:
        return "#f44336"; // Red
      case IssuePriority.MEDIUM:
        return "#ff9800"; // Orange
      case IssuePriority.LOW:
        return "#4caf50"; // Green
      default:
        return "#ff9800";
    }
  };

  // Group stories by release for swimlane view
  const getStoriesByRelease = (
    allIssues: Record<string, Issue[]>
  ): Record<string | "unassigned", Issue[]> => {
    const result: Record<string | "unassigned", Issue[]> = { unassigned: [] };

    // Initialize empty arrays for each release
    releases.forEach(release => {
      result[release.id] = [];
    });

    // Group stories by release
    Object.values(allIssues).forEach(issueArray => {
      issueArray.forEach(issue => {
        if (issue.type === IssueType.STORY) {
          if (issue.releaseId) {
            if (result[issue.releaseId]) {
              result[issue.releaseId].push(issue);
            } else {
              result.unassigned.push(issue);
            }
          } else {
            result.unassigned.push(issue);
          }
        }
      });
    });

    return result;
  };

  const storiesByRelease = getStoriesByRelease(issues ?? []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        Error loading story board: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Story board header with actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography component="h2" variant="h5">
          Story Map
        </Typography>
        <Box>
          <Button
            startIcon={<AddIcon />}
            sx={{ mr: 1 }}
            variant="contained"
            onClick={handleOpenActivityDialog}
          >
            Add Activity
          </Button>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={handleOpenReleaseDialog}>
            Add Release
          </Button>
        </Box>
      </Box>

      {/* Story board content */}
      {activities?.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography gutterBottom color="text.secondary" variant="h6">
            No activities yet
          </Typography>
          <Typography paragraph color="text.secondary" variant="body2">
            Add your first activity to start building your story map.
          </Typography>
          <Button startIcon={<AddIcon />} variant="contained" onClick={handleOpenActivityDialog}>
            Add Activity
          </Button>
        </Box>
      ) : (
        <Box>
          {/* Releases (Swimlanes) */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ mb: 2 }} variant="h6">
              Release Swimlanes
            </Typography>

            {releases.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Typography color="text.secondary" variant="body2">
                  No releases yet. Add your first release to start planning.
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ mt: 1 }}
                  variant="outlined"
                  onClick={handleOpenReleaseDialog}
                >
                  Add Release
                </Button>
              </Box>
            ) : (
              <Box>
                {/* Swimlanes */}
                {releases.map(release => (
                  <Box key={release.id} sx={{ mb: 3 }}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: "#f0f7ff",
                        borderLeft: "4px solid #1976d2",
                      }}
                    >
                      <Typography fontWeight="medium" sx={{ mb: 1 }} variant="subtitle1">
                        {release.name}
                      </Typography>
                      {release.description && (
                        <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
                          {release.description}
                        </Typography>
                      )}

                      {/* Stories in this release */}
                      {storiesByRelease[release.id] && storiesByRelease[release.id].length > 0 ? (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {storiesByRelease[release.id].map(story => (
                            <Card
                              key={story.id}
                              sx={{
                                width: { xs: "100%", sm: "250px" },
                                mb: 1,
                                backgroundColor: getStatusColor(story.status),
                                borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
                              }}
                            >
                              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                  <Typography variant="subtitle2">{story.name}</Typography>
                                  <IconButton
                                    size="small"
                                    onClick={e => handleOpenMoveMenu(e, story.id)}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                {story.description && (
                                  <Typography
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                    variant="body2"
                                  >
                                    {story.description}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      ) : (
                        <Typography
                          color="text.secondary"
                          sx={{ textAlign: "center", py: 1 }}
                          variant="body2"
                        >
                          No stories in this release yet
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                ))}

                {/* Unassigned Stories */}
                <Box sx={{ mb: 3 }}>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "#f5f5f5",
                      borderLeft: "4px solid #9e9e9e",
                    }}
                  >
                    <Typography fontWeight="medium" sx={{ mb: 1 }} variant="subtitle1">
                      Unassigned Stories
                    </Typography>

                    {/* Unassigned stories */}
                    {storiesByRelease.unassigned && storiesByRelease.unassigned.length > 0 ? (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {storiesByRelease.unassigned.map(story => (
                          <Card
                            key={story.id}
                            sx={{
                              width: { xs: "100%", sm: "250px" },
                              mb: 1,
                              backgroundColor: getStatusColor(story.status),
                              borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
                            }}
                          >
                            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="subtitle2">{story.name}</Typography>
                                <IconButton
                                  size="small"
                                  onClick={e => handleOpenMoveMenu(e, story.id)}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              {story.description && (
                                <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                                  {story.description}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    ) : (
                      <Typography
                        color="text.secondary"
                        sx={{ textAlign: "center", py: 1 }}
                        variant="body2"
                      >
                        No unassigned stories
                      </Typography>
                    )}
                  </Paper>
                </Box>
              </Box>
            )}
          </Box>

          {/* User Activity / Epic / Story Map */}
          <Box sx={{ mt: 4 }}>
            <Typography sx={{ mb: 2 }} variant="h6">
              Activities and Tasks
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {activities?.map(activity => (
                  <Box key={activity.id} sx={{ width: "100%" }}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      {/* Activity header */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                          pb: 1,
                          borderBottom: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography fontWeight="bold" variant="h6">
                          {activity.name}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenEpicDialog(activity.id)}
                        >
                          Add Epic
                        </Button>
                      </Box>

                      {/* Activity description */}
                      {activity.description && (
                        <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
                          {activity.description}
                        </Typography>
                      )}

                      {/* Epics */}
                      {epics[activity.id] && epics[activity.id].length > 0 ? (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                          {epics[activity.id].map(epic => (
                            <Box
                              key={epic.id}
                              sx={{
                                width: {
                                  xs: "100%",
                                  sm: "calc(50% - 8px)",
                                  md: "calc(33.33% - 10.67px)",
                                  lg: "calc(25% - 12px)",
                                },
                              }}
                            >
                              <Paper
                                sx={{
                                  p: 1.5,
                                  mb: 1.5,
                                  bgcolor: "#f5f5f5",
                                  borderLeft: `4px solid ${getPriorityColor(epic.priority)}`,
                                }}
                              >
                                <Box
                                  sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
                                >
                                  <Typography fontWeight="medium" variant="subtitle1">
                                    {epic.name}
                                  </Typography>
                                  <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenStoryDialog(epic.id)}
                                  >
                                    Add Story
                                  </Button>
                                </Box>

                                {epic.description && (
                                  <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                                    {epic.description}
                                  </Typography>
                                )}

                                {/* Stories */}
                                {issues[epic.id] && issues[epic.id].length > 0 ? (
                                  issues[epic.id].map(story => (
                                    <Card
                                      key={story.id}
                                      sx={{
                                        mb: 1,
                                        backgroundColor: getStatusColor(story.status),
                                        borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
                                      }}
                                    >
                                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                                        <Box
                                          sx={{ display: "flex", justifyContent: "space-between" }}
                                        >
                                          <Typography variant="subtitle2">{story.name}</Typography>
                                          <IconButton
                                            size="small"
                                            onClick={e => handleOpenMoveMenu(e, story.id)}
                                          >
                                            <MoreVertIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                        {story.description && (
                                          <Typography
                                            color="text.secondary"
                                            sx={{ mt: 0.5 }}
                                            variant="body2"
                                          >
                                            {story.description}
                                          </Typography>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))
                                ) : (
                                  <Typography
                                    color="text.secondary"
                                    sx={{ textAlign: "center", py: 1 }}
                                    variant="body2"
                                  >
                                    No stories yet
                                  </Typography>
                                )}
                              </Paper>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography
                          color="text.secondary"
                          sx={{ textAlign: "center", py: 2 }}
                          variant="body2"
                        >
                          No epics yet. Add your first epic.
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Move Story Menu */}
      <Menu
        anchorEl={moveMenuAnchorEl}
        open={Boolean(moveMenuAnchorEl)}
        onClose={handleCloseMoveMenu}
      >
        <MenuItem disabled={movingStory} onClick={() => handleMoveStory(null)}>
          Remove from release
        </MenuItem>
        <Divider />
        {releases.map(release => (
          <MenuItem
            key={release.id}
            disabled={movingStory}
            onClick={() => handleMoveStory(release.id)}
          >
            {release.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Add Activity Dialog */}
      <Dialog fullWidth maxWidth="sm" open={activityDialogOpen} onClose={handleCloseActivityDialog}>
        <DialogTitle>Add New Activity (Backbone)</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            disabled={addingActivity}
            error={!!activityError}
            helperText={activityError}
            label="Activity Name"
            margin="dense"
            sx={{ mb: 2 }}
            value={activityName}
            onChange={e => setActivityName(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            disabled={addingActivity}
            label="Description (optional)"
            margin="dense"
            rows={3}
            value={activityDescription}
            onChange={e => setActivityDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={addingActivity} onClick={handleCloseActivityDialog}>
            Cancel
          </Button>
          <Button
            disabled={addingActivity}
            startIcon={addingActivity ? <CircularProgress size={20} /> : undefined}
            variant="contained"
            onClick={handleCreateActivity}
          >
            {addingActivity ? "Creating..." : "Create Activity"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Epic Dialog */}
      <Dialog fullWidth maxWidth="sm" open={epicDialogOpen} onClose={handleCloseEpicDialog}>
        <DialogTitle>Add New Epic (User Task)</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            disabled={addingEpic}
            error={!!epicError}
            helperText={epicError}
            label="Epic Name"
            margin="dense"
            sx={{ mb: 2 }}
            value={epicName}
            onChange={e => setEpicName(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            disabled={addingEpic}
            label="Description (optional)"
            margin="dense"
            rows={3}
            value={epicDescription}
            onChange={e => setEpicDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={addingEpic} onClick={handleCloseEpicDialog}>
            Cancel
          </Button>
          <Button
            disabled={addingEpic}
            startIcon={addingEpic ? <CircularProgress size={20} /> : undefined}
            variant="contained"
            onClick={handleCreateEpic}
          >
            {addingEpic ? "Creating..." : "Create Epic"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Story Dialog */}
      <Dialog fullWidth maxWidth="sm" open={storyDialogOpen} onClose={handleCloseStoryDialog}>
        <DialogTitle>Add New Story (User Story)</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            disabled={addingStory}
            error={!!storyError}
            helperText={storyError}
            label="Story Name"
            margin="dense"
            sx={{ mb: 2 }}
            value={storyName}
            onChange={e => setStoryName(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            disabled={addingStory}
            label="Description (optional)"
            margin="dense"
            rows={3}
            value={storyDescription}
            onChange={e => setStoryDescription(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom color="text.secondary" variant="body2">
              Tip: Write user stories in the format &ldquo;As a [persona], I want to [do something]
              so that [benefit]&rdquo;
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button disabled={addingStory} onClick={handleCloseStoryDialog}>
            Cancel
          </Button>
          <Button
            disabled={addingStory}
            startIcon={addingStory ? <CircularProgress size={20} /> : undefined}
            variant="contained"
            onClick={handleCreateStory}
          >
            {addingStory ? "Creating..." : "Create Story"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Release Dialog */}
      <Dialog fullWidth maxWidth="sm" open={releaseDialogOpen} onClose={handleCloseReleaseDialog}>
        <DialogTitle>Add New Release (Swimlane)</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            disabled={addingRelease}
            error={!!releaseError}
            helperText={releaseError}
            label="Release Name"
            margin="dense"
            sx={{ mb: 2 }}
            value={releaseName}
            onChange={e => setReleaseName(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            disabled={addingRelease}
            label="Description (optional)"
            margin="dense"
            rows={3}
            value={releaseDescription}
            onChange={e => setReleaseDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={addingRelease} onClick={handleCloseReleaseDialog}>
            Cancel
          </Button>
          <Button
            disabled={addingRelease}
            startIcon={addingRelease ? <CircularProgress size={20} /> : undefined}
            variant="contained"
            onClick={handleCreateRelease}
          >
            {addingRelease ? "Creating..." : "Create Release"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
