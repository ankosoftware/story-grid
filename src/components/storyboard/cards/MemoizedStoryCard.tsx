import React, { memo } from "react";
import { Card, CardContent, Box, Typography, IconButton, Chip, useTheme } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChatIcon from "@mui/icons-material/Chat";
import ErrorIcon from "@mui/icons-material/Error";
import { Issue, IssueStatus, IssuePriority } from "@/lib/firebase/models/types";
import {
  CARD_WIDTH_STYLE,
  CARD_HEIGHT_STYLE,
  CARD_TEXT_WIDTH_STYLE,
  CARD_TEXT_HEIGHT_STYLE,
  SPACING,
} from "../utils/spacingConstants";

interface MemoizedStoryCardProps {
  story: Issue;
  getStatusColor: (status: IssueStatus) => string;
  getPriorityColor: (priority: IssuePriority) => string;
  handleOpenMoveMenu: (event: React.MouseEvent<HTMLElement>, storyId: string) => void;
  handleOpenItemForEdit: (item: Issue, type: "activity" | "epic" | "story") => void;
  handleOpenComments?: (item: Issue) => void;
  onClick?: () => void;
}

export const MemoizedStoryCard = memo(
  ({
    story,
    getStatusColor,
    getPriorityColor,
    handleOpenMoveMenu,
    handleOpenItemForEdit,
    handleOpenComments,
    onClick,
  }: MemoizedStoryCardProps) => {
    const theme = useTheme();

    // Card styling based on type - more compact, with dark mode support
    const cardStyles = {
      bgcolor: theme.palette.background.paper,
      color: "text.primary",
      height: CARD_HEIGHT_STYLE,
      width: CARD_WIDTH_STYLE,
      border: `1px solid ${theme.palette.divider}`,
      borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
      boxShadow:
        theme.palette.mode === "dark" ? "0 1px 2px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.05)",
      mb: SPACING.STORY_GAP / 2, // Half of story gap for spacing between cards
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      overflow: "visible",
      cursor: "pointer",
      borderRadius: 1,
      "&:hover": {
        boxShadow: 3,
        transition: "box-shadow 0.2s ease-in-out",
      },
    };

    // Handler for comment icon click
    const handleCommentClick = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      if (handleOpenComments) {
        handleOpenComments(story);
      }
    };

    const handleCardClick = () => {
      if (onClick) {
        onClick();
      } else {
        handleOpenItemForEdit(story, "story");
      }
    };

    return (
      <Card sx={cardStyles} onClick={handleCardClick}>
        <CardContent
          data-testid="memoized-story-card-content"
          sx={{ p: 0.5, "&:last-child": { pb: 0.5 }, width: CARD_WIDTH_STYLE }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: "0.75rem",
                lineHeight: 1.2,
                width: CARD_TEXT_WIDTH_STYLE,
                maxWidth: CARD_TEXT_WIDTH_STYLE,
                height: CARD_TEXT_HEIGHT_STYLE,
              }}
              variant="body2"
            >
              {story.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {story.commentCount && story.commentCount > 0 && (
                <IconButton size="small" sx={{ p: 0.3, mr: 0.2 }} onClick={handleCommentClick}>
                  {story.openCommentCount && story.openCommentCount > 0 ? (
                    <ErrorIcon
                      sx={{
                        fontSize: "0.9rem",
                        color: theme.palette.warning.main,
                      }}
                    />
                  ) : (
                    <ChatIcon
                      sx={{
                        fontSize: "0.9rem",
                        color: theme.palette.primary.main,
                      }}
                    />
                  )}
                  {story.commentCount > 1 && (
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor:
                          story.openCommentCount && story.openCommentCount > 0
                            ? theme.palette.warning.main
                            : theme.palette.primary.main,
                        color: "white",
                        borderRadius: "50%",
                        width: "12px",
                        height: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      variant="caption"
                    >
                      {story.openCommentCount && story.openCommentCount > 0
                        ? story.openCommentCount
                        : story.commentCount}
                    </Typography>
                  )}
                </IconButton>
              )}
              <IconButton
                size="small"
                sx={{
                  p: 0.3,
                  "& svg": {
                    fontSize: "1rem",
                  },
                }}
                onClick={e => {
                  e.stopPropagation();
                  handleOpenMoveMenu(e, story.id);
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              position: "relative",
              alignItems: "flex-end",
              mt: 0.1,
            }}
          >
            {story.status !== IssueStatus.TO_DO && (
              <Chip
                label={story.status}
                size="small"
                sx={{
                  fontSize: "0.6rem",
                  bgcolor: getStatusColor(story.status),
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.common.white
                      : theme.palette.text.primary,
                  height: "14px",
                  borderRadius: "7px",
                }}
              />
            )}
            {story.storyPoints !== undefined && (
              <Chip
                label={story.storyPoints}
                size="small"
                sx={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  fontSize: "0.6rem",
                  height: "16px",
                  width: "16px",
                  fontWeight: "bold",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[700]
                      : theme.palette.grey[200],
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[100]
                      : theme.palette.grey[800],
                  borderRadius: "50%",
                  p: 0,
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

// Add displayName to fix the linter warning
MemoizedStoryCard.displayName = "MemoizedStoryCard";
