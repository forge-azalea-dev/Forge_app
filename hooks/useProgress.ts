import { useState, useEffect, useCallback } from "react";
import { ProjectRepo } from "@/lib/database";
import type { Project } from "@/lib/database";
import type { Phase, ProjectStatus } from "@/lib/database";

interface UseProgressReturn {
  filteredProjects: Project[];
  statusFilter: ProjectStatus | "all";
  loading: boolean;
  error: string | null;
  setStatusFilter: (filter: ProjectStatus | "all") => void;
  updatePhase: (projectId: string, phase: Phase) => Promise<void>;
  updateStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
}

export function useProgress(): UseProgressReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (): Promise<void> => {
    try {
      const data = await ProjectRepo.getAll();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat projects");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProjects().finally(() => setLoading(false));
  }, [fetchProjects]);

  const updatePhase = async (projectId: string, phase: Phase): Promise<void> => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, phase } : p))
    );
    try {
      await ProjectRepo.update(projectId, { phase });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update phase");
      await fetchProjects();
    }
  };

  const updateStatus = async (projectId: string, status: ProjectStatus): Promise<void> => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status } : p))
    );
    try {
      await ProjectRepo.update(projectId, { status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update status");
      await fetchProjects();
    }
  };

  const filteredProjects =
    statusFilter === "all"
      ? projects
      : projects.filter((p) => p.status === statusFilter);

  return {
    filteredProjects,
    statusFilter,
    loading,
    error,
    setStatusFilter,
    updatePhase,
    updateStatus,
  };
}
