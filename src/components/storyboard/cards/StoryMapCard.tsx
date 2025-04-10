import React, { memo } from "react";
import { Card, CardContent, Box, Typography, IconButton, useTheme, Badge } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChatIcon from "@mui/icons-material/Chat";
import { Issue, IssuePriority } from "@/lib/firebase/models/types";
import { getPriorityColor } from "../utils/colorUtils";

interface StoryMapCardProps {
  type: "activity" | "epic" | "story" | "blank" | "release" | "placeholder";
  item?: Issue;
  onAction?: (e: React.MouseEvent<HTMLElement>, id: string) => void;
  onClick?: () => void;
  onCommentClick?: (e: React.MouseEvent<HTMLElement>, item: Issue) => void;
  children?: React.ReactNode;
  isAddCard?: boolean;
}

export const StoryMapCard = memo(
  ({
    type,
    item,
    onAction,
    onClick,
    onCommentClick,
    children,
    isAddCard = false,
  }: StoryMapCardProps) => {
    const theme = useTheme();

    // Card styling based on type
    const cardStyles = {
      activity: {
        bgcolor: theme.palette.primary.main,
        color: "white",
        height: "50px",
        width: "100px",
        borderRadius: 1,
      },
      epic: {
        bgcolor: "#00acc1",
        color: "white",
        height: "50px",
        width: "100px",
        borderRadius: 1,
      },
      story: {
        bgcolor: "white",
        color: "text.primary",
        height: "50px",
        width: "100px",
        border: "1px solid #e0e0e0",
        borderLeft: item ? `4px solid ${getPriorityColor(item?.priority)}` : undefined,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        borderRadius: 1,
      },
      blank: {
        bgcolor: "white",
        color: "text.secondary",
        height: "50px",
        width: "100px",
        border: "1px dashed #bdbdbd",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 1,
      },
      release: {
        bgcolor: theme.palette.background.paper,
        color: "text.primary",
        height: "50px",
        width: "120px",
        border: `1px solid ${theme.palette.primary.main}`,
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        borderRadius: 1,
      },
      placeholder: {
        height: "0px",
        width: "100px",
      },
    };

    // Handler for comment icon click
    const handleCommentClick = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      if (onCommentClick && item) {
        onCommentClick(e, item);
      }
    };

    if (isAddCard) {
      return (
        <Card
          sx={{
            ...cardStyles.blank,
            mb: 0.5,
            cursor: "pointer",
            "&:hover": {
              bgcolor: theme.palette.action.hover,
              transition: "background-color 0.2s ease-in-out",
            },
          }}
          onClick={onClick}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <AddIcon sx={{ fontSize: "0.9rem" }} />
            <Typography sx={{ fontSize: "0.7rem" }} variant="caption">{`Add ${type}`}</Typography>
          </Box>
        </Card>
      );
    }

    if (type === "placeholder") {
      return <div style={{ height: "0px", width: "100px" }}></div>;
    }

    // Determine justifyContent based on card type
    const justifyContent = type === "activity" || type === "epic" ? "flex-start" : "center";
    const paddingTop = type === "activity" || type === "epic" ? 0.5 : 0;

    return (
      <Card
        sx={{
          ...(cardStyles[type] || cardStyles.blank),
          mb: 0.5,
          display: "flex",
          flexDirection: "column",
          justifyContent: justifyContent,
          cursor: onClick ? "pointer" : "default",
          "&:hover": onClick
            ? {
                boxShadow: 3,
                transition: "box-shadow 0.2s ease-in-out",
              }
            : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 0.5, pt: paddingTop, "&:last-child": { pb: 0.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: type === "activity" ? "0.8rem" : "0.75rem",
                lineHeight: 1.2,
              }}
              variant={type === "activity" ? "body2" : "caption"}
            >
              {item?.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {/* Show comment indicator for items with comments */}
              {item?.commentCount && item.commentCount > 0 && onCommentClick && (
                <IconButton
                  size="small"
                  sx={{
                    p: 0.3,
                    mr: 0.2,
                    "& svg": {
                      color:
                        type === "activity" || type === "epic"
                          ? "white"
                          : theme.palette.primary.main,
                    },
                  }}
                  onClick={handleCommentClick}
                >
                  <Badge
                    badgeContent={item.commentCount > 1 ? item.commentCount : undefined}
                    color="error"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "0.6rem",
                        height: "14px",
                        minWidth: "14px",
                        padding: 0,
                      },
                    }}
                  >
                    <ChatIcon sx={{ fontSize: "0.9rem" }} />
                  </Badge>
                </IconButton>
              )}
              {onAction && item && (
                <IconButton
                  size="small"
                  sx={{ mt: -0.5, mr: -0.5, p: 0.5 }}
                  onClick={e => {
                    e.stopPropagation();
                    onAction(e, item.id);
                  }}
                >
                  <MoreVertIcon sx={{ fontSize: "0.9rem" }} />
                </IconButton>
              )}
            </Box>
          </Box>
          {children}
        </CardContent>
      </Card>
    );
  }
);

StoryMapCard.displayName = "StoryMapCard";
