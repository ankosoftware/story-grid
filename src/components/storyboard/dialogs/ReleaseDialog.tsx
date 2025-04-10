import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

export interface ReleaseDialogProps {
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
}

export const ReleaseDialog = ({ open, onClose, onAddRelease }: ReleaseDialogProps) => {
  const [releaseName, setReleaseName] = useState("");
  const [releaseDescription, setReleaseDescription] = useState("");
  const [addingRelease, setAddingRelease] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  // Reset form when dialog closes or opens
  useEffect(() => {
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
