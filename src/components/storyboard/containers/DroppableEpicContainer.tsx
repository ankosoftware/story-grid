import React, { memo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useDrop } from "react-dnd";
import { Issue } from "@/lib/firebase/models/types";
import { ItemTypes } from "../utils/types";
import { updateIssue } from "@/lib/firebase/firestore";

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

    const [{ isOver, canDrop }, drop] = useDrop(
      {
        accept: [ItemTypes.STORY],
        drop: (item: {
          id: string;
          type: string;
          parentId: string | null;
          originalIndex: number;
        }) => {
          // Reset indicator when dropped
          setDropIndicatorIndex(null);
          setDraggedItemId(null);

          // When a story is dropped, return information about where it was dropped
          return { id: epic.id, type: "epic", releaseId };
        },
        hover: (
          item: { id: string; type: string; parentId: string | null; originalIndex: number },
          monitor
        ) => {
          // Set the dragged item ID
          if (draggedItemId !== item.id) {
            setDraggedItemId(item.id);
          }

          // Only proceed if hovering over a different story card
          if (item.type === ItemTypes.STORY && releaseId !== undefined) {
            // Get the DOM element we're hovering over
            const dropRef = drop.current;
            if (!dropRef) return;

            // Get the client offset of the hover
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;

            // Find the story card elements
            const storyCards = Array.from(dropRef.querySelectorAll("[data-story-id]"));
            if (storyCards.length === 0) {
              // If no cards, we can place at the beginning
              setDropIndicatorIndex(0);
              return;
            }

            // Find the card we're hovering over
            for (let i = 0; i < storyCards.length; i++) {
              const card = storyCards[i] as HTMLElement;
              const cardRect = card.getBoundingClientRect();
              const cardId = card.getAttribute("data-story-id");

              // Skip the card we're dragging
              if (cardId === item.id) continue;

              // If cursor is in the top half of the card, place before it
              if (clientOffset.y < cardRect.top + cardRect.height / 2) {
                setDropIndicatorIndex(i);

                // If this is a move within the same epic and we need to update order
                if (item.parentId === epic.id && releaseId === item.originalReleaseId) {
                  let newDisplayOrder;
                  if (i === 0) {
                    // If it's the first card, place it at the beginning
                    newDisplayOrder =
                      parseFloat(card.getAttribute("data-display-order") || "0") - 1;
                  } else {
                    // Otherwise, place it between the previous and current card
                    const prevCard = storyCards[i - 1] as HTMLElement;
                    const prevId = prevCard.getAttribute("data-story-id");

                    // If previous card is the one we're dragging, use the card before that
                    if (prevId === item.id && i > 1) {
                      const earlierCard = storyCards[i - 2] as HTMLElement;
                      const prevOrder = parseFloat(
                        earlierCard.getAttribute("data-display-order") || "0"
                      );
                      const currentOrder = parseFloat(
                        card.getAttribute("data-display-order") || "0"
                      );
                      newDisplayOrder = (prevOrder + currentOrder) / 2;
                    } else if (prevId !== item.id) {
                      const prevOrder = parseFloat(
                        prevCard.getAttribute("data-display-order") || "0"
                      );
                      const currentOrder = parseFloat(
                        card.getAttribute("data-display-order") || "0"
                      );
                      newDisplayOrder = (prevOrder + currentOrder) / 2;
                    }
                  }

                  if (newDisplayOrder !== undefined) {
                    // Only update if we're not rapidly changing position
                    updateIssue(item.id, { displayOrder: newDisplayOrder });
                  }
                }

                return;
              }

              // If we're at the last card and the cursor is in the bottom half
              if (i === storyCards.length - 1) {
                setDropIndicatorIndex(storyCards.length);

                // If this is a move within the same epic and we need to update order
                if (item.parentId === epic.id && releaseId === item.originalReleaseId) {
                  // If it's after the last card, place it at the end
                  const newDisplayOrder =
                    parseFloat(card.getAttribute("data-display-order") || "0") + 1;

                  // Only update if we're not rapidly changing position
                  updateIssue(item.id, { displayOrder: newDisplayOrder });
                }

                return;
              }
            }
          } else {
            // If not hovering over a story or moving to a different epic, clear the indicator
            setDropIndicatorIndex(null);
          }
        },
        collect: monitor => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        }),
      },
      [epic.id, releaseId, draggedItemId]
    );

    const dropRef = useRef(null);
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
        // If this is the Box containing all the story cards
        if (child.props && child.props.sx && child.props.sx.mb) {
          const storyCards = React.Children.toArray(child.props.children);

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
