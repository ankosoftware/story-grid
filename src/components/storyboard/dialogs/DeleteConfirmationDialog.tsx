import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";

export interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemType: "activity" | "epic" | "story";
  itemName: string;
  isDeleting: boolean;
}

export const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  itemType,
  itemName,
  isDeleting,
}: DeleteConfirmationDialogProps) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
      // Keep dialog open to show error, handle it in parent component
    }
  };

  const getWarningMessage = () => {
    switch (itemType) {
      case "activity":
        return "This will delete the activity and all epics and stories within it.";
      case "epic":
        return "This will delete the epic and all stories within it.";
      case "story":
        return "This will delete the story and its associated data.";
      default:
        return "This action cannot be undone.";
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={!isDeleting ? onClose : undefined}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningIcon color="warning" />
        Confirm Deletion
      </DialogTitle>
      <DialogContent>
        <Typography gutterBottom variant="body1">
          Are you sure you want to delete the {itemType} "{itemName}"?
        </Typography>
        <Typography color="error" variant="body2">
          {getWarningMessage()} This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button disabled={isDeleting} onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="error"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress color="inherit" size={20} /> : null}
          variant="contained"
          onClick={handleConfirm}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
