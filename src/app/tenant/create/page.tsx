"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/context/TenantContext";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";

export default function TenantCreatePage() {
  const { createTenant, isLoading } = useTenant();
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      if (!name.trim()) {
        throw new Error("Workspace name is required");
      }

      await createTenant(name.trim(), description.trim() || undefined);
      // No need to navigate here as the TenantContext handles navigation
    } catch (error) {
      console.error("Error creating tenant:", error);
      setError(error instanceof Error ? error.message : "Failed to create workspace");
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ px: 4, py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Workspace
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Create a new workspace for your team or project
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="tenantName"
            label="Workspace Name"
            name="tenantName"
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isCreating}
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="Description (Optional)"
            name="description"
            multiline
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isCreating}
            inputProps={{ maxLength: 500 }}
          />

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button component={Link} href="/tenant/select" variant="outlined" disabled={isCreating}>
              Cancel
            </Button>

            <Button type="submit" variant="contained" disabled={isCreating || !name.trim()}>
              {isCreating ? <CircularProgress size={24} /> : "Create Workspace"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
