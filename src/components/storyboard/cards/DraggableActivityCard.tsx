import React, { memo, useRef } from "react";
import { Box, useTheme } from "@mui/material";
import { useDrag } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";
import { StoryMapCard } from "./StoryMapCard";

interface DraggableActivityCardProps {
  activity: Issue;
  handleOpenItemForEdit?: (item: Issue, type: "activity" | "epic" | "story") => void;
  handleOpenComments?: (item: Issue) => void;
  onClick?: () => void;
  onAction?: (e: React.MouseEvent<HTMLElement>, id: string) => void;
}

export const DraggableActivityCard = memo(
  ({
    activity,
    handleOpenItemForEdit,
    handleOpenComments,
    onClick,
    onAction,
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

    return (
      <Box
        ref={previewRef}
        data-display-order={activity.displayOrder}
        data-activity-id={activity.id}
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
          />
        </Box>
      </Box>
    );
  }
);

// Add displayName to fix the linter warning
DraggableActivityCard.displayName = "DraggableActivityCard";
