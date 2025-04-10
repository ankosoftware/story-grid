import React, { memo, useRef, useState, useCallback, useMemo } from "react";
import { Box } from "@mui/material";
import { useDrop } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";
import { batchUpdateIssueOrders } from "@/lib/firebase/firestore";

interface DroppableActivityContainerProps {
  activity: Issue;
  children: React.ReactNode;
}

// Type for the draggable item
interface DragItem {
  id: string;
  type: string;
  parentId: string | null;
  originalIndex: number;
}

export const DroppableActivityContainer = memo(
  ({ activity, children }: DroppableActivityContainerProps) => {
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

    // Memoized epic elements accessor to avoid repeated DOM queries
    const getEpicElements = useCallback(() => {
      if (!dropRef.current) {
        return [];
      }

      return Array.from(dropRef.current.querySelectorAll("[data-epic-id]")) as HTMLElement[];
    }, []);

    // Get ordered epics (excluding the dragged item)
    const getOrderedEpics = useCallback(
      (draggedItemId: string | null) => {
        const elements = getEpicElements();

        return elements
          .filter(el => el.getAttribute("data-epic-id") !== draggedItemId)
          .map(el => ({
            id: el.getAttribute("data-epic-id") || "",
            displayOrder: parseInt(el.getAttribute("data-display-order") || "0", 10),
            element: el,
          }))
          .sort((a, b) => a.displayOrder - b.displayOrder);
      },
      [getEpicElements]
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
          return { id: activity.id, type: "activity" };
        }

        // Get the ordered epics excluding the dragged item
        const epics = getOrderedEpics(item.id);

        // Create a batch of updates for efficient reordering
        const batchUpdates = [
          // Add the dropped item at its new position
          {
            id: item.id,
            displayOrder: pendingDisplayOrder,
          },
        ];

        // Adjust orders of other items that need to be shifted
        epics.forEach(epic => {
          if (epic.displayOrder >= pendingDisplayOrder) {
            batchUpdates.push({
              id: epic.id,
              displayOrder: epic.displayOrder + 1,
            });
          }
        });

        // Execute the batch update
        if (batchUpdates.length > 0) {
          batchUpdateIssueOrders(batchUpdates).catch(error =>
            console.error("Error updating display orders:", error)
          );
        }

        return { id: activity.id, type: "activity" };
      },
      [dropState, activity.id, getOrderedEpics]
    );

    // Hover handler - optimized for horizontal orientation
    const handleHover = useCallback(
      (item: DragItem, monitor: any) => {
        // Only set the ID if it changed
        setDropState(prev =>
          prev.draggedItemId !== item.id ? { ...prev, draggedItemId: item.id } : prev
        );

        // Only proceed if hovering over an epic card
        if (item.type !== ItemTypes.EPIC) {
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

        // Get ordered epics excluding the dragged item
        const orderedEpics = getOrderedEpics(item.id);

        // If no cards, place at beginning
        if (orderedEpics.length === 0) {
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
        for (let i = 0; i < orderedEpics.length; i++) {
          const { element } = orderedEpics[i];
          const cardRect = element.getBoundingClientRect();

          // If cursor is to the left or in the left half of this card
          if (clientOffset.x <= cardRect.left + cardRect.width / 2) {
            newIndicatorIndex = i;

            // Calculate new display order
            if (i === 0) {
              // If it's the first card, insert before it
              newDisplayOrder = Math.max(1, orderedEpics[i].displayOrder - 1);
            } else {
              // Place between the two cards
              newDisplayOrder = orderedEpics[i - 1].displayOrder + 1;
            }
            break;
          }
        }

        // If we didn't find a position, place after the last card
        if (newIndicatorIndex === null) {
          const lastIndex = orderedEpics.length - 1;
          newIndicatorIndex = orderedEpics.length;
          newDisplayOrder = orderedEpics[lastIndex].displayOrder + 1;
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
      [getOrderedEpics]
    );

    // useDrop hook with optimized handlers
    const [{ isOver, canDrop }, drop] = useDrop(
      {
        accept: [ItemTypes.EPIC],
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

    // Memoized drop indicator renderer - vertical for horizontal layout
    const DropIndicator = memo(() => (
      <Box
        sx={{
          width: "4px",
          height: "auto",
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
      const showIndicator = isOver && canDrop && dropState.draggedItemId;

      return React.Children.map(children, child => {
        if (!React.isValidElement(child)) {
          return child;
        }

        // Make sure child.props.sx is properly typed
        const childProps = child.props as any;

        // If this is the Box containing all the epic cards
        if (childProps?.sx && typeof childProps.sx === "object" && "display" in childProps.sx) {
          const epicCards = React.Children.toArray(childProps.children);
          const cardsWithIndicators: React.ReactNode[] = [];

          // Add indicator at the beginning if needed
          if (showIndicator && indicatorIndex === 0) {
            cardsWithIndicators.push(<DropIndicator key="indicator-0" />);
          }

          // Add the epic cards with indicators between them
          epicCards.forEach((card, index) => {
            cardsWithIndicators.push(card);

            // Add indicator after this card if needed
            if (showIndicator && indicatorIndex === index + 1) {
              cardsWithIndicators.push(<DropIndicator key={`indicator-${index + 1}`} />);
            }
          });

          // Return the Box with the new children array
          return React.cloneElement(child, {}, cardsWithIndicators);
        }

        return child;
      });
    }, [children, dropState, isOver, canDrop]);

    // Memoized container style
    const containerStyle = useMemo(
      () => ({
        p: 1,
        borderRadius: 1,
        transition: "all 0.2s ease",
        background: isOver && canDrop ? "rgba(63, 81, 181, 0.1)" : "transparent",
        border: isOver && canDrop ? "1px dashed #3f51b5" : "1px solid transparent",
        boxShadow: isOver && canDrop ? "0px 0px 8px rgba(63, 81, 181, 0.3)" : "none",
      }),
      [isOver, canDrop]
    );

    return (
      <Box ref={dropRef} sx={containerStyle}>
        {childrenWithIndicators}
      </Box>
    );
  }
);

DroppableActivityContainer.displayName = "DroppableActivityContainer";
