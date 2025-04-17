"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Chip,
} from "@mui/material";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getInvitationByToken, acceptInvitation } from "@/lib/firebase/firestore";
import { Invitation, UserRole } from "@/lib/firebase/models/types";

// Role descriptions
const RoleDescriptions: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Complete control over workspace settings, projects, and user management",
  [UserRole.MANAGER]:
    "Can create and manage projects and releases, but cannot change workspace settings",
  [UserRole.CONTRIBUTOR]: "Can create and update stories, but cannot create projects or releases",
  [UserRole.VIEWER]: "Read-only access to all projects and stories",
};

// Role colors
const RoleColors: Record<UserRole, string> = {
  [UserRole.ADMIN]: "error",
  [UserRole.MANAGER]: "warning",
  [UserRole.CONTRIBUTOR]: "info",
  [UserRole.VIEWER]: "default",
};

export default function InvitationPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setLoading(true);
        const invitationData = await getInvitationByToken(token);

        if (!invitationData) {
          setError("Invalid or expired invitation. Please request a new invitation.");
        } else {
          setInvitation(invitationData);
        }
      } catch (err) {
        console.error("Error fetching invitation:", err);
        setError("Could not load invitation details.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  // Handle acceptance
  const handleAcceptInvitation = async () => {
    if (!user || !invitation) {
      return;
    }

    try {
      setAccepting(true);
      setError(null);

      const tenantId = await acceptInvitation(
        token,
        user.uid,
        user.email || "",
        user.displayName || undefined,
        user.photoURL || undefined
      );

      setSuccess(true);

      // Redirect to tenant dashboard after a short delay
      setTimeout(() => {
        router.push(`/${tenantId}/dashboard`);
      }, 1500);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError((err as Error).message);
    } finally {
      setAccepting(false);
    }
  };

  // Handle signing in to accept
  const handleSignInToAccept = () => {
    // Redirect to login page with return URL
    const returnUrl = window.location.pathname;
    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  // Show loading state while everything initializes
  if (loading || authLoading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <CircularProgress />
          <Typography sx={{ mt: 2 }} variant="body1">
            Loading invitation...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show error if invitation not found or expired
  if (error || !invitation) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ mt: 8, p: 4, borderRadius: 2 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Invitation Error</AlertTitle>
            {error || "Invalid invitation"}
          </Alert>
          <Button fullWidth variant="contained" onClick={() => router.push("/login")}>
            Return to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4, borderRadius: 2 }}>
        <Typography gutterBottom align="center" component="h1" variant="h4">
          Workspace Invitation
        </Typography>

        {success ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Success!</AlertTitle>
            You have successfully joined the workspace. Redirecting to dashboard...
          </Alert>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              You have been invited to join a workspace.
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom variant="subtitle1">
                Invitation Details
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography color="text.secondary" variant="body2">
                  Email:
                </Typography>
                <Typography fontWeight="medium" variant="body2">
                  {invitation.email}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography color="text.secondary" variant="body2">
                  Role:
                </Typography>
                <Box>
                  <Chip
                    color={RoleColors[invitation.role] as any}
                    label={invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                    size="small"
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography color="text.secondary" variant="body2">
                  Expires:
                </Typography>
                <Typography variant="body2">
                  {invitation.expiresAt.toDate().toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography gutterBottom color="text.secondary" variant="body2">
                {RoleDescriptions[invitation.role]}
              </Typography>
            </Box>

            {user ? (
              <Button
                fullWidth
                disabled={accepting}
                sx={{ mt: 2 }}
                variant="contained"
                onClick={handleAcceptInvitation}
              >
                {accepting ? "Joining..." : "Accept Invitation"}
              </Button>
            ) : (
              <Box sx={{ mt: 3 }}>
                <Typography gutterBottom align="center" color="text.secondary" variant="body2">
                  You need to sign in to accept this invitation
                </Typography>
                <Button fullWidth sx={{ mt: 1 }} variant="contained" onClick={handleSignInToAccept}>
                  Sign In to Accept
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
