import { useState, useEffect, useCallback } from "react";
import { TodoRepo, ProjectRepo } from "@/lib/database";
import type { Todo, CreateTodo, UpdateTodo, Project } from "@/lib/database";

export type StatusFilter = "all" | "pending" | "in_progress" | "done";

interface UseTodosReturn {
  todos: Todo[];
  filteredTodos: Todo[];
  projects: Project[];
  selectedProjectId: string | null;
  statusFilter: StatusFilter;
  loading: boolean;
  error: string | null;
  selectProject: (id: string | null) => void;
  setStatusFilter: (f: StatusFilter) => void;
  createTodo: (data: CreateTodo) => Promise<void>;
  updateTodo: (id: string, data: UpdateTodo) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  createProject: (name: string) => Promise<void>;
}

const STATUS_CYCLE: Record<Todo["status"], Todo["status"]> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    const data = await ProjectRepo.getAll();
    setProjects(data);
    return data;
  }, []);

  const fetchTodos = useCallback(async (projectId: string) => {
    try {
      const data = await TodoRepo.getByProject(projectId);
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat todos");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then((fetchedProjects) => {
        if (fetchedProjects.length > 0) {
          const firstId = fetchedProjects[0].id;
          setSelectedProjectId((prev) => prev ?? firstId);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat projects");
      })
      .finally(() => setLoading(false));
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTodos(selectedProjectId);
    } else {
      setTodos([]);
    }
  }, [selectedProjectId, fetchTodos]);

  const filteredTodos =
    statusFilter === "all"
      ? todos
      : todos.filter((t) => t.status === statusFilter);

  const selectProject = (id: string | null) => {
    setSelectedProjectId(id);
  };

  const createTodo = async (data: CreateTodo) => {
    try {
      await TodoRepo.create(data);
      if (selectedProjectId) {
        await fetchTodos(selectedProjectId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat todo");
    }
  };

  const updateTodo = async (id: string, data: UpdateTodo) => {
    try {
      await TodoRepo.update(id, data);
      if (selectedProjectId) {
        await fetchTodos(selectedProjectId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupdate todo");
    }
  };

  const deleteTodo = async (id: string) => {
    // Optimistic update
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await TodoRepo.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus todo");
      // Rollback
      if (selectedProjectId) {
        await fetchTodos(selectedProjectId);
      }
    }
  };

  const toggleStatus = async (id: string) => {
    // Optimistic update: cycle status immediately
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: STATUS_CYCLE[t.status] } : t,
      ),
    );
    try {
      await TodoRepo.toggleStatus(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status todo");
      // Rollback
      if (selectedProjectId) {
        await fetchTodos(selectedProjectId);
      }
    }
  };

  const createProject = async (name: string) => {
    try {
      await ProjectRepo.create({
        name,
        description: null,
        stack: null,
        phase: "prd",
        status: "active",
        figma_url: null,
        repo_url: null,
      });
      const updated = await fetchProjects();
      // Auto-select the newly created project (it's first since sorted by updated_at DESC)
      if (updated.length > 0) {
        setSelectedProjectId(updated[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat project");
    }
  };

  return {
    todos,
    filteredTodos,
    projects,
    selectedProjectId,
    statusFilter,
    loading,
    error,
    selectProject,
    setStatusFilter,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleStatus,
    createProject,
  };
}
