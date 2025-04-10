import React, { memo, useRef } from "react";
import { Box } from "@mui/material";
import { useDrag } from "react-dnd";
import { Issue, IssueStatus, IssuePriority } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";
import { MemoizedStoryCard } from "./MemoizedStoryCard";

interface DraggableStoryCardProps {
  story: Issue;
  getStatusColor: (status: IssueStatus) => string;
  getPriorityColor: (priority: IssuePriority) => string;
  handleOpenMoveMenu: (event: React.MouseEvent<HTMLElement>, storyId: string) => void;
  handleOpenItemForEdit: (item: Issue, type: "activity" | "epic" | "story") => void;
  handleMoveStoryToEpic: (
    storyId: string,
    newParentId: string,
    releaseId: string | null
  ) => Promise<void>;
  index: number;
}

export const DraggableStoryCard = memo(
  ({
    story,
    getStatusColor,
    getPriorityColor,
    handleOpenMoveMenu,
    handleOpenItemForEdit,
    handleMoveStoryToEpic,
    index,
  }: DraggableStoryCardProps) => {
    // Setup drag source
    const [{ isDragging }, drag, preview] = useDrag(
      () => ({
        type: ItemTypes.STORY,
        item: {
          type: ItemTypes.STORY,
          id: story.id,
          parentId: story.parentId || null,
          originalIndex: story.displayOrder || index,
        },
        collect: monitor => ({
          isDragging: monitor.isDragging(),
        }),
        end: (item, monitor) => {
          const dropResult = monitor.getDropResult<{
            id: string;
            type: string;
            releaseId: string | null;
          }>();

          if (
            item &&
            dropResult &&
            dropResult.type === "epic" &&
            (dropResult.id !== story.parentId || dropResult.releaseId !== story.releaseId)
          ) {
            // Only move if dropped on a different parent or release
            handleMoveStoryToEpic(story.id, dropResult.id, dropResult.releaseId);
          }
        },
      }),
      [story.id, story.parentId, story.displayOrder, index, handleMoveStoryToEpic]
    );

    // Use refs properly for react-dnd
    const previewRef = useRef(null);
    const dragRef = useRef(null);

    // Connect the preview and drag refs
    drag(dragRef);
    preview(previewRef);

    return (
      <Box
        ref={previewRef}
        sx={{
          opacity: isDragging ? 0.6 : 1,
          cursor: "move",
          transform: isDragging ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          zIndex: isDragging ? 1000 : 1,
          display: isDragging ? "none" : "block", // Hide the original while dragging
        }}
      >
        <Box ref={dragRef} sx={{ display: "flex", alignItems: "center" }}>
          <MemoizedStoryCard
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
            handleOpenItemForEdit={handleOpenItemForEdit}
            handleOpenMoveMenu={handleOpenMoveMenu}
            story={story}
          />
        </Box>
      </Box>
    );
  }
);

// Add displayName to fix the linter warning
DraggableStoryCard.displayName = "DraggableStoryCard"; 