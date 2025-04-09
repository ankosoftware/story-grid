import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DoubleArrowIcon from "@mui/icons-material/DoubleArrow";
import { Issue, Release, IssueStatus, IssuePriority, IssueType } from "@/lib/firebase/models/types";

interface StoryMapProps {
  projectId: string;
  activities: Issue[]; // BACKBONE items - User Activities/Goals
  epics: Record<string, Issue[]>; // Epics by backbone ID (User Tasks)
  issues: Record<string, Issue[]>; // Stories by epic ID
  releases: Release[];
  loading: boolean;
  error: Error | null;
  onAddActivity: (name: string, description?: string) => Promise<string>;
  onAddEpic: (backboneId: string, name: string, description?: string) => Promise<string>;
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

export default function StoryMap({
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
}: StoryMapProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State for dialogs
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [epicName, setEpicName] = useState("");
  const [epicDescription, setEpicDescription] = useState("");
  const [addingEpic, setAddingEpic] = useState(false);
  const [epicError, setEpicError] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [storyName, setStoryName] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [addingStory, setAddingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

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

  // Group stories by release for release bands
  const storiesByRelease: Record<string, Issue[]> = {};

  // Initialize empty arrays for each release
  releases.forEach(release => {
    storiesByRelease[release.id] = [];
  });

  // Add an entry for unassigned stories
  storiesByRelease["unassigned"] = [];

  // Populate stories by release
  Object.values(issues).forEach(issueArray => {
    issueArray.forEach(issue => {
      if (issue.type === IssueType.STORY) {
        if (issue.releaseId && storiesByRelease[issue.releaseId]) {
          storiesByRelease[issue.releaseId].push(issue);
        } else {
          storiesByRelease.unassigned.push(issue);
        }
      }
    });
  });

  return (
    <Box sx={{ width: "100%" }}>
      {/* Story board header with actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, flexWrap: "wrap" }}>
        <Typography component="h2" variant="h5">
          Story Map
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button startIcon={<AddIcon />} variant="contained" onClick={handleOpenActivityDialog}>
            Add Activity
          </Button>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={handleOpenReleaseDialog}>
            Add Release
          </Button>
        </Box>
      </Box>

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
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflowX: "auto",
          }}
        >
          {/* Story Map Layout */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              minWidth: isMobile ? "800px" : "auto", // Force horizontal scroll on mobile
            }}
          >
            {/* Left sidebar with labels */}
            <Box
              sx={{
                width: "150px",
                flexShrink: 0,
                pr: 2,
                borderRight: `1px solid ${theme.palette.divider}`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    transform: "rotate(0deg)",
                    color: theme.palette.primary.main,
                    whiteSpace: "nowrap",
                  }}
                  variant="subtitle1"
                >
                  Backbone
                </Typography>
              </Box>

              <Box
                sx={{
                  bgcolor: "#f5f0ff",
                  py: 2,
                  px: 1,
                  borderRadius: 1,
                  mb: 2,
                  flex: 1,
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      mb: 0.5,
                    }}
                    variant="body2"
                  >
                    User Activities
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  bgcolor: "#fff0f3",
                  py: 2,
                  px: 1,
                  borderRadius: 1,
                  flex: 1,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    mb: 0.5,
                  }}
                  variant="body2"
                >
                  User Stories
                </Typography>
              </Box>
            </Box>

            {/* Main content */}
            <Box sx={{ flex: 1, pl: 2, display: "flex", flexDirection: "column" }}>
              {/* Activities Row */}
              <Box
                sx={{
                  display: "flex",
                  mb: 2,
                  gap: 2,
                  overflowX: "auto",
                  pb: 1,
                }}
              >
                {activities.map(activity => (
                  <Card
                    key={activity.id}
                    sx={{
                      bgcolor: "#0052cc",
                      color: "white",
                      minWidth: "150px",
                      maxWidth: "200px",
                      height: "80px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 1.5,
                        "&:last-child": { pb: 1.5 },
                        textAlign: "center",
                      }}
                    >
                      <Typography sx={{ fontWeight: "bold" }} variant="subtitle1">
                        {activity.name}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                <Box
                  sx={{
                    minWidth: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Tooltip title="Add User Activity">
                    <IconButton
                      color="primary"
                      sx={{
                        border: `1px dashed ${theme.palette.primary.main}`,
                        borderRadius: 1,
                      }}
                      onClick={handleOpenActivityDialog}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Epics (User Tasks) Row */}
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    overflowX: "auto",
                    pb: 1,
                  }}
                >
                  {activities.map(activity => (
                    <Box
                      key={`epics-${activity.id}`}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        minWidth: "150px",
                        maxWidth: "200px",
                        gap: 1,
                      }}
                    >
                      {/* Epics for this activity */}
                      {epics[activity.id] &&
                        epics[activity.id].map(epic => (
                          <Card
                            key={epic.id}
                            sx={{
                              bgcolor: "#00b8d9",
                              color: "white",
                              height: "60px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                            }}
                          >
                            <CardContent
                              sx={{
                                p: 1,
                                "&:last-child": { pb: 1 },
                                textAlign: "center",
                              }}
                            >
                              <Typography sx={{ fontWeight: "medium" }} variant="body2">
                                {epic.name}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}

                      {/* Add Epic button */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mt: 0.5,
                        }}
                      >
                        <Tooltip title="Add User Task">
                          <IconButton
                            size="small"
                            sx={{
                              border: `1px dashed ${theme.palette.primary.main}`,
                              borderRadius: 1,
                            }}
                            onClick={() => handleOpenEpicDialog(activity.id)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Releases bands with stories */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {releases.map((release, index) => (
                  <Box
                    key={release.id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      pb: 2,
                      borderBottom:
                        index < releases.length - 1
                          ? `2px solid ${theme.palette.primary.main}`
                          : "none",
                    }}
                  >
                    {/* Release label */}
                    <Box
                      sx={{
                        position: "absolute",
                        right: 0,
                        bottom: -10,
                        zIndex: 2,
                      }}
                    >
                      <Chip
                        color="primary"
                        label={index === 0 ? "MVP" : `Release ${index + 1}`}
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                    </Box>

                    {/* Stories in this release */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        overflowX: "auto",
                        pb: 1,
                        minHeight: "80px",
                      }}
                    >
                      {activities.map(activity => (
                        <Box
                          key={`${activity.id}-${release.id}`}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: "150px",
                            maxWidth: "200px",
                            gap: 1,
                          }}
                        >
                          {/* Stories for this activity's epics in this release */}
                          {epics[activity.id] &&
                            epics[activity.id].map(epic => {
                              // Find stories for this epic that are in this release
                              const epicStories =
                                issues[epic.id]?.filter(story => story.releaseId === release.id) ||
                                [];

                              return epicStories.map(story => (
                                <Card
                                  key={story.id}
                                  sx={{
                                    border: "1px solid #1976d2",
                                    bgcolor: "white",
                                    borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
                                  }}
                                >
                                  <CardContent
                                    sx={{
                                      p: 1,
                                      "&:last-child": { pb: 1 },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                      }}
                                    >
                                      <Typography variant="body2">{story.name}</Typography>
                                      <IconButton
                                        size="small"
                                        sx={{
                                          mt: -0.5,
                                          mr: -0.5,
                                          "&:hover": { bgcolor: "transparent" },
                                        }}
                                        onClick={e => handleOpenMoveMenu(e, story.id)}
                                      >
                                        <MoreVertIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </CardContent>
                                </Card>
                              ));
                            })}

                          {/* Find epics for this activity */}
                          {epics[activity.id] &&
                            epics[activity.id].map(epic => (
                              <Box
                                key={`add-${epic.id}-${release.id}`}
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                <Tooltip title="Add User Story">
                                  <IconButton
                                    size="small"
                                    sx={{
                                      border: `1px dashed ${theme.palette.grey[400]}`,
                                      borderRadius: 1,
                                    }}
                                    onClick={() => {
                                      setSelectedParentId(epic.id);
                                      setStoryDialogOpen(true);
                                    }}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ))}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}

                {/* Add Release button */}
                {releases.length === 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      my: 2,
                    }}
                  >
                    <Button
                      startIcon={<AddIcon />}
                      variant="outlined"
                      onClick={handleOpenReleaseDialog}
                    >
                      Add First Release
                    </Button>
                  </Box>
                )}

                {/* Unassigned stories section */}
                {storiesByRelease.unassigned.length > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      border: `1px dashed ${theme.palette.grey[400]}`,
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        mb: 1,
                        color: theme.palette.text.secondary,
                      }}
                      variant="subtitle2"
                    >
                      Unassigned Stories
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      {storiesByRelease.unassigned.map(story => (
                        <Card
                          key={story.id}
                          sx={{
                            width: { xs: "100%", sm: "200px" },
                            border: "1px solid #e0e0e0",
                            bgcolor: "white",
                            borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
                          }}
                        >
                          <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="body2">{story.name}</Typography>
                              <IconButton
                                size="small"
                                onClick={e => handleOpenMoveMenu(e, story.id)}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Add release button at bottom */}
                {releases.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mt: 1,
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      variant="outlined"
                      onClick={handleOpenReleaseDialog}
                    >
                      Add Release
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
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
        <DialogTitle>Add New Activity/Goal</DialogTitle>
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
        <DialogTitle>Add New User Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            disabled={addingEpic}
            error={!!epicError}
            helperText={epicError}
            label="Task Name"
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
            {addingEpic ? "Creating..." : "Create Task"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Story Dialog */}
      <Dialog fullWidth maxWidth="sm" open={storyDialogOpen} onClose={handleCloseStoryDialog}>
        <DialogTitle>Add New User Story</DialogTitle>
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
              Tip: Write user stories in the format As a [persona], I want to [do something] so that
              [benefit]
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
        <DialogTitle>Add New Release</DialogTitle>
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
