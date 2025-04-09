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
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Issue, Release, IssueStatus, IssuePriority, IssueType } from "@/lib/firebase/models/types";

interface StoryMapProps {
  projectId: string;
  activities: Issue[]; // Backbone items – User Activities/Goals
  epics: Record<string, Issue[]>; // Epics by activity (backbone) ID (User Tasks)
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

  // --------------------------
  // Local state for dialogs, menus, etc.
  // --------------------------
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

  // Add state for story detail dialog
  const [storyDetailDialogOpen, setStoryDetailDialogOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Issue | null>(null);

  // Add state for edit dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Issue | null>(null);
  const [editingItemType, setEditingItemType] = useState<"activity" | "epic" | "story" | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // --------------------------
  // Handlers for Move Issue Menu
  // --------------------------
  const handleOpenMoveMenu = (event: React.MouseEvent<HTMLElement>, storyId: string) => {
    event.stopPropagation();
    setMoveMenuAnchorEl(event.currentTarget);
    setSelectedStoryId(storyId);
  };

  const handleCloseMoveMenu = () => {
    setMoveMenuAnchorEl(null);
    setSelectedStoryId(null);
  };

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

  // --------------------------
  // Handlers for Activity Dialog
  // --------------------------
  const handleOpenActivityDialog = () => {
    setActivityDialogOpen(true);
    setActivityName("");
    setActivityDescription("");
    setActivityError(null);
  };

  const handleCloseActivityDialog = () => {
    setActivityDialogOpen(false);
  };

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

  // --------------------------
  // Handlers for Epic Dialog
  // --------------------------
  const handleOpenEpicDialog = (activityId: string) => {
    setSelectedActivityId(activityId);
    setEpicDialogOpen(true);
    setEpicName("");
    setEpicDescription("");
    setEpicError(null);
  };

  const handleCloseEpicDialog = () => {
    setEpicDialogOpen(false);
    setSelectedActivityId(null);
  };

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

  // --------------------------
  // Handlers for Story Dialog
  // --------------------------
  const handleOpenStoryDialog = (epicId: string) => {
    setSelectedParentId(epicId);
    setStoryDialogOpen(true);
    setStoryName("");
    setStoryDescription("");
    setStoryError(null);
  };

  const handleCloseStoryDialog = () => {
    setStoryDialogOpen(false);
    setSelectedParentId(null);
  };

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

  // --------------------------
  // Handlers for Release Dialog
  // --------------------------
  const handleOpenReleaseDialog = () => {
    setReleaseDialogOpen(true);
    setReleaseName("");
    setReleaseDescription("");
    setReleaseError(null);
  };

  const handleCloseReleaseDialog = () => {
    setReleaseDialogOpen(false);
  };

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

  // --------------------------
  // Add handler for opening story detail dialog
  // --------------------------
  const handleOpenStoryDetail = (story: Issue) => {
    setSelectedStory(story);
    setStoryDetailDialogOpen(true);
  };

  const handleCloseStoryDetail = () => {
    setStoryDetailDialogOpen(false);
    setSelectedStory(null);
  };

  // --------------------------
  // Add handlers for opening items for editing
  // --------------------------
  const handleOpenItemForEdit = (item: Issue, type: "activity" | "epic" | "story") => {
    setEditingItem(item);
    setEditingItemType(type);
    setEditName(item.name);
    setEditDescription(item.description || "");
    setEditingError(null);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingItem(null);
    setEditingItemType(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editingItemType) {
      return;
    }

    if (!editName.trim()) {
      setEditingError(`${editingItemType} name is required`);
      return;
    }

    try {
      setIsEditing(true);
      setEditingError(null);

      // Here you would call your update function
      // For now, we'll just log the edit
      console.log(`Editing ${editingItemType}:`, {
        id: editingItem.id,
        name: editName,
        description: editDescription,
      });

      // TODO: Add actual update functionality
      // await onUpdateItem(editingItem.id, editName, editDescription);

      handleCloseEditDialog();
    } catch (err) {
      setEditingError((err as Error).message || `Failed to update ${editingItemType}`);
    } finally {
      setIsEditing(false);
    }
  };

  // --------------------------
  // Helper functions for color coding
  // --------------------------
  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.TO_DO:
        return "#e0e0e0";
      case IssueStatus.IN_PROGRESS:
        return "#bbdefb";
      case IssueStatus.DONE:
        return "#c8e6c9";
      default:
        return "#e0e0e0";
    }
  };

  const getPriorityColor = (priority: IssuePriority) => {
    switch (priority) {
      case IssuePriority.HIGH:
        return "#f44336";
      case IssuePriority.MEDIUM:
        return "#ff9800";
      case IssuePriority.LOW:
        return "#4caf50";
      default:
        return "#ff9800";
    }
  };

  // --------------------------
  // Reusable Card Components
  // --------------------------
  const StoryMapCard = ({
    type,
    item,
    onAction,
    onClick,
    children,
    isAddCard = false,
  }: {
    type: "activity" | "epic" | "story" | "blank" | "release";
    item?: Issue;
    onAction?: (e: React.MouseEvent<HTMLElement>, id: string) => void;
    onClick?: () => void;
    children?: React.ReactNode;
    isAddCard?: boolean;
  }) => {
    // Card styling based on type
    const cardStyles = {
      activity: {
        bgcolor: theme.palette.primary.main,
        color: "white",
        height: "60px",
        width: "100px",
      },
      epic: {
        bgcolor: "#00acc1",
        color: "white",
        height: "60px",
        width: "100px",
      },
      story: {
        bgcolor: "white",
        color: "text.primary",
        height: "60px",
        width: "100px",
        border: "1px solid #e0e0e0",
        borderLeft: item ? `4px solid ${getPriorityColor(item?.priority)}` : undefined,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      },
      blank: {
        bgcolor: "white",
        color: "text.secondary",
        height: "60px",
        width: "100px",
        border: "1px dashed #bdbdbd",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      },
    };

    if (isAddCard) {
      return (
        <Card
          sx={{
            ...cardStyles.blank,
            mb: 1,
            cursor: "pointer",
            "&:hover": {
              bgcolor: theme.palette.action.hover,
              transition: "background-color 0.2s ease-in-out",
            },
          }}
          onClick={onClick}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AddIcon fontSize="small" />
            <Typography variant="caption">{`Add ${type}`}</Typography>
          </Box>
        </Card>
      );
    }

    return (
      <Card
        sx={{
          ...(cardStyles[type] || cardStyles.blank),
          mb: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          cursor: onClick ? "pointer" : "default",
          "&:hover": onClick
            ? {
                boxShadow: 3,
                transition: "box-shadow 0.2s ease-in-out",
              }
            : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              variant={type === "activity" ? "subtitle1" : "body2"}
            >
              {item?.name}
            </Typography>
            {onAction && item && (
              <IconButton
                size="small"
                sx={{ mt: -0.5, mr: -0.5 }}
                onClick={e => {
                  e.stopPropagation(); // Prevent card click when clicking the menu
                  onAction(e, item.id);
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          {children}
        </CardContent>
      </Card>
    );
  };

  // --------------------------
  // Rendering functions for Story cards
  // --------------------------
  const renderStoryCard = (story: Issue) => (
    <StoryMapCard
      key={story.id}
      item={story}
      type="story"
      onAction={handleOpenMoveMenu}
      onClick={() => handleOpenItemForEdit(story, "story")}
    >
      {story.status !== IssueStatus.TO_DO && (
        <Chip
          label={story.status}
          size="small"
          sx={{
            mt: 1,
            fontSize: "0.7rem",
            bgcolor: getStatusColor(story.status),
            height: "18px",
          }}
        />
      )}
    </StoryMapCard>
  );

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
      {/* Header Actions */}
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

      {/* Main Story Map Structure */}
      <Paper
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflowX: "auto",
        }}
      >
        <Box sx={{ minWidth: activities.length * 250 }}>
          {/* Activities Row */}
          <Box
            sx={{
              display: "flex",
              mb: 2,
            }}
          >
            {activities.map(activity => (
              <Box key={activity.id} sx={{ mx: 1 }}>
                <StoryMapCard
                  item={activity}
                  type="activity"
                  onClick={() => handleOpenItemForEdit(activity, "activity")}
                >
                  {/* Activity card has no additional content */}
                </StoryMapCard>

                {/* Epics Row - Horizontal */}
                <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 2 }}>
                  {epics[activity.id] &&
                    epics[activity.id].map(epic => (
                      <Box key={epic.id} sx={{ flex: 1, minWidth: 0 }}>
                        <StoryMapCard
                          item={epic}
                          type="epic"
                          onClick={() => handleOpenItemForEdit(epic, "epic")}
                        >
                          {/* Epic card has no additional content */}
                        </StoryMapCard>

                        {/* Stories Column - Vertical under each epic */}
                        <Box sx={{ mb: 2 }}>
                          {issues[epic.id] && issues[epic.id].length > 0 ? (
                            issues[epic.id].map(story => renderStoryCard(story))
                          ) : (
                            <></>
                          )}
                          <StoryMapCard
                            isAddCard={true}
                            type="story"
                            onClick={() => handleOpenStoryDialog(epic.id)}
                          />
                        </Box>
                      </Box>
                    ))}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <StoryMapCard
                      isAddCard={true}
                      type="epic"
                      onClick={() => handleOpenEpicDialog(activity.id)}
                    />
                  </Box>
                </Box>
              </Box>
            ))}

            {/* Add Activity Card */}
            <Box
              sx={{
                width: 100,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                pt: 1,
              }}
            >
              <StoryMapCard isAddCard={true} type="activity" onClick={handleOpenActivityDialog} />
            </Box>
          </Box>

          {/* Release Management Section */}
          <Box sx={{ mt: 4 }}>
            {releases.length > 0 && (
              <Typography sx={{ mb: 2, mt: 2 }} variant="h6">
                Release Swimlanes
              </Typography>
            )}
            {releases.map(release => (
              <Box
                key={release.id}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  mb: 3,
                  pb: 3,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box
                  sx={{
                    width: 220,
                    flexShrink: 0,
                    pr: 2,
                    borderRight: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      border: `1px solid ${theme.palette.primary.main}`,
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      backgroundColor: theme.palette.primary.light + "10",
                    }}
                  >
                    <Typography fontWeight="bold" variant="subtitle2">
                      {release.name}
                    </Typography>
                    {release.description && (
                      <Typography
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                        variant="caption"
                      >
                        {release.description}
                      </Typography>
                    )}
                  </Paper>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 2,
                    flexGrow: 1,
                    pl: 2,
                    overflowX: "auto",
                    backgroundColor: theme.palette.background.default + "50",
                  }}
                >
                  {activities.map(activity => (
                    <Box
                      key={`release-${release.id}-activity-${activity.id}`}
                      sx={{ width: 220, mx: 1 }}
                    >
                      {epics[activity.id] &&
                        epics[activity.id].map(epic => {
                          const releaseStories = (issues[epic.id] || []).filter(
                            story => story.releaseId === release.id
                          );
                          return releaseStories.length > 0 ? (
                            <Box key={`release-${release.id}-epic-${epic.id}`} sx={{ mb: 2 }}>
                              <Typography
                                sx={{ display: "block", mb: 0.5, color: "text.secondary" }}
                                variant="caption"
                              >
                                {epic.name}
                              </Typography>
                              {releaseStories.map(story => renderStoryCard(story))}
                            </Box>
                          ) : null;
                        })}
                    </Box>
                  ))}
                  <Box sx={{ width: 50 }} />
                </Box>
              </Box>
            ))}
            {releases.length > 0 ? (
              <Button
                startIcon={<AddIcon />}
                sx={{ alignSelf: "flex-start", mt: 1 }}
                variant="outlined"
                onClick={handleOpenReleaseDialog}
              >
                Add Release
              </Button>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  borderTop: `1px dashed ${theme.palette.divider}`,
                  mt: 2,
                }}
              >
                <Typography gutterBottom color="text.secondary" variant="body1">
                  No releases defined yet
                </Typography>
                <Typography paragraph color="text.secondary" sx={{ mb: 2 }} variant="body2">
                  Add your first release to organize stories into delivery increments
                </Typography>
                <StoryMapCard isAddCard={true} type="release" onClick={handleOpenReleaseDialog} />
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

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

      {/* Story Detail Dialog */}
      <Dialog fullWidth maxWidth="md" open={storyDetailDialogOpen} onClose={handleCloseStoryDetail}>
        {selectedStory && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">{selectedStory.name}</Typography>
                <Chip
                  label={selectedStory.status}
                  size="small"
                  sx={{ bgcolor: getStatusColor(selectedStory.status) }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom color="text.secondary" variant="subtitle2">
                  Description
                </Typography>
                <Typography variant="body2">
                  {selectedStory.description || "No description provided."}
                </Typography>
              </Box>

              {selectedStory.acceptanceCriteria && (
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom color="text.secondary" variant="subtitle2">
                    Acceptance Criteria
                  </Typography>
                  <Typography variant="body2">{selectedStory.acceptanceCriteria}</Typography>
                </Box>
              )}

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ minWidth: "120px", mb: 2 }}>
                  <Typography color="text.secondary" variant="caption">
                    Priority
                  </Typography>
                  <Chip
                    label={selectedStory.priority}
                    size="small"
                    sx={{
                      bgcolor: getPriorityColor(selectedStory.priority) + "20",
                      color: getPriorityColor(selectedStory.priority),
                      fontWeight: "bold",
                    }}
                  />
                </Box>

                {selectedStory.assignee && (
                  <Box sx={{ minWidth: "120px", mb: 2 }}>
                    <Typography color="text.secondary" variant="caption">
                      Assignee
                    </Typography>
                    <Typography variant="body2">{selectedStory.assignee}</Typography>
                  </Box>
                )}

                {selectedStory.releaseId && (
                  <Box sx={{ minWidth: "120px", mb: 2 }}>
                    <Typography color="text.secondary" variant="caption">
                      Release
                    </Typography>
                    <Typography variant="body2">
                      {releases.find(r => r.id === selectedStory.releaseId)?.name || "Unknown"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseStoryDetail}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Dialog */}
      <Dialog fullWidth maxWidth="sm" open={editDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>
          {editingItemType &&
            `Edit ${editingItemType.charAt(0).toUpperCase() + editingItemType.slice(1)}`}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            disabled={isEditing}
            error={!!editingError}
            helperText={editingError}
            label="Name"
            margin="dense"
            sx={{ mb: 2 }}
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            disabled={isEditing}
            label="Description"
            margin="dense"
            rows={3}
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
          />

          {/* Add additional fields for stories */}
          {editingItemType === "story" && editingItem && (
            <>
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  Additional Details
                </Typography>
              </Box>

              {/* Status dropdown */}
              <TextField
                fullWidth
                select
                disabled={isEditing}
                label="Status"
                margin="dense"
                sx={{ mb: 2 }}
                value={editingItem.status || IssueStatus.TO_DO}
              >
                {Object.values(IssueStatus).map(status => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>

              {/* Priority dropdown */}
              <TextField
                fullWidth
                select
                disabled={isEditing}
                label="Priority"
                margin="dense"
                sx={{ mb: 2 }}
                value={editingItem.priority || IssuePriority.MEDIUM}
              >
                {Object.values(IssuePriority).map(priority => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>

              {/* Release dropdown */}
              <TextField
                fullWidth
                select
                disabled={isEditing}
                label="Release"
                margin="dense"
                value={editingItem.releaseId || ""}
              >
                <MenuItem value="">No Release</MenuItem>
                {releases.map(release => (
                  <MenuItem key={release.id} value={release.id}>
                    {release.name}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={isEditing} onClick={handleCloseEditDialog}>
            Cancel
          </Button>
          <Button
            disabled={isEditing}
            startIcon={isEditing ? <CircularProgress size={20} /> : undefined}
            variant="contained"
            onClick={handleSaveEdit}
          >
            {isEditing ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
