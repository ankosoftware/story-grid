import { useState, useEffect } from "react";
import { createInvitation, getTenantInvitations, cancelInvitation } from "../firebase/firestore";
import { Invitation, UserRole } from "../firebase/models/types";
import { useAuth } from "../auth/AuthProvider";

/**
 * Custom hook to manage workspace invitations
 */
export const useInvitations = () => {
  const { user, currentTenant, loading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch invitations when the tenant changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !currentTenant) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    const fetchInvitations = async () => {
      try {
        setLoading(true);
        const fetchedInvitations = await getTenantInvitations(currentTenant.id);
        setInvitations(fetchedInvitations);
        setError(null);
      } catch (err) {
        console.error("Error fetching invitations:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [user, currentTenant, authLoading]);

  /**
   * Invite a user to the current workspace
   */
  const inviteUser = async (email: string, role: UserRole) => {
    if (!currentTenant || !user) {
      throw new Error("No tenant selected or not logged in");
    }

    try {
      setLoading(true);
      const invitation = await createInvitation(email, currentTenant.id, role, user.uid);

      // Update local state to reflect the new invitation
      setInvitations(prev => [invitation, ...prev]);

      return invitation;
    } catch (err) {
      console.error("Error inviting user:", err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel an invitation
   */
  const cancelUserInvitation = async (invitationId: string) => {
    if (!currentTenant) {
      throw new Error("No tenant selected");
    }

    try {
      await cancelInvitation(invitationId);

      // Update local state to remove the canceled invitation
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));

      return true;
    } catch (err) {
      console.error("Error canceling invitation:", err);
      setError(err as Error);
      return false;
    }
  };

  return {
    invitations,
    loading,
    error,
    inviteUser,
    cancelUserInvitation,
  };
};
