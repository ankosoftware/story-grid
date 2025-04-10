import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import { Release } from "@/lib/firebase/models/types";
import { safeToDate } from "../utils/dateUtils";

export interface ReleaseDetailDialogProps {
  open: boolean;
  onClose: () => void;
  release: Release | null;
  onUpdateRelease?: (release: Release, updatedData: Partial<Release>) => Promise<void>;
}

export const ReleaseDetailDialog = ({
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
  useEffect(() => {
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
