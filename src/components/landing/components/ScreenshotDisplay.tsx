"use client";

import React, { useState } from "react";
import { Box, Paper, Typography, useTheme, alpha } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import Image from "next/image";

interface ScreenshotDisplayProps {
  src: string;
  alt: string;
  priority?: boolean;
}

const ScreenshotDisplay: React.FC<ScreenshotDisplayProps> = ({ src, alt, priority = false }) => {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.4 : 0.15)}`,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/10",
          backgroundColor:
            theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[100],
        }}
      >
        {imageError ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: theme.palette.text.secondary,
              gap: 1,
            }}
          >
            <ImageIcon sx={{ fontSize: 48, opacity: 0.5 }} />
            <Typography sx={{ opacity: 0.7 }} variant="body2">
              Screenshot placeholder
            </Typography>
          </Box>
        ) : (
          <Image
            fill
            alt={alt}
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            src={src}
            style={{ objectFit: "cover" }}
            onError={() => setImageError(true)}
          />
        )}
      </Box>
    </Paper>
  );
};

export default ScreenshotDisplay;
