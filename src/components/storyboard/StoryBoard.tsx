import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DescriptionIcon from "@mui/icons-material/Description";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Issue, Release, IssueStatus, IssuePriority } from "@/lib/firebase/models/types";
import {
  updateIssue,
  updateRelease,
  updateReleaseOrder,
  deleteActivity,
  deleteEpic,
  deleteStory,
} from "@/lib/firebase/firestore";

// Import utility functions and types
import {
  getStatusColor,
  getPriorityColor,
  createUnassignedReleaseObject,
  StoryMapProps,
  exportStoryboardToCSV,
  exportStoryboardToMarkup,
  SPACING,
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
  CommentsDialog,
  EpicDetailDialog,
  DeleteConfirmationDialog,
} from "./dialogs";

// Import card components
import {
  StoryMapCard,
  MemoizedStoryCard,
  DraggableStoryCard,
  DraggableEpicCard,
  MemoizedReleaseCard,
  DraggableActivityCard,
} from "./cards";

// Import container components
import {
  DroppableActivityContainer,
  DroppableEpicContainer,
  DroppableActivityRowContainer,
} from "./containers";

export default function StoryMap({
  projectId,
  projectName,
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
  onUpdateIssueOptimistic,
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

  // Add state for sticky activities row with localStorage
  const [stickyActivitiesRow, setStickyActivitiesRow] = useState(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem("stickyActivitiesRow");
    return saved ? JSON.parse(saved) : false;
  });

  // Add state for comments dialog
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedIssueForComments, setSelectedIssueForComments] = useState<Issue | null>(null);

  // Add state for Epic Detail dialog
  const [epicDetailDialogOpen, setEpicDetailDialogOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Issue | null>(null);

  // Add state for deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingItemType, setDeletingItemType] = useState<"activity" | "epic" | "story" | null>(
    null
  );
  const [deletingItemName, setDeletingItemName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Add state for context menus
  const [contextMenuAnchorEl, setContextMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [contextMenuItemId, setContextMenuItemId] = useState<string | null>(null);
  const [contextMenuItemType, setContextMenuItemType] = useState<
    "activity" | "epic" | "story" | null
  >(null);

  // Add state for the export menu
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Add state for collapsed activities
  const [collapsedActivities, setCollapsedActivities] = useState<string[]>(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem("collapsedActivities");
    return saved ? JSON.parse(saved) : [];
  });

  // Save sticky preference when it changes
  useEffect(() => {
    localStorage.setItem("stickyActivitiesRow", JSON.stringify(stickyActivitiesRow));
  }, [stickyActivitiesRow]);

  // Save collapsed activities when they change
  useEffect(() => {
    localStorage.setItem("collapsedActivities", JSON.stringify(collapsedActivities));
  }, [collapsedActivities]);

  // Add handler for updating issues with optimistic updates
  const handleUpdateIssue = useCallback(
    async (issue: Issue, updatedData: Partial<Issue>) => {
      try {
        setUpdatingIssue(true);

        // Use optimistic update if available, otherwise fall back to direct Firestore call
        if (onUpdateIssueOptimistic) {
          // Optimistic update: UI updates immediately, Firestore syncs in background
          await onUpdateIssueOptimistic(issue.id, updatedData);
          console.log(
            `Optimistically updated ${issue.type.toLowerCase()}: ${issue.id}`,
            updatedData
          );
        } else {
          // Fallback: wait for Firestore (slower, but works without the prop)
          await updateIssue(issue.id, updatedData);
          console.log(`Updated ${issue.type.toLowerCase()}: ${issue.id}`, updatedData);
        }
      } catch (error) {
        console.error("Error updating issue:", error);
        throw error;
      } finally {
        setUpdatingIssue(false);
      }
    },
    [onUpdateIssueOptimistic]
  );

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

  // Handler for Activity Dialog
  const handleOpenActivityDialog = useCallback(() => {
    setActivityDialogOpen(true);
  }, []);

  const handleCloseActivityDialog = useCallback(() => {
    setActivityDialogOpen(false);
  }, []);

  const handleActivityDialogSubmit = useCallback(
    async (name: string, description?: string) => {
      try {
        const activityId = await onAddActivity(name, description);
        setSnackbarMessage(`Activity '${name}' created successfully`);
        setSnackbarOpen(true);
        return activityId;
      } catch (error) {
        console.error("Error creating activity:", error);
        setSnackbarMessage(`Failed to create activity: ${(error as Error).message}`);
        setSnackbarOpen(true);
        throw error;
      }
    },
    [onAddActivity]
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

  const handleEpicDialogSubmit = useCallback(
    async (activityId: string, name: string, description?: string) => {
      try {
        const epicId = await onAddEpic(activityId, name, description);
        setSnackbarMessage(`Epic '${name}' created successfully`);
        setSnackbarOpen(true);
        return epicId;
      } catch (error) {
        console.error("Error creating epic:", error);
        setSnackbarMessage(`Failed to create epic: ${(error as Error).message}`);
        setSnackbarOpen(true);
        throw error;
      }
    },
    [onAddEpic]
  );

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

  const handleStoryDialogSubmit = useCallback(
    async (epicId: string, name: string, options?: any) => {
      try {
        const storyId = await onAddStory(epicId, name, options);
        setSnackbarMessage(`Story '${name}' created successfully`);
        setSnackbarOpen(true);
        return storyId;
      } catch (error) {
        console.error("Error creating story:", error);
        setSnackbarMessage(`Failed to create story: ${(error as Error).message}`);
        setSnackbarOpen(true);
        throw error;
      }
    },
    [onAddStory]
  );

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

  // Handler for Epic Detail
  const handleOpenEpicDetail = useCallback((epic: Issue) => {
    setSelectedEpic(epic);
    setEpicDetailDialogOpen(true);
  }, []);

  const handleCloseEpicDetail = useCallback(() => {
    setEpicDetailDialogOpen(false);
    setSelectedEpic(null);
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

  // Add handler for opening comments dialog
  const handleOpenComments = useCallback((issue: Issue) => {
    setSelectedIssueForComments(issue);
    setCommentsDialogOpen(true);
  }, []);

  const handleCloseCommentsDialog = useCallback(() => {
    setCommentsDialogOpen(false);
    setSelectedIssueForComments(null);
  }, []);

  // Add handler for opening context menu
  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>, id: string, type: "activity" | "epic" | "story") => {
      event.preventDefault();
      event.stopPropagation();
      // Set anchor element and item info
      setContextMenuAnchorEl(event.currentTarget);
      setContextMenuItemId(id);
      setContextMenuItemType(type);
    },
    []
  );

  // Add handler for closing context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenuAnchorEl(null);
    setContextMenuItemId(null);
    setContextMenuItemType(null);
  }, []);

  // Add handler for delete action
  const handleDeleteAction = useCallback(() => {
    // First close the context menu
    handleCloseContextMenu();

    // Find the name of the item to delete
    let itemName = "item";

    if (contextMenuItemType === "activity") {
      const activity = activities.find(a => a.id === contextMenuItemId);
      if (activity) {
        itemName = activity.name;
      }
    } else if (contextMenuItemType === "epic") {
      for (const activityId in epics) {
        const epic = epics[activityId].find(e => e.id === contextMenuItemId);
        if (epic) {
          itemName = epic.name;
          break;
        }
      }
    } else if (contextMenuItemType === "story") {
      for (const epicId in issues) {
        const story = issues[epicId].find(s => s.id === contextMenuItemId);
        if (story) {
          itemName = story.name;
          break;
        }
      }
    }

    // Open the delete confirmation dialog
    setDeletingItemId(contextMenuItemId);
    setDeletingItemType(contextMenuItemType);
    setDeletingItemName(itemName);
    setDeleteDialogOpen(true);
  }, [contextMenuItemId, contextMenuItemType, activities, epics, issues]);

  // Add handler for confirming delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingItemId || !deletingItemType) {
      return;
    }

    try {
      setIsDeleting(true);

      // Execute the appropriate delete function based on item type
      switch (deletingItemType) {
        case "activity":
          await deleteActivity(deletingItemId);
          break;
        case "epic":
          await deleteEpic(deletingItemId);
          break;
        case "story":
          await deleteStory(deletingItemId);
          break;
      }

      // Show success message
      setSnackbarMessage(`Successfully deleted ${deletingItemType}: ${deletingItemName}`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error(`Error deleting ${deletingItemType}:`, error);
      setSnackbarMessage(`Failed to delete ${deletingItemType}: ${(error as Error).message}`);
      setSnackbarOpen(true);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingItemId(null);
      setDeletingItemType(null);
      setDeletingItemName("");
    }
  }, [deletingItemId, deletingItemType, deletingItemName]);

  // Add handler for moving activities
  const handleUpdateActivityOrder = useCallback(
    async (activityId: string, newDisplayOrder: number) => {
      try {
        setUpdatingIssue(true);

        // Update the activity's display order
        await updateIssue(activityId, { displayOrder: newDisplayOrder });

        console.log(`Updated display order for activity ${activityId} to ${newDisplayOrder}`);
      } catch (error) {
        console.error("Error updating activity order:", error);
      } finally {
        setUpdatingIssue(false);
      }
    },
    []
  );

  // Handle opening and closing export menu
  const handleOpenExportMenu = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setExportMenuAnchorEl(null);
  };

  // Function to handle exporting CSV
  const handleExportCSV = () => {
    // Close the menu
    handleCloseExportMenu();

    // Use the exported function
    exportStoryboardToCSV(activities, epics, issues, releases, projectName);

    // Show success message
    setSnackbarMessage("CSV exported successfully!");
    setSnackbarOpen(true);
  };

  // Function to handle exporting Markdown
  const handleExportMarkup = () => {
    // Close the menu
    handleCloseExportMenu();

    // Use the exported function
    exportStoryboardToMarkup(activities, epics, issues, releases, projectName);

    // Show success message
    setSnackbarMessage("Markdown exported successfully!");
    setSnackbarOpen(true);
  };

  // Add handler for toggling activity collapse
  const handleToggleActivityCollapse = useCallback((activityId: string) => {
    setCollapsedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
  }, []);

  // Add function to toggle all activities collapse state
  const handleToggleAllActivities = useCallback(() => {
    if (collapsedActivities.length === activities.length) {
      // If all activities are collapsed, expand all
      setCollapsedActivities([]);
    } else {
      // Otherwise, collapse all
      setCollapsedActivities(activities.map(activity => activity.id));
    }
  }, [activities, collapsedActivities.length]);

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
        handleOpenComments={handleOpenComments}
        handleOpenItemForEdit={handleOpenItemForEdit}
        handleOpenMoveMenu={handleOpenMoveMenu}
        index={index}
        story={story}
        onAction={e => handleContextMenu(e, story.id, "story")}
      />
    ),
    [
      handleMoveStoryToEpic,
      handleOpenItemForEdit,
      handleOpenMoveMenu,
      handleOpenComments,
      handleContextMenu,
    ]
  );

  // Calculate story points for epics
  const calculateEpicStoryPoints = useCallback(
    (epicId: string, releaseId?: string): number => {
      if (!issues[epicId]) {
        return 0;
      }

      return issues[epicId].reduce((total, story) => {
        if (story.releaseId === releaseId || !releaseId) {
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

  // Calculate activity column width based on number of epics
  const getActivityColumnWidth = useCallback(
    (activityId: string) => {
      const epicCount = epics[activityId]?.length || 0;
      // Width for epic cards + add epic card
      return (
        (epicCount + 1) * (SPACING.CARD_WIDTH + SPACING.CARD_PADDING) + epicCount * SPACING.GAP_PX
      );
    },
    [epics]
  );

  // Memoize the epic card component
  const renderEpicCard = useCallback(
    (epic: Issue) => (
      <Box
        key={epic.id}
        data-testid={`epic-card-${epic.id}`}
        sx={{
          flex: 1,
          minWidth: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          paddingRight: SPACING.EPIC_COLUMN_PADDING_X,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DraggableEpicCard
          epic={epic}
          handleMoveEpicToActivity={handleMoveEpicToActivity}
          handleOpenComments={handleOpenComments}
          handleOpenEpicDetail={handleOpenEpicDetail}
          handleOpenItemForEdit={handleOpenItemForEdit}
          storyPoints={calculateEpicStoryPoints(epic.id)}
          onAction={e => handleContextMenu(e, epic.id, "epic")}
        />
      </Box>
    ),
    [
      handleMoveEpicToActivity,
      handleOpenItemForEdit,
      handleOpenComments,
      handleOpenEpicDetail,
      calculateEpicStoryPoints,
      theme.palette.divider,
      handleContextMenu,
    ]
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
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => setActivityDialogOpen(true)}
            >
              Add Activity
            </Button>
            <Tooltip title="Keep activities and epics visible while scrolling">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={stickyActivitiesRow}
                    size="small"
                    onChange={e => setStickyActivitiesRow(e.target.checked)}
                  />
                }
                label="Sticky Headers"
                sx={{ mx: 1 }}
              />
            </Tooltip>
            <Tooltip
              title={
                collapsedActivities.length === activities.length
                  ? "Expand all activities"
                  : "Collapse all activities"
              }
            >
              <Button
                size="small"
                sx={{ mr: 1 }}
                variant="outlined"
                onClick={handleToggleAllActivities}
              >
                {collapsedActivities.length === activities.length ? "Expand All" : "Collapse All"}
              </Button>
            </Tooltip>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Button startIcon={<AddIcon />} variant="outlined" onClick={handleOpenReleaseDialog}>
                Add Release
              </Button>
              <IconButton
                aria-label="Export options"
                size="small"
                sx={{ ml: 0.5 }}
                onClick={handleOpenExportMenu}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchorEl}
          open={Boolean(exportMenuAnchorEl)}
          onClose={handleCloseExportMenu}
        >
          <MenuItem onClick={handleExportCSV}>
            <CloudDownloadIcon fontSize="small" sx={{ mr: 1 }} />
            Export as CSV
          </MenuItem>
          <MenuItem onClick={handleExportMarkup}>
            <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
            Export as Markdown
          </MenuItem>
        </Menu>

        {/* Main Story Map Structure */}
        <Box
          data-testid="story-map-main-container"
          sx={{
            p: 1,
            border: `1px solid ${theme.palette.divider}`,
            overflowX: "auto",
            maxHeight: stickyActivitiesRow ? "calc(100vh - 200px)" : "auto",
            ...(stickyActivitiesRow && {
              overflowY: "auto",
              scrollbarWidth: "thin", // For Firefox
              "&::-webkit-scrollbar": {
                // For Chrome/Safari/Edge
                width: "8px",
                height: "8px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: theme.palette.grey[400],
                borderRadius: "4px",
              },
            }),
          }}
        >
          <div
            data-testid="story-map-container"
            style={{ display: "inline-block", minWidth: "100%" }}
          >
            {/* Activities Row */}
            <Box
              sx={{
                minWidth: activities.length * 250,
                width: "100%",
                ...(stickyActivitiesRow && {
                  backgroundColor: theme.palette.background.paper,
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  boxShadow: `0 2px 4px ${theme.palette.divider}`,
                  transition: "box-shadow 0.3s ease", // Add smooth transition for box-shadow
                }),
              }}
            >
              <DroppableActivityRowContainer activities={activities}>
                {activities.map(activity => (
                  <Box
                    key={activity.id}
                    sx={{
                      mx: SPACING.ACTIVITY_MARGIN_X,
                      width: getActivityColumnWidth(activity.id),
                    }}
                  >
                    <DroppableActivityContainer activity={activity}>
                      <Box sx={{ px: 0, mb: 0 }}>
                        <DraggableActivityCard
                          activity={activity}
                          handleOpenComments={handleOpenComments}
                          handleOpenItemForEdit={handleOpenItemForEdit}
                          isCollapsed={collapsedActivities.includes(activity.id)}
                          onAction={e => handleContextMenu(e, activity.id, "activity")}
                          onToggleCollapse={handleToggleActivityCollapse}
                        />
                      </Box>

                      {/* Only show content if the activity is not collapsed */}
                      {!collapsedActivities.includes(activity.id) && (
                        <>
                          {/* Epics Row - Horizontal */}
                          <Box
                            data-testid={`epics-row-${activity.id}`}
                            sx={{
                              display: "flex",
                              flexDirection: "row",
                              gap: SPACING.EPIC_GAP,
                              mb: SPACING.STORY_GAP,
                              height: "100%",
                              ...(stickyActivitiesRow && {
                                position: "sticky",
                                top: theme.spacing(7),
                                zIndex: 9,
                                backgroundColor: theme.palette.background.paper,
                                paddingTop: 1,
                              }),
                            }}
                          >
                            {epics[activity.id] &&
                              epics[activity.id].map(epic => renderEpicCard(epic))}

                            <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
                              <StoryMapCard
                                isAddCard={true}
                                type="epic"
                                onClick={() => handleOpenEpicDialog(activity.id)}
                              />
                            </Box>
                          </Box>
                        </>
                      )}
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
              </DroppableActivityRowContainer>
            </Box>
            {releases.map((release, index) => (
              <Box
                key={release.id}
                data-testid={`release-section-${release.id}`}
                sx={{ width: "100%" }}
              >
                {/* Release Header */}
                <Box data-release-id={release.id} sx={{ display: "flex", width: "100%" }}>
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
                  data-testid={`release-row-${release.id}`}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    mb: SPACING.RELEASE_ROW_MARGIN_BOTTOM,
                    px: 2,
                  }}
                >
                  {activities.map(activity => (
                    <Box
                      key={activity.id}
                      data-testid={`activity-column-${activity.id}-${release.id}`}
                      sx={{
                        mx: SPACING.ACTIVITY_MARGIN_X,
                      }}
                    >
                      {/* Add placeholder for activity */}
                      <StoryMapCard type="placeholder" />

                      {/* Only show content if the activity is not collapsed */}
                      {!collapsedActivities.includes(activity.id) ? (
                        /* Epics Row - Horizontal */
                        <Box
                          data-testid={`epics-story-row-${activity.id}-${release.id}`}
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            gap: SPACING.EPIC_GAP,
                            mb: SPACING.STORY_GAP,
                            height: "100%",
                            pr: 1,
                          }}
                        >
                          {epics[activity.id] &&
                            epics[activity.id].map(epic => (
                              <Box
                                key={epic.id}
                                sx={{
                                  flex: 1,
                                  minWidth: 0,
                                  borderRight: `1px solid ${theme.palette.divider}`,
                                  paddingRight: SPACING.EPIC_COLUMN_PADDING_X,
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                {/* Add placeholder for epic */}
                                <StoryMapCard type="placeholder" />
                                {/* Add story points to the epic in the release */}
                                <Chip
                                  label={calculateEpicStoryPoints(epic.id, release.id)}
                                  sx={{
                                    fontSize: "0.6rem",
                                    height: "16px",
                                    fontWeight: "bold",
                                    bgcolor:
                                      theme.palette.mode === "dark"
                                        ? theme.palette.grey[700]
                                        : theme.palette.grey[200],
                                    color: theme.palette.text.primary,
                                    borderRadius: "8px",
                                    marginLeft: "0px",
                                  }}
                                />
                                {/* Stories Column - Vertical under each epic */}
                                <DroppableEpicContainer
                                  data-testid={`stories-column-${epic.id}-${release.id}`}
                                  epic={epic}
                                  releaseId={release.id}
                                >
                                  <Box
                                    data-testid={`stories-column-box-${epic.id}-${release.id}`}
                                    sx={{ mb: SPACING.STORY_GAP, flexGrow: 1 }}
                                  >
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
                          <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
                            <StoryMapCard type="placeholder" />
                          </Box>
                        </Box>
                      ) : (
                        /* Show a collapsed placeholder when the activity is collapsed */
                        <Box
                          sx={{
                            height: "30px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography color="text.secondary" variant="caption">
                            (Collapsed)
                          </Typography>
                        </Box>
                      )}
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
                  alignItems: "flex-start",
                  mb: SPACING.RELEASE_ROW_MARGIN_BOTTOM,
                }}
              >
                {activities.map(activity => (
                  <Box
                    key={activity.id}
                    sx={{
                      mx: SPACING.ACTIVITY_MARGIN_X,
                      width: getActivityColumnWidth(activity.id),
                    }}
                  >
                    {/* Add placeholder for activity */}
                    <StoryMapCard type="placeholder" />

                    {/* Only show content if the activity is not collapsed */}
                    {!collapsedActivities.includes(activity.id) ? (
                      /* Epics Row - Horizontal */
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          gap: SPACING.EPIC_GAP,
                          mb: SPACING.STORY_GAP,
                          height: "100%",
                        }}
                      >
                        {epics[activity.id] &&
                          epics[activity.id].map(epic => (
                            <Box
                              key={epic.id}
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                borderRight: `1px solid ${theme.palette.divider}`,
                                px: SPACING.EPIC_COLUMN_PADDING_X,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              {/* Add placeholder for epic */}
                              <StoryMapCard type="placeholder" />
                              {/* Stories Column - Vertical under each epic */}
                              <DroppableEpicContainer epic={epic} releaseId={null}>
                                <Box sx={{ mb: SPACING.STORY_GAP, flexGrow: 1 }}>
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

                        <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
                          <StoryMapCard type="placeholder" />
                        </Box>
                      </Box>
                    ) : (
                      /* Show a collapsed placeholder when the activity is collapsed */
                      <Box
                        sx={{
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography color="text.secondary" variant="caption">
                          (Collapsed)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </div>
        </Box>

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
          projectId={projectId}
          onAddActivity={handleActivityDialogSubmit}
          onClose={handleCloseActivityDialog}
        />

        <EpicDialog
          activityId={selectedActivityId}
          open={epicDialogOpen}
          projectId={projectId}
          onAddEpic={handleEpicDialogSubmit}
          onClose={handleCloseEpicDialog}
        />

        <StoryDialog
          currentReleaseId={currentReleaseContext}
          epicId={selectedParentId}
          open={storyDialogOpen}
          projectId={projectId}
          onAddStory={handleStoryDialogSubmit}
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

        <EpicDetailDialog
          epic={selectedEpic}
          getStatusColor={getStatusColor}
          open={epicDetailDialogOpen}
          onClose={handleCloseEpicDetail}
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

        <CommentsDialog
          issue={selectedIssueForComments}
          open={commentsDialogOpen}
          onClose={handleCloseCommentsDialog}
        />

        {/* Add context menu */}
        <Menu
          anchorEl={contextMenuAnchorEl}
          open={Boolean(contextMenuAnchorEl)}
          onClose={handleCloseContextMenu}
        >
          {contextMenuItemType === "activity" && (
            <MenuItem
              onClick={() => {
                handleCloseContextMenu();
                // Existing edit functionality here
                const activity = activities.find(a => a.id === contextMenuItemId);
                if (activity) {
                  setEditingItem(activity);
                  setEditingItemType("activity");
                  setEditDialogOpen(true);
                }
              }}
            >
              Edit Activity
            </MenuItem>
          )}

          {contextMenuItemType === "epic" && (
            <MenuItem
              onClick={() => {
                handleCloseContextMenu();
                // Existing edit functionality here
                let epicToEdit: Issue | undefined;

                for (const activityId in epics) {
                  epicToEdit = epics[activityId].find(e => e.id === contextMenuItemId);
                  if (epicToEdit) {
                    break;
                  }
                }

                if (epicToEdit) {
                  setEditingItem(epicToEdit);
                  setEditingItemType("epic");
                  setEditDialogOpen(true);
                }
              }}
            >
              Edit Epic
            </MenuItem>
          )}

          {contextMenuItemType === "story" && (
            <MenuItem
              onClick={() => {
                handleCloseContextMenu();
                // Existing edit functionality here
                let storyToEdit: Issue | undefined;

                for (const epicId in issues) {
                  storyToEdit = issues[epicId].find(s => s.id === contextMenuItemId);
                  if (storyToEdit) {
                    break;
                  }
                }

                if (storyToEdit) {
                  setEditingItem(storyToEdit);
                  setEditingItemType("story");
                  setEditDialogOpen(true);
                }
              }}
            >
              Edit Story
            </MenuItem>
          )}

          {/* Add delete option for all item types */}
          <MenuItem sx={{ color: "error.main" }} onClick={handleDeleteAction}>
            Delete {contextMenuItemType}
          </MenuItem>
        </Menu>

        {/* Add delete confirmation dialog */}
        <DeleteConfirmationDialog
          isDeleting={isDeleting}
          itemName={deletingItemName}
          itemType={deletingItemType || "story"}
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
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
