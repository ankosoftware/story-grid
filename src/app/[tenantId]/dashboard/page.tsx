"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import ProtectedRoute from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/context/TenantContext";
import { useRouter, useParams } from "next/navigation";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import BusinessIcon from "@mui/icons-material/Business";

export default function TenantDashboardPage() {
  const { user, logOut } = useAuth();
  const { tenant, tenants, switchTenant, isLoading } = useTenant();
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [loadingSwitch, setLoadingSwitch] = useState(false);

  // Ensure we're using the correct tenant based on the URL
  useEffect(() => {
    // Skip if we're still loading initial tenant data
    if (isLoading) return;

    // If the URL tenant ID doesn't match the current tenant, switch to it
    if (tenant?.id !== tenantId && tenants.some(t => t.id === tenantId)) {
      const switchToCorrectTenant = async () => {
        try {
          setLoadingSwitch(true);
          await switchTenant(tenantId);
        } catch (error) {
          console.error("Error switching to URL tenant:", error);
          // If there's an error, navigate to the current tenant's dashboard
          if (tenant) {
            router.push(`/${tenant.id}/dashboard`);
          } else {
            router.push("/tenant/select");
          }
        } finally {
          setLoadingSwitch(false);
        }
      };

      switchToCorrectTenant();
    }
  }, [tenant, tenantId, tenants, switchTenant, isLoading, router]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSwitchTenant = async (newTenantId: string) => {
    handleMenuClose();
    setLoadingSwitch(true);
    try {
      await switchTenant(newTenantId);
      router.push(`/${newTenantId}/dashboard`);
    } catch (error) {
      console.error("Error switching tenant:", error);
    } finally {
      setLoadingSwitch(false);
    }
  };

  const handleCreateNewTenant = () => {
    handleMenuClose();
    router.push("/tenant/create");
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Show loading state while tenant data is loading or switching
  if (isLoading || loadingSwitch || !tenant) {
    return (
      <Container
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading workspace...
          </Typography>
        </Box>
      </Container>
    );
  }

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
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    Dashboard
                  </Typography>
                  {tenant && (
                    <Button
                      variant="text"
                      color="primary"
                      startIcon={<BusinessIcon />}
                      onClick={handleMenuOpen}
                      sx={{ textTransform: "none" }}
                    >
                      <Typography variant="subtitle1">
                        Workspace: <strong>{tenant.name}</strong>
                      </Typography>
                    </Button>
                  )}
                  <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    MenuListProps={{
                      "aria-labelledby": "tenant-button",
                    }}
                    PaperProps={{
                      elevation: 3,
                      sx: { minWidth: 250 },
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: "bold" }}>
                      Switch Workspace
                    </Typography>
                    <Divider />
                    {tenants.map(t => (
                      <MenuItem
                        key={t.id}
                        onClick={() => handleSwitchTenant(t.id)}
                        selected={tenant?.id === t.id}
                      >
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              bgcolor: tenant?.id === t.id ? "primary.main" : "grey.300",
                              width: 30,
                              height: 30,
                            }}
                          >
                            {t.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText primary={t.name} />
                      </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem onClick={handleCreateNewTenant}>
                      <ListItemIcon>
                        <AddBusinessIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Create New Workspace" />
                    </MenuItem>
                  </Menu>
                </Box>
                <Button variant="outlined" color="primary" onClick={handleLogout}>
                  Log Out
                </Button>
              </Box>

              <Typography variant="body1" gutterBottom>
                Welcome to your Storyboard Mapping App Dashboard!
              </Typography>

              <Typography variant="body2" color="text.secondary">
                You are signed in as: {user?.email} in workspace: {tenant.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Workspace ID: {tenant.id}
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
                onClick={() => router.push(`/${tenant.id}/projects/new`)}
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
