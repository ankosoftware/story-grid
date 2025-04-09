import { Timestamp } from 'firebase/firestore';

// Tenant data model
export interface Tenant {
  id: string;
  name: string;
  createdAt: Timestamp;
  createdBy: string; // User ID of the creator
  updatedAt?: Timestamp;
  description?: string;
  logoUrl?: string;
  settings?: TenantSettings;
}

// Tenant settings interface
export interface TenantSettings {
  theme?: string;
  defaultLanguage?: string;
  // Add other tenant-specific settings as needed
}

// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager', 
  CONTRIBUTOR = 'contributor',
  VIEWER = 'viewer',
}

// User profile data model
export interface UserProfile {
  id: string; // Same as Auth UID
  email: string;
  displayName?: string;
  photoURL?: string;
  tenantId: string; // ID of the current tenant
  role: UserRole;
  tenants: UserTenantAccess[]; // List of tenants the user has access to
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
  settings?: UserSettings;
}

// User tenant access information
export interface UserTenantAccess {
  tenantId: string;
  role: UserRole;
  joinedAt: Timestamp;
}

// User settings interface
export interface UserSettings {
  theme?: string;
  notifications?: NotificationSettings;
  // Add other user-specific settings as needed
}

// Notification settings
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  // Add other notification channels as needed
} 