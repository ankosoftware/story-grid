import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  DocumentReference,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { Tenant, UserProfile, UserRole, UserTenantAccess } from "./models/types";

// Collection references
export const tenantsCollection = collection(db, "tenants") as CollectionReference<Tenant>;
export const usersCollection = collection(db, "users") as CollectionReference<UserProfile>;

// Tenant functions
export const getTenantRef = (tenantId: string): DocumentReference<Tenant> => {
  return doc(db, "tenants", tenantId) as DocumentReference<Tenant>;
};

export const getUserRef = (userId: string): DocumentReference<UserProfile> => {
  return doc(db, "users", userId) as DocumentReference<UserProfile>;
};

// Function to create a new tenant
export const createTenant = async (
  name: string,
  createdBy: string,
  description?: string,
  logoUrl?: string
): Promise<string> => {
  // Create a new document reference with an auto-generated ID
  const tenantRef = doc(tenantsCollection);
  const tenantId = tenantRef.id;

  // Prepare tenant data
  const tenantData: Tenant = {
    id: tenantId,
    name,
    createdAt: Timestamp.now(),
    createdBy,
    description,
    logoUrl,
  };

  // Write the tenant data to Firestore
  await setDoc(tenantRef, tenantData);

  return tenantId;
};

// Function to get a tenant by ID
export const getTenantById = async (tenantId: string): Promise<Tenant | null> => {
  const tenantRef = getTenantRef(tenantId);
  const tenantSnap = await getDoc(tenantRef);

  if (tenantSnap.exists()) {
    return tenantSnap.data();
  }

  return null;
};

// Function to get all tenants for a user
export const getUserTenants = async (userId: string): Promise<Tenant[]> => {
  const userRef = getUserRef(userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const userProfile = userSnap.data();
  const tenants: Tenant[] = [];

  // Get all tenants the user has access to
  for (const tenantAccess of userProfile.tenants) {
    const tenant = await getTenantById(tenantAccess.tenantId);
    if (tenant) {
      tenants.push(tenant);
    }
  }

  return tenants;
};

// Function to create a user profile
export const createUserProfile = async (
  userId: string,
  email: string,
  tenantId: string,
  role: UserRole = UserRole.CONTRIBUTOR,
  displayName?: string,
  photoURL?: string
): Promise<void> => {
  const userRef = getUserRef(userId);

  // Create user tenant access
  const tenantAccess: UserTenantAccess = {
    tenantId,
    role,
    joinedAt: Timestamp.now(),
  };

  // Prepare user profile data
  const userData: UserProfile = {
    id: userId,
    email,
    displayName,
    photoURL,
    tenantId, // Current active tenant
    role,
    tenants: [tenantAccess],
    createdAt: Timestamp.now(),
  };

  // Write the user profile data to Firestore
  await setDoc(userRef, userData);
};

// Function to update a user's current tenant
export const updateUserCurrentTenant = async (userId: string, tenantId: string): Promise<void> => {
  const userRef = getUserRef(userId);

  await updateDoc(userRef, {
    tenantId,
    updatedAt: Timestamp.now(),
  });
};

// Function to add a user to a tenant
export const addUserToTenant = async (
  userId: string,
  tenantId: string,
  role: UserRole
): Promise<void> => {
  const userRef = getUserRef(userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User does not exist");
  }

  const userProfile = userSnap.data();

  // Check if user already has access to this tenant
  const existingAccess = userProfile.tenants.find(access => access.tenantId === tenantId);

  if (existingAccess) {
    // Update existing access role if different
    if (existingAccess.role !== role) {
      const updatedTenants = userProfile.tenants.map(access => {
        if (access.tenantId === tenantId) {
          return { ...access, role };
        }
        return access;
      });

      await updateDoc(userRef, {
        tenants: updatedTenants,
        updatedAt: Timestamp.now(),
      });
    }
  } else {
    // Add new tenant access
    const newTenantAccess: UserTenantAccess = {
      tenantId,
      role,
      joinedAt: Timestamp.now(),
    };

    await updateDoc(userRef, {
      tenants: [...userProfile.tenants, newTenantAccess],
      updatedAt: Timestamp.now(),
    });
  }
};

// Function to get a user profile by ID
export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
  const userRef = getUserRef(userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  }

  return null;
};
