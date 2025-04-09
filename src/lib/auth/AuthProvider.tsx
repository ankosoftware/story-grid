"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import {
  createUserProfile,
  getUserProfileById,
  createTenant,
  getUserTenants,
  updateUserCurrentTenant,
} from "../firebase/firestore";
import { Tenant, UserProfile, UserRole } from "../firebase/models/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  createNewTenant: (name: string, description?: string, logoUrl?: string) => Promise<string>;
  switchTenant: (tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and tenants when user auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setUser(user);

      if (user) {
        try {
          // Fetch user profile
          const profile = await getUserProfileById(user.uid);
          setUserProfile(profile);

          // Fetch user tenants
          const tenants = await getUserTenants(user.uid);
          setUserTenants(tenants);

          // Set current tenant if user has a profile with a current tenant
          if (profile && profile.tenantId) {
            const current = tenants.find(t => t.id === profile.tenantId) || null;
            setCurrentTenant(current);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // Reset states when logged out
        setUserProfile(null);
        setCurrentTenant(null);
        setUserTenants([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // User is automatically signed in after signup
      const user = userCredential.user;

      // For now, we don't create a profile here since we need a tenant
      // This will happen when they create or join a tenant
    } catch (error) {
      console.error("Error in signup:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error in signin:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error in Google sign in:", error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error in logout:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error in reset password:", error);
      throw error;
    }
  };

  // Function to create a new tenant and set the user as admin
  const createNewTenant = async (name: string, description?: string, logoUrl?: string) => {
    if (!user) {
      throw new Error("User must be logged in to create a tenant");
    }

    try {
      // Create the tenant in Firestore
      const tenantId = await createTenant(name, user.uid, description, logoUrl);

      // Check if user profile exists
      const profile = await getUserProfileById(user.uid);

      if (profile) {
        // Add user to the tenant with ADMIN role and set as current tenant
        await updateUserCurrentTenant(user.uid, tenantId, UserRole.ADMIN);
      } else {
        // Create a new user profile with the tenant
        await createUserProfile(
          user.uid,
          user.email || "",
          tenantId,
          UserRole.ADMIN,
          user.displayName || undefined,
          user.photoURL || undefined
        );
      }

      // Refresh user profile and tenants
      const newProfile = await getUserProfileById(user.uid);
      setUserProfile(newProfile);

      const tenants = await getUserTenants(user.uid);
      setUserTenants(tenants);

      // Set the current tenant
      const current = tenants.find(t => t.id === tenantId) || null;
      setCurrentTenant(current);

      return tenantId;
    } catch (error) {
      console.error("Error creating tenant:", error);
      throw error;
    }
  };

  // Function to switch the current tenant
  const switchTenant = async (tenantId: string) => {
    if (!user) {
      throw new Error("User must be logged in to switch tenants");
    }

    try {
      // Update the user's current tenant
      await updateUserCurrentTenant(user.uid, tenantId);

      // Update the current tenant in state
      const tenant = userTenants.find(t => t.id === tenantId) || null;
      setCurrentTenant(tenant);

      // Update the user profile in state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          tenantId,
        });
      }
    } catch (error) {
      console.error("Error switching tenant:", error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    currentTenant,
    userTenants,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logOut,
    resetPassword,
    createNewTenant,
    switchTenant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
