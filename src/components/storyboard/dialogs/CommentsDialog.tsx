import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { Issue } from "@/lib/firebase/models/types";
import { CommentsSection } from "../components/CommentsSection";

export interface CommentsDialogProps {
  open: boolean;
  onClose: () => void;
  issue: Issue | null;
}

export const CommentsDialog = ({ open, onClose, issue }: CommentsDialogProps) => {
  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>Comments for {issue ? issue.name : ""}</DialogTitle>
      <DialogContent>
        <CommentsSection issue={issue} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
