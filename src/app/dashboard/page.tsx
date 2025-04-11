"use client";

import { useEffect } from "react";
import { Box, CircularProgress, Typography, Container } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/context/TenantContext";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { tenant, tenants, isLoading } = useTenant();

  useEffect(() => {
    // Skip redirects while loading tenant information
    if (isLoading) {
      return;
    }

    // If not logged in, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // If user has no tenants, redirect to tenant selection
    if (tenants.length === 0) {
      router.push("/tenant/select");
      return;
    }

    // If user has a current tenant, redirect to the tenant-specific dashboard
    if (tenant) {
      router.push(`/${tenant.id}/dashboard`);
      return;
    }

    // If user has tenants but no current tenant, redirect to tenant selection
    router.push("/tenant/select");
  }, [user, tenant, tenants, isLoading, router]);

  return (
    <Container
      sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }} variant="h6">
          Redirecting to your workspace...
        </Typography>
      </Box>
    </Container>
  );
}
