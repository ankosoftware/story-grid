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
  const [addingEpic, setAddingEpic] = useState(false);
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

        <RichTextEditor
          disabled={addingEpic}
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
