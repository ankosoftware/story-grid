import { useState, useEffect } from "react";
import { getTenantUsers, updateUserRole } from "../firebase/firestore";
import { UserProfile, UserRole } from "../firebase/models/types";
import { useAuth } from "../auth/AuthProvider";

/**
 * Custom hook to manage users for the current tenant
 */
export const useUsers = () => {
  const { user, currentTenant, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch users when the tenant changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !currentTenant) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await getTenantUsers(currentTenant.id);
        setUsers(fetchedUsers);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, currentTenant, authLoading]);

  /**
   * Update a user's role in the current tenant
   */
  const updateRole = async (userId: string, newRole: UserRole) => {
    if (!currentTenant) {
      throw new Error("No tenant selected");
    }

    try {
      await updateUserRole(userId, currentTenant.id, newRole);

      // Update local state to reflect the change
      setUsers(prevUsers =>
        prevUsers.map(u => {
          if (u.id === userId) {
            // Create a new user object with updated role
            const updatedUser = { ...u };

            // Update the role in the specific tenant
            updatedUser.tenants = updatedUser.tenants.map(t => {
              if (t.tenantId === currentTenant.id) {
                return { ...t, role: newRole };
              }
              return t;
            });

            // Update the main role if this is the user's current tenant
            if (updatedUser.tenantId === currentTenant.id) {
              updatedUser.role = newRole;
            }

            return updatedUser;
          }
          return u;
        })
      );

      return true;
    } catch (err) {
      console.error("Error updating user role:", err);
      setError(err as Error);
      return false;
    }
  };

  return {
    users,
    loading,
    error,
    updateRole,
  };
};
