import React, { memo } from "react";
import { Card, CardContent, Box, Typography, IconButton, Chip, useTheme } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChatIcon from "@mui/icons-material/Chat";
import { Issue, IssueStatus, IssuePriority } from "@/lib/firebase/models/types";

interface MemoizedStoryCardProps {
  story: Issue;
  getStatusColor: (status: IssueStatus) => string;
  getPriorityColor: (priority: IssuePriority) => string;
  handleOpenMoveMenu: (event: React.MouseEvent<HTMLElement>, storyId: string) => void;
  handleOpenItemForEdit: (item: Issue, type: "activity" | "epic" | "story") => void;
  handleOpenComments?: (item: Issue) => void;
}

export const MemoizedStoryCard = memo(
  ({
    story,
    getStatusColor,
    getPriorityColor,
    handleOpenMoveMenu,
    handleOpenItemForEdit,
    handleOpenComments,
  }: MemoizedStoryCardProps) => {
    const theme = useTheme();

    // Card styling based on type - more compact
    const cardStyles = {
      bgcolor: "white",
      color: "text.primary",
      height: "50px",
      width: "100px",
      border: "1px solid #e0e0e0",
      borderLeft: `4px solid ${getPriorityColor(story.priority)}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      mb: 0.5,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
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

    return (
      <Card sx={cardStyles} onClick={() => handleOpenItemForEdit(story, "story")}>
        <CardContent sx={{ p: 0.5, "&:last-child": { pb: 0.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: "0.75rem",
                lineHeight: 1.2,
                maxWidth: "70px",
              }}
              variant="body2"
            >
              {story.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {story.commentCount && story.commentCount > 0 && (
                <IconButton size="small" sx={{ p: 0.3, mr: 0.2 }} onClick={handleCommentClick}>
                  <ChatIcon
                    sx={{
                      fontSize: "0.9rem",
                      color: theme.palette.primary.main,
                    }}
                  />
                  {story.commentCount > 1 && (
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: theme.palette.primary.main,
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
                      {story.commentCount}
                    </Typography>
                  )}
                </IconButton>
              )}
              <IconButton
                size="small"
                sx={{ mt: -0.5, mr: -0.5, p: 0.5 }}
                onClick={e => {
                  e.stopPropagation();
                  handleOpenMoveMenu(e, story.id);
                }}
              >
                <MoreVertIcon sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mt: 0.5,
            }}
          >
            {story.status !== IssueStatus.TO_DO && (
              <Chip
                label={story.status}
                size="small"
                sx={{
                  fontSize: "0.6rem",
                  bgcolor: getStatusColor(story.status),
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
                  ml: "auto",
                  fontSize: "0.6rem",
                  height: "16px",
                  width: "16px",
                  fontWeight: "bold",
                  bgcolor: theme.palette.grey[200],
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
