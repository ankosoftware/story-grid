import React, { memo } from "react";
import { Box, Typography, IconButton, Chip, Tooltip, useTheme } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { Release } from "@/lib/firebase/models/types";
import { formatDate } from "../utils/dateUtils";

interface MemoizedReleaseCardProps {
  release: Release;
  handleOpenReleaseForEdit: (release: Release) => void;
  handleMoveRelease?: (releaseId: string, direction: "up" | "down") => Promise<void>;
  isFirst?: boolean;
  isLast?: boolean;
  allowReorder?: boolean;
  totalStoryPoints?: number;
}

export const MemoizedReleaseCard = memo(
  ({
    release,
    handleOpenReleaseForEdit,
    handleMoveRelease,
    isFirst = false,
    isLast = false,
    allowReorder = true,
    totalStoryPoints,
  }: MemoizedReleaseCardProps) => {
    const theme = useTheme();

    // Handle move release
    const handleMove = (direction: "up" | "down", e: React.MouseEvent) => {
      e.stopPropagation();
      if (handleMoveRelease) {
        handleMoveRelease(release.id, direction);
      }
    };

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.primary.main}`,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          borderRadius: 1,
          mb: 0.5,
          p: 0.5,
          "&:hover": {
            boxShadow: 1,
          },
        }}
      >
        {allowReorder && (
          <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
            <IconButton
              disabled={isFirst}
              size="small"
              sx={{
                opacity: isFirst ? 0.3 : 1,
                color: theme.palette.text.secondary,
                p: 0.5,
              }}
              onClick={e => handleMove("up", e)}
            >
              <Box component="span" sx={{ display: "flex" }}>
                <ArrowUpward sx={{ fontSize: "1rem" }} />
              </Box>
            </IconButton>
            <IconButton
              disabled={isLast}
              size="small"
              sx={{
                opacity: isLast ? 0.3 : 1,
                color: theme.palette.text.secondary,
                p: 0.5,
              }}
              onClick={e => handleMove("down", e)}
            >
              <Box component="span" sx={{ display: "flex" }}>
                <ArrowDownward sx={{ fontSize: "1rem" }} />
              </Box>
            </IconButton>
          </Box>
        )}

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            cursor: "pointer",
          }}
          onClick={() => handleOpenReleaseForEdit(release)}
        >
          <Typography fontWeight="bold" sx={{ fontSize: "0.85rem" }} variant="body2">
            {release.name}
          </Typography>

          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", mt: 0.25 }}>
            {release.startDate && (
              <Chip
                label={`Start: ${formatDate(release.startDate)}`}
                size="small"
                sx={{
                  bgcolor: theme.palette.grey[100],
                  height: "16px",
                  fontSize: "0.6rem",
                  borderRadius: "8px",
                }}
              />
            )}
            {release.endDate && (
              <Chip
                label={`End: ${formatDate(release.endDate)}`}
                size="small"
                sx={{
                  bgcolor: theme.palette.grey[100],
                  height: "16px",
                  fontSize: "0.6rem",
                  borderRadius: "8px",
                }}
              />
            )}
            {totalStoryPoints !== undefined && totalStoryPoints > 0 && (
              <Chip
                label={`${totalStoryPoints} pts`}
                size="small"
                sx={{
                  bgcolor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                  height: "16px",
                  fontSize: "0.6rem",
                  fontWeight: "bold",
                  borderRadius: "8px",
                }}
              />
            )}
          </Box>
        </Box>

        <Box>
          <Tooltip title="Edit release">
            <IconButton
              size="small"
              sx={{ p: 0.5 }}
              onClick={e => {
                e.stopPropagation();
                handleOpenReleaseForEdit(release);
              }}
            >
              <MoreVertIcon sx={{ fontSize: "1rem" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  }
);

// Add displayName to fix the linter warning
MemoizedReleaseCard.displayName = "MemoizedReleaseCard";
