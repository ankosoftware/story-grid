import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Issue, Release, IssueStatus, IssuePriority, IssueType } from "@/lib/firebase/models/types";

interface StoryBoardProps {
  projectId: string;
  epics: Issue[];
  issuesByParent: Record<string, Issue[]>;
  releases: Release[];
  loading: boolean;
  error: Error | null;
  onAddEpic: (name: string, description?: string) => Promise<string>;
  onAddStory: (
    parentId: string,
    name: string,
    options?: {
      description?: string;
      acceptanceCriteria?: string;
      status?: IssueStatus;
      priority?: IssuePriority;
      assignee?: string;
      releaseId?: string;
    }
  ) => Promise<string>;
  onAddRelease: (
    name: string,
    options?: {
      description?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) => Promise<string>;
}

export default function StoryBoard({
  projectId,
  epics,
  issuesByParent,
  releases,
  loading,
  error,
  onAddEpic,
  onAddStory,
  onAddRelease,
}: StoryBoardProps) {
  // State for add epic dialog
  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [epicName, setEpicName] = useState("");
  const [epicDescription, setEpicDescription] = useState("");
  const [addingEpic, setAddingEpic] = useState(false);
  const [epicError, setEpicError] = useState<string | null>(null);

  // State for add story dialog
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [storyName, setStoryName] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [addingStory, setAddingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  // State for add release dialog
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseName, setReleaseName] = useState("");
  const [releaseDescription, setReleaseDescription] = useState("");
  const [addingRelease, setAddingRelease] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  // Function to handle opening epic dialog
  const handleOpenEpicDialog = () => {
    setEpicDialogOpen(true);
    setEpicName("");
    setEpicDescription("");
    setEpicError(null);
  };

  // Function to handle closing epic dialog
  const handleCloseEpicDialog = () => {
    setEpicDialogOpen(false);
  };

  // Function to handle creating new epic
  const handleCreateEpic = async () => {
    if (!epicName.trim()) {
      setEpicError("Epic name is required");
      return;
    }

    try {
      setAddingEpic(true);
      setEpicError(null);
      await onAddEpic(epicName, epicDescription.trim() ? epicDescription : undefined);
      handleCloseEpicDialog();
    } catch (err) {
      setEpicError((err as Error).message || "Failed to create epic");
    } finally {
      setAddingEpic(false);
    }
  };

  // Function to handle opening story dialog
  const handleOpenStoryDialog = (parentId: string) => {
    setSelectedParentId(parentId);
    setStoryDialogOpen(true);
    setStoryName("");
    setStoryDescription("");
    setStoryError(null);
  };

  // Function to handle closing story dialog
  const handleCloseStoryDialog = () => {
    setStoryDialogOpen(false);
    setSelectedParentId(null);
  };

  // Function to handle creating new story
  const handleCreateStory = async () => {
    if (!selectedParentId) {
      setStoryError("No epic selected");
      return;
    }

    if (!storyName.trim()) {
      setStoryError("Story name is required");
      return;
    }

    try {
      setAddingStory(true);
      setStoryError(null);
      await onAddStory(selectedParentId, storyName, {
        description: storyDescription.trim() ? storyDescription : undefined,
      });
      handleCloseStoryDialog();
    } catch (err) {
      setStoryError((err as Error).message || "Failed to create story");
    } finally {
      setAddingStory(false);
    }
  };

  // Function to handle opening release dialog
  const handleOpenReleaseDialog = () => {
    setReleaseDialogOpen(true);
    setReleaseName("");
    setReleaseDescription("");
    setReleaseError(null);
  };

  // Function to handle closing release dialog
  const handleCloseReleaseDialog = () => {
    setReleaseDialogOpen(false);
  };

  // Function to handle creating new release
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
      handleCloseReleaseDialog();
    } catch (err) {
      setReleaseError((err as Error).message || "Failed to create release");
    } finally {
      setAddingRelease(false);
    }
  };

  // Function to get status color
  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.TO_DO:
        return "#e0e0e0"; // Grey
      case IssueStatus.IN_PROGRESS:
        return "#bbdefb"; // Light blue
      case IssueStatus.DONE:
        return "#c8e6c9"; // Light green
      default:
        return "#e0e0e0";
    }
  };

  // Function to get priority color
  const getPriorityColor = (priority: IssuePriority) => {
    switch (priority) {
      case IssuePriority.HIGH:
        return "#f44336"; // Red
      case IssuePriority.MEDIUM:
        return "#ff9800"; // Orange
      case IssuePriority.LOW:
        return "#4caf50"; // Green
      default:
        return "#ff9800";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        Error loading story board: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Story board header with actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h2">
          Story Map
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenEpicDialog}
            sx={{ mr: 1 }}
          >
            Add Epic
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenReleaseDialog}>
            Add Release
          </Button>
        </Box>
      </Box>

      {/* Story board content */}
      {epics.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No epics yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add your first epic to start building your story map.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenEpicDialog}>
            Add Epic
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {epics.map(epic => (
            <Grid item xs={12} md={6} lg={4} key={epic.id}>
              <Paper sx={{ p: 2, height: "100%" }}>
                {/* Epic header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    pb: 1,
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {epic.name}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenStoryDialog(epic.id)}
                  >
                    Add Story
                  </Button>
                </Box>

                {/* Epic description */}
                {epic.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {epic.description}
                  </Typography>
                )}

                {/* Stories */}
                {issuesByParent[epic.id]?.length > 0 ? (
                  issuesByParent[epic.id].map(story => (
                    <Card
                      key={story.id}
                      sx={{
                        mb: 1.5,
                        backgroundColor: getStatusColor(story.status),
                        borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
                      }}
                    >
                      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="subtitle2">{story.name}</Typography>
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {story.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {story.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    No stories yet. Add your first story.
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Epic Dialog */}
      <Dialog open={epicDialogOpen} onClose={handleCloseEpicDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Epic</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Epic Name"
            fullWidth
            value={epicName}
            onChange={e => setEpicName(e.target.value)}
            error={!!epicError}
            helperText={epicError}
            disabled={addingEpic}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={epicDescription}
            onChange={e => setEpicDescription(e.target.value)}
            disabled={addingEpic}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEpicDialog} disabled={addingEpic}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateEpic}
            variant="contained"
            disabled={addingEpic}
            startIcon={addingEpic ? <CircularProgress size={20} /> : undefined}
          >
            {addingEpic ? "Creating..." : "Create Epic"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Story Dialog */}
      <Dialog open={storyDialogOpen} onClose={handleCloseStoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Story</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Story Name"
            fullWidth
            value={storyName}
            onChange={e => setStoryName(e.target.value)}
            error={!!storyError}
            helperText={storyError}
            disabled={addingStory}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={storyDescription}
            onChange={e => setStoryDescription(e.target.value)}
            disabled={addingStory}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStoryDialog} disabled={addingStory}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateStory}
            variant="contained"
            disabled={addingStory}
            startIcon={addingStory ? <CircularProgress size={20} /> : undefined}
          >
            {addingStory ? "Creating..." : "Create Story"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Release Dialog */}
      <Dialog open={releaseDialogOpen} onClose={handleCloseReleaseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Release</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Release Name"
            fullWidth
            value={releaseName}
            onChange={e => setReleaseName(e.target.value)}
            error={!!releaseError}
            helperText={releaseError}
            disabled={addingRelease}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={releaseDescription}
            onChange={e => setReleaseDescription(e.target.value)}
            disabled={addingRelease}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReleaseDialog} disabled={addingRelease}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateRelease}
            variant="contained"
            disabled={addingRelease}
            startIcon={addingRelease ? <CircularProgress size={20} /> : undefined}
          >
            {addingRelease ? "Creating..." : "Create Release"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
