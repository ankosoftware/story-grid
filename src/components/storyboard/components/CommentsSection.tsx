import React, { useState, useEffect } from "react";
import {
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
  Chip,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { Issue, IssueComment } from "@/lib/firebase/models/types";
import {
  getCommentsForIssue,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentStatus,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/auth/AuthProvider";
import { RichTextEditor } from "@/components/common/RichTextEditor";

export interface CommentsSectionProps {
  issue: Issue | null;
  refresh?: boolean;
  onRefreshComplete?: () => void;
}

export const CommentsSection = ({
  issue,
  refresh = false,
  onRefreshComplete,
}: CommentsSectionProps) => {
  const { user } = useAuth(); // Get the current user
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Fetch comments when issue changes or when refresh is triggered
  useEffect(() => {
    if (issue) {
      fetchComments();
    } else {
      // Reset state when no issue
      setComments([]);
      setNewComment("");
      setError(null);
    }
  }, [issue]);

  // Handle refresh prop change
  useEffect(() => {
    if (refresh && issue) {
      fetchComments();
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    }
  }, [refresh, issue]);

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

  const handleToggleStatus = async (commentId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await toggleCommentStatus(commentId);
      await fetchComments(); // Refresh comments
    } catch (err) {
      setError("Failed to update comment status. Please try again.");
      console.error("Error updating comment status:", err);
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
    <Box sx={{ mt: 3 }}>
      <Typography gutterBottom variant="h6">
        Comments
      </Typography>

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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Tooltip
                          title={comment.status === "open" ? "Mark as closed" : "Mark as open"}
                        >
                          <Chip
                            color={comment.status === "open" ? "warning" : "success"}
                            disabled={isSubmitting}
                            icon={comment.status === "open" ? <ErrorIcon /> : <CheckCircleIcon />}
                            label={comment.status === "open" ? "Open" : "Closed"}
                            size="small"
                            sx={{ cursor: "pointer" }}
                            onClick={() => handleToggleStatus(comment.id)}
                          />
                        </Tooltip>
                        <Typography color="text.secondary" variant="caption">
                          {formatDate(comment.createdAt)}
                          {comment.updatedAt && " (edited)"}
                        </Typography>
                      </Box>
                    </Box>
                    {editingCommentId === comment.id ? (
                      <Box sx={{ mt: 1 }}>
                        <RichTextEditor
                          disabled={isSubmitting}
                          maxHeight={300}
                          minHeight={100}
                          placeholder="Edit your comment..."
                          projectId={issue?.projectId}
                          value={editText}
                          onChange={setEditText}
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
                      <Box dangerouslySetInnerHTML={{ __html: comment.text }} sx={{ mt: 0.5 }} />
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
        <RichTextEditor
          disabled={isSubmitting || !user}
          maxHeight={300}
          minHeight={150}
          placeholder="Type your comment here..."
          projectId={issue?.projectId}
          value={newComment}
          onChange={setNewComment}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Button
            disabled={isSubmitting || !newComment.trim() || !user}
            variant="contained"
            onClick={handleAddComment}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Add Comment"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
