// Standard spacing constants for the storyboard
// All card components should use these values for consistent sizing

// Card dimensions (in pixels)
export const CARD_WIDTH = 100;
export const CARD_HEIGHT = 50;

// Internal card dimensions (in pixels)
export const CARD_TEXT_WIDTH = 70; // Width for text area inside story cards (leaves space for icons)
export const CARD_TEXT_HEIGHT = 40; // Height for text area inside story cards

// Gaps between cards (MUI spacing units, 1 unit = 8px)
export const EPIC_GAP = 2; // 16px - gap between epic columns
export const STORY_GAP = 1; // 8px - gap between story cards vertically

// Margins (MUI spacing units)
export const ACTIVITY_MARGIN_X = 0; // horizontal margin between activities
export const RELEASE_ROW_MARGIN_BOTTOM = 2; // 16px - space below each release row
export const EPIC_COLUMN_PADDING_X = 2; // 16px - padding inside epic columns

// Calculated values for width computation (in pixels)
export const CARD_PADDING = 16; // px: 1 = 8px * 2 sides
export const GAP_PX = 24; // gap: 3 in pixels

// Unified style strings
export const CARD_WIDTH_STYLE = `${CARD_WIDTH}px`;
export const CARD_HEIGHT_STYLE = `${CARD_HEIGHT}px`;
export const CARD_TEXT_WIDTH_STYLE = `${CARD_TEXT_WIDTH}px`;
export const CARD_TEXT_HEIGHT_STYLE = `${CARD_TEXT_HEIGHT}px`;

// Grouped export for convenience
export const SPACING = {
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_TEXT_WIDTH,
  CARD_TEXT_HEIGHT,
  EPIC_GAP,
  STORY_GAP,
  ACTIVITY_MARGIN_X,
  RELEASE_ROW_MARGIN_BOTTOM,
  EPIC_COLUMN_PADDING_X,
  CARD_PADDING,
  GAP_PX,
} as const;
