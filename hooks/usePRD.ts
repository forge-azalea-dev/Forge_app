import { useState, useEffect, useCallback } from "react";
import { ProjectRepo, PrdRepo } from "@/lib/database";
import type { Project, Prd } from "@/lib/database";
import type { Phase, ProjectStatus } from "@/lib/database";

export interface PrdFormData {
  name: string;
  stack: string | null;
  description: string | null;
  figma_url: string | null;
  repo_url: string | null;
  phase: Phase;
  status: ProjectStatus;
  prd_title: string;
  prd_content: string | null;
}

interface UsePRDReturn {
  projects: Project[];
  selectedProjectId: string | null;
  selectedProject: Project | null;
  activePrd: Prd | null;
  loading: boolean;
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
  selectProject: (id: string) => void;
  createProject: (name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveAll: (data: PrdFormData) => Promise<void>;
}

export function usePRD(): UsePRDReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activePrd, setActivePrd] = useState<Prd | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    try {
      const data = await ProjectRepo.getAll();
      setProjects(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat projects");
      return [];
    }
  }, []);

  // Initial load — auto-select first project
  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then((data) => {
        if (data.length > 0) {
          setSelectedProjectId((current) => current ?? data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [fetchProjects]);

  // Load PRD setiap kali selected project berubah
  useEffect(() => {
    if (!selectedProjectId) {
      setActivePrd(null);
      return;
    }
    PrdRepo.getByProject(selectedProjectId)
      .then(setActivePrd)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat PRD");
      });
  }, [selectedProjectId]);

  const selectProject = (id: string) => {
    setSelectedProjectId(id);
    setSavedAt(null);
  };

  const createProject = async (name: string): Promise<void> => {
    try {
      setError(null);
      const project = await ProjectRepo.create({
        name,
        description: null,
        stack: null,
        phase: "prd",
        status: "active",
        figma_url: null,
        repo_url: null,
      });
      await fetchProjects();
      setSelectedProjectId(project.id);
      setSavedAt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat project");
      throw err;
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    try {
      setError(null);
      await ProjectRepo.delete(id);
      const updated = await fetchProjects();
      if (selectedProjectId === id) {
        const next = updated.find((p) => p.id !== id) ?? null;
        setSelectedProjectId(next?.id ?? null);
        setActivePrd(null);
        setSavedAt(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus project");
      throw err;
    }
  };

  const saveAll = async (data: PrdFormData): Promise<void> => {
    if (!selectedProjectId) return;
    try {
      setSaving(true);
      setError(null);
      await ProjectRepo.update(selectedProjectId, {
        name: data.name,
        description: data.description,
        stack: data.stack,
        figma_url: data.figma_url,
        repo_url: data.repo_url,
        phase: data.phase,
        status: data.status,
      });
      const prd = await PrdRepo.upsert(selectedProjectId, {
        title: data.prd_title,
        content: data.prd_content,
      });
      setActivePrd(prd);
      await fetchProjects();
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  return {
    projects,
    selectedProjectId,
    selectedProject,
    activePrd,
    loading,
    saving,
    savedAt,
    error,
    selectProject,
    createProject,
    deleteProject,
    saveAll,
  };
}
