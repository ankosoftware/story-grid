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

export interface ActivityDialogProps {
  open: boolean;
  onClose: () => void;
  onAddActivity: (name: string, description?: string) => Promise<string>;
}

export const ActivityDialog = ({ open, onClose, onAddActivity }: ActivityDialogProps) => {
  const [activityName, setActivityName] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);
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

        <Box sx={{ mt: 2 }}>
          <Typography color="text.secondary" variant="caption">
            Note: You can add comments to this activity after creation.
          </Typography>
        </Box>
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
