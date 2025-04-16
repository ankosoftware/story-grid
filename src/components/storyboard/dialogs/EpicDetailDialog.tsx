import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import { Issue, IssueStatus } from "@/lib/firebase/models/types";
import { CommentsSection } from "../components/CommentsSection";

export interface EpicDetailDialogProps {
  open: boolean;
  onClose: () => void;
  epic: Issue | null;
  getStatusColor: (status: IssueStatus) => string;
}

export const EpicDetailDialog = ({
  open,
  onClose,
  epic,
  getStatusColor,
}: EpicDetailDialogProps) => {
  if (!epic) {
    return null;
  }

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">{epic.name}</Typography>
          <Chip label={epic.status} size="small" sx={{ bgcolor: getStatusColor(epic.status) }} />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom color="text.secondary" variant="subtitle2">
            Description
          </Typography>
          <Typography variant="body2">{epic.description || "No description provided."}</Typography>
        </Box>

        {epic.assignee && (
          <Box sx={{ minWidth: "120px", mb: 2 }}>
            <Typography color="text.secondary" variant="caption">
              Assignee
            </Typography>
            <Typography variant="body2">{epic.assignee}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Integrated Comments Section */}
        <CommentsSection issue={epic} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
