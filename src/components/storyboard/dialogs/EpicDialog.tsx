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
import { RichTextEditor } from "@/components/common/RichTextEditor";

export interface EpicDialogProps {
  open: boolean;
  onClose: () => void;
  onAddEpic: (backboneId: string, name: string, description?: string) => Promise<string>;
  activityId: string | null;
  projectId: string;
}

export const EpicDialog = ({
  open,
  onClose,
  onAddEpic,
  activityId,
  projectId,
}: EpicDialogProps) => {
  const [epicName, setEpicName] = useState("");
  const [epicDescription, setEpicDescription] = useState("");
  const [epicError, setEpicError] = useState<string | null>(null);

  // Reset form when dialog closes or opens
  useEffect(() => {
    if (open) {
      // Initialize with empty values when opening
      setEpicName("");
      setEpicDescription("");
      setEpicError(null);
    }
  }, [open]);

  const handleCreateEpic = () => {
    if (!activityId) {
      setEpicError("No activity selected");
      return;
    }
    if (!epicName.trim()) {
      setEpicError("Epic name is required");
      return;
    }

    // Close the dialog immediately
    onClose();

    // Start the async operation after closing the dialog
    // The parent component will handle the toast notification
    onAddEpic(activityId, epicName, epicDescription.trim() ? epicDescription : undefined).catch(
      err => {
        console.error("Error creating epic:", err);
        // Error handling will be done by the parent component
      }
    );
  };

  // Add keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
          error={!!epicError}
          helperText={epicError}
          label="Task Name"
          margin="dense"
          sx={{ mb: 2 }}
          value={epicName}
          onChange={e => setEpicName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <RichTextEditor
          label="Description (optional)"
          minHeight={150}
          placeholder="Add detailed description..."
          value={epicDescription}
          onChange={setEpicDescription}
          projectId={projectId}
        />

        <Box sx={{ mt: 2 }}>
          <Typography color="text.secondary" variant="caption">
            Note: You can add comments to this task after creation.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateEpic}>
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};
