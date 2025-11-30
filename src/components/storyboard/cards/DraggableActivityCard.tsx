import React, { memo, useRef } from "react";
import { Box, useTheme, IconButton } from "@mui/material";
import { useDrag } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";
import { StoryMapCard } from "./StoryMapCard";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface DraggableActivityCardProps {
  activity: Issue;
  handleOpenItemForEdit?: (item: Issue, type: "activity" | "epic" | "story") => void;
  handleOpenComments?: (item: Issue) => void;
  onClick?: () => void;
  onAction?: (e: React.MouseEvent<HTMLElement>, id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (activityId: string) => void;
}

export const DraggableActivityCard = memo(
  ({
    activity,
    handleOpenItemForEdit,
    handleOpenComments,
    onClick,
    onAction,
    isCollapsed = false,
    onToggleCollapse,
  }: DraggableActivityCardProps) => {
    const theme = useTheme();

    // Setup drag source
    const [{ isDragging }, drag, preview] = useDrag(
      () => ({
        type: ItemTypes.ACTIVITY,
        item: {
          type: ItemTypes.ACTIVITY,
          id: activity.id,
          parentId: null,
          originalIndex: activity.displayOrder || 0,
        },
        collect: monitor => ({
          isDragging: monitor.isDragging(),
        }),
      }),
      [activity.id, activity.displayOrder]
    );

    // Use refs properly for react-dnd
    const previewRef = useRef(null);
    const dragRef = useRef(null);

    // Connect the preview and drag refs
    drag(dragRef);
    preview(previewRef);

    const handleCardClick = () => {
      if (onClick) {
        onClick();
      } else if (handleOpenItemForEdit) {
        handleOpenItemForEdit(activity, "activity");
      }
    };

    const handleToggleCollapse = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      if (onToggleCollapse) {
        onToggleCollapse(activity.id);
      }
    };

    return (
      <Box
        ref={previewRef}
        data-activity-id={activity.id}
        data-display-order={activity.displayOrder}
        sx={{
          opacity: isDragging ? 0.6 : 1,
          cursor: "move",
          transform: isDragging ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          zIndex: isDragging ? 1000 : 1,
          display: isDragging ? "block" : "block",
          mb: 1,
        }}
      >
        <Box ref={dragRef} sx={{ display: "flex", alignItems: "center" }}>
          <StoryMapCard
            item={activity}
            type="activity"
            onAction={onAction}
            onClick={handleCardClick}
            onCommentClick={handleOpenComments ? (e, item) => handleOpenComments(item) : undefined}
          >
            {onToggleCollapse && (
              <IconButton
                size="small"
                sx={{
                  color: "white",
                  padding: "2px",
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  minWidth: "18px",
                  minHeight: "18px",
                  width: "18px",
                  height: "18px",
                  backgroundColor: isCollapsed ? "rgba(255, 255, 255, 0.15)" : "transparent",
                  borderRadius: "3px",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                  },
                }}
                onClick={handleToggleCollapse}
              >
                {isCollapsed ? (
                  <ExpandMoreIcon sx={{ fontSize: "0.9rem" }} />
                ) : (
                  <ExpandLessIcon sx={{ fontSize: "0.9rem" }} />
                )}
              </IconButton>
            )}
          </StoryMapCard>
        </Box>
      </Box>
    );
  }
);

// Add displayName to fix the linter warning
DraggableActivityCard.displayName = "DraggableActivityCard";
