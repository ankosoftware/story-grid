import { useState, useEffect } from "react";
import { createProject, getProjects } from "../firebase/firestore";
import { Project } from "../firebase/models/types";
import { useAuth } from "../auth/AuthProvider";

/**
 * Custom hook to manage projects for the current tenant
 */
export const useProjects = () => {
  const { user, currentTenant, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch projects when the tenant changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !currentTenant) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const fetchedProjects = await getProjects(currentTenant.id);
        setProjects(fetchedProjects);
        setError(null);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, currentTenant, authLoading]);

  /**
   * Create a new project
   *
   * @param name - Project name
   * @param description - Optional project description
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Promise that resolves to the ID of the created project
   */
  const createNewProject = async (
    name: string,
    description?: string,
    startDate?: Date | null,
    endDate?: Date | null
  ): Promise<string> => {
    if (!user || !currentTenant) {
      throw new Error("User must be logged in and have an active tenant to create a project");
    }

    try {
      // Create the project in Firestore
      const projectId = await createProject(
        currentTenant.id,
        name,
        user.uid,
        description,
        startDate,
        endDate
      );

      // Refresh the projects list
      const updatedProjects = await getProjects(currentTenant.id);
      setProjects(updatedProjects);

      return projectId;
    } catch (err) {
      console.error("Error creating project:", err);
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    createNewProject,
  };
};
