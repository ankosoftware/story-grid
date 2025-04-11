"use client";

import { useState } from "react";
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
} from "@mui/material";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage("Password reset email sent. Check your inbox for further instructions.");
      setEmail("");
    } catch (err: any) {
      console.error("Password reset error:", err);
      const errorMessage = err.message || "Failed to send password reset email. Please try again.";
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
            Reset Password
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>Success</AlertTitle>
              {message}
            </Alert>
          )}

          <Typography sx={{ mb: 2 }} variant="body1">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </Typography>

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
            <Button
              fullWidth
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
              type="submit"
              variant="contained"
            >
              {loading ? "Sending..." : "Reset Password"}
            </Button>
            <Box sx={{ textAlign: "center" }}>
              <Link href="/login" style={{ textDecoration: "none" }}>
                Back to Login
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
