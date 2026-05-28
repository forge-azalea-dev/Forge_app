import { useState } from "react";
import { usePrompts } from "@/hooks/usePrompts";
import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptForm } from "@/components/prompts/PromptForm";
import { AI_TOOLS } from "@/lib/database";
import type { Prompt, CreatePrompt } from "@/lib/database";

type AiToolFilter = import("@/lib/database").AiTool | "all";

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

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Prompt | null>(null);

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

      {/* Toolbar: search + add button */}
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
          onClick={handleAddClick}
          className="shrink-0 rounded-[4px] border border-[rgba(139,0,0,0.3)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[rgba(139,0,0,0.15)] hover:border-[#C41E3A] transition-colors"
        >
          + Add Prompt
        </button>
      </div>

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
    </div>
  );
}
