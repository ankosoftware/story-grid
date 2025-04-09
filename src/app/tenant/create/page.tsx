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
        <Typography sx={{ mt: 2 }} variant="body1">
          Loading...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ px: 4, py: 3 }}>
        <Typography gutterBottom component="h1" variant="h4">
          Create New Workspace
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }} variant="body1">
          Create a new workspace for your team or project
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box noValidate component="form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            fullWidth
            required
            disabled={isCreating}
            id="tenantName"
            inputProps={{ maxLength: 100 }}
            label="Workspace Name"
            margin="normal"
            name="tenantName"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <TextField
            fullWidth
            multiline
            disabled={isCreating}
            id="description"
            inputProps={{ maxLength: 500 }}
            label="Description (Optional)"
            margin="normal"
            name="description"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button component={Link} disabled={isCreating} href="/tenant/select" variant="outlined">
              Cancel
            </Button>

            <Button disabled={isCreating || !name.trim()} type="submit" variant="contained">
              {isCreating ? <CircularProgress size={24} /> : "Create Workspace"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
