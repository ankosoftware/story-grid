"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Container,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/context/TenantContext";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";

export default function TenantSelectPage() {
  const { tenants, switchTenant, isLoading } = useTenant();
  const { user } = useAuth();
  const router = useRouter();
  const [switchingTenantId, setSwitchingTenantId] = useState<string | null>(null);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleTenantSelect = async (tenantId: string) => {
    setSwitchingTenantId(tenantId);
    try {
      await switchTenant(tenantId);
      // No need to navigate here as the TenantContext handles navigation
    } catch (error) {
      console.error("Error selecting tenant:", error);
      setSwitchingTenantId(null);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your workspace...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Select a Workspace
      </Typography>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Choose a workspace to continue or create a new one.
      </Typography>

      {tenants.length === 0 ? (
        <Box sx={{ textAlign: "center", my: 5 }}>
          <Typography variant="h6" gutterBottom>
            You don't have any workspaces yet
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            href="/tenant/create"
            sx={{ mt: 2 }}
          >
            Create Your First Workspace
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {tenants.map(tenant => (
              <Grid item xs={12} sm={6} md={4} key={tenant.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "0.3s",
                    "&:hover": {
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {tenant.name}
                    </Typography>
                    {tenant.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {tenant.description}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleTenantSelect(tenant.id)}
                      disabled={switchingTenantId === tenant.id}
                    >
                      {switchingTenantId === tenant.id ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Select Workspace"
                      )}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ textAlign: "center" }}>
            <Button variant="outlined" color="primary" component={Link} href="/tenant/create">
              Create New Workspace
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
