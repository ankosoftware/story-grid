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
    if (isLoading) {
      return;
    }

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
          <Typography sx={{ mt: 2 }} variant="h6">
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
                  <Typography gutterBottom component="h1" variant="h4">
                    Dashboard
                  </Typography>
                  {tenant && (
                    <Button
                      color="primary"
                      startIcon={<BusinessIcon />}
                      sx={{ textTransform: "none" }}
                      variant="text"
                      onClick={handleMenuOpen}
                    >
                      <Typography variant="subtitle1">
                        Workspace: <strong>{tenant.name}</strong>
                      </Typography>
                    </Button>
                  )}
                  <Menu
                    anchorEl={anchorEl}
                    MenuListProps={{
                      "aria-labelledby": "tenant-button",
                    }}
                    open={open}
                    PaperProps={{
                      elevation: 3,
                      sx: { minWidth: 250 },
                    }}
                    onClose={handleMenuClose}
                  >
                    <Typography sx={{ px: 2, py: 1, fontWeight: "bold" }} variant="subtitle2">
                      Switch Workspace
                    </Typography>
                    <Divider />
                    {tenants.map(t => (
                      <MenuItem
                        key={t.id}
                        selected={tenant?.id === t.id}
                        onClick={() => handleSwitchTenant(t.id)}
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
                <Button color="primary" variant="outlined" onClick={handleLogout}>
                  Log Out
                </Button>
              </Box>

              <Typography gutterBottom variant="body1">
                Welcome to your Storyboard Mapping App Dashboard!
              </Typography>

              <Typography color="text.secondary" variant="body2">
                You are signed in as: {user?.email} in workspace: {tenant.name}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Workspace ID: {tenant.id}
              </Typography>
            </Paper>
          </Grid>

          {/* Add more dashboard content here */}
          <Grid item lg={4} md={6} xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography gutterBottom variant="h6">
                Recent Projects
              </Typography>
              <Typography color="text.secondary" variant="body2">
                No projects yet. Create your first project to get started.
              </Typography>
              <Button
                color="primary"
                sx={{ mt: 2 }}
                variant="contained"
                onClick={() => router.push(`/${tenant.id}/projects/new`)}
              >
                Create Project
              </Button>
            </Paper>
          </Grid>

          <Grid item lg={4} md={6} xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography gutterBottom variant="h6">
                Activity
              </Typography>
              <Typography color="text.secondary" variant="body2">
                No recent activity to display.
              </Typography>
            </Paper>
          </Grid>

          <Grid item lg={4} md={6} xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography gutterBottom variant="h6">
                Team Members
              </Typography>
              <Typography color="text.secondary" variant="body2">
                No team members yet. Invite team members to collaborate.
              </Typography>
              <Button color="primary" sx={{ mt: 2 }} variant="outlined">
                Invite Members
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ProtectedRoute>
  );
}
