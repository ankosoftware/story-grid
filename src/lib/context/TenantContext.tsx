"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../auth/AuthProvider";
import { Tenant } from "../firebase/models/types";

interface TenantContextType {
  tenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (name: string, description?: string, logoUrl?: string) => Promise<string>;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const {
    currentTenant,
    userTenants,
    loading: authLoading,
    user,
    createNewTenant,
    switchTenant: authSwitchTenant,
  } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Handle routing based on tenant selection
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user) {
      setIsLoading(false);

      // Check if the current path includes a tenant ID
      const tenantIdMatch = pathname.match(/^\/([^\/]+)\/dashboard/);
      const pathTenantId = tenantIdMatch ? tenantIdMatch[1] : null;

      // If we're not in a tenant selection flow and user has no tenants, redirect to tenant selection
      if (
        !pathname.includes("/tenant/select") &&
        !pathname.includes("/tenant/create") &&
        !pathname.includes("/login") &&
        !pathname.includes("/register") &&
        !pathname.includes("/forgot-password") &&
        userTenants.length === 0
      ) {
        router.push("/tenant/select");
        return;
      }

      // If user has tenants but no current tenant selected, redirect to tenant selection
      if (
        !pathname.includes("/tenant/select") &&
        !pathname.includes("/tenant/create") &&
        !pathname.includes("/login") &&
        !pathname.includes("/register") &&
        !pathname.includes("/forgot-password") &&
        userTenants.length > 0 &&
        !currentTenant &&
        !pathTenantId
      ) {
        router.push("/tenant/select");
        return;
      }

      // If we're at the app root, redirect to the current tenant's dashboard
      if (pathname === "/") {
        if (currentTenant) {
          router.push(`/${currentTenant.id}/dashboard`);
        } else if (userTenants.length > 0) {
          router.push("/tenant/select");
        }
        return;
      }
    }
  }, [authLoading, user, currentTenant, userTenants, pathname, router]);

  // Function to switch tenant
  const handleSwitchTenant = async (tenantId: string) => {
    setIsLoading(true);
    try {
      await authSwitchTenant(tenantId);
      // Updated to use tenant-specific dashboard route
      router.push(`/${tenantId}/dashboard`);
    } catch (error) {
      console.error("Error switching tenant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new tenant
  const handleCreateTenant = async (name: string, description?: string, logoUrl?: string) => {
    setIsLoading(true);
    try {
      const tenantId = await createNewTenant(name, description, logoUrl);
      // Updated to use tenant-specific dashboard route
      router.push(`/${tenantId}/dashboard`);
      return tenantId;
    } catch (error) {
      console.error("Error creating tenant:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    tenant: currentTenant,
    tenants: userTenants,
    isLoading: isLoading || authLoading,
    switchTenant: handleSwitchTenant,
    createTenant: handleCreateTenant,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};
