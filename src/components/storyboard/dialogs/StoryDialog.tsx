import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
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

  const handleCreateStory = () => {
    if (!epicId) {
      setStoryError("No epic selected");
      return;
    }
    if (!storyName.trim()) {
      setStoryError("Story name is required");
      return;
    }

    // Close the dialog immediately
    onClose();

    // Start the async operation after closing the dialog
    // The parent component will handle the toast notification
    onAddStory(epicId, storyName, {
      description: storyDescription.trim() ? storyDescription : undefined,
      storyPoints: storyPoints,
      releaseId: currentReleaseId || undefined,
    }).catch(err => {
      console.error("Error creating story:", err);
      // Error handling will be done by the parent component
    });
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateStory();
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>Add New Story</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          error={!!storyError}
          helperText={storyError}
          label="Story Title"
          margin="dense"
          sx={{ mb: 2 }}
          value={storyName}
          onChange={e => setStoryName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <RichTextEditor
          label="Description (optional)"
          minHeight={150}
          placeholder="Add detailed description..."
          projectId={projectId}
          value={storyDescription}
          onChange={setStoryDescription}
        />

        <TextField
          fullWidth
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          label="Story Points (optional)"
          margin="dense"
          sx={{ mt: 2 }}
          type="number"
          value={storyPoints ?? ""}
          onChange={handleStoryPointsChange}
        />

        <Box sx={{ mt: 2 }}>
          <Typography color="text.secondary" variant="caption">
            {currentReleaseId
              ? "This story will be added to the current release."
              : "This story will not be assigned to any release."}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateStory}>
          Create Story
        </Button>
      </DialogActions>
    </Dialog>
  );
};
