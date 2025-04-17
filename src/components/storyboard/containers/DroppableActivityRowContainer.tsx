import React, { memo, useRef, useState, useCallback, useMemo } from "react";
import { Box } from "@mui/material";
import { useDrop } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";
import { batchUpdateIssueOrders } from "@/lib/firebase/firestore";

interface DroppableActivityRowContainerProps {
  activities: Issue[];
  children: React.ReactNode;
}

// Type for the draggable item
interface DragItem {
  id: string;
  type: string;
  parentId: string | null;
  originalIndex: number;
}

export const DroppableActivityRowContainer = memo(
  ({ activities, children }: DroppableActivityRowContainerProps) => {
    // Consolidated state for drop operations
    const [dropState, setDropState] = useState<{
      indicatorIndex: number | null;
      draggedItemId: string | null;
      pendingDisplayOrder: number | null;
    }>({
      indicatorIndex: null,
      draggedItemId: null,
      pendingDisplayOrder: null,
    });

    // Create a ref for the container element
    const dropRef = useRef<HTMLDivElement>(null);

    // Memoized activity elements accessor to avoid repeated DOM queries
    const getActivityElements = useCallback(() => {
      if (!dropRef.current) {
        return [];
      }

      return Array.from(dropRef.current.querySelectorAll("[data-activity-id]")) as HTMLElement[];
    }, []);

    // Get ordered activities (excluding the dragged item)
    const getOrderedActivities = useCallback(
      (draggedItemId: string | null) => {
        const elements = getActivityElements();

        return elements
          .filter(el => el.getAttribute("data-activity-id") !== draggedItemId)
          .map(el => ({
            id: el.getAttribute("data-activity-id") || "",
            displayOrder: parseInt(el.getAttribute("data-display-order") || "0", 10),
            element: el,
          }))
          .sort((a, b) => a.displayOrder - b.displayOrder);
      },
      [getActivityElements]
    );

    // Drop handler - optimized and extracted for better readability
    const handleDrop = useCallback(
      (item: DragItem) => {
        const { pendingDisplayOrder } = dropState;

        // Reset indicator when dropped
        setDropState(prev => ({
          ...prev,
          indicatorIndex: null,
          draggedItemId: null,
          pendingDisplayOrder: null,
        }));

        if (pendingDisplayOrder === null) {
          console.warn("Missing pendingDisplayOrder during drop");
          return;
        }

        // Get the ordered activities excluding the dragged item
        const orderedActivities = getOrderedActivities(item.id);

        // Create a batch of updates for efficient reordering
        const batchUpdates = [
          // Add the dropped item at its new position
          {
            id: item.id,
            displayOrder: pendingDisplayOrder,
          },
        ];

        // Adjust orders of other items that need to be shifted
        orderedActivities.forEach(activity => {
          if (activity.displayOrder >= pendingDisplayOrder) {
            batchUpdates.push({
              id: activity.id,
              displayOrder: activity.displayOrder + 1,
            });
          }
        });

        // Execute the batch update
        if (batchUpdates.length > 0) {
          batchUpdateIssueOrders(batchUpdates).catch(error =>
            console.error("Error updating display orders:", error)
          );
        }
      },
      [dropState, getOrderedActivities]
    );

    // Hover handler - optimized for horizontal orientation
    const handleHover = useCallback(
      (item: DragItem, monitor: any) => {
        // Only set the ID if it changed
        setDropState(prev =>
          prev.draggedItemId !== item.id ? { ...prev, draggedItemId: item.id } : prev
        );

        // Only proceed if hovering over an activity
        if (item.type !== ItemTypes.ACTIVITY) {
          return;
        }

        // Get the container element
        const containerElement = dropRef.current;
        if (!containerElement) {
          return;
        }

        // Get the client offset of the hover
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) {
          return;
        }

        // Get ordered activities excluding the dragged item
        const orderedActivities = getOrderedActivities(item.id);

        // If no cards, place at beginning
        if (orderedActivities.length === 0) {
          setDropState(prev => ({
            ...prev,
            indicatorIndex: 0,
            pendingDisplayOrder: 1,
          }));
          return;
        }

        // Determine where to place card based on cursor position
        let newIndicatorIndex = null;
        let newDisplayOrder = null;

        // Find the right position based on X coordinate (horizontal orientation)
        for (let i = 0; i < orderedActivities.length; i++) {
          const { element } = orderedActivities[i];
          const cardRect = element.getBoundingClientRect();

          // If cursor is to the left or in the left half of this card
          if (clientOffset.x <= cardRect.left + cardRect.width / 2) {
            newIndicatorIndex = i;

            // Calculate new display order - FIXED CALCULATION
            if (i === 0) {
              // If it's the first card, use a value smaller than the first card
              newDisplayOrder = Math.max(1, orderedActivities[0].displayOrder - 1);
            } else {
              // Place between the current and previous card
              const prevOrder = orderedActivities[i - 1].displayOrder;
              const currentOrder = orderedActivities[i].displayOrder;
              newDisplayOrder = prevOrder + Math.floor((currentOrder - prevOrder) / 2);

              // If orders are consecutive, place exactly between them
              if (currentOrder - prevOrder <= 1) {
                // Shift everything from this position
                newDisplayOrder = prevOrder + 1;
              }
            }
            break;
          }
        }

        // If we didn't find a position, place after the last card
        if (newIndicatorIndex === null) {
          const lastIndex = orderedActivities.length - 1;
          newIndicatorIndex = orderedActivities.length;
          newDisplayOrder = orderedActivities[lastIndex].displayOrder + 1;
        }

        // Only update state if values changed
        setDropState(prev => {
          if (
            prev.indicatorIndex === newIndicatorIndex &&
            prev.pendingDisplayOrder === newDisplayOrder
          ) {
            return prev;
          }
          return {
            ...prev,
            indicatorIndex: newIndicatorIndex,
            pendingDisplayOrder: newDisplayOrder,
          };
        });
      },
      [getOrderedActivities]
    );

    // useDrop hook with optimized handlers
    const [{ isOver, canDrop }, drop] = useDrop(
      {
        accept: [ItemTypes.ACTIVITY],
        drop: handleDrop,
        hover: handleHover,
        collect: monitor => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        }),
      },
      [handleDrop, handleHover]
    );

    // Apply the drop ref to our container ref
    drop(dropRef);

    // Memoized drop indicator renderer - vertical line (for horizontal layout)
    const DropIndicator = memo(() => (
      <Box
        sx={{
          width: "4px",
          height: "100%",
          backgroundColor: "#2196f3",
          margin: "0 8px",
          borderRadius: "2px",
          boxShadow: "0 0 4px rgba(33, 150, 243, 0.5)",
          animation: "pulse 1s infinite",
          "@keyframes pulse": {
            "0%": { opacity: 0.6 },
            "50%": { opacity: 1 },
            "100%": { opacity: 0.6 },
          },
        }}
      />
    ));

    DropIndicator.displayName = "DropIndicator";

    // Generate children with indicators - memoized for performance
    const childrenWithIndicators = useMemo(() => {
      const { indicatorIndex } = dropState;
      const showIndicator = isOver && canDrop && indicatorIndex !== null;

      if (!showIndicator) {
        return children;
      }

      return React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) {
          return child;
        }

        if (index === indicatorIndex) {
          return (
            <>
              <DropIndicator />
              {child}
            </>
          );
        }

        return child;
      });
    }, [children, dropState.indicatorIndex, isOver, canDrop]);

    return (
      <Box
        ref={dropRef}
        sx={{
          display: "flex",
          mb: 0,
          position: "relative",
          transition: "background-color 0.2s ease",
          border: isOver && canDrop ? `2px dashed #2196f3` : "none",
          backgroundColor: isOver && canDrop ? "rgba(33, 150, 243, 0.05)" : "transparent",
          borderRadius: "8px",
          padding: isOver && canDrop ? "8px" : "10px",
        }}
      >
        {childrenWithIndicators}
      </Box>
    );
  }
);

// Add displayName to fix the linter warning
DroppableActivityRowContainer.displayName = "DroppableActivityRowContainer";
