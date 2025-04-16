import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { UserRole } from "@/lib/firebase/models/types";

type AdminGuardProps = {
  children: React.ReactNode;
};

export default function AdminGuard({ children }: AdminGuardProps) {
  const { userProfile, currentTenant, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to be loaded
    if (loading) return;

    // If user is not logged in or no tenant is selected, this is handled by ProtectedRoute
    if (!userProfile || !currentTenant) return;

    // Check if user is an admin
    const isAdmin = userProfile.role === UserRole.ADMIN;

    // If user is not an admin, redirect to dashboard
    if (!isAdmin) {
      router.push(`/${currentTenant.id}/dashboard`);
    }
  }, [userProfile, currentTenant, loading, router]);

  // If loading or not admin, don't render anything
  if (loading || !userProfile || !currentTenant) {
    return null;
  }

  // If user is an admin, render the children
  if (userProfile.role === UserRole.ADMIN) {
    return <>{children}</>;
  }

  // Otherwise, render nothing
  return null;
}
