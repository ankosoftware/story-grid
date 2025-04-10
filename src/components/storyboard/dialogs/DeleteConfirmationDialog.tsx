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
    <Dialog open={open} onClose={!isDeleting ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningIcon color="warning" />
        Confirm Deletion
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete the {itemType} "{itemName}"?
        </Typography>
        <Typography variant="body2" color="error">
          {getWarningMessage()} This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained" 
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 