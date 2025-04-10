import React, { memo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useDrop } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";
import { updateIssue, batchUpdateIssueOrders } from "@/lib/firebase/firestore";

interface DroppableEpicContainerProps {
  epic: Issue;
  releaseId: string | null;
  children: React.ReactNode;
}

export const DroppableEpicContainer = memo(
  ({ epic, releaseId, children }: DroppableEpicContainerProps) => {
    // Add state to track drop indicator position
    const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [pendingDisplayOrder, setPendingDisplayOrder] = useState<number | null>(null);

    // Create a ref for the container element
    const dropRef = useRef<HTMLDivElement>(null);

    const [{ isOver, canDrop }, drop] = useDrop(
      {
        accept: [ItemTypes.STORY],
        drop: (item: {
          id: string;
          type: string;
          parentId: string | null;
          originalIndex: number;
          originalReleaseId?: string | null;
        }) => {
          // Reset indicator when dropped
          setDropIndicatorIndex(null);
          console.log("Dropping item", item, pendingDisplayOrder);

          // Get the container element
          const containerElement = dropRef.current;
          if (!containerElement) {
            console.warn("Container element not found during drop");
            return { id: epic.id, type: "epic", releaseId };
          }

          // Find all story cards in the container, including the one being dropped
          const allStoryCards = Array.from(
            containerElement.querySelectorAll("[data-story-id]")
          ) as HTMLElement[];

          // Create an array of story IDs in their visual order
          const storyIds = allStoryCards.map(card => card.getAttribute("data-story-id") || "");

          // Add the dropped item at the position indicated by dropIndicatorIndex
          if (dropIndicatorIndex !== null && !storyIds.includes(item.id)) {
            storyIds.splice(dropIndicatorIndex, 0, item.id);
          }

          // Filter out empty IDs
          const validStoryIds = storyIds.filter(id => id !== "");

          // Calculate new display orders for all stories
          const BASE_ORDER = 100000;
          const STEP = 100000;

          // Create a batch of updates for all stories
          const batchUpdates = validStoryIds.map((id, index) => ({
            id,
            displayOrder: (index + 1) * STEP,
          }));

          // Log the batch update
          console.log(`Resequencing ${batchUpdates.length} items in a batch operation`);

          // Use the batch update function
          batchUpdateIssueOrders(batchUpdates).catch(error =>
            console.error("Error updating display orders:", error)
          );

          // Clear states after drop
          setPendingDisplayOrder(null);
          setDraggedItemId(null);

          // Return information about where it was dropped
          return { id: epic.id, type: "epic", releaseId };
        },

        hover: (
          item: {
            id: string;
            type: string;
            parentId: string | null;
            originalIndex: number;
            originalReleaseId?: string | null;
          },
          monitor
        ) => {
          // Set the dragged item ID
          if (draggedItemId !== item.id) {
            setDraggedItemId(item.id);
          }

          // Only proceed if hovering over a story card
          if (item.type === ItemTypes.STORY && releaseId !== undefined) {
            // Get the DOM element we're hovering over
            const containerElement = dropRef.current;
            if (!containerElement) {
              return;
            }

            // Get the client offset of the hover
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) {
              return;
            }

            // Find the story card elements, excluding the one being dragged
            const storyCards = Array.from(
              containerElement.querySelectorAll("[data-story-id]")
            ).filter(
              card => (card as HTMLElement).getAttribute("data-story-id") !== item.id
            ) as HTMLElement[];

            // If no cards (or only the dragged card), place at beginning
            if (storyCards.length === 0) {
              setDropIndicatorIndex(0);
              // Use a standard starting value for an empty container
              setPendingDisplayOrder(100000);
              return;
            }

            // Determine where to place card based on cursor position
            let placedIndicator = false;
            for (let i = 0; i < storyCards.length; i++) {
              const card = storyCards[i] as HTMLElement;
              const cardRect = card.getBoundingClientRect();

              // If cursor is above or in the top half of this card
              if (clientOffset.y <= cardRect.top + cardRect.height / 2) {
                setDropIndicatorIndex(i);
                placedIndicator = true;

                // Calculate new display order based on position
                const newDisplayOrder = (i + 1) * 100000;
                setPendingDisplayOrder(newDisplayOrder);
                break;
              }
            }

            // If we didn't place an indicator yet, it should go after the last card
            if (!placedIndicator) {
              setDropIndicatorIndex(storyCards.length);

              // Calculate position-based display order for the end position
              const newDisplayOrder = (storyCards.length + 1) * 100000;
              setPendingDisplayOrder(newDisplayOrder);
            }
          } else {
            // If not hovering over a story or different type, clear indicator
            setDropIndicatorIndex(null);
          }
        },

        collect: monitor => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        }),
      },
      [epic.id, releaseId, pendingDisplayOrder, dropIndicatorIndex]
    );

    // Apply the drop ref to our container ref
    drop(dropRef);

    // Function to render the drop indicator at the specified index
    const renderDropIndicator = (index: number) => {
      if (dropIndicatorIndex === index && isOver && canDrop && draggedItemId) {
        return (
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
        );
      }
      return null;
    };

    // Clone the children to add drop indicators
    const childrenWithIndicators = React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        // Make sure child.props.sx is properly typed
        const childProps = child.props as any;
        // If this is the Box containing all the story cards
        if (
          childProps &&
          childProps.sx &&
          typeof childProps.sx === "object" &&
          "mb" in childProps.sx
        ) {
          const storyCards = React.Children.toArray(childProps.children);

          // Create a new array to hold cards with indicators
          const cardsWithIndicators: React.ReactNode[] = [];

          // Add indicator at the beginning if needed
          cardsWithIndicators.push(renderDropIndicator(0));

          // Add the story cards with indicators between them
          storyCards.forEach((card, index) => {
            cardsWithIndicators.push(card);
            // Add indicator after this card
            cardsWithIndicators.push(renderDropIndicator(index + 1));
          });

          // Return the Box with the new children array
          return React.cloneElement(child, {}, cardsWithIndicators);
        }
      }
      return child;
    });

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
        {childrenWithIndicators}
      </Box>
    );
  }
);

// Add displayName for DroppableEpicContainer
DroppableEpicContainer.displayName = "DroppableEpicContainer";
