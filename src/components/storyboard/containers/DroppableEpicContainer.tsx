import React, { memo, useRef, useState, useCallback, useMemo } from "react";
import { Box } from "@mui/material";
import { useDrop } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";
import { batchUpdateIssueOrders } from "@/lib/firebase/firestore";

interface DroppableEpicContainerProps {
  epic: Issue;
  releaseId: string | null;
  children: React.ReactNode;
}

// Type for the draggable item
interface DragItem {
  id: string;
  type: string;
  parentId: string | null;
  originalIndex: number;
  originalReleaseId?: string | null;
}

export const DroppableEpicContainer = memo(
  ({ epic, releaseId, children }: DroppableEpicContainerProps) => {
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

    // Memoized story elements accessor to avoid repeated DOM queries
    const getStoryElements = useCallback(() => {
      if (!dropRef.current) {
        return [];
      }

      return Array.from(dropRef.current.querySelectorAll("[data-story-id]")) as HTMLElement[];
    }, []);

    // Get ordered stories (excluding the dragged item)
    const getOrderedStories = useCallback(
      (draggedItemId: string | null) => {
        const elements = getStoryElements();

        return elements
          .filter(el => el.getAttribute("data-story-id") !== draggedItemId)
          .map(el => ({
            id: el.getAttribute("data-story-id") || "",
            displayOrder: parseInt(el.getAttribute("data-display-order") || "0", 10),
            element: el,
          }))
          .sort((a, b) => a.displayOrder - b.displayOrder);
      },
      [getStoryElements]
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
          return { id: epic.id, type: "epic", releaseId };
        }

        // Get the ordered stories excluding the dragged item
        const stories = getOrderedStories(item.id);

        // Create a batch of updates for efficient reordering
        const batchUpdates = [
          // Add the dropped item at its new position
          {
            id: item.id,
            displayOrder: pendingDisplayOrder,
          },
        ];

        // Adjust orders of other items that need to be shifted
        stories.forEach(story => {
          if (story.displayOrder >= pendingDisplayOrder) {
            batchUpdates.push({
              id: story.id,
              displayOrder: story.displayOrder + 1,
            });
          }
        });

        // Execute the batch update
        if (batchUpdates.length > 0) {
          batchUpdateIssueOrders(batchUpdates).catch(error =>
            console.error("Error updating display orders:", error)
          );
        }

        return { id: epic.id, type: "epic", releaseId };
      },
      [dropState, epic.id, releaseId, getOrderedStories]
    );

    // Hover handler - optimized to reduce calculations
    const handleHover = useCallback(
      (item: DragItem, monitor: any) => {
        // Only set the ID if it changed
        setDropState(prev =>
          prev.draggedItemId !== item.id ? { ...prev, draggedItemId: item.id } : prev
        );

        // Only proceed if hovering over a story card and releaseId is defined
        if (item.type !== ItemTypes.STORY || releaseId === undefined) {
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

        // Get ordered stories excluding the dragged item
        const orderedStories = getOrderedStories(item.id);

        // If no cards, place at beginning
        if (orderedStories.length === 0) {
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

        // Find the right position based on Y coordinate
        for (let i = 0; i < orderedStories.length; i++) {
          const { element } = orderedStories[i];
          const cardRect = element.getBoundingClientRect();

          // If cursor is above or in the top half of this card
          if (clientOffset.y <= cardRect.top + cardRect.height / 2) {
            newIndicatorIndex = i;

            // Calculate new display order
            if (i === 0) {
              // If it's the first card, insert before it
              newDisplayOrder = Math.max(1, orderedStories[i].displayOrder - 1);
            } else {
              // Place between the two cards
              newDisplayOrder = orderedStories[i - 1].displayOrder + 1;
            }
            break;
          }
        }

        // If we didn't find a position, place after the last card
        if (newIndicatorIndex === null) {
          const lastIndex = orderedStories.length - 1;
          newIndicatorIndex = orderedStories.length;
          newDisplayOrder = orderedStories[lastIndex].displayOrder + 1;
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
      [getOrderedStories, releaseId]
    );

    // useDrop hook with optimized handlers
    const [{ isOver, canDrop }, drop] = useDrop(
      {
        accept: [ItemTypes.STORY],
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

    // Memoized drop indicator renderer
    const DropIndicator = memo(() => (
      <Box
        sx={{
          height: "4px",
          backgroundColor: "#2196f3",
          margin: "8px 0",
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

        // If this is the Box containing all the story cards
        if (childProps?.sx && typeof childProps.sx === "object" && "mb" in childProps.sx) {
          const storyCards = React.Children.toArray(childProps.children);
          const cardsWithIndicators: React.ReactNode[] = [];

          // Add indicator at the beginning if needed
          if (showIndicator && indicatorIndex === 0) {
            cardsWithIndicators.push(<DropIndicator key="indicator-0" />);
          }

          // Add the story cards with indicators between them
          storyCards.forEach((card, index) => {
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
        paddingTop: 1,
        paddingBottom: 1,
        paddingLeft: 0,
        paddingRight: 1,
        borderRadius: 1,
        transition: "all 0.2s ease",
        background: isOver && canDrop ? "rgba(0, 172, 193, 0.2)" : "transparent",
        border: isOver && canDrop ? "2px dashed #00acc1" : "1px solid transparent",
        boxShadow: isOver && canDrop ? "0px 0px 8px rgba(0, 172, 193, 0.3)" : "none",
      }),
      [isOver, canDrop]
    );

    return (
      <Box ref={dropRef} data-testid={`droppable-epic-${epic.id}`} sx={containerStyle}>
        {childrenWithIndicators}
      </Box>
    );
  }
);

// Add displayName for DroppableEpicContainer
DroppableEpicContainer.displayName = "DroppableEpicContainer";
