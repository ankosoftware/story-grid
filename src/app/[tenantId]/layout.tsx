"use client";

import { PropsWithChildren } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTenant } from "@/lib/context/TenantContext";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";

export default function TenantLayout({ children }: PropsWithChildren) {
  const { tenant, tenants, isLoading, switchTenant } = useTenant();
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;

  // Validate that the tenant ID in the URL is valid and accessible
  useEffect(() => {
    if (isLoading) return;

    // Check if the tenant ID exists in the user's tenants
    const tenantExists = tenants.some(t => t.id === tenantId);

    if (!tenantExists) {
      // If the tenant doesn't exist or user doesn't have access, redirect to tenant selection
      console.warn(`Invalid tenant ID in URL: ${tenantId}`);
      router.push("/tenant/select");
      return;
    }
  }, [tenantId, tenants, isLoading, router]);

  if (isLoading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading workspace...
          </Typography>
        </Box>
      </Box>
    );
  }

  // If tenant ID is valid, render the children inside MainLayout
  return <MainLayout title={tenant?.name || "Anko Storyboard"}>{children}</MainLayout>;
}
