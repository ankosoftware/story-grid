import React, { memo, useRef } from "react";
import { Box } from "@mui/material";
import { useDrop } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";

interface DroppableActivityContainerProps {
  activity: Issue;
  children: React.ReactNode;
}

export const DroppableActivityContainer = memo(
  ({ activity, children }: DroppableActivityContainerProps) => {
    const [{ isOver, canDrop }, drop] = useDrop(
      () => ({
        accept: [ItemTypes.EPIC],
        drop: () => ({ id: activity.id, type: "activity" }),
        collect: monitor => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        }),
      }),
      [activity.id]
    );

    const dropRef = useRef(null);
    drop(dropRef);

    return (
      <Box
        ref={dropRef}
        sx={{
          p: 1,
          borderRadius: 1,
          background: isOver && canDrop ? "rgba(63, 81, 181, 0.1)" : "transparent",
          border: isOver && canDrop ? "1px dashed #3f51b5" : "1px solid transparent",
        }}
      >
        {children}
      </Box>
    );
  }
);

DroppableActivityContainer.displayName = "DroppableActivityContainer"; 