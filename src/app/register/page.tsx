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
  Grid,
  styled,
} from "@mui/material";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      router.push("/dashboard"); // Redirect to dashboard after successful registration
    } catch (err: any) {
      console.error("Registration error:", err);
      const errorMessage = err.message || "Failed to create an account. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
  }));

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 2 }}>
          <Typography gutterBottom align="center" component="h1" variant="h4">
            Create Account
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
              autoComplete="new-password"
              id="password"
              label="Password"
              margin="normal"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <TextField
              fullWidth
              required
              id="confirmPassword"
              label="Confirm Password"
              margin="normal"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <Button
              fullWidth
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
              type="submit"
              variant="contained"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid size={12}>
                <Item>
                  <Link href="/login" style={{ textDecoration: "none" }}>
                    Already have an account? Sign in
                  </Link>
                </Item>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
