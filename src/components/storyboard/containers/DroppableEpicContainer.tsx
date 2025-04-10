import React, { memo, useRef } from "react";
import { Box } from "@mui/material";
import { useDrop } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";

interface DroppableEpicContainerProps {
  epic: Issue;
  releaseId: string | null;
  children: React.ReactNode;
}

export const DroppableEpicContainer = memo(
  ({ epic, releaseId, children }: DroppableEpicContainerProps) => {
    const [{ isOver, canDrop }, drop] = useDrop(
      () => ({
        accept: [ItemTypes.STORY],
        drop: () => ({ id: epic.id, type: "epic", releaseId }),
        collect: monitor => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        }),
      }),
      [epic.id, releaseId]
    );

    const dropRef = useRef(null);
    drop(dropRef);

    return (
      <Box
        ref={dropRef}
        sx={{
          p: 1,
          borderRadius: 1,
          transition: "all 0.2s ease",
          background: isOver && canDrop ? "rgba(0, 172, 193, 0.2)" : "transparent",
          border: isOver && canDrop ? "2px dashed #00acc1" : "1px solid transparent",
          boxShadow: isOver && canDrop ? "0px 0px 8px rgba(0, 172, 193, 0.3)" : "none",
        }}
      >
        {children}
      </Box>
    );
  }
);

// Add displayName for DroppableEpicContainer
DroppableEpicContainer.displayName = "DroppableEpicContainer"; 