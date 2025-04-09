"use client";

import { Box, Container, Typography, Button, Paper, Grid } from "@mui/material";
import ProtectedRoute from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, logOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h4" component="h1" gutterBottom>
                  Dashboard
                </Typography>
                <Button variant="outlined" color="primary" onClick={handleLogout}>
                  Log Out
                </Button>
              </Box>

              <Typography variant="body1" gutterBottom>
                Welcome to your Storyboard Mapping App Dashboard!
              </Typography>

              <Typography variant="body2" color="text.secondary">
                You are signed in as: {user?.email}
              </Typography>
            </Paper>
          </Grid>

          {/* Add more dashboard content here */}
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Recent Projects
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No projects yet. Create your first project to get started.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => router.push("/projects/new")}
              >
                Create Project
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No recent activity to display.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Team Members
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No team members yet. Invite team members to collaborate.
              </Typography>
              <Button variant="outlined" color="primary" sx={{ mt: 2 }}>
                Invite Members
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ProtectedRoute>
  );
}
