import React, { memo, useRef, useState, useEffect } from "react";
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
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
    const [pendingDisplayOrder, setPendingDisplayOrder] = useState<number | null>(null);

    // Create a ref for the container element
    const dropRef = useRef<HTMLDivElement>(null);

    // Effect to handle pending display order updates
    useEffect(() => {
      if (pendingDisplayOrder !== null && draggedItemId) {
        const now = Date.now();
        // Only update once every 100ms to prevent excessive updates
        if (now - lastUpdateTime > 100) {
          console.log("Updating issue display order", draggedItemId, pendingDisplayOrder);
          updateIssue(draggedItemId, { displayOrder: pendingDisplayOrder });
          setLastUpdateTime(now);
          setPendingDisplayOrder(null);
        }
      }
    }, [pendingDisplayOrder, draggedItemId, lastUpdateTime]);

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
          setDraggedItemId(null);

          // Ensure any pending updates are processed
          if (pendingDisplayOrder !== null && item.id) {
            updateIssue(item.id, { displayOrder: pendingDisplayOrder });
            setPendingDisplayOrder(null);
          }

          // When a story is dropped, return information about where it was dropped
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
              // If this is the first card in the epic, use a low display order (0)
              if (item.parentId === epic.id && releaseId === item.originalReleaseId) {
                setPendingDisplayOrder(0);
              }
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

                // Calculate new display order if within same epic and release
                if (item.parentId === epic.id && releaseId === item.originalReleaseId) {
                  let newDisplayOrder;
                  if (i === 0) {
                    // First position: use lower than the first card's order
                    const firstOrder = parseFloat(card.getAttribute("data-display-order") || "0");
                    newDisplayOrder = firstOrder - 1;
                  } else {
                    // Middle position: between previous and current card
                    const prevCard = storyCards[i - 1];
                    const prevOrder = parseFloat(
                      prevCard.getAttribute("data-display-order") || "0"
                    );
                    const currOrder = parseFloat(card.getAttribute("data-display-order") || "0");
                    newDisplayOrder = (prevOrder + currOrder) / 2;
                  }

                  // Set pending display order update
                  if (newDisplayOrder !== undefined) {
                    setPendingDisplayOrder(newDisplayOrder);
                  }
                }
                break;
              }
            }

            // If we didn't place an indicator yet, it should go after the last card
            if (!placedIndicator) {
              setDropIndicatorIndex(storyCards.length);

              // Calculate new display order if within same epic and release
              if (item.parentId === epic.id && releaseId === item.originalReleaseId) {
                // Last position: use higher than the last card's order
                const lastCard = storyCards[storyCards.length - 1];
                const lastOrder = parseFloat(lastCard.getAttribute("data-display-order") || "0");
                setPendingDisplayOrder(lastOrder + 1);
              }
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
      [epic.id, releaseId, draggedItemId, pendingDisplayOrder, lastUpdateTime]
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
