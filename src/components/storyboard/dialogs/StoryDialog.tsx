import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { IssueStatus, IssuePriority } from "@/lib/firebase/models/types";
import { RichTextEditor } from "@/components/common/RichTextEditor";

export interface StoryDialogProps {
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
  projectId: string;
}

export const StoryDialog = ({
  open,
  onClose,
  onAddStory,
  epicId,
  currentReleaseId,
  projectId,
}: StoryDialogProps) => {
  const [storyName, setStoryName] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
  const [addingStory, setAddingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  // Reset form when dialog closes or opens
  useEffect(() => {
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

        <RichTextEditor
          value={storyDescription}
          onChange={setStoryDescription}
          disabled={addingStory}
          label="Description (optional)"
          placeholder="Add detailed description..."
          minHeight={150}
          projectId={projectId}
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
          <Typography color="text.secondary" variant="body2">
            Tip: Write user stories in the format As a [persona], I want to [do something] so that
            [benefit]
          </Typography>

          <Typography sx={{ mt: 2 }} variant="caption" color="text.secondary">
            Note: You can add comments to this story after creation.
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
