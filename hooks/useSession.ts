import { useState, useEffect, useCallback } from "react";
import { SessionRepo, ProjectRepo } from "@/lib/database";
import type { Session, CreateSession, UpdateSession, Project } from "@/lib/database";

interface UseSessionReturn {
  filteredSessions: Session[];
  projects: Project[];
  projectFilter: string | "all";
  loading: boolean;
  error: string | null;
  setProjectFilter: (filter: string | "all") => void;
  createSession: (data: CreateSession) => Promise<void>;
  updateSession: (id: string, data: UpdateSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState<string | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (): Promise<void> => {
    try {
      const data = await SessionRepo.getAll();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sesi");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSessions(),
      ProjectRepo.getAll()
        .then(setProjects)
        .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat proyek")),
    ]).finally(() => setLoading(false));
  }, [fetchSessions]);

  const createSession = async (data: CreateSession): Promise<void> => {
    setError(null);
    try {
      await SessionRepo.create(data);
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat sesi");
    }
  };

  const updateSession = async (id: string, data: UpdateSession): Promise<void> => {
    setError(null);
    try {
      await SessionRepo.update(id, data);
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update sesi");
    }
  };

  const deleteSession = async (id: string): Promise<void> => {
    setError(null);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await SessionRepo.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus sesi");
      await fetchSessions();
    }
  };

  const filteredSessions = sessions.filter(
    (s) => projectFilter === "all" || (s.project_id !== null && s.project_id === projectFilter),
  );

  return {
    filteredSessions,
    projects,
    projectFilter,
    loading,
    error,
    setProjectFilter,
    createSession,
    updateSession,
    deleteSession,
  };
}
