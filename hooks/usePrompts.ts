import { useState, useEffect, useCallback } from "react";
import { PromptRepo } from "@/lib/database";
import type { Prompt, CreatePrompt, UpdatePrompt } from "@/lib/database";
import type { AiTool } from "@/lib/database";

interface UsePromptsReturn {
  filteredPrompts: Prompt[];
  toolFilter: AiTool | "all";
  searchQuery: string;
  loading: boolean;
  error: string | null;
  setToolFilter: (filter: AiTool | "all") => void;
  setSearchQuery: (query: string) => void;
  createPrompt: (data: CreatePrompt) => Promise<void>;
  updatePrompt: (id: string, data: UpdatePrompt) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  copyPrompt: (id: string) => Promise<void>;
}

export function usePrompts(): UsePromptsReturn {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [toolFilter, setToolFilter] = useState<AiTool | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async (): Promise<void> => {
    try {
      const data = await PromptRepo.getAll();
      setPrompts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat prompts");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPrompts().finally(() => setLoading(false));
  }, [fetchPrompts]);

  const createPrompt = async (data: CreatePrompt): Promise<void> => {
    setError(null);
    try {
      await PromptRepo.create(data);
      await fetchPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat prompt");
    }
  };

  const updatePrompt = async (id: string, data: UpdatePrompt): Promise<void> => {
    setError(null);
    try {
      await PromptRepo.update(id, data);
      await fetchPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update prompt");
    }
  };

  const deletePrompt = async (id: string): Promise<void> => {
    setError(null);
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    try {
      await PromptRepo.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus prompt");
      await fetchPrompts();
    }
  };

  const copyPrompt = async (id: string): Promise<void> => {
    setError(null);
    const prompt = prompts.find((p) => p.id === id);
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content);
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, use_count: p.use_count + 1, last_used: new Date().toISOString() }
            : p
        )
      );
      await PromptRepo.incrementUseCount(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal copy prompt");
      await fetchPrompts();
    }
  };

  const filteredPrompts = prompts.filter((p) => {
    const matchesTool = toolFilter === "all" || p.ai_tool === toolFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q);
    return matchesTool && matchesSearch;
  });

  return {
    filteredPrompts,
    toolFilter,
    searchQuery,
    loading,
    error,
    setToolFilter,
    setSearchQuery,
    createPrompt,
    updatePrompt,
    deletePrompt,
    copyPrompt,
  };
}
