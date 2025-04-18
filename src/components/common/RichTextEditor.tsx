import React, { useState, useEffect, useCallback, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import TurndownService from "turndown";
import "@/styles/RichTextEditor.css";
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
  Stack,
  Typography,
} from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import ImageIcon from "@mui/icons-material/Image";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import { uploadBase64Image } from "@/lib/firebase/storage";
import { useTenant } from "@/lib/context/TenantContext";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number | string;
  maxHeight?: number | string;
  label?: string;
  projectId?: string; // Optional project ID for scoping uploads
}

// Simple HTML tag detection regex
const hasHtmlTagsRegex = /<[a-z][\s\S]*>/i;

/**
 * Rich Text Editor Component that supports both HTML and Markdown
 *
 * Key features:
 * - Accepts both HTML and Markdown input
 * - Automatically converts HTML input to Markdown
 * - Always outputs content as Markdown
 * - Provides rich text editing UI (bold, italic, lists, etc.)
 * - Supports image uploads (with Firebase Storage integration)
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  disabled = false,
  minHeight = 150,
  maxHeight = 400,
  label,
  projectId,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { tenant } = useTenant();

  // Initialize Turndown service for HTML to Markdown conversion
  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      bulletListMarker: "-",
    });

    // Configure image rule to properly handle images
    service.addRule("images", {
      filter: "img",
      replacement: function (content, node) {
        const img = node as HTMLImageElement;
        return `![${img.alt || ""}](${img.src}${img.title ? ` "${img.title}"` : ""})`;
      },
    });

    return service;
  }, []);

  // Process the initial content - convert HTML to Markdown if needed
  const processInitialContent = useCallback(
    (content: string): string => {
      if (!content) {
        return "";
      }

      // Check if content is HTML and convert if needed
      if (hasHtmlTagsRegex.test(content)) {
        try {
          return turndownService.turndown(content);
        } catch (error) {
          console.error("Error converting HTML to Markdown:", error);
          return content; // Return original content if conversion fails
        }
      }

      return content; // Return as-is if not HTML
    },
    [turndownService]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: "-",
        linkify: true,
      }),
    ],
    content: processInitialContent(value) || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Get markdown output
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: "rich-text-editor-content",
        style: `min-height: ${minHeight}px; max-height: ${maxHeight}px; overflow-y: auto;`,
      },
    },
  });

  // Update the editor content when the value prop changes
  useEffect(() => {
    if (editor) {
      const processedContent = processInitialContent(value);
      const currentMarkdown = editor.storage.markdown?.getMarkdown() || "";

      if (processedContent !== currentMarkdown) {
        editor.commands.setContent(processedContent || "");
      }
    }
  }, [editor, value, processInitialContent]);

  // Handle file input change
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files are allowed");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      // Convert file to Base64 temporarily for preview
      const reader = new FileReader();
      reader.onload = async e => {
        if (typeof e.target?.result === "string") {
          try {
            // Upload the image to Firebase Storage with tenant and project info
            const { url } = await uploadBase64Image(e.target.result, {
              tenantId: tenant?.id,
              projectId,
              path: "rich-editor-uploads",
            });

            // Insert the image at the current cursor position
            editor.chain().focus().setImage({ src: url }).run();
          } catch (error) {
            console.error("Error uploading image:", error);
            setErrorMessage("Failed to upload image. Please try again.");
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error handling file:", error);
      setErrorMessage("Failed to process image. Please try again.");
      setIsUploading(false);
    }
  };

  // Handle paste events to capture pasted images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!editor || isUploading || disabled) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) {
        return;
      }

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) {
            continue;
          }

          try {
            setIsUploading(true);
            setErrorMessage(null);

            // Convert file to Base64 temporarily for preview
            const reader = new FileReader();
            reader.onload = async e => {
              if (typeof e.target?.result === "string") {
                try {
                  // Upload the image to Firebase Storage with tenant and project info
                  const { url } = await uploadBase64Image(e.target.result, {
                    tenantId: tenant?.id,
                    projectId,
                    path: "rich-editor-uploads",
                  });

                  // Insert the image at the current cursor position
                  editor.chain().focus().setImage({ src: url }).run();
                } catch (error) {
                  console.error("Error uploading pasted image:", error);
                  setErrorMessage("Failed to upload pasted image. Please try again.");
                } finally {
                  setIsUploading(false);
                }
              }
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error("Error handling pasted file:", error);
            setErrorMessage("Failed to process pasted image. Please try again.");
            setIsUploading(false);
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [editor, isUploading, disabled, tenant, projectId]);

  // Upload an image from clipboard
  const addImage = useCallback(() => {
    if (disabled) {
      return;
    }

    // Create a file input and trigger it
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = e => {
      // Convert the native Event to the expected type by accessing the currentTarget
      const target = e.target as HTMLInputElement;
      const syntheticEvent = {
        target,
        currentTarget: target,
      } as React.ChangeEvent<HTMLInputElement>;

      handleFileInputChange(syntheticEvent);
    };
    input.click();
  }, [disabled]);

  if (!editor) {
    return <CircularProgress size={24} />;
  }

  return (
    <Box sx={{ width: "100%" }}>
      {label && (
        <Typography color="text.secondary" sx={{ mb: 1, fontWeight: 500 }} variant="body2">
          {label}
        </Typography>
      )}
      <Paper
        sx={{
          p: 1,
          mb: 1,
          backgroundColor: disabled ? "action.disabledBackground" : "background.paper",
        }}
        variant="outlined"
      >
        <ButtonGroup
          disableElevation
          aria-label="text formatting"
          size="small"
          sx={{ flexWrap: "wrap", gap: 0.5, mb: 1 }}
          variant="outlined"
        >
          <Tooltip title="Bold">
            <IconButton
              color={editor.isActive("bold") ? "primary" : "default"}
              disabled={disabled}
              size="small"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Italic">
            <IconButton
              color={editor.isActive("italic") ? "primary" : "default"}
              disabled={disabled}
              size="small"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Bullet List">
            <IconButton
              color={editor.isActive("bulletList") ? "primary" : "default"}
              disabled={disabled}
              size="small"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Numbered List">
            <IconButton
              color={editor.isActive("orderedList") ? "primary" : "default"}
              disabled={disabled}
              size="small"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Blockquote">
            <IconButton
              color={editor.isActive("blockquote") ? "primary" : "default"}
              disabled={disabled}
              size="small"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <FormatQuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Horizontal Rule">
            <IconButton
              disabled={disabled}
              size="small"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <HorizontalRuleIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add Image">
            <IconButton disabled={disabled || isUploading} size="small" onClick={addImage}>
              {isUploading ? <CircularProgress size={18} /> : <ImageIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Undo">
            <IconButton
              disabled={disabled || !editor.can().undo()}
              size="small"
              onClick={() => editor.chain().focus().undo().run()}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Redo">
            <IconButton
              disabled={disabled || !editor.can().redo()}
              size="small"
              onClick={() => editor.chain().focus().redo().run()}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            p: 1,
            minHeight,
            maxHeight,
            overflow: "auto",
            position: "relative",
            backgroundColor: "background.paper",
          }}
        >
          {!value && !editor.isFocused && (
            <Box
              sx={{
                position: "absolute",
                top: "10px",
                left: "10px",
                color: "text.disabled",
                pointerEvents: "none",
              }}
            >
              {placeholder}
            </Box>
          )}
          <EditorContent editor={editor} />
        </Box>

        {errorMessage && (
          <Typography color="error" sx={{ mt: 1 }} variant="caption">
            {errorMessage}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};
