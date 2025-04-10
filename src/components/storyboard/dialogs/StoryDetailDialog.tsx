import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip,
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import { Issue, Release, IssueStatus, IssuePriority } from "@/lib/firebase/models/types";
import { CommentsDialog } from "./CommentsDialog";

export interface StoryDetailDialogProps {
  open: boolean;
  onClose: () => void;
  story: Issue | null;
  releases: Release[];
  getStatusColor: (status: IssueStatus) => string;
  getPriorityColor: (priority: IssuePriority) => string;
}

export const StoryDetailDialog = ({
  open,
  onClose,
  story,
  releases,
  getStatusColor,
  getPriorityColor,
}: StoryDetailDialogProps) => {
  const [commentsOpen, setCommentsOpen] = useState(false);

  if (!story) {
    return null;
  }

  const handleOpenComments = () => {
    setCommentsOpen(true);
  };

  const handleCloseComments = () => {
    setCommentsOpen(false);
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">{story.name}</Typography>
          <Chip label={story.status} size="small" sx={{ bgcolor: getStatusColor(story.status) }} />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom color="text.secondary" variant="subtitle2">
            Description
          </Typography>
          <Typography variant="body2">{story.description || "No description provided."}</Typography>
        </Box>

        {story.acceptanceCriteria && (
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom color="text.secondary" variant="subtitle2">
              Acceptance Criteria
            </Typography>
            <Typography variant="body2">{story.acceptanceCriteria}</Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ minWidth: "120px", mb: 2 }}>
            <Typography color="text.secondary" variant="caption">
              Priority
            </Typography>
            <Chip
              label={story.priority}
              size="small"
              sx={{
                bgcolor: getPriorityColor(story.priority) + "20",
                color: getPriorityColor(story.priority),
                fontWeight: "bold",
              }}
            />
          </Box>

          {story.storyPoints !== undefined && (
            <Box sx={{ minWidth: "120px", mb: 2 }}>
              <Typography color="text.secondary" variant="caption">
                Story Points
              </Typography>
              <Typography fontWeight="bold" variant="body2">
                {story.storyPoints}
              </Typography>
            </Box>
          )}

          {story.assignee && (
            <Box sx={{ minWidth: "120px", mb: 2 }}>
              <Typography color="text.secondary" variant="caption">
                Assignee
              </Typography>
              <Typography variant="body2">{story.assignee}</Typography>
            </Box>
          )}

          {story.releaseId && (
            <Box sx={{ minWidth: "120px", mb: 2 }}>
              <Typography color="text.secondary" variant="caption">
                Release
              </Typography>
              <Typography variant="body2">
                {releases.find(r => r.id === story.releaseId)?.name || "Unknown"}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<CommentIcon />} onClick={handleOpenComments}>
          Comments
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Comments Dialog */}
      <CommentsDialog 
        open={commentsOpen} 
        onClose={handleCloseComments} 
        issue={story} 
      />
    </Dialog>
  );
};
