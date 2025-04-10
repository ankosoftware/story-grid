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
  Typography,
  List,
  ListItem,
  Divider,
  IconButton,
  Avatar,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Issue, IssueComment } from "@/lib/firebase/models/types";
import {
  getCommentsForIssue,
  addComment,
  updateComment,
  deleteComment,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/auth/AuthProvider";

export interface CommentsDialogProps {
  open: boolean;
  onClose: () => void;
  issue: Issue | null;
}

export const CommentsDialog = ({ open, onClose, issue }: CommentsDialogProps) => {
  const { user } = useAuth(); // Get the current user
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Fetch comments when dialog opens
  useEffect(() => {
    if (open && issue) {
      fetchComments();
    } else {
      // Reset state when dialog closes
      setComments([]);
      setNewComment("");
      setError(null);
    }
  }, [open, issue]);

  const fetchComments = async () => {
    if (!issue) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedComments = await getCommentsForIssue(issue.id);
      setComments(fetchedComments);
    } catch (err) {
      setError("Failed to load comments. Please try again.");
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!issue || !user || !newComment.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await addComment(issue.id, newComment, user.uid);
      setNewComment(""); // Clear input
      await fetchComments(); // Refresh comments
    } catch (err) {
      setError("Failed to add comment. Please try again.");
      console.error("Error adding comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditing = (comment: IssueComment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const handleCancelEditing = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editText.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await updateComment(commentId, editText);
      setEditingCommentId(null);
      await fetchComments(); // Refresh comments
    } catch (err) {
      setError("Failed to update comment. Please try again.");
      console.error("Error updating comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await deleteComment(commentId);
      await fetchComments(); // Refresh comments
    } catch (err) {
      setError("Failed to delete comment. Please try again.");
      console.error("Error deleting comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) {
      return "";
    }
    try {
      // Handle Firestore Timestamp objects
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return "";
    }
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>Comments for {issue ? issue.name : ""}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Comments List */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Typography sx={{ py: 2, textAlign: "center", color: "text.secondary" }}>
            No comments yet. Be the first to comment!
          </Typography>
        ) : (
          <List sx={{ width: "100%" }}>
            {comments.map((comment, index) => (
              <React.Fragment key={comment.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    flexDirection: "column",
                    alignItems: "stretch",
                    py: 1,
                  }}
                >
                  <Box sx={{ display: "flex", mb: 1 }}>
                    <Avatar
                      sx={{ width: 32, height: 32, mr: 1 }}
                      alt="User Avatar"
                      // Use a default avatar or get from user profile
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography sx={{ fontWeight: "bold" }} variant="subtitle2">
                          User {comment.createdBy.substring(0, 6)}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          {formatDate(comment.createdAt)}
                          {comment.updatedAt && " (edited)"}
                        </Typography>
                      </Box>
                      {editingCommentId === comment.id ? (
                        <Box sx={{ mt: 1 }}>
                          <TextField
                            fullWidth
                            multiline
                            disabled={isSubmitting}
                            rows={2}
                            size="small"
                            value={editText}
                            variant="outlined"
                            onChange={e => setEditText(e.target.value)}
                          />
                          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                            <Button
                              disabled={isSubmitting}
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={handleCancelEditing}
                            >
                              Cancel
                            </Button>
                            <Button
                              disabled={isSubmitting || !editText.trim()}
                              size="small"
                              variant="contained"
                              onClick={() => handleUpdateComment(comment.id)}
                            >
                              Save
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap" }} variant="body2">
                          {comment.text}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Only show edit/delete for the comment author */}
                  {user && comment.createdBy === user.uid && !editingCommentId && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <IconButton
                        disabled={isSubmitting}
                        size="small"
                        onClick={() => handleStartEditing(comment)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        disabled={isSubmitting}
                        size="small"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </ListItem>
                {index < comments.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Add Comment Form */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mt: 2,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography sx={{ mb: 1 }} variant="subtitle2">
            Add a comment
          </Typography>
          <TextField
            fullWidth
            multiline
            disabled={isSubmitting || !user}
            placeholder="Type your comment here..."
            rows={3}
            sx={{ mb: 1 }}
            value={newComment}
            variant="outlined"
            onChange={e => setNewComment(e.target.value)}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              disabled={isSubmitting || !newComment.trim() || !user}
              variant="contained"
              onClick={handleAddComment}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Add Comment"}
            </Button>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
