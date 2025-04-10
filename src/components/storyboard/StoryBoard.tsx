import React, { useState, useCallback, useMemo, memo } from "react";
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
import { updateIssue } from "@/lib/firebase/firestore";

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
      storyPoints?: number;
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

// Extract dialogs to separate components
type ActivityDialogProps = {
  open: boolean;
  onClose: () => void;
  onAddActivity: (name: string, description?: string) => Promise<string>;
};

export const ActivityDialog = ({ open, onClose, onAddActivity }: ActivityDialogProps) => {
  const [activityName, setActivityName] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

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
      onClose();
    } catch (err) {
      setActivityError((err as Error).message || "Failed to create activity");
    } finally {
      setAddingActivity(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
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
        <Button disabled={addingActivity} onClick={onClose}>
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
  );
};

// Extract Epic dialog to a separate component
type EpicDialogProps = {
  open: boolean;
  onClose: () => void;
  onAddEpic: (backboneId: string, name: string, description?: string) => Promise<string>;
  activityId: string | null;
};

const EpicDialog = ({ open, onClose, onAddEpic, activityId }: EpicDialogProps) => {
  const [epicName, setEpicName] = useState("");
  const [epicDescription, setEpicDescription] = useState("");
  const [addingEpic, setAddingEpic] = useState(false);
  const [epicError, setEpicError] = useState<string | null>(null);

  const handleCreateEpic = async () => {
    if (!activityId) {
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
      await onAddEpic(activityId, epicName, epicDescription.trim() ? epicDescription : undefined);
      onClose();
    } catch (err) {
      setEpicError((err as Error).message || "Failed to create epic");
    } finally {
      setAddingEpic(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
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
        <Button disabled={addingEpic} onClick={onClose}>
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
  );
};

// Extract Story dialog component
type StoryDialogProps = {
  open: boolean;
  onClose: () => void;
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
      storyPoints?: number;
    }
  ) => Promise<string>;
  epicId: string | null;
};

const StoryDialog = ({ open, onClose, onAddStory, epicId }: StoryDialogProps) => {
  const [storyName, setStoryName] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
  const [addingStory, setAddingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  const handleCreateStory = async () => {
    if (!epicId) {
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
      await onAddStory(epicId, storyName, {
        description: storyDescription.trim() ? storyDescription : undefined,
        storyPoints: storyPoints,
      });
      onClose();
    } catch (err) {
      setStoryError((err as Error).message || "Failed to create story");
    } finally {
      setAddingStory(false);
    }
  };

  // Helper function to handle numeric input for story points
  const handleStoryPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setStoryPoints(undefined);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setStoryPoints(numValue);
      }
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
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

        <TextField
          fullWidth
          disabled={addingStory}
          InputProps={{
            inputProps: { min: 0 },
          }}
          label="Story Points"
          margin="dense"
          sx={{ mt: 2, mb: 2 }}
          type="number"
          value={storyPoints === undefined ? "" : storyPoints}
          onChange={handleStoryPointsChange}
        />

        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom color="text.secondary" variant="body2">
            Tip: Write user stories in the format As a [persona], I want to [do something] so that
            [benefit]
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button disabled={addingStory} onClick={onClose}>
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
  );
};

// Extract Release dialog component
type ReleaseDialogProps = {
  open: boolean;
  onClose: () => void;
  onAddRelease: (
    name: string,
    options?: {
      description?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) => Promise<string>;
};

const ReleaseDialog = ({ open, onClose, onAddRelease }: ReleaseDialogProps) => {
  const [releaseName, setReleaseName] = useState("");
  const [releaseDescription, setReleaseDescription] = useState("");
  const [addingRelease, setAddingRelease] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);

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
      onClose();
    } catch (err) {
      setReleaseError((err as Error).message || "Failed to create release");
    } finally {
      setAddingRelease(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
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
        <Button disabled={addingRelease} onClick={onClose}>
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
  );
};

// Extract StoryDetail dialog component
type StoryDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  story: Issue | null;
  releases: Release[];
  getStatusColor: (status: IssueStatus) => string;
  getPriorityColor: (priority: IssuePriority) => string;
};

const StoryDetailDialog = ({
  open,
  onClose,
  story,
  releases,
  getStatusColor,
  getPriorityColor,
}: StoryDetailDialogProps) => {
  if (!story) {
    return null;
  }

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">{story.name}</Typography>
          <Chip label={story.status} size="small" sx={{ bgcolor: getStatusColor(story.status) }} />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom color="text.secondary" variant="subtitle2">
            Description
          </Typography>
          <Typography variant="body2">{story.description || "No description provided."}</Typography>
        </Box>

        {story.acceptanceCriteria && (
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom color="text.secondary" variant="subtitle2">
              Acceptance Criteria
            </Typography>
            <Typography variant="body2">{story.acceptanceCriteria}</Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ minWidth: "120px", mb: 2 }}>
            <Typography color="text.secondary" variant="caption">
              Priority
            </Typography>
            <Chip
              label={story.priority}
              size="small"
              sx={{
                bgcolor: getPriorityColor(story.priority) + "20",
                color: getPriorityColor(story.priority),
                fontWeight: "bold",
              }}
            />
          </Box>

          {story.storyPoints !== undefined && (
            <Box sx={{ minWidth: "120px", mb: 2 }}>
              <Typography color="text.secondary" variant="caption">
                Story Points
              </Typography>
              <Typography fontWeight="bold" variant="body2">
                {story.storyPoints}
              </Typography>
            </Box>
          )}

          {story.assignee && (
            <Box sx={{ minWidth: "120px", mb: 2 }}>
              <Typography color="text.secondary" variant="caption">
                Assignee
              </Typography>
              <Typography variant="body2">{story.assignee}</Typography>
            </Box>
          )}

          {story.releaseId && (
            <Box sx={{ minWidth: "120px", mb: 2 }}>
              <Typography color="text.secondary" variant="caption">
                Release
              </Typography>
              <Typography variant="body2">
                {releases.find(r => r.id === story.releaseId)?.name || "Unknown"}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Extract EditItem dialog component
type EditItemDialogProps = {
  open: boolean;
  onClose: () => void;
  item: Issue | null;
  itemType: "activity" | "epic" | "story" | null;
  releases: Release[];
  onUpdateItem?: (item: Issue, updatedData: Partial<Issue>) => Promise<void>;
};

const EditItemDialog = ({
  open,
  onClose,
  item,
  itemType,
  releases,
  onUpdateItem,
}: EditItemDialogProps) => {
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<IssueStatus>(IssueStatus.TO_DO);
  const [editPriority, setEditPriority] = useState<IssuePriority>(IssuePriority.MEDIUM);
  const [editReleaseId, setEditReleaseId] = useState<string>("");
  const [editStoryPoints, setEditStoryPoints] = useState<number | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      setEditName(item.name);
      setEditDescription(item.description || "");
      setEditStatus(item.status || IssueStatus.TO_DO);
      setEditPriority(item.priority || IssuePriority.MEDIUM);
      setEditReleaseId(item.releaseId || "");
      setEditStoryPoints(item.storyPoints || null);
      setEditingError(null);
    }
  }, [item]);

  const handleSaveEdit = async () => {
    if (!item || !itemType || !onUpdateItem) {
      return;
    }

    if (!editName.trim()) {
      setEditingError(`${itemType} name is required`);
      return;
    }

    try {
      setIsEditing(true);
      setEditingError(null);

      const updatedData: Partial<Issue> = {
        name: editName,
        description: editDescription,
      };

      // Add additional fields for stories
      if (itemType === "story") {
        updatedData.status = editStatus;
        updatedData.priority = editPriority;
        updatedData.releaseId = editReleaseId || null;
        updatedData.storyPoints = editStoryPoints;
      }

      await onUpdateItem(item, updatedData);
      onClose();
    } catch (err) {
      setEditingError((err as Error).message || `Failed to update ${itemType}`);
    } finally {
      setIsEditing(false);
    }
  };

  // Helper function to handle numeric input for story points
  const handleStoryPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setEditStoryPoints(undefined);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setEditStoryPoints(numValue);
      }
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>
        {itemType && `Edit ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
      </DialogTitle>
      <DialogContent>
        {editingError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {editingError}
          </Alert>
        )}
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
        {itemType === "story" && item && (
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
              value={editStatus}
              onChange={e => setEditStatus(e.target.value as IssueStatus)}
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
              value={editPriority}
              onChange={e => setEditPriority(e.target.value as IssuePriority)}
            >
              {Object.values(IssuePriority).map(priority => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </TextField>

            {/* Story Points field */}
            <TextField
              fullWidth
              disabled={isEditing}
              InputProps={{
                inputProps: { min: 0 },
              }}
              label="Story Points"
              margin="dense"
              sx={{ mb: 2 }}
              type="number"
              value={editStoryPoints === undefined ? "" : editStoryPoints}
              onChange={handleStoryPointsChange}
            />

            {/* Release dropdown */}
            <TextField
              fullWidth
              select
              disabled={isEditing}
              label="Release"
              margin="dense"
              value={editReleaseId}
              onChange={e => setEditReleaseId(e.target.value)}
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
        <Button disabled={isEditing} onClick={onClose}>
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
  );
};

// Extract ReleaseDetail dialog component
type ReleaseDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  release: Release | null;
  onUpdateRelease?: (release: Release, updatedData: Partial<Release>) => Promise<void>;
};

const ReleaseDetailDialog = ({
  open,
  onClose,
  release,
  onUpdateRelease,
}: ReleaseDetailDialogProps) => {
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when release changes
  React.useEffect(() => {
    if (release) {
      setEditName(release.name);
      setEditDescription(release.description || "");
      setEditStartDate(
        release.startDate ? new Date(release.startDate).toISOString().split("T")[0] : ""
      );
      setEditEndDate(release.endDate ? new Date(release.endDate).toISOString().split("T")[0] : "");
      setEditingError(null);
    }
  }, [release]);

  const handleSaveEdit = async () => {
    if (!release || !onUpdateRelease) {
      return;
    }

    if (!editName.trim()) {
      setEditingError("Release name is required");
      return;
    }

    try {
      setIsEditing(true);
      setEditingError(null);

      const updatedData: Partial<Release> = {
        name: editName,
        description: editDescription,
      };

      if (editStartDate) {
        updatedData.startDate = new Date(editStartDate);
      }

      if (editEndDate) {
        updatedData.endDate = new Date(editEndDate);
      }

      await onUpdateRelease(release, updatedData);
      onClose();
    } catch (err) {
      setEditingError((err as Error).message || "Failed to update release");
    } finally {
      setIsEditing(false);
    }
  };

  if (!release) {
    return null;
  }

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>Edit Release</DialogTitle>
      <DialogContent>
        {editingError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {editingError}
          </Alert>
        )}
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

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            disabled={isEditing}
            InputLabelProps={{ shrink: true }}
            label="Start Date"
            margin="dense"
            type="date"
            value={editStartDate}
            onChange={e => setEditStartDate(e.target.value)}
          />

          <TextField
            fullWidth
            disabled={isEditing}
            InputLabelProps={{ shrink: true }}
            label="End Date"
            margin="dense"
            type="date"
            value={editEndDate}
            onChange={e => setEditEndDate(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button disabled={isEditing} onClick={onClose}>
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
  );
};

// Create a memoized story card component
const MemoizedStoryCard = memo(
  ({
    story,
    getStatusColor,
    getPriorityColor,
    handleOpenMoveMenu,
    handleOpenItemForEdit,
  }: {
    story: Issue;
    getStatusColor: (status: IssueStatus) => string;
    getPriorityColor: (priority: IssuePriority) => string;
    handleOpenMoveMenu: (event: React.MouseEvent<HTMLElement>, storyId: string) => void;
    handleOpenItemForEdit: (item: Issue, type: "activity" | "epic" | "story") => void;
  }) => {
    const theme = useTheme();

    // Card styling based on type
    const cardStyles = {
      bgcolor: "white",
      color: "text.primary",
      height: "60px",
      width: "100px",
      border: "1px solid #e0e0e0",
      borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      mb: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      cursor: "pointer",
      "&:hover": {
        boxShadow: 3,
        transition: "box-shadow 0.2s ease-in-out",
      },
    };

    return (
      <Card sx={cardStyles} onClick={() => handleOpenItemForEdit(story, "story")}>
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              variant="body2"
            >
              {story.name}
            </Typography>
            <IconButton
              size="small"
              sx={{ mt: -0.5, mr: -0.5 }}
              onClick={e => {
                e.stopPropagation(); // Prevent card click when clicking the menu
                handleOpenMoveMenu(e, story.id);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 1 }}
          >
            {story.status !== IssueStatus.TO_DO && (
              <Chip
                label={story.status}
                size="small"
                sx={{
                  fontSize: "0.7rem",
                  bgcolor: getStatusColor(story.status),
                  height: "18px",
                }}
              />
            )}
            {story.storyPoints !== undefined && (
              <Chip
                label={story.storyPoints}
                size="small"
                sx={{
                  ml: "auto",
                  fontSize: "0.7rem",
                  height: "18px",
                  fontWeight: "bold",
                  bgcolor: theme.palette.grey[200],
                  minWidth: "18px",
                  borderRadius: "50%",
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

// Add displayName to fix the linter warning
MemoizedStoryCard.displayName = "MemoizedStoryCard";

// Create a memoized release card component
const MemoizedReleaseCard = memo(
  ({
    release,
    handleOpenReleaseForEdit,
  }: {
    release: Release;
    handleOpenReleaseForEdit: (release: Release) => void;
  }) => {
    const theme = useTheme();

    // Format dates for display
    const formatDate = (date: Date | undefined) => {
      if (!date) {
        return "";
      }
      return new Date(date).toLocaleDateString();
    };

    // Card styling
    const cardStyles = {
      bgcolor: theme.palette.background.paper,
      color: "text.primary",
      border: `1px solid ${theme.palette.primary.main}`,
      borderLeft: `4px solid ${theme.palette.primary.main}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      p: 1,
      mb: 1,
      cursor: "pointer",
      "&:hover": {
        boxShadow: 3,
        transition: "box-shadow 0.2s ease-in-out",
      },
    };

    return (
      <Card sx={cardStyles} onClick={() => handleOpenReleaseForEdit(release)}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight="bold" variant="subtitle1">
            {release.name}
          </Typography>
        </Box>

        {(release.startDate || release.endDate) && (
          <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center" }}>
            {release.startDate && (
              <Chip
                label={`Start: ${formatDate(release.startDate)}`}
                size="small"
                sx={{ bgcolor: theme.palette.grey[100] }}
              />
            )}
            {release.endDate && (
              <Chip
                label={`End: ${formatDate(release.endDate)}`}
                size="small"
                sx={{ bgcolor: theme.palette.grey[100] }}
              />
            )}
          </Box>
        )}

        {release.description && (
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: "0.8rem" }} variant="body2">
            {release.description}
          </Typography>
        )}
      </Card>
    );
  }
);

// Add displayName to fix the linter warning
MemoizedReleaseCard.displayName = "MemoizedReleaseCard";

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
  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);

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

  // Add state for updating issues
  const [updatingIssue, setUpdatingIssue] = useState(false);

  // Add state for release detail dialog
  const [releaseDetailDialogOpen, setReleaseDetailDialogOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);

  // Add handler for updating issues
  const handleUpdateIssue = useCallback(async (issue: Issue, updatedData: Partial<Issue>) => {
    try {
      setUpdatingIssue(true);

      // Call the Firestore updateIssue function
      await updateIssue(issue.id, updatedData);

      // No need to update local state manually anymore
      // The real-time listener in useStoryBoard will handle that
      console.log(`Updated ${issue.type.toLowerCase()}: ${issue.id}`, updatedData);
    } catch (error) {
      console.error("Error updating issue:", error);
      throw error;
    } finally {
      setUpdatingIssue(false);
    }
  }, []);

  // --------------------------
  // Memoized handler functions to avoid unnecessary rerenders
  // --------------------------
  const handleOpenMoveMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>, storyId: string) => {
      event.stopPropagation();
      setMoveMenuAnchorEl(event.currentTarget);
      setSelectedStoryId(storyId);
    },
    []
  );

  const handleCloseMoveMenu = useCallback(() => {
    setMoveMenuAnchorEl(null);
    setSelectedStoryId(null);
  }, []);

  const handleMoveStory = useCallback(
    async (releaseId: string | null) => {
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
    },
    [selectedStoryId, onMoveIssue, handleCloseMoveMenu]
  );

  // Handler for Epic Dialog
  const handleOpenEpicDialog = useCallback((activityId: string) => {
    setSelectedActivityId(activityId);
    setEpicDialogOpen(true);
  }, []);

  const handleCloseEpicDialog = useCallback(() => {
    setEpicDialogOpen(false);
    setSelectedActivityId(null);
  }, []);

  // Handler for Story Dialog
  const handleOpenStoryDialog = useCallback((epicId: string) => {
    setSelectedParentId(epicId);
    setStoryDialogOpen(true);
  }, []);

  const handleCloseStoryDialog = useCallback(() => {
    setStoryDialogOpen(false);
    setSelectedParentId(null);
  }, []);

  // Handler for Release Dialog
  const handleOpenReleaseDialog = useCallback(() => {
    setReleaseDialogOpen(true);
  }, []);

  const handleCloseReleaseDialog = useCallback(() => {
    setReleaseDialogOpen(false);
  }, []);

  // Handler for Story Detail
  const handleOpenStoryDetail = useCallback((story: Issue) => {
    setSelectedStory(story);
    setStoryDetailDialogOpen(true);
  }, []);

  const handleCloseStoryDetail = useCallback(() => {
    setStoryDetailDialogOpen(false);
    setSelectedStory(null);
  }, []);

  // Handler for editing items
  const handleOpenItemForEdit = useCallback((item: Issue, type: "activity" | "epic" | "story") => {
    setEditingItem(item);
    setEditingItemType(type);
    setEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditingItem(null);
    setEditingItemType(null);
  }, []);

  // Handler for Release Detail
  const handleOpenReleaseForEdit = useCallback((release: Release) => {
    setSelectedRelease(release);
    setReleaseDetailDialogOpen(true);
  }, []);

  const handleCloseReleaseDetail = useCallback(() => {
    setReleaseDetailDialogOpen(false);
    setSelectedRelease(null);
  }, []);

  // Add handler for updating releases
  const handleUpdateRelease = useCallback(
    async (release: Release, updatedData: Partial<Release>) => {
      try {
        setUpdatingIssue(true);

        // Call the Firestore updateRelease function - you'll need to implement this
        // For now, we'll just log it
        console.log(`Would update release: ${release.id}`, updatedData);
        // TODO: Implement actual release update functionality
        // await updateRelease(release.id, updatedData);

        console.log(`Updated release: ${release.id}`, updatedData);
      } catch (error) {
        console.error("Error updating release:", error);
        throw error;
      } finally {
        setUpdatingIssue(false);
      }
    },
    []
  );

  // --------------------------
  // Memoized Helper functions for color coding
  // --------------------------
  const getStatusColor = useCallback((status: IssueStatus) => {
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
  }, []);

  const getPriorityColor = useCallback((priority: IssuePriority) => {
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
  }, []);

  // --------------------------
  // Memoized rendering function for Story cards
  // --------------------------
  const renderStoryCard = useCallback(
    (story: Issue) => (
      <MemoizedStoryCard
        key={story.id}
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
        handleOpenItemForEdit={handleOpenItemForEdit}
        handleOpenMoveMenu={handleOpenMoveMenu}
        story={story}
      />
    ),
    [getStatusColor, getPriorityColor, handleOpenMoveMenu, handleOpenItemForEdit]
  );

  const StoryMapCard = useCallback(
    ({
      type,
      item,
      onAction,
      onClick,
      children,
      isAddCard = false,
    }: {
      type: "activity" | "epic" | "story" | "blank" | "release" | "placeholder";
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
        release: {
          bgcolor: theme.palette.background.paper,
          color: "text.primary",
          height: "60px",
          width: "120px",
          border: `1px solid ${theme.palette.primary.main}`,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
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

      if (type === "placeholder") {
        return <div style={{ height: "0px", width: "100px" }}></div>;
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
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
            >
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
    },
    [theme, getPriorityColor]
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
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setActivityDialogOpen(true)}
          >
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
                        {/* <Box sx={{ mb: 2 }}>
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
                        </Box> */}
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
              <StoryMapCard
                isAddCard={true}
                type="activity"
                onClick={() => setActivityDialogOpen(true)}
              />
            </Box>
          </Box>
        </Box>
        {releases.map(release => (
          <Box key={release.id} sx={{ minWidth: activities.length * 250 }}>
            {/* Release Header */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 1, p: 1, bgcolor: "#f0f0f0" }}>
              <MemoizedReleaseCard
                handleOpenReleaseForEdit={handleOpenReleaseForEdit}
                release={release}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                mb: 2,
              }}
            >
              {activities.map(activity => (
                <Box key={activity.id} sx={{ mx: 1 }}>
                  {/* Add placeholder for activity */}
                  <StoryMapCard type="placeholder" />

                  {/* Epics Row - Horizontal */}
                  <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 2 }}>
                    {epics[activity.id] &&
                      epics[activity.id].map(epic => (
                        <Box key={epic.id} sx={{ flex: 1, minWidth: 0 }}>
                          {/* Add placeholder for epic */}
                          <StoryMapCard type="placeholder" />
                          {/* Stories Column - Vertical under each epic */}
                          <Box sx={{ mb: 2 }}>
                            {issues[epic.id] && issues[epic.id].length > 0 ? (
                              issues[epic.id]
                                .filter(story => story.releaseId === release.id)
                                .map(story => renderStoryCard(story))
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
                      <StoryMapCard type="placeholder" />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
        {/* Unassigned Stories */}
        <Box sx={{ minWidth: activities.length * 250 }}>
          <Box
            sx={{
              display: "flex",
              mb: 2,
            }}
          >
            {activities.map(activity => (
              <Box key={activity.id} sx={{ mx: 1 }}>
                {/* Add placeholder for activity */}
                <StoryMapCard type="placeholder" />

                {/* Epics Row - Horizontal */}
                <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 2 }}>
                  {epics[activity.id] &&
                    epics[activity.id].map(epic => (
                      <Box key={epic.id} sx={{ flex: 1, minWidth: 0 }}>
                        {/* Add placeholder for epic */}
                        <StoryMapCard type="placeholder" />
                        {/* Stories Column - Vertical under each epic */}
                        <Box sx={{ mb: 2 }}>
                          {issues[epic.id] && issues[epic.id].length > 0 ? (
                            issues[epic.id]
                              .filter(story => !story.releaseId)
                              .map(story => renderStoryCard(story))
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
                    <StoryMapCard type="placeholder" />
                  </Box>
                </Box>
              </Box>
            ))}
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

      {/* Dialog Components */}
      <ActivityDialog
        open={activityDialogOpen}
        onAddActivity={onAddActivity}
        onClose={() => setActivityDialogOpen(false)}
      />

      <EpicDialog
        activityId={selectedActivityId}
        open={epicDialogOpen}
        onAddEpic={onAddEpic}
        onClose={handleCloseEpicDialog}
      />

      <StoryDialog
        epicId={selectedParentId}
        open={storyDialogOpen}
        onAddStory={onAddStory}
        onClose={handleCloseStoryDialog}
      />

      <ReleaseDialog
        open={releaseDialogOpen}
        onAddRelease={onAddRelease}
        onClose={handleCloseReleaseDialog}
      />

      <StoryDetailDialog
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
        open={storyDetailDialogOpen}
        releases={releases}
        story={selectedStory}
        onClose={handleCloseStoryDetail}
      />

      <EditItemDialog
        item={editingItem}
        itemType={editingItemType}
        open={editDialogOpen}
        releases={releases}
        onClose={handleCloseEditDialog}
        onUpdateItem={handleUpdateIssue}
      />

      <ReleaseDetailDialog
        open={releaseDetailDialogOpen}
        release={selectedRelease}
        onClose={handleCloseReleaseDetail}
        onUpdateRelease={handleUpdateRelease}
      />

      {process.env.NODE_ENV === "development" && (
        <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
          <Button
            color="secondary"
            size="small"
            variant="contained"
            onClick={async () => {
              if (activities.length > 0) {
                const testActivity = activities[0];
                console.log("Testing realtime update for:", testActivity.id);
                try {
                  // Add a timestamp to the name to make the change visible
                  const updateData = {
                    name: `${testActivity.name} (updated at ${new Date().toLocaleTimeString()})`,
                  };
                  await updateIssue(testActivity.id, updateData);
                  console.log("Update sent to Firebase, waiting for realtime update...");
                } catch (error) {
                  console.error("Test update failed:", error);
                }
              } else {
                console.log("No activities to test with");
              }
            }}
          >
            Test Realtime Update
          </Button>
        </Box>
      )}
    </Box>
  );
}
