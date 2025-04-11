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
      // Navigate to the tenant-specific dashboard route
      router.push(`/${tenantId}/dashboard`);
    } catch (error) {
      console.error("Error selecting tenant:", error);
      setSwitchingTenantId(null);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} variant="body1">
          Loading your workspace...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Typography gutterBottom component="h1" variant="h4">
        Select a Workspace
      </Typography>

      <Typography sx={{ mb: 4 }} variant="body1">
        Choose a workspace to continue or create a new one.
      </Typography>

      {tenants.length === 0 ? (
        <Box sx={{ textAlign: "center", my: 5 }}>
          <Typography gutterBottom variant="h6">
            You don&apos;t have any workspaces yet
          </Typography>
          <Button
            color="primary"
            component={Link}
            href="/tenant/create"
            sx={{ mt: 2 }}
            variant="contained"
          >
            Create Your First Workspace
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {tenants.map(tenant => (
              <Grid key={tenant.id} size={{ md: 4, sm: 6, xs: 12 }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "0.3s",
                    "&:hover": {
                      boxShadow: 3,
                    },
                  }}
                  variant="outlined"
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom noWrap component="h2" variant="h6">
                      {tenant.name}
                    </Typography>
                    {tenant.description && (
                      <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
                        {tenant.description}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      disabled={switchingTenantId === tenant.id}
                      variant="contained"
                      onClick={() => handleTenantSelect(tenant.id)}
                    >
                      {switchingTenantId === tenant.id ? (
                        <CircularProgress color="inherit" size={24} />
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
            <Button color="primary" component={Link} href="/tenant/create" variant="outlined">
              Create New Workspace
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
