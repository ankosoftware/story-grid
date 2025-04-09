"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Stack,
} from "@mui/material";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/dashboard"); // Redirect to dashboard after successful login
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.message || "Failed to sign in. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 2 }}>
          <Typography gutterBottom align="center" component="h1" variant="h4">
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          <Box noValidate component="form" sx={{ mt: 1 }} onSubmit={handleSubmit}>
            <TextField
              autoFocus
              fullWidth
              required
              autoComplete="email"
              id="email"
              label="Email Address"
              margin="normal"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <TextField
              fullWidth
              required
              autoComplete="current-password"
              id="password"
              label="Password"
              margin="normal"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button
              fullWidth
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
              type="submit"
              variant="contained"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <Stack direction="row" justifyContent="space-between">
              <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                Forgot password?
              </Link>
              <Link href="/register" style={{ textDecoration: "none" }}>
                {"Don't have an account? Sign Up"}
              </Link>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
