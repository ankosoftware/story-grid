import React, { useState, useEffect, useCallback } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
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

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number | string;
  maxHeight?: number | string;
  label?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  disabled = false,
  minHeight = 150,
  maxHeight = 400,
  label,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  // Handle file input change
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !event.target.files || event.target.files.length === 0) return;

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
            // Upload the image to Firebase Storage
            const { url } = await uploadBase64Image(e.target.result);

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
      if (!editor || isUploading || disabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) continue;

          try {
            setIsUploading(true);
            setErrorMessage(null);

            // Convert file to Base64 temporarily for preview
            const reader = new FileReader();
            reader.onload = async e => {
              if (typeof e.target?.result === "string") {
                try {
                  // Upload the image to Firebase Storage
                  const { url } = await uploadBase64Image(e.target.result);

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
  }, [editor, isUploading, disabled]);

  // Upload an image from clipboard
  const addImage = useCallback(() => {
    if (disabled) return;

    // Create a file input and trigger it
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = e => handleFileInputChange(e as React.ChangeEvent<HTMLInputElement>);
    input.click();
  }, [disabled]);

  if (!editor) {
    return <CircularProgress size={24} />;
  }

  return (
    <Box sx={{ width: "100%" }}>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
          {label}
        </Typography>
      )}
      <Paper
        variant="outlined"
        sx={{
          p: 1,
          mb: 1,
          backgroundColor: disabled ? "action.disabledBackground" : "background.paper",
        }}
      >
        <ButtonGroup
          variant="outlined"
          size="small"
          aria-label="text formatting"
          sx={{ flexWrap: "wrap", gap: 0.5, mb: 1 }}
          disableElevation
        >
          <Tooltip title="Bold">
            <IconButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              color={editor.isActive("bold") ? "primary" : "default"}
              disabled={disabled}
              size="small"
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Italic">
            <IconButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              color={editor.isActive("italic") ? "primary" : "default"}
              disabled={disabled}
              size="small"
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Bullet List">
            <IconButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              color={editor.isActive("bulletList") ? "primary" : "default"}
              disabled={disabled}
              size="small"
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Numbered List">
            <IconButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              color={editor.isActive("orderedList") ? "primary" : "default"}
              disabled={disabled}
              size="small"
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Blockquote">
            <IconButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              color={editor.isActive("blockquote") ? "primary" : "default"}
              disabled={disabled}
              size="small"
            >
              <FormatQuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Horizontal Rule">
            <IconButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              disabled={disabled}
              size="small"
            >
              <HorizontalRuleIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add Image">
            <IconButton onClick={addImage} disabled={disabled || isUploading} size="small">
              {isUploading ? <CircularProgress size={18} /> : <ImageIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Undo">
            <IconButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={disabled || !editor.can().undo()}
              size="small"
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Redo">
            <IconButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={disabled || !editor.can().redo()}
              size="small"
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
          <Typography color="error" variant="caption" sx={{ mt: 1 }}>
            {errorMessage}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};
