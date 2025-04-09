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
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Tenant,
  UserProfile,
  UserRole,
  UserTenantAccess,
  Project,
  Issue,
  Release,
  IssueStatus,
  IssuePriority,
  IssueType,
} from "./models/types";

// Collection references
export const tenantsCollection = collection(db, "tenants") as CollectionReference<Tenant>;
export const usersCollection = collection(db, "users") as CollectionReference<UserProfile>;
export const projectsCollection = collection(db, "projects") as CollectionReference<Project>;
export const issuesCollection = collection(db, "issues") as CollectionReference<Issue>;
export const releasesCollection = collection(db, "releases") as CollectionReference<Release>;

// Tenant functions
export const getTenantRef = (tenantId: string): DocumentReference<Tenant> => {
  return doc(db, "tenants", tenantId) as DocumentReference<Tenant>;
};

export const getUserRef = (userId: string): DocumentReference<UserProfile> => {
  return doc(db, "users", userId) as DocumentReference<UserProfile>;
};

// Project references and functions
export const getProjectRef = (projectId: string): DocumentReference<Project> => {
  return doc(db, "projects", projectId) as DocumentReference<Project>;
};

export const getIssueRef = (issueId: string): DocumentReference<Issue> => {
  return doc(db, "issues", issueId) as DocumentReference<Issue>;
};

export const getReleaseRef = (releaseId: string): DocumentReference<Release> => {
  return doc(db, "releases", releaseId) as DocumentReference<Release>;
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
    description: description || "",
    logoUrl: logoUrl || "",
  };

  try {
    // Write the tenant data to Firestore
    await setDoc(tenantRef, tenantData);
  } catch (error) {
    console.error("Error creating tenant:", error);
    throw error;
  }

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

/**
 * Updates a user's current active tenant
 *
 * @param userId - The ID of the user to update
 * @param tenantId - The ID of the tenant to set as current
 * @param role - Optional. If provided, adds the tenant to the user's tenants list with this role
 *               This is typically used when adding a user to a new tenant
 * @returns Promise that resolves when the update is complete
 */
export const updateUserCurrentTenant = async (
  userId: string,
  tenantId: string,
  role?: UserRole
): Promise<void> => {
  const userRef = getUserRef(userId);

  // Base update with tenantId
  const updateData: any = {
    tenantId,
    updatedAt: Timestamp.now(),
  };

  // If role is provided, this is a new tenant for the user
  if (role) {
    // Get current user profile to check if tenant already exists in their list
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User does not exist");
    }

    const userProfile = userSnap.data();

    // Check if tenant already exists in user's tenant list
    const existingTenantIndex = userProfile.tenants.findIndex(
      (t: UserTenantAccess) => t.tenantId === tenantId
    );

    if (existingTenantIndex === -1) {
      // Add new tenant access
      const newTenantAccess: UserTenantAccess = {
        tenantId,
        role,
        joinedAt: Timestamp.now(),
      };

      // Add to tenants array
      updateData.tenants = [...userProfile.tenants, newTenantAccess];

      // Update role if this is the current tenant
      updateData.role = role;
    }
  }

  await updateDoc(userRef, updateData);
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

// Project CRUD functions
/**
 * Creates a new project under a tenant
 *
 * @param tenantId - The ID of the tenant the project belongs to
 * @param name - Project name
 * @param userId - ID of the user creating the project
 * @param description - Optional project description
 * @param startDate - Optional project start date
 * @param endDate - Optional project end date
 * @returns Promise that resolves to the new project ID
 */
export const createProject = async (
  tenantId: string,
  name: string,
  userId: string,
  description?: string,
  startDate?: Date,
  endDate?: Date
): Promise<string> => {
  // Create a new document reference with an auto-generated ID
  const projectRef = doc(projectsCollection);
  const projectId = projectRef.id;

  // Prepare project data
  const projectData: Project = {
    id: projectId,
    tenantId,
    name,
    description: description || "",
    createdAt: Timestamp.now(),
    createdBy: userId,
    startDate: startDate ? Timestamp.fromDate(startDate) : null,
    endDate: endDate ? Timestamp.fromDate(endDate) : null,
  };

  // Write the project data to Firestore
  await setDoc(projectRef, projectData);

  return projectId;
};

/**
 * Retrieves all projects for a tenant
 *
 * @param tenantId - The ID of the tenant to get projects for
 * @returns Promise that resolves to an array of Project objects
 */
export const getProjects = async (tenantId: string): Promise<Project[]> => {
  const projectsQuery = query(projectsCollection, where("tenantId", "==", tenantId));

  const projectsSnap = await getDocs(projectsQuery);

  const projects: Project[] = [];

  projectsSnap.forEach(doc => {
    projects.push(doc.data());
  });

  return projects;
};

/**
 * Retrieves a project by ID
 *
 * @param projectId - The ID of the project to retrieve
 * @returns Promise that resolves to a Project object or null if not found
 */
export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const projectRef = getProjectRef(projectId);
  const projectSnap = await getDoc(projectRef);

  if (projectSnap.exists()) {
    return projectSnap.data();
  }

  return null;
};

/**
 * Updates a project
 *
 * @param projectId - The ID of the project to update
 * @param updateData - Object containing the fields to update
 * @returns Promise that resolves when the update is complete
 */
export const updateProject = async (
  projectId: string,
  updateData: Partial<Omit<Project, "id" | "tenantId" | "createdAt" | "createdBy">>
): Promise<void> => {
  const projectRef = getProjectRef(projectId);

  // Add updatedAt timestamp
  const dataWithTimestamp = {
    ...updateData,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(projectRef, dataWithTimestamp);
};

/**
 * Creates a new issue (epic or story)
 *
 * @param projectId - The ID of the project the issue belongs to
 * @param name - Issue name
 * @param type - Type of the issue (epic or story)
 * @param userId - ID of the user creating the issue
 * @param options - Optional issue properties
 * @returns Promise that resolves to the new issue ID
 */
export const createIssue = async (
  projectId: string,
  name: string,
  type: IssueType,
  userId: string,
  options?: {
    parentId?: string; // Only relevant for stories
    description?: string;
    acceptanceCriteria?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    assignee?: string;
    releaseId?: string;
    displayOrder?: number;
  }
): Promise<string> => {
  // If no display order provided, get the current max order for the type/parent and add 1
  let order = options?.displayOrder;
  if (order === undefined) {
    let issuesQuery;

    if (type === IssueType.EPIC) {
      // For epics, get max display order of all epics in the project
      issuesQuery = query(
        issuesCollection,
        where("projectId", "==", projectId),
        where("type", "==", IssueType.EPIC),
        orderBy("displayOrder", "desc")
      );
    } else {
      // For stories, get max display order of all stories under the parent epic
      if (!options?.parentId) {
        throw new Error("Parent ID is required for stories");
      }

      issuesQuery = query(
        issuesCollection,
        where("projectId", "==", projectId),
        where("type", "==", IssueType.STORY),
        where("parentId", "==", options.parentId),
        orderBy("displayOrder", "desc")
      );
    }

    const issuesSnap = await getDocs(issuesQuery);
    const maxOrder = issuesSnap.empty ? 0 : issuesSnap.docs[0].data().displayOrder;

    order = maxOrder + 1;
  }

  // Create a new document reference with an auto-generated ID
  const issueRef = doc(issuesCollection);
  const issueId = issueRef.id;

  // Prepare issue data
  const issueData: Issue = {
    id: issueId,
    projectId,
    name,
    type,
    parentId: type === IssueType.STORY ? options?.parentId : undefined,
    description: options?.description || "",
    acceptanceCriteria: options?.acceptanceCriteria || "",
    status: options?.status || IssueStatus.TO_DO,
    priority: options?.priority || IssuePriority.MEDIUM,
    assignee: options?.assignee,
    releaseId: options?.releaseId,
    displayOrder: order,
    createdAt: Timestamp.now(),
    createdBy: userId,
  };

  // Write the issue data to Firestore
  await setDoc(issueRef, issueData);

  return issueId;
};

/**
 * Retrieves all issues for a parent issue
 *
 * @param parentId - The ID of the parent issue to get child issues for
 * @returns Promise that resolves to an array of Issue objects ordered by displayOrder
 */
export const getIssuesByParent = async (parentId: string): Promise<Issue[]> => {
  const issuesQuery = query(
    issuesCollection,
    where("parentId", "==", parentId),
    where("type", "==", IssueType.STORY),
    orderBy("displayOrder", "asc")
  );

  const issuesSnap = await getDocs(issuesQuery);

  const issues: Issue[] = [];

  issuesSnap.forEach(doc => {
    issues.push(doc.data());
  });

  return issues;
};

/**
 * Retrieves all epics for a project
 *
 * @param projectId - The ID of the project to get epics for
 * @returns Promise that resolves to an array of Issue objects with type=EPIC ordered by displayOrder
 */
export const getEpicsByProject = async (projectId: string): Promise<Issue[]> => {
  const epicsQuery = query(
    issuesCollection,
    where("projectId", "==", projectId),
    where("type", "==", IssueType.EPIC),
    orderBy("displayOrder", "asc")
  );

  const epicsSnap = await getDocs(epicsQuery);

  const epics: Issue[] = [];

  epicsSnap.forEach(doc => {
    epics.push(doc.data());
  });

  return epics;
};

/**
 * Retrieves all issues for a project, grouped by parent (for stories) or as standalone (for epics without parent)
 *
 * @param projectId - The ID of the project to get issues for
 * @returns Promise that resolves to an object with epics and issuesByParent mapping parent IDs to arrays of issues
 */
export const getIssuesByProject = async (
  projectId: string
): Promise<{
  epics: Issue[];
  issuesByParent: Record<string, Issue[]>;
}> => {
  // First, get all epics for the project
  const epics = await getEpicsByProject(projectId);

  // Then get all stories for the project
  const storiesQuery = query(
    issuesCollection,
    where("projectId", "==", projectId),
    where("type", "==", IssueType.STORY)
  );

  const storiesSnap = await getDocs(storiesQuery);

  const issuesByParent: Record<string, Issue[]> = {};

  storiesSnap.forEach(doc => {
    const story = doc.data();
    if (story.parentId) {
      if (!issuesByParent[story.parentId]) {
        issuesByParent[story.parentId] = [];
      }
      issuesByParent[story.parentId].push(story);
    }
  });

  // Sort stories by displayOrder within each parent
  Object.keys(issuesByParent).forEach(parentId => {
    issuesByParent[parentId].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  return { epics, issuesByParent };
};

/**
 * Creates a new release for a project
 *
 * @param projectId - The ID of the project the release belongs to
 * @param name - Release name
 * @param userId - ID of the user creating the release
 * @param options - Optional release properties
 * @returns Promise that resolves to the new release ID
 */
export const createRelease = async (
  projectId: string,
  name: string,
  userId: string,
  options?: {
    description?: string;
    startDate?: Date;
    endDate?: Date;
    displayOrder?: number;
  }
): Promise<string> => {
  // If no display order provided, get the current max order and add 1
  let order = options?.displayOrder;
  if (order === undefined) {
    const releasesQuery = query(
      releasesCollection,
      where("projectId", "==", projectId),
      orderBy("displayOrder", "desc")
    );

    const releasesSnap = await getDocs(releasesQuery);
    const maxOrder = releasesSnap.empty ? 0 : releasesSnap.docs[0].data().displayOrder;

    order = maxOrder + 1;
  }

  // Create a new document reference with an auto-generated ID
  const releaseRef = doc(releasesCollection);
  const releaseId = releaseRef.id;

  // Convert dates to Timestamps if provided
  const startTimestamp = options?.startDate ? Timestamp.fromDate(options.startDate) : undefined;
  const endTimestamp = options?.endDate ? Timestamp.fromDate(options.endDate) : undefined;

  // Prepare release data
  const releaseData: Release = {
    id: releaseId,
    projectId,
    name,
    description: options?.description || "",
    startDate: startTimestamp,
    endDate: endTimestamp,
    displayOrder: order,
    createdAt: Timestamp.now(),
    createdBy: userId,
  };

  // Write the release data to Firestore
  await setDoc(releaseRef, releaseData);

  return releaseId;
};

/**
 * Retrieves all releases for a project
 *
 * @param projectId - The ID of the project to get releases for
 * @returns Promise that resolves to an array of Release objects ordered by displayOrder
 */
export const getReleases = async (projectId: string): Promise<Release[]> => {
  const releasesQuery = query(
    releasesCollection,
    where("projectId", "==", projectId),
    orderBy("displayOrder", "asc")
  );

  const releasesSnap = await getDocs(releasesQuery);

  const releases: Release[] = [];

  releasesSnap.forEach(doc => {
    releases.push(doc.data());
  });

  return releases;
};

/**
 * Retrieves an issue by ID
 *
 * @param issueId - The ID of the issue to retrieve
 * @returns Promise that resolves to the Issue or null if not found
 */
export const getIssueById = async (issueId: string): Promise<Issue | null> => {
  const issueRef = getIssueRef(issueId);
  const issueSnap = await getDoc(issueRef);

  if (issueSnap.exists()) {
    return issueSnap.data();
  }

  return null;
};

/**
 * Migrates existing epics and stories to the new issues collection
 *
 * @param projectId - The ID of the project to migrate data for
 * @returns Promise that resolves when the migration is complete
 */
export const migrateToIssues = async (projectId: string): Promise<void> => {
  // Check if collections exist in Firestore
  try {
    // See if the old epics collection exists and has data
    const epicsQuery = query(collection(db, "epics"), where("projectId", "==", projectId));
    const epicsSnap = await getDocs(epicsQuery);

    // If no epics, assume migration not needed
    if (epicsSnap.empty) {
      return;
    }

    // Get all stories for the project
    const storiesQuery = query(collection(db, "stories"), where("projectId", "==", projectId));
    const storiesSnap = await getDocs(storiesQuery);

    // Batch for writing data
    const batch = writeBatch(db);

    // Map to keep track of old epic IDs to new issue IDs
    const epicIdMap = new Map<string, string>();

    // First migrate all epics
    for (const epicDoc of epicsSnap.docs) {
      const epicData = epicDoc.data();
      const newIssueRef = doc(issuesCollection);
      const newIssueId = newIssueRef.id;

      // Map old epic ID to new issue ID
      epicIdMap.set(epicData.id, newIssueId);

      // Handle potentially null updatedAt field
      let updatedAtTimestamp = undefined;
      if (epicData.updatedAt) {
        updatedAtTimestamp = epicData.updatedAt;
      }

      // Create new issue data
      const issueData: Issue = {
        id: newIssueId,
        projectId: epicData.projectId,
        name: epicData.name,
        description: epicData.description || "",
        type: IssueType.EPIC,
        status: IssueStatus.TO_DO,
        priority: IssuePriority.MEDIUM,
        displayOrder: epicData.displayOrder,
        createdAt: epicData.createdAt,
        createdBy: epicData.createdBy,
        updatedAt: updatedAtTimestamp,
      };

      // Add to batch
      batch.set(newIssueRef, issueData);
    }

    // Then migrate all stories
    for (const storyDoc of storiesSnap.docs) {
      const storyData = storyDoc.data();
      const newIssueRef = doc(issuesCollection);
      const newIssueId = newIssueRef.id;

      // Get the new parent ID (epic ID)
      const newParentId = epicIdMap.get(storyData.epicId);

      if (!newParentId) {
        console.error(
          `No new parent ID found for story ${storyData.id} with epic ${storyData.epicId}`
        );
        continue;
      }

      // Handle potentially null updatedAt field
      let updatedAtTimestamp = undefined;
      if (storyData.updatedAt) {
        updatedAtTimestamp = storyData.updatedAt;
      }

      // Create new issue data
      const issueData: Issue = {
        id: newIssueId,
        projectId: storyData.projectId,
        name: storyData.name,
        description: storyData.description || "",
        type: IssueType.STORY,
        parentId: newParentId,
        status: storyData.status,
        priority: storyData.priority,
        acceptanceCriteria: storyData.acceptanceCriteria || "",
        assignee: storyData.assignee,
        releaseId: storyData.releaseId,
        displayOrder: storyData.displayOrder,
        createdAt: storyData.createdAt,
        createdBy: storyData.createdBy,
        updatedAt: updatedAtTimestamp,
        attachments: storyData.attachments,
      };

      // Add to batch
      batch.set(newIssueRef, issueData);
    }

    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error("Error migrating to issues:", error);
    throw error;
  }
};
