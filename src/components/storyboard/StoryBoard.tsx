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
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import { Issue, Release, IssueStatus, IssuePriority, IssueType } from "@/lib/firebase/models/types";
import { updateIssue, updateRelease, updateReleaseOrder } from "@/lib/firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Define drag item types
const ItemTypes = {
  STORY: "story",
  EPIC: "epic",
};

// Define draggable item interface
interface DragItem {
  type: string;
  id: string;
  parentId: string | null;
  originalIndex: number;
}

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

  // Reset form when dialog closes or opens
  React.useEffect(() => {
    if (open) {
      // Initialize with empty values when opening
      setActivityName("");
      setActivityDescription("");
      setActivityError(null);
    }
  }, [open]);

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

  // Add keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !addingActivity) {
      e.preventDefault();
      handleCreateActivity();
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
          onKeyDown={handleKeyDown}
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
          onKeyDown={e => {
            // Allow shift+enter for new lines in multiline fields
            if (e.key === "Enter" && !e.shiftKey && !addingActivity) {
              e.preventDefault();
              handleCreateActivity();
            }
          }}
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

  // Reset form when dialog closes or opens
  React.useEffect(() => {
    if (open) {
      // Initialize with empty values when opening
      setEpicName("");
      setEpicDescription("");
      setEpicError(null);
    }
  }, [open]);

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

  // Add keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !addingEpic) {
      e.preventDefault();
      handleCreateEpic();
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
          onKeyDown={handleKeyDown}
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
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey && !addingEpic) {
              e.preventDefault();
              handleCreateEpic();
            }
          }}
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
  currentReleaseId?: string | null;
};

const StoryDialog = ({ open, onClose, onAddStory, epicId, currentReleaseId }: StoryDialogProps) => {
  const [storyName, setStoryName] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
  const [addingStory, setAddingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  // Reset form when dialog closes or opens
  React.useEffect(() => {
    if (open) {
      // Initialize with empty values when opening
      setStoryName("");
      setStoryDescription("");
      setStoryPoints(undefined);
      setStoryError(null);
    }
  }, [open]);

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
        releaseId: currentReleaseId || undefined,
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

  // Add keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !addingStory) {
      e.preventDefault();
      handleCreateStory();
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
          onKeyDown={handleKeyDown}
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
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey && !addingStory) {
              e.preventDefault();
              handleCreateStory();
            }
          }}
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
          onKeyDown={handleKeyDown}
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

  // Reset form when dialog closes or opens
  React.useEffect(() => {
    if (open) {
      // Initialize with empty values when opening
      setReleaseName("");
      setReleaseDescription("");
      setReleaseError(null);
    }
  }, [open]);

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

  // Add keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !addingRelease) {
      e.preventDefault();
      handleCreateRelease();
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
          onKeyDown={handleKeyDown}
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
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey && !addingRelease) {
              e.preventDefault();
              handleCreateRelease();
            }
          }}
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
      setEditStoryPoints(null);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setEditStoryPoints(numValue);
      }
    }
  };

  // Add keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isEditing) {
      e.preventDefault();
      handleSaveEdit();
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
          onKeyDown={handleKeyDown}
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
          onKeyDown={handleKeyDown}
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
              onKeyDown={handleKeyDown}
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
              onKeyDown={handleKeyDown}
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
              onKeyDown={handleKeyDown}
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
              onKeyDown={handleKeyDown}
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

// Create a safe converter for Firestore Timestamp to Date
const safeToDate = (timestamp: unknown): Date | undefined => {
  if (!timestamp) {
    return undefined;
  }

  // Check if it's a Firestore Timestamp
  if (timestamp && typeof (timestamp as any).toDate === "function") {
    return (timestamp as any).toDate();
  }

  // Check if it's a Date or can be converted to one
  try {
    return new Date(timestamp as any);
  } catch (error) {
    console.error("Failed to convert to Date:", error);
    return undefined;
  }
};

const ReleaseDetailDialog = ({
  open,
  onClose,
  release,
  onUpdateRelease,
}: ReleaseDetailDialogProps) => {
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when release changes
  React.useEffect(() => {
    if (release) {
      setEditName(release.name);
      setEditDescription(release.description || "");

      // Handle Firestore Timestamp objects using our safe converter
      if (release.startDate) {
        const startDate = safeToDate(release.startDate);
        setEditStartDate(startDate ? startDate.toISOString().split("T")[0] : "");
      } else {
        setEditStartDate("");
      }

      if (release.endDate) {
        const endDate = safeToDate(release.endDate);
        setEditEndDate(endDate ? endDate.toISOString().split("T")[0] : "");
      } else {
        setEditEndDate("");
      }

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

      // Convert string dates to Date objects if they exist
      if (editStartDate) {
        updatedData.startDate = new Date(editStartDate) as any;
      } else {
        updatedData.startDate = null;
      }

      if (editEndDate) {
        updatedData.endDate = new Date(editEndDate) as any;
      } else {
        updatedData.endDate = null;
      }

      await onUpdateRelease(release, updatedData);
      onClose();
    } catch (err) {
      setEditingError((err as Error).message || "Failed to update release");
    } finally {
      setIsEditing(false);
    }
  };

  // Add keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isEditing) {
      e.preventDefault();
      handleSaveEdit();
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
          onKeyDown={handleKeyDown}
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
          onKeyDown={handleKeyDown}
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
            onKeyDown={handleKeyDown}
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
            onKeyDown={handleKeyDown}
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

    // Card styling based on type - more compact
    const cardStyles = {
      bgcolor: "white",
      color: "text.primary",
      height: "50px",
      width: "100px",
      border: "1px solid #e0e0e0",
      borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      mb: 0.5,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      cursor: "pointer",
      borderRadius: 1,
      "&:hover": {
        boxShadow: 3,
        transition: "box-shadow 0.2s ease-in-out",
      },
    };

    return (
      <Card sx={cardStyles} onClick={() => handleOpenItemForEdit(story, "story")}>
        <CardContent sx={{ p: 0.5, "&:last-child": { pb: 0.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: "0.75rem",
                lineHeight: 1.2,
                maxWidth: "70px",
              }}
              variant="body2"
            >
              {story.name}
            </Typography>
            <IconButton
              size="small"
              sx={{ mt: -0.5, mr: -0.5, p: 0.5 }}
              onClick={e => {
                e.stopPropagation();
                handleOpenMoveMenu(e, story.id);
              }}
            >
              <MoreVertIcon sx={{ fontSize: "1rem" }} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mt: 0.5,
            }}
          >
            {story.status !== IssueStatus.TO_DO && (
              <Chip
                label={story.status}
                size="small"
                sx={{
                  fontSize: "0.6rem",
                  bgcolor: getStatusColor(story.status),
                  height: "14px",
                  borderRadius: "7px",
                }}
              />
            )}
            {story.storyPoints !== undefined && (
              <Chip
                label={story.storyPoints}
                size="small"
                sx={{
                  ml: "auto",
                  fontSize: "0.6rem",
                  height: "16px",
                  width: "16px",
                  fontWeight: "bold",
                  bgcolor: theme.palette.grey[200],
                  borderRadius: "50%",
                  p: 0,
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

// Create a draggable story card component
const DraggableStoryCard = memo(
  ({
    story,
    getStatusColor,
    getPriorityColor,
    handleOpenMoveMenu,
    handleOpenItemForEdit,
    handleMoveStoryToEpic,
    index,
  }: {
    story: Issue;
    getStatusColor: (status: IssueStatus) => string;
    getPriorityColor: (priority: IssuePriority) => string;
    handleOpenMoveMenu: (event: React.MouseEvent<HTMLElement>, storyId: string) => void;
    handleOpenItemForEdit: (item: Issue, type: "activity" | "epic" | "story") => void;
    handleMoveStoryToEpic: (storyId: string, newParentId: string) => Promise<void>;
    index: number;
  }) => {
    // Setup drag source
    const [{ isDragging }, drag, preview] = useDrag(
      () => ({
        type: ItemTypes.STORY,
        item: {
          type: ItemTypes.STORY,
          id: story.id,
          parentId: story.parentId || null,
          originalIndex: story.displayOrder || index,
        },
        collect: monitor => ({
          isDragging: monitor.isDragging(),
        }),
        end: (item, monitor) => {
          const dropResult = monitor.getDropResult<{ id: string; type: string }>();
          if (
            item &&
            dropResult &&
            dropResult.type === "epic" &&
            dropResult.id !== story.parentId
          ) {
            // Only move if dropped on a different parent
            handleMoveStoryToEpic(story.id, dropResult.id);
          }
        },
      }),
      [story.id, story.parentId, story.displayOrder, index, handleMoveStoryToEpic]
    );

    // Use refs properly for react-dnd
    const previewRef = React.useRef(null);
    const dragRef = React.useRef(null);

    // Connect the preview and drag refs
    drag(dragRef);
    preview(previewRef);

    return (
      <Box
        ref={previewRef}
        sx={{
          opacity: isDragging ? 0.6 : 1,
          cursor: "move",
          transform: isDragging ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          zIndex: isDragging ? 1000 : 1,
          display: isDragging ? "none" : "block", // Hide the original while dragging
        }}
      >
        <Box ref={dragRef} sx={{ display: "flex", alignItems: "center" }}>
          <DragHandleIcon
            sx={{
              fontSize: "0.9rem",
              color: "text.secondary",
              mr: 0.5,
              visibility: isDragging ? "hidden" : "visible",
            }}
          />
          <MemoizedStoryCard
            key={story.id}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
            handleOpenItemForEdit={handleOpenItemForEdit}
            handleOpenMoveMenu={handleOpenMoveMenu}
            story={story}
          />
        </Box>
      </Box>
    );
  }
);

// Add displayName to fix the linter warning
DraggableStoryCard.displayName = "DraggableStoryCard";

// Create a draggable epic card component
const DraggableEpicCard = memo(
  ({
    epic,
    handleOpenItemForEdit,
    handleMoveEpicToActivity,
  }: {
    epic: Issue;
    handleOpenItemForEdit: (item: Issue, type: "activity" | "epic" | "story") => void;
    handleMoveEpicToActivity: (epicId: string, newParentId: string) => Promise<void>;
  }) => {
    // Setup drag source
    const [{ isDragging }, drag, preview] = useDrag(
      () => ({
        type: ItemTypes.EPIC,
        item: {
          type: ItemTypes.EPIC,
          id: epic.id,
          parentId: epic.parentId || null,
          originalIndex: epic.displayOrder,
        },
        collect: monitor => ({
          isDragging: monitor.isDragging(),
        }),
        end: (item, monitor) => {
          const dropResult = monitor.getDropResult<{ id: string; type: string }>();
          if (
            item &&
            dropResult &&
            dropResult.type === "activity" &&
            dropResult.id !== epic.parentId
          ) {
            // Only move if dropped on a different parent
            handleMoveEpicToActivity(epic.id, dropResult.id);
          }
        },
      }),
      [epic.id, epic.parentId, epic.displayOrder, handleMoveEpicToActivity]
    );

    // Use refs properly for react-dnd
    const previewRef = React.useRef(null);
    const dragRef = React.useRef(null);

    // Connect the preview and drag refs
    drag(dragRef);
    preview(previewRef);

    return (
      <Box
        ref={previewRef}
        sx={{
          opacity: isDragging ? 0.4 : 1,
          cursor: "move",
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box ref={dragRef} sx={{ display: "flex", alignItems: "center" }}>
          <DragHandleIcon
            sx={{
              fontSize: "0.9rem",
              color: "white",
              mr: 0.5,
              visibility: isDragging ? "hidden" : "visible",
            }}
          />
          <Card
            sx={{
              bgcolor: "#00acc1",
              color: "white",
              height: "50px",
              width: "100%",
              borderRadius: 1,
              mb: 0.5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              cursor: "pointer",
              "&:hover": {
                boxShadow: 3,
                transition: "box-shadow 0.2s ease-in-out",
              },
            }}
            onClick={() => handleOpenItemForEdit(epic, "epic")}
          >
            <CardContent sx={{ p: 0.5, pt: 0.5, "&:last-child": { pb: 0.5 } }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
              >
                <Typography
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "0.8rem",
                    lineHeight: 1.2,
                  }}
                  variant="body2"
                >
                  {epic.name}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }
);

// Add displayName to fix the linter warning
DraggableEpicCard.displayName = "DraggableEpicCard";

// Create a droppable container for activities
const DroppableActivityContainer = memo(
  ({ activity, children }: { activity: Issue; children: React.ReactNode }) => {
    const [{ isOver, canDrop }, drop] = useDrop(
      () => ({
        accept: [ItemTypes.EPIC],
        drop: () => ({ id: activity.id, type: "activity" }),
        collect: monitor => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        }),
      }),
      [activity.id]
    );

    const dropRef = React.useRef(null);
    drop(dropRef);

    return (
      <Box
        ref={dropRef}
        sx={{
          p: 1,
          borderRadius: 1,
          background: isOver && canDrop ? "rgba(63, 81, 181, 0.1)" : "transparent",
          border: isOver && canDrop ? "1px dashed #3f51b5" : "1px solid transparent",
        }}
      >
        {children}
      </Box>
    );
  }
);

DroppableActivityContainer.displayName = "DroppableActivityContainer";

// Create a droppable container for epics
const DroppableEpicContainer = memo(
  ({ epic, children }: { epic: Issue; children: React.ReactNode }) => {
    const [{ isOver, canDrop }, drop] = useDrop(
      () => ({
        accept: [ItemTypes.STORY],
        drop: () => ({ id: epic.id, type: "epic" }),
        collect: monitor => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        }),
      }),
      [epic.id]
    );

    const dropRef = React.useRef(null);
    drop(dropRef);

    return (
      <Box
        ref={dropRef}
        sx={{
          p: 1,
          borderRadius: 1,
          transition: "all 0.2s ease",
          background: isOver && canDrop ? "rgba(0, 172, 193, 0.2)" : "transparent",
          border: isOver && canDrop ? "2px dashed #00acc1" : "1px solid transparent",
          boxShadow: isOver && canDrop ? "0px 0px 8px rgba(0, 172, 193, 0.3)" : "none",
        }}
      >
        {children}
      </Box>
    );
  }
);

// Add displayName for DroppableEpicContainer
DroppableEpicContainer.displayName = "DroppableEpicContainer";

// Create a memoized release card component
const MemoizedReleaseCard = memo(
  ({
    release,
    handleOpenReleaseForEdit,
    handleMoveRelease,
    isFirst,
    isLast,
  }: {
    release: Release;
    handleOpenReleaseForEdit: (release: Release) => void;
    handleMoveRelease?: (releaseId: string, direction: "up" | "down") => Promise<void>;
    isFirst?: boolean;
    isLast?: boolean;
  }) => {
    const theme = useTheme();

    // Format dates for display
    const formatDate = (timestamp: unknown) => {
      const date = safeToDate(timestamp);
      if (!date) {
        return "";
      }
      return date.toLocaleDateString();
    };

    // Handle move release
    const handleMove = (direction: "up" | "down", e: React.MouseEvent) => {
      e.stopPropagation();
      if (handleMoveRelease) {
        handleMoveRelease(release.id, direction);
      }
    };

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.primary.main}`,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          borderRadius: 1,
          mb: 0.5,
          p: 0.5,
          "&:hover": {
            boxShadow: 1,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
          <IconButton
            disabled={isFirst}
            size="small"
            sx={{
              opacity: isFirst ? 0.3 : 1,
              color: theme.palette.text.secondary,
              p: 0.5,
            }}
            onClick={e => handleMove("up", e)}
          >
            <Box component="span" sx={{ transform: "rotate(-90deg)", display: "flex" }}>
              <DragIndicatorIcon sx={{ fontSize: "1rem" }} />
            </Box>
          </IconButton>
          <IconButton
            disabled={isLast}
            size="small"
            sx={{
              opacity: isLast ? 0.3 : 1,
              color: theme.palette.text.secondary,
              p: 0.5,
            }}
            onClick={e => handleMove("down", e)}
          >
            <Box component="span" sx={{ transform: "rotate(90deg)", display: "flex" }}>
              <DragIndicatorIcon sx={{ fontSize: "1rem" }} />
            </Box>
          </IconButton>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            cursor: "pointer",
          }}
          onClick={() => handleOpenReleaseForEdit(release)}
        >
          <Typography fontWeight="bold" sx={{ fontSize: "0.85rem" }} variant="body2">
            {release.name}
          </Typography>

          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", mt: 0.25 }}>
            {release.startDate && (
              <Chip
                label={`Start: ${formatDate(release.startDate)}`}
                size="small"
                sx={{
                  bgcolor: theme.palette.grey[100],
                  height: "16px",
                  fontSize: "0.6rem",
                  borderRadius: "8px",
                }}
              />
            )}
            {release.endDate && (
              <Chip
                label={`End: ${formatDate(release.endDate)}`}
                size="small"
                sx={{
                  bgcolor: theme.palette.grey[100],
                  height: "16px",
                  fontSize: "0.6rem",
                  borderRadius: "8px",
                }}
              />
            )}
          </Box>

          {release.description && (
            <Typography
              color="text.secondary"
              sx={{ mt: 0.25, fontSize: "0.7rem" }}
              variant="body2"
            >
              {release.description}
            </Typography>
          )}
        </Box>

        <Box>
          <Tooltip title="Edit release">
            <IconButton
              size="small"
              sx={{ p: 0.5 }}
              onClick={e => {
                e.stopPropagation();
                handleOpenReleaseForEdit(release);
              }}
            >
              <MoreVertIcon sx={{ fontSize: "1rem" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  }
);

// Add displayName to fix the linter warning
MemoizedReleaseCard.displayName = "MemoizedReleaseCard";

// Define the StoryMapCard component outside of the main component to make it accessible to all components
const StoryMapCard = memo(
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
    const theme = useTheme();

    // Card styling based on type
    const cardStyles = {
      activity: {
        bgcolor: theme.palette.primary.main,
        color: "white",
        height: "50px",
        width: "100px",
        borderRadius: 1,
      },
      epic: {
        bgcolor: "#00acc1",
        color: "white",
        height: "50px",
        width: "100px",
        borderRadius: 1,
      },
      story: {
        bgcolor: "white",
        color: "text.primary",
        height: "50px",
        width: "100px",
        border: "1px solid #e0e0e0",
        borderLeft: item ? `4px solid ${getPriorityColor(item?.priority)}` : undefined,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        borderRadius: 1,
      },
      blank: {
        bgcolor: "white",
        color: "text.secondary",
        height: "50px",
        width: "100px",
        border: "1px dashed #bdbdbd",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 1,
      },
      release: {
        bgcolor: theme.palette.background.paper,
        color: "text.primary",
        height: "50px",
        width: "120px",
        border: `1px solid ${theme.palette.primary.main}`,
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        borderRadius: 1,
      },
      placeholder: {
        height: "50px",
        width: "100px",
      },
    };

    if (isAddCard) {
      return (
        <Card
          sx={{
            ...cardStyles.blank,
            mb: 0.5,
            cursor: "pointer",
            "&:hover": {
              bgcolor: theme.palette.action.hover,
              transition: "background-color 0.2s ease-in-out",
            },
          }}
          onClick={onClick}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <AddIcon sx={{ fontSize: "0.9rem" }} />
            <Typography sx={{ fontSize: "0.7rem" }} variant="caption">{`Add ${type}`}</Typography>
          </Box>
        </Card>
      );
    }

    if (type === "placeholder") {
      return <div style={{ height: "50px", width: "100px" }}></div>;
    }

    // Determine justifyContent based on card type
    const justifyContent = type === "activity" || type === "epic" ? "flex-start" : "center";
    const paddingTop = type === "activity" || type === "epic" ? 0.5 : 0;

    return (
      <Card
        sx={{
          ...(cardStyles[type] || cardStyles.blank),
          mb: 0.5,
          display: "flex",
          flexDirection: "column",
          justifyContent: justifyContent,
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
        <CardContent sx={{ p: 0.5, pt: paddingTop, "&:last-child": { pb: 0.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: type === "activity" ? "0.8rem" : "0.75rem",
                lineHeight: 1.2,
              }}
              variant={type === "activity" ? "body2" : "caption"}
            >
              {item?.name}
            </Typography>
            {onAction && item && (
              <IconButton
                size="small"
                sx={{ mt: -0.5, mr: -0.5, p: 0.5 }}
                onClick={e => {
                  e.stopPropagation();
                  onAction(e, item.id);
                }}
              >
                <MoreVertIcon sx={{ fontSize: "0.9rem" }} />
              </IconButton>
            )}
          </Box>
          {children}
        </CardContent>
      </Card>
    );
  }
);

StoryMapCard.displayName = "StoryMapCard";

// Helper functions for card coloring
const getPriorityColor = (priority?: IssuePriority) => {
  if (!priority) {
    return "#ff9800";
  } // Default to medium
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

// Helper function for status color
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

  // Add state for moving releases
  const [movingRelease, setMovingRelease] = useState(false);

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

  // Add state to track the current release context
  const [currentReleaseContext, setCurrentReleaseContext] = useState<string | null>(null);

  // Add snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

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

  // Add drag and drop handlers for stories and epics
  const handleMoveStoryToEpic = useCallback(
    async (storyId: string, newParentId: string) => {
      try {
        setMovingStory(true);
        // Find the story in our local state
        let story: Issue | undefined;
        let targetEpic: Issue | undefined;

        // Find the story
        for (const epicId in issues) {
          const foundStory = issues[epicId].find(s => s.id === storyId);
          if (foundStory) {
            story = foundStory;
            break;
          }
        }

        // Find the target epic name for the success message
        for (const activityId in epics) {
          const foundEpic = epics[activityId].find(e => e.id === newParentId);
          if (foundEpic) {
            targetEpic = foundEpic;
            break;
          }
        }

        if (!story) {
          console.error("Story not found:", storyId);
          return;
        }

        // Update the story's parent ID while preserving its releaseId
        await updateIssue(storyId, {
          parentId: newParentId,
          releaseId: story.releaseId, // Preserve the existing releaseId
        });

        // Show success message
        setSnackbarMessage(
          `Moved story "${story.name}" to epic "${targetEpic?.name || "Unknown epic"}"`
        );
        setSnackbarOpen(true);

        console.log(
          `Moved story ${storyId} to epic ${newParentId}, preserved releaseId: ${story.releaseId}`
        );
      } catch (error) {
        console.error("Error moving story:", error);
        setSnackbarMessage(`Error moving story: ${(error as Error).message}`);
        setSnackbarOpen(true);
      } finally {
        setMovingStory(false);
      }
    },
    [issues, epics]
  );

  // Add handler for moving epics between activities
  const handleMoveEpicToActivity = useCallback(
    async (epicId: string, newParentId: string) => {
      try {
        setUpdatingIssue(true);
        // Find the epic in our local state
        let epic: Issue | undefined;
        for (const activityId in epics) {
          const foundEpic = epics[activityId].find(e => e.id === epicId);
          if (foundEpic) {
            epic = foundEpic;
            break;
          }
        }

        if (!epic) {
          console.error("Epic not found:", epicId);
          return;
        }

        // Update the epic's parent ID
        await updateIssue(epicId, { parentId: newParentId });
        console.log(`Moved epic ${epicId} to activity ${newParentId}`);
      } catch (error) {
        console.error("Error moving epic:", error);
      } finally {
        setUpdatingIssue(false);
      }
    },
    [epics]
  );

  // --------------------------
  // Memoized Handler functions to avoid unnecessary rerenders
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
  const handleOpenStoryDialog = useCallback((epicId: string, releaseId?: string | null) => {
    setSelectedParentId(epicId);
    setCurrentReleaseContext(releaseId || null);
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

        // Call the Firestore updateRelease function
        await updateRelease(release.id, updatedData);

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

  // Add handler for moving releases
  const handleMoveRelease = useCallback(
    async (releaseId: string, direction: "up" | "down") => {
      try {
        setMovingRelease(true);

        // Use the updateReleaseOrder function from firestore
        await updateReleaseOrder(releaseId, projectId, direction);

        console.log(`Moved release ${releaseId} ${direction}`);
      } catch (error) {
        console.error("Error moving release:", error);
      } finally {
        setMovingRelease(false);
      }
    },
    [projectId]
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
    (story: Issue, index: number) => (
      <DraggableStoryCard
        key={story.id}
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
        handleMoveStoryToEpic={handleMoveStoryToEpic}
        handleOpenItemForEdit={handleOpenItemForEdit}
        handleOpenMoveMenu={handleOpenMoveMenu}
        index={index}
        story={story}
      />
    ),
    [
      getPriorityColor,
      getStatusColor,
      handleMoveStoryToEpic,
      handleOpenItemForEdit,
      handleOpenMoveMenu,
    ]
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
    <DndProvider backend={HTML5Backend}>
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
                  <DroppableActivityContainer activity={activity}>
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
                            <DraggableEpicCard
                              epic={epic}
                              handleMoveEpicToActivity={handleMoveEpicToActivity}
                              handleOpenItemForEdit={handleOpenItemForEdit}
                            />
                            <DroppableEpicContainer epic={epic}>
                              {/* Stories Column - Vertical under each epic */}
                              <Box sx={{ mb: 2 }}>
                                {issues[epic.id] && issues[epic.id].length > 0 ? (
                                  issues[epic.id]
                                    .filter(story => story.releaseId === null)
                                    .map((story, index) => renderStoryCard(story, index))
                                ) : (
                                  <></>
                                )}
                                <StoryMapCard
                                  isAddCard={true}
                                  type="story"
                                  onClick={() => handleOpenStoryDialog(epic.id)}
                                />
                              </Box>
                            </DroppableEpicContainer>
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
                  </DroppableActivityContainer>
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
          {releases.map((release, index) => (
            <Box key={release.id} sx={{ minWidth: activities.length * 250 }}>
              {/* Release Header */}
              <Box sx={{ display: "flex" }}>
                <MemoizedReleaseCard
                  handleMoveRelease={handleMoveRelease}
                  handleOpenReleaseForEdit={handleOpenReleaseForEdit}
                  isFirst={index === 0}
                  isLast={index === releases.length - 1}
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
                            <DroppableEpicContainer epic={epic}>
                              <Box sx={{ mb: 2 }}>
                                {issues[epic.id] && issues[epic.id].length > 0 ? (
                                  issues[epic.id]
                                    .filter(story => story.releaseId === release.id)
                                    .map((story, index) => renderStoryCard(story, index))
                                ) : (
                                  <></>
                                )}
                                <StoryMapCard
                                  isAddCard={true}
                                  type="story"
                                  onClick={() => handleOpenStoryDialog(epic.id, release.id)}
                                />
                              </Box>
                            </DroppableEpicContainer>
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
                          <DroppableEpicContainer epic={epic}>
                            <Box sx={{ mb: 2 }}>
                              {issues[epic.id] && issues[epic.id].length > 0 ? (
                                issues[epic.id]
                                  .filter(story => !story.releaseId)
                                  .map((story, index) => renderStoryCard(story, index))
                              ) : (
                                <></>
                              )}
                              <StoryMapCard
                                isAddCard={true}
                                type="story"
                                onClick={() => handleOpenStoryDialog(epic.id, null)}
                              />
                            </Box>
                          </DroppableEpicContainer>
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
          currentReleaseId={currentReleaseContext}
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

        {/* Snackbar for feedback messages */}
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          autoHideDuration={4000}
          message={snackbarMessage}
          open={snackbarOpen}
          onClose={() => setSnackbarOpen(false)}
        />
      </Box>
    </DndProvider>
  );
}
