import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  MenuItem,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { Issue, Release, IssueStatus, IssuePriority } from "@/lib/firebase/models/types";
import { CommentsSection } from "../components/CommentsSection";
import { RichTextEditor } from "@/components/common/RichTextEditor";

export interface EditItemDialogProps {
  open: boolean;
  onClose: () => void;
  item: Issue | null;
  itemType: "activity" | "epic" | "story" | null;
  releases: Release[];
  onUpdateItem?: (item: Issue, updatedData: Partial<Issue>) => Promise<void>;
}

export const EditItemDialog = ({
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

  // Reset form when item changes
  useEffect(() => {
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

  const handleSaveEdit = () => {
    if (!item || !itemType || !onUpdateItem) {
      return;
    }

    if (!editName.trim()) {
      setEditingError(`${itemType} name is required`);
      return;
    }

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

    // Close dialog immediately (optimistic)
    onClose();

    // Fire and forget - update happens in background with optimistic UI
    // If it fails, the hook will rollback the state automatically
    onUpdateItem(item, updatedData).catch(err => {
      console.error(`Failed to update ${itemType}:`, err);
    });
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
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
          error={!!editingError}
          helperText={editingError}
          label="Name"
          margin="dense"
          sx={{ mb: 2 }}
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <RichTextEditor
          label="Description"
          minHeight={150}
          projectId={item?.projectId}
          value={editDescription}
          onChange={setEditDescription}
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
              InputProps={{
                inputProps: { min: 0 },
              }}
              label="Story Points"
              margin="dense"
              sx={{ mb: 2 }}
              type="number"
              value={editStoryPoints === null ? "" : editStoryPoints}
              onChange={handleStoryPointsChange}
              onKeyDown={handleKeyDown}
            />

            {/* Release dropdown */}
            <TextField
              fullWidth
              select
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

        {item && (
          <>
            <Divider sx={{ my: 3 }} />
            {/* Integrated Comments Section */}
            <CommentsSection issue={item} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSaveEdit}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
