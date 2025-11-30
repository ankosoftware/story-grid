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
import { RichTextEditor } from "@/components/common/RichTextEditor";

export interface ActivityDialogProps {
  open: boolean;
  onClose: () => void;
  onAddActivity: (name: string, description?: string) => Promise<string>;
  projectId: string;
}

export const ActivityDialog = ({
  open,
  onClose,
  onAddActivity,
  projectId,
}: ActivityDialogProps) => {
  const [activityName, setActivityName] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityError, setActivityError] = useState<string | null>(null);

  // Reset form when dialog closes or opens
  useEffect(() => {
    if (open) {
      // Initialize with empty values when opening
      setActivityName("");
      setActivityDescription("");
      setActivityError(null);
    }
  }, [open]);

  const handleCreateActivity = () => {
    if (!activityName.trim()) {
      setActivityError("Activity name is required");
      return;
    }

    // Close the dialog immediately
    onClose();

    // Start the async operation after closing the dialog
    // The parent component will handle the toast notification
    onAddActivity(activityName, activityDescription.trim() ? activityDescription : undefined).catch(
      err => {
        console.error("Error creating activity:", err);
        // Error handling will be done by the parent component
      }
    );
  };

  // Add keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
          error={!!activityError}
          helperText={activityError}
          label="Activity Name"
          margin="dense"
          sx={{ mb: 2 }}
          value={activityName}
          onChange={e => setActivityName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <RichTextEditor
          label="Description (optional)"
          minHeight={150}
          placeholder="Add detailed description..."
          projectId={projectId}
          value={activityDescription}
          onChange={setActivityDescription}
        />

        <Box sx={{ mt: 2 }}>
          <Typography color="text.secondary" variant="caption">
            Note: You can add comments to this activity after creation.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateActivity}>
          Create Activity
        </Button>
      </DialogActions>
    </Dialog>
  );
};
