/**
 * Safely converts a Firestore Timestamp, Date, or other date-like value to a JavaScript Date
 */
export const safeToDate = (timestamp: unknown): Date | undefined => {
  if (!timestamp) {
    return undefined;
  }

  // Check if it's a Firestore Timestamp
  if (timestamp && typeof (timestamp as any).toDate === "function") {
    return (timestamp as any).toDate();
  }

  // Check if it's a Date or can be converted to one
  try {
    return new Date(timestamp as any);
  } catch (error) {
    console.error("Failed to convert to Date:", error);
    return undefined;
  }
};

/**
 * Formats a date for display using local date format
 */
export const formatDate = (timestamp: unknown): string => {
  const date = safeToDate(timestamp);
  if (!date) {
    return "";
  }
  return date.toLocaleDateString();
}; 