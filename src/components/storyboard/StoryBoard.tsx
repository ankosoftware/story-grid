import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Issue, Release, IssueStatus, IssuePriority } from "@/lib/firebase/models/types";
import { updateIssue, updateRelease, updateReleaseOrder } from "@/lib/firebase/firestore";

// Import utility functions and types
import {
  getStatusColor,
  getPriorityColor,
  createUnassignedReleaseObject,
  StoryMapProps,
} from "./utils";

// Import dialog components
import {
  ActivityDialog,
  EpicDialog,
  StoryDialog,
  ReleaseDialog,
  StoryDetailDialog,
  EditItemDialog,
  ReleaseDetailDialog,
} from "./dialogs";

// Import card components
import {
  StoryMapCard,
  MemoizedStoryCard,
  DraggableStoryCard,
  DraggableEpicCard,
  MemoizedReleaseCard,
} from "./cards";

// Import container components
import { DroppableActivityContainer, DroppableEpicContainer } from "./containers";

export default function StoryMap({
  projectId,
  activities,
  epics,
  issues,
  releases,
  loading,
  error,
  onAddActivity,
  onAddEpic,
  onAddStory,
  onAddRelease,
  onMoveIssue,
}: StoryMapProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // --------------------------
  // Local state for dialogs, menus, etc.
  // --------------------------
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);

  // State for move story menu
  const [moveMenuAnchorEl, setMoveMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [movingStory, setMovingStory] = useState(false);

  // Add state for moving releases
  const [movingRelease, setMovingRelease] = useState(false);

  // Add state for story detail dialog
  const [storyDetailDialogOpen, setStoryDetailDialogOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Issue | null>(null);

  // Add state for edit dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Issue | null>(null);
  const [editingItemType, setEditingItemType] = useState<"activity" | "epic" | "story" | null>(
    null
  );

  // Add state for updating issues
  const [updatingIssue, setUpdatingIssue] = useState(false);

  // Add state for release detail dialog
  const [releaseDetailDialogOpen, setReleaseDetailDialogOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);

  // Add state to track the current release context
  const [currentReleaseContext, setCurrentReleaseContext] = useState<string | null>(null);

  // Add snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Add handler for updating issues
  const handleUpdateIssue = useCallback(async (issue: Issue, updatedData: Partial<Issue>) => {
    try {
      setUpdatingIssue(true);

      // Check if this is a display order update
      const isDisplayOrderUpdate = updatedData.displayOrder !== undefined;

      // For display order updates during dragging, we can use debouncing
      // by adding a small delay before actually sending the update
      if (isDisplayOrderUpdate) {
        console.log(
          `Updating display order for ${issue.type.toLowerCase()}: ${issue.id} to ${updatedData.displayOrder}`
        );

        // Call the Firestore updateIssue function
        await updateIssue(issue.id, updatedData);

        // After updating, log completion
        console.log(`Display order update completed for ${issue.id}`);
      } else {
        // For non-display order updates, process immediately
        await updateIssue(issue.id, updatedData);
        console.log(`Updated ${issue.type.toLowerCase()}: ${issue.id}`, updatedData);
      }
    } catch (error) {
      console.error("Error updating issue:", error);
      throw error;
    } finally {
      setUpdatingIssue(false);
    }
  }, []);

  // Add drag and drop handlers for stories and epics
  const handleMoveStoryToEpic = useCallback(
    async (storyId: string, newParentId: string, releaseId: string | null) => {
      try {
        setMovingStory(true);
        // Find the story in our local state
        let story: Issue | undefined;
        let targetEpic: Issue | undefined;

        // Find the story
        for (const epicId in issues) {
          const foundStory = issues[epicId].find(s => s.id === storyId);
          if (foundStory) {
            story = foundStory;
            break;
          }
        }

        // Find the target epic name for the success message
        for (const activityId in epics) {
          const foundEpic = epics[activityId].find(e => e.id === newParentId);
          if (foundEpic) {
            targetEpic = foundEpic;
            break;
          }
        }

        if (!story) {
          console.error("Story not found:", storyId);
          return;
        }

        // Update the story's parent ID while preserving its releaseId
        await updateIssue(storyId, {
          parentId: newParentId,
          releaseId: releaseId,
        });

        // Show success message
        setSnackbarMessage(
          `Moved story "${story.name}" to epic "${targetEpic?.name || "Unknown epic"}"`
        );
        setSnackbarOpen(true);

        console.log(
          `Moved story ${storyId} to epic ${newParentId}, preserved releaseId: ${story.releaseId}`
        );
      } catch (error) {
        console.error("Error moving story:", error);
        setSnackbarMessage(`Error moving story: ${(error as Error).message}`);
        setSnackbarOpen(true);
      } finally {
        setMovingStory(false);
      }
    },
    [issues, epics]
  );

  // Add handler for moving epics between activities
  const handleMoveEpicToActivity = useCallback(
    async (epicId: string, newParentId: string) => {
      try {
        setUpdatingIssue(true);
        // Find the epic in our local state
        let epic: Issue | undefined;
        for (const activityId in epics) {
          const foundEpic = epics[activityId].find(e => e.id === epicId);
          if (foundEpic) {
            epic = foundEpic;
            break;
          }
        }

        if (!epic) {
          console.error("Epic not found:", epicId);
          return;
        }

        // Update the epic's parent ID
        await updateIssue(epicId, { parentId: newParentId });
        console.log(`Moved epic ${epicId} to activity ${newParentId}`);
      } catch (error) {
        console.error("Error moving epic:", error);
      } finally {
        setUpdatingIssue(false);
      }
    },
    [epics]
  );

  // --------------------------
  // Memoized Handler functions to avoid unnecessary rerenders
  // --------------------------
  const handleOpenMoveMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>, storyId: string) => {
      event.stopPropagation();
      setMoveMenuAnchorEl(event.currentTarget);
      setSelectedStoryId(storyId);
    },
    []
  );

  const handleCloseMoveMenu = useCallback(() => {
    setMoveMenuAnchorEl(null);
    setSelectedStoryId(null);
  }, []);

  const handleMoveStory = useCallback(
    async (releaseId: string | null) => {
      if (!selectedStoryId || !onMoveIssue) {
        handleCloseMoveMenu();
        return;
      }
      try {
        setMovingStory(true);
        await onMoveIssue(selectedStoryId, releaseId);
      } catch (error) {
        console.error("Failed to move story:", error);
      } finally {
        setMovingStory(false);
        handleCloseMoveMenu();
      }
    },
    [selectedStoryId, onMoveIssue, handleCloseMoveMenu]
  );

  // Handler for Epic Dialog
  const handleOpenEpicDialog = useCallback((activityId: string) => {
    setSelectedActivityId(activityId);
    setEpicDialogOpen(true);
  }, []);

  const handleCloseEpicDialog = useCallback(() => {
    setEpicDialogOpen(false);
    setSelectedActivityId(null);
  }, []);

  // Handler for Story Dialog
  const handleOpenStoryDialog = useCallback((epicId: string, releaseId?: string | null) => {
    setSelectedParentId(epicId);
    setCurrentReleaseContext(releaseId || null);
    setStoryDialogOpen(true);
  }, []);

  const handleCloseStoryDialog = useCallback(() => {
    setStoryDialogOpen(false);
    setSelectedParentId(null);
  }, []);

  // Handler for Release Dialog
  const handleOpenReleaseDialog = useCallback(() => {
    setReleaseDialogOpen(true);
  }, []);

  const handleCloseReleaseDialog = useCallback(() => {
    setReleaseDialogOpen(false);
  }, []);

  // Handler for Story Detail
  const handleOpenStoryDetail = useCallback((story: Issue) => {
    setSelectedStory(story);
    setStoryDetailDialogOpen(true);
  }, []);

  const handleCloseStoryDetail = useCallback(() => {
    setStoryDetailDialogOpen(false);
    setSelectedStory(null);
  }, []);

  // Handler for editing items
  const handleOpenItemForEdit = useCallback((item: Issue, type: "activity" | "epic" | "story") => {
    setEditingItem(item);
    setEditingItemType(type);
    setEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditingItem(null);
    setEditingItemType(null);
  }, []);

  // Handler for Release Detail
  const handleOpenReleaseForEdit = useCallback((release: Release) => {
    setSelectedRelease(release);
    setReleaseDetailDialogOpen(true);
  }, []);

  const handleCloseReleaseDetail = useCallback(() => {
    setReleaseDetailDialogOpen(false);
    setSelectedRelease(null);
  }, []);

  // Add handler for updating releases
  const handleUpdateRelease = useCallback(
    async (release: Release, updatedData: Partial<Release>) => {
      try {
        setUpdatingIssue(true);

        // Call the Firestore updateRelease function
        await updateRelease(release.id, updatedData);

        console.log(`Updated release: ${release.id}`, updatedData);
      } catch (error) {
        console.error("Error updating release:", error);
        throw error;
      } finally {
        setUpdatingIssue(false);
      }
    },
    []
  );

  // Add handler for moving releases
  const handleMoveRelease = useCallback(
    async (releaseId: string, direction: "up" | "down") => {
      try {
        setMovingRelease(true);

        // Use the updateReleaseOrder function from firestore
        await updateReleaseOrder(releaseId, projectId, direction);

        console.log(`Moved release ${releaseId} ${direction}`);
      } catch (error) {
        console.error("Error moving release:", error);
      } finally {
        setMovingRelease(false);
      }
    },
    [projectId]
  );

  // --------------------------
  // Memoized rendering function for Story cards
  // --------------------------
  const renderStoryCard = useCallback(
    (story: Issue, index: number) => (
      <DraggableStoryCard
        key={story.id}
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
        handleMoveStoryToEpic={handleMoveStoryToEpic}
        handleOpenItemForEdit={handleOpenItemForEdit}
        handleOpenMoveMenu={handleOpenMoveMenu}
        index={index}
        story={story}
      />
    ),
    [handleMoveStoryToEpic, handleOpenItemForEdit, handleOpenMoveMenu]
  );

  // Calculate story points for epics
  const calculateEpicStoryPoints = useCallback(
    (epicId: string, releaseId?: string): number => {
      if (!issues[epicId]) {
        return 0;
      }

      return issues[epicId].reduce((total, story) => {
        if (releaseId && story.releaseId === releaseId) {
          return total + (story.storyPoints || 0);
        }
        return total;
      }, 0);
    },
    [issues]
  );

  // Calculate story points for releases
  const calculateReleaseStoryPoints = useCallback(
    (releaseId: string): number => {
      let total = 0;

      // Sum up story points for all stories in this release
      Object.keys(issues).forEach(epicId => {
        issues[epicId].forEach(story => {
          if (story.releaseId === releaseId && story.storyPoints) {
            total += story.storyPoints;
          }
        });
      });

      return total;
    },
    [issues]
  );

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
    <DndProvider backend={HTML5Backend}>
      <Box>
        {/* Header Actions */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, flexWrap: "wrap" }}>
          <Typography component="h2" variant="h5">
            Story Map
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => setActivityDialogOpen(true)}
            >
              Add Activity
            </Button>
            <Button startIcon={<AddIcon />} variant="outlined" onClick={handleOpenReleaseDialog}>
              Add Release
            </Button>
          </Box>
        </Box>

        {/* Main Story Map Structure */}
        <Paper
          sx={{
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflowX: "auto",
          }}
        >
          <Box sx={{ minWidth: activities.length * 250 }}>
            {/* Activities Row */}
            <Box
              sx={{
                display: "flex",
                mb: 2,
              }}
            >
              {activities.map(activity => (
                <Box key={activity.id} sx={{ mx: 1 }}>
                  <DroppableActivityContainer activity={activity}>
                    <StoryMapCard
                      item={activity}
                      type="activity"
                      onClick={() => handleOpenItemForEdit(activity, "activity")}
                    >
                      {/* Activity card has no additional content */}
                    </StoryMapCard>

                    {/* Epics Row - Horizontal */}
                    <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 2 }}>
                      {epics[activity.id] &&
                        epics[activity.id].map(epic => (
                          <Box key={epic.id} sx={{ flex: 1, minWidth: 0 }}>
                            <DraggableEpicCard
                              epic={epic}
                              handleMoveEpicToActivity={handleMoveEpicToActivity}
                              handleOpenItemForEdit={handleOpenItemForEdit}
                              storyPoints={calculateEpicStoryPoints(epic.id)}
                            />
                          </Box>
                        ))}

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <StoryMapCard
                          isAddCard={true}
                          type="epic"
                          onClick={() => handleOpenEpicDialog(activity.id)}
                        />
                      </Box>
                    </Box>
                  </DroppableActivityContainer>
                </Box>
              ))}

              {/* Add Activity Card */}
              <Box
                sx={{
                  width: 100,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  pt: 1,
                }}
              >
                <StoryMapCard
                  isAddCard={true}
                  type="activity"
                  onClick={() => setActivityDialogOpen(true)}
                />
              </Box>
            </Box>
          </Box>
          {releases.map((release, index) => (
            <Box key={release.id} sx={{ minWidth: activities.length * 250 }}>
              {/* Release Header */}
              <Box sx={{ display: "flex", width: "100%" }}>
                <MemoizedReleaseCard
                  handleMoveRelease={handleMoveRelease}
                  handleOpenReleaseForEdit={handleOpenReleaseForEdit}
                  isFirst={index === 0}
                  isLast={index === releases.length - 1}
                  release={release}
                  totalStoryPoints={calculateReleaseStoryPoints(release.id)}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  mb: 2,
                }}
              >
                {activities.map(activity => (
                  <Box key={activity.id} sx={{ mx: 0 }}>
                    {/* Add placeholder for activity */}
                    <StoryMapCard type="placeholder" />

                    {/* Epics Row - Horizontal */}
                    <Box sx={{ display: "flex", flexDirection: "row", gap: 1, mb: 1 }}>
                      {epics[activity.id] &&
                        epics[activity.id].map(epic => (
                          <Box key={epic.id} sx={{ flex: 1, minWidth: 0 }}>
                            {/* Add placeholder for epic */}
                            <StoryMapCard type="placeholder" />
                            {/* Add story points to the epic in the release */}
                            <Chip
                              label={calculateEpicStoryPoints(epic.id, release.id)}
                              sx={{
                                fontSize: "0.6rem",
                                height: "16px",
                                fontWeight: "bold",
                                bgcolor: theme.palette.grey[200],
                                borderRadius: "8px",
                                marginLeft: "8px",
                              }}
                            />
                            {/* Stories Column - Vertical under each epic */}
                            <DroppableEpicContainer epic={epic} releaseId={release.id}>
                              <Box sx={{ mb: 1 }}>
                                {issues[epic.id] && issues[epic.id].length > 0 ? (
                                  issues[epic.id]
                                    .filter(story => story.releaseId === release.id)
                                    .map((story, index) => renderStoryCard(story, index))
                                ) : (
                                  <></>
                                )}
                                <StoryMapCard
                                  isAddCard={true}
                                  type="story"
                                  onClick={() => handleOpenStoryDialog(epic.id, release.id)}
                                />
                              </Box>
                            </DroppableEpicContainer>
                          </Box>
                        ))}

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <StoryMapCard type="placeholder" />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
          {/* Unassigned Stories */}
          <Box sx={{ minWidth: activities.length * 250 }}>
            <Box sx={{ display: "flex" }}>
              <MemoizedReleaseCard
                allowReorder={false}
                handleMoveRelease={handleMoveRelease}
                handleOpenReleaseForEdit={handleOpenReleaseForEdit}
                isFirst={false}
                isLast={false}
                release={createUnassignedReleaseObject(projectId) as Release}
                totalStoryPoints={calculateReleaseStoryPoints("unassigned")}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                mb: 2,
              }}
            >
              {activities.map(activity => (
                <Box key={activity.id} sx={{ mx: 1 }}>
                  {/* Add placeholder for activity */}
                  <StoryMapCard type="placeholder" />

                  {/* Epics Row - Horizontal */}
                  <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 2 }}>
                    {epics[activity.id] &&
                      epics[activity.id].map(epic => (
                        <Box key={epic.id} sx={{ flex: 1, minWidth: 0 }}>
                          {/* Add placeholder for epic */}
                          <StoryMapCard type="placeholder" />
                          {/* Stories Column - Vertical under each epic */}
                          <DroppableEpicContainer epic={epic} releaseId={null}>
                            <Box sx={{ mb: 2 }}>
                              {issues[epic.id] && issues[epic.id].length > 0 ? (
                                issues[epic.id]
                                  .filter(story => !story.releaseId)
                                  .map((story, index) => renderStoryCard(story, index))
                              ) : (
                                <></>
                              )}
                              <StoryMapCard
                                isAddCard={true}
                                type="story"
                                onClick={() => handleOpenStoryDialog(epic.id, null)}
                              />
                            </Box>
                          </DroppableEpicContainer>
                        </Box>
                      ))}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <StoryMapCard type="placeholder" />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Move Story Menu */}
        <Menu
          anchorEl={moveMenuAnchorEl}
          open={Boolean(moveMenuAnchorEl)}
          onClose={handleCloseMoveMenu}
        >
          <MenuItem disabled={movingStory} onClick={() => handleMoveStory(null)}>
            Remove from release
          </MenuItem>
          <Divider />
          {releases.map(release => (
            <MenuItem
              key={release.id}
              disabled={movingStory}
              onClick={() => handleMoveStory(release.id)}
            >
              {release.name}
            </MenuItem>
          ))}
        </Menu>

        {/* Dialog Components */}
        <ActivityDialog
          open={activityDialogOpen}
          onAddActivity={onAddActivity}
          onClose={() => setActivityDialogOpen(false)}
        />

        <EpicDialog
          activityId={selectedActivityId}
          open={epicDialogOpen}
          onAddEpic={onAddEpic}
          onClose={handleCloseEpicDialog}
        />

        <StoryDialog
          currentReleaseId={currentReleaseContext}
          epicId={selectedParentId}
          open={storyDialogOpen}
          onAddStory={onAddStory}
          onClose={handleCloseStoryDialog}
        />

        <ReleaseDialog
          open={releaseDialogOpen}
          onAddRelease={onAddRelease}
          onClose={handleCloseReleaseDialog}
        />

        <StoryDetailDialog
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
          open={storyDetailDialogOpen}
          releases={releases}
          story={selectedStory}
          onClose={handleCloseStoryDetail}
        />

        <EditItemDialog
          item={editingItem}
          itemType={editingItemType}
          open={editDialogOpen}
          releases={releases}
          onClose={handleCloseEditDialog}
          onUpdateItem={handleUpdateIssue}
        />

        <ReleaseDetailDialog
          open={releaseDetailDialogOpen}
          release={selectedRelease}
          onClose={handleCloseReleaseDetail}
          onUpdateRelease={handleUpdateRelease}
        />

        {/* Snackbar for feedback messages */}
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          autoHideDuration={4000}
          message={snackbarMessage}
          open={snackbarOpen}
          onClose={() => setSnackbarOpen(false)}
        />
      </Box>
    </DndProvider>
  );
}
