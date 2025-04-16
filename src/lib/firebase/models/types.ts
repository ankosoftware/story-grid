import { Timestamp } from "firebase/firestore";

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
  ADMIN = "admin",
  MANAGER = "manager",
  CONTRIBUTOR = "contributor",
  VIEWER = "viewer",
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

// Status enum for stories
export enum StoryStatus {
  TO_DO = "to_do",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

// Priority enum for stories
export enum StoryPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// Project model
export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
  createdBy: string; // User ID
  updatedAt?: Timestamp;
  startDate?: Timestamp | null;
  endDate?: Timestamp | null;
}

// Status enum for issues
export enum IssueStatus {
  TO_DO = "to_do",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

// Priority enum for issues
export enum IssuePriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// Type enum for issues
export enum IssueType {
  BACKBONE = "backbone", // User activities/goals
  EPIC = "epic", // User tasks
  STORY = "story", // User stories
}

// Issue model (replaces both Epic and Story models)
export interface Issue {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: IssueType;
  parentId?: string | null; // Reference to parent issue (null for epics, epic ID for stories)
  status: IssueStatus;
  priority: IssuePriority;
  acceptanceCriteria?: string;
  assignee?: string | null; // User ID of the assignee
  releaseId?: string | null; // ID of the release it belongs to
  displayOrder: number; // Position in the display order
  storyPoints?: number | null; // Estimate of complexity/effort in story points
  createdAt: Timestamp;
  createdBy: string; // User ID
  updatedAt?: Timestamp;
  attachments?: IssueAttachment[];
  commentCount?: number; // Number of comments on this issue
  openCommentCount?: number; // Number of open comments on this issue
}

// Issue attachment model
export interface IssueAttachment {
  id: string;
  issueId: string;
  name: string;
  url: string;
  type: string; // e.g., 'image', 'document'
  createdAt: Timestamp;
  createdBy: string; // User ID
}

// Issue comment model
export interface IssueComment {
  id: string;
  issueId: string;
  text: string;
  createdAt: Timestamp;
  createdBy: string; // User ID
  updatedAt?: Timestamp;
  status: "open" | "closed"; // Track whether a comment is open or closed
}

// Release model
export interface Release {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate?: Timestamp | null;
  endDate?: Timestamp | null;
  displayOrder: number; // Priority order of releases
  createdAt: Timestamp;
  createdBy: string; // User ID
  updatedAt?: Timestamp;
}

// Invitation model for new workspace members
export interface Invitation {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  createdBy: string;
  status: "pending" | "accepted" | "expired";
  token: string;
}
