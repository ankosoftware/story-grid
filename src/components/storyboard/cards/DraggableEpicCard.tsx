import React, { memo, useRef } from "react";
import { Box, Chip, useTheme } from "@mui/material";
import { useDrag } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";
import { StoryMapCard } from "./StoryMapCard";

interface DraggableEpicCardProps {
  epic: Issue;
  handleMoveEpicToActivity?: (epicId: string, newParentId: string) => Promise<void>;
  handleOpenItemForEdit?: (item: Issue, type: "activity" | "epic" | "story") => void;
  handleOpenComments?: (item: Issue) => void;
  handleOpenEpicDetail?: (epic: Issue) => void;
  storyPoints?: number;
  onClick?: () => void;
  onAction?: (e: React.MouseEvent<HTMLElement>, id: string) => void;
}

export const DraggableEpicCard = memo(
  ({
    epic,
    handleMoveEpicToActivity,
    handleOpenItemForEdit,
    handleOpenComments,
    handleOpenEpicDetail,
    storyPoints,
    onClick,
    onAction,
  }: DraggableEpicCardProps) => {
    const theme = useTheme();

    // Setup drag source
    const [{ isDragging }, drag, preview] = useDrag(
      () => ({
        type: ItemTypes.EPIC,
        item: {
          type: ItemTypes.EPIC,
          id: epic.id,
          parentId: epic.parentId || null,
          originalIndex: epic.displayOrder || 0,
        },
        collect: monitor => ({
          isDragging: monitor.isDragging(),
        }),
        end: (item, monitor) => {
          const dropResult = monitor.getDropResult<{ id: string; type: string }>();
          if (item && dropResult) {
            if (
              dropResult.type === "activity" &&
              dropResult.id !== epic.parentId &&
              handleMoveEpicToActivity
            ) {
              // Move to a different activity
              handleMoveEpicToActivity(epic.id, dropResult.id);
            }
          }
        },
      }),
      [epic.id, epic.parentId, epic.displayOrder, handleMoveEpicToActivity]
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
      } else if (handleOpenEpicDetail) {
        handleOpenEpicDetail(epic);
      } else if (handleOpenItemForEdit) {
        handleOpenItemForEdit(epic, "epic");
      }
    };

    return (
      <Box
        ref={previewRef}
        data-display-order={epic.displayOrder}
        data-epic-id={epic.id}
        sx={{
          opacity: isDragging ? 0.6 : 1,
          cursor: "move",
          transform: isDragging ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          zIndex: isDragging ? 1000 : 1,
          display: isDragging ? "block" : "block",
        }}
      >
        <Box ref={dragRef} sx={{ display: "flex", alignItems: "center" }}>
          <StoryMapCard
            item={epic}
            type="epic"
            onAction={onAction}
            onClick={handleCardClick}
            onCommentClick={handleOpenComments ? (e, item) => handleOpenComments(item) : undefined}
          >
            {storyPoints !== undefined && storyPoints > 0 && (
              <Chip
                label={storyPoints}
                size="small"
                sx={{
                  fontSize: "0.6rem",
                  height: "16px",
                  fontWeight: "bold",
                  bgcolor: theme.palette.grey[200],
                  borderRadius: "8px",
                }}
              />
            )}
          </StoryMapCard>
        </Box>
      </Box>
    );
  }
);

// Add displayName to fix the linter warning
DraggableEpicCard.displayName = "DraggableEpicCard";
