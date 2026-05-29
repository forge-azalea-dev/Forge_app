import { useState } from "react";
import { usePrompts } from "@/hooks/usePrompts";
import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptForm } from "@/components/prompts/PromptForm";
import { AI_TOOLS, ProjectRepo, PHASE_LABELS } from "@/lib/database";
import { useAI } from "@/hooks/useAI";
import type { Prompt, CreatePrompt } from "@/lib/database";

type AiToolFilter = import("@/lib/database").AiTool | "all";

interface SuggestedPrompt {
  title: string;
  content: string;
  category: string;
}

const TOOL_LABELS: Record<string, string> = {
  all: "All",
  claude: "Claude",
  chatgpt: "ChatGPT",
  ideogram: "Ideogram",
  stitch: "Stitch",
  cursor: "Cursor",
  custom: "Custom",
};

const FILTER_TABS: AiToolFilter[] = ["all", ...AI_TOOLS];

export default function PromptVaultPage() {
  const {
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
  } = usePrompts();

  const ai = useAI();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Prompt | null>(null);

  // AI suggester state
  const [aiError, setAiError] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[] | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());

  const handleAddClick = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEditClick = (prompt: Prompt) => {
    setEditTarget(prompt);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleFormSubmit = async (data: CreatePrompt) => {
    if (editTarget) {
      await updatePrompt(editTarget.id, data);
    } else {
      await createPrompt(data);
    }
    handleFormClose();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus prompt ini?")) return;
    await deletePrompt(id);
  };

  const handleSuggestClick = async () => {
    setAiError(null);

    if (!ai.isConfigured) {
      setAiError("Konfigurasi API key di Settings");
      return;
    }

    setSuggestLoading(true);
    try {
      const activeProjects = await ProjectRepo.getActive();
      const project = activeProjects[0];
      const projectName = project?.name ?? "—";
      const stack = project?.stack ?? "—";
      const phase = project?.phase ? (PHASE_LABELS[project.phase] ?? project.phase) : "—";

      const systemPrompt = `You are a prompt engineering expert. Suggest 3 practical prompts in Bahasa Indonesia.
Respond ONLY in JSON format:
[
  {"title": "...", "content": "...", "category": "..."},
  {"title": "...", "content": "...", "category": "..."},
  {"title": "...", "content": "...", "category": "..."}
]
No preamble, no markdown, just the JSON array.`;

      const userPrompt = `Project aktif: ${projectName}
Stack: ${stack}
Fase saat ini: ${phase}
Suggest 3 prompt yang berguna untuk fase ini.`;

      const raw = await ai.generate(systemPrompt, userPrompt);

      if (!raw) {
        // ai.generate sets its own error; expose it here
        setAiError(ai.error ?? "Gagal mendapatkan respons AI. Coba lagi.");
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        setAiError("Gagal memparse respons AI. Coba lagi.");
        return;
      }

      if (!Array.isArray(parsed)) {
        setAiError("Gagal memparse respons AI. Coba lagi.");
        return;
      }

      const suggestions: SuggestedPrompt[] = parsed.map((item: unknown) => {
        const obj = item as Record<string, unknown>;
        return {
          title: typeof obj.title === "string" ? obj.title : "",
          content: typeof obj.content === "string" ? obj.content : "",
          category: typeof obj.category === "string" ? obj.category : "",
        };
      });

      setSuggestedPrompts(suggestions);
      setSavedIndexes(new Set());
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleSaveToVault = async (suggestion: SuggestedPrompt, index: number) => {
    await createPrompt({
      title: suggestion.title,
      content: suggestion.content,
      ai_tool: "claude",
      category: suggestion.category || null,
      tags: null,
    });
    setSavedIndexes((prev) => new Set(prev).add(index));
  };

  const handleCloseModal = () => {
    setSuggestedPrompts(null);
    setSavedIndexes(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Prompt Vault
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Library prompt per AI tool.
        </p>
      </div>

      {/* Error bar */}
      {error && (
        <div className="rounded-[6px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-4 py-2">
          <p className="font-mono text-xs text-[#C41E3A]">{error}</p>
        </div>
      )}

      {/* Toolbar: search + suggest + add button */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari prompt..."
          className="flex-1 rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] placeholder-[#444444] outline-none focus:border-[#C41E3A] transition-colors"
        />
        <button
          type="button"
          onClick={handleSuggestClick}
          disabled={suggestLoading}
          className="shrink-0 rounded-[4px] border border-[rgba(139,0,0,0.3)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[rgba(139,0,0,0.15)] hover:border-[#C41E3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {suggestLoading ? "Generating..." : "✨ Suggest Prompt"}
        </button>
        <button
          type="button"
          onClick={handleAddClick}
          className="shrink-0 rounded-[4px] border border-[rgba(139,0,0,0.3)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[rgba(139,0,0,0.15)] hover:border-[#C41E3A] transition-colors"
        >
          + Add Prompt
        </button>
      </div>

      {/* AI error message */}
      {aiError && (
        <p className="font-mono text-xs text-[#C41E3A]">{aiError}</p>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[rgba(139,0,0,0.2)]">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setToolFilter(tab)}
            className={`px-3 py-1.5 font-mono text-xs transition-colors ${
              toolFilter === tab
                ? "border-b-2 border-[#C41E3A] text-[#F0F0F0]"
                : "text-[#666666] hover:text-[#AAAAAA]"
            }`}
          >
            {TOOL_LABELS[tab] ?? tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center">
          <span className="font-mono text-[11px] text-[#666666]">Memuat...</span>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#666666]">
            {searchQuery
              ? "Tidak ada prompt yang cocok"
              : toolFilter === "all"
              ? "Belum ada prompt"
              : `Belum ada prompt untuk ${TOOL_LABELS[toolFilter] ?? toolFilter}`}
          </p>
          {!searchQuery && (
            <p className="mt-1 text-xs text-[#444444]">
              Klik &quot;+ Add Prompt&quot; untuk menambahkan.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onCopy={copyPrompt}
              onEdit={handleEditClick}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal form */}
      {formOpen && (
        <PromptForm
          initial={editTarget}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}

      {/* AI Suggest Prompt Modal */}
      {suggestedPrompts !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[rgba(139,0,0,0.3)] rounded-[6px] w-full max-w-lg p-6">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#F0F0F0]">
                Saran Prompt dari AI
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="font-mono text-xs text-[#666666] hover:text-[#AAAAAA] transition-colors"
              >
                Tutup
              </button>
            </div>

            {/* Suggestion cards */}
            <div className="space-y-3">
              {suggestedPrompts.map((suggestion, index) => (
                <div
                  key={index}
                  className="rounded-[6px] border border-[rgba(139,0,0,0.2)] bg-[#0A0A0A] p-4 space-y-2"
                >
                  <p className="font-mono text-xs font-bold text-[#F0F0F0]">
                    {suggestion.title}
                  </p>
                  <p className="text-sm text-[#AAAAAA] line-clamp-3">
                    {suggestion.content}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    {suggestion.category ? (
                      <span className="font-mono text-[10px] text-[#666666] border border-[rgba(139,0,0,0.2)] px-1.5 py-0.5 rounded">
                        {suggestion.category}
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveToVault(suggestion, index)}
                      disabled={savedIndexes.has(index)}
                      className="w-full rounded-[4px] bg-[#8B0000] hover:bg-[#C41E3A] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[#8B0000]"
                    >
                      {savedIndexes.has(index) ? "✓ Tersimpan" : "Save to Vault"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
