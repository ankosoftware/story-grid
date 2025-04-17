"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Divider,
} from "@mui/material";
import { useAuth } from "@/lib/auth/AuthProvider";
import GoogleIcon from "@mui/icons-material/Google";
import { Suspense } from "react";

// Create a separate component for the parts that use useSearchParams
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") || "/dashboard";
  const { signIn, signInWithGoogle } = useAuth();

  // Show invitation message if coming from an invitation link
  const isFromInvitation = returnUrl.startsWith("/invite/");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push(returnUrl); // Redirect to return URL after successful login
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.message || "Failed to sign in. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      router.push(returnUrl);
    } catch (err: any) {
      console.error("Google login error:", err);
      const errorMessage = err.message || "Failed to sign in with Google. Please try again.";
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 2 }}>
          <Typography gutterBottom align="center" component="h1" variant="h4">
            Sign In
          </Typography>

          {isFromInvitation && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Workspace Invitation</AlertTitle>
              Please sign in to accept your workspace invitation
            </Alert>
          )}

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

            <Divider sx={{ my: 2 }}>OR</Divider>

            <Button
              fullWidth
              color="primary"
              disabled={googleLoading}
              startIcon={<GoogleIcon />}
              sx={{ mb: 2 }}
              variant="outlined"
              onClick={handleGoogleSignIn}
            >
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </Button>

            <Stack direction="row" justifyContent="space-between">
              <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                Forgot password?
              </Link>
              <Link href="/register" style={{ textDecoration: "none" }}>
                Create an account
              </Link>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="sm">
          <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 2, textAlign: "center" }}>
              <Typography variant="h5">Loading...</Typography>
            </Paper>
          </Box>
        </Container>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
