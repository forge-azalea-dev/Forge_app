import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AI_TOOLS } from "@/lib/database";
import type { Prompt, CreatePrompt } from "@/lib/database";

interface PromptFormProps {
  initial: Prompt | null;
  onSubmit: (data: CreatePrompt) => Promise<void>;
  onClose: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  ideogram: "Ideogram",
  stitch: "Stitch",
  cursor: "Cursor",
  custom: "Custom",
};

export function PromptForm({ initial, onSubmit, onClose }: PromptFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [aiTool, setAiTool] = useState<AiTool>("claude");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setContent(initial.content);
      setAiTool(initial.ai_tool);
      setCategory(initial.category ?? "");
    } else {
      setTitle("");
      setContent("");
      setAiTool("claude");
      setCategory("");
    }
  }, [initial?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        ai_tool: aiTool,
        category: category.trim() || null,
        tags: null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[8px] border border-[rgba(139,0,0,0.3)] bg-[#111111] px-6 py-5 shadow-[0_0_24px_rgba(139,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.15em] text-[#F0F0F0]">
            {initial ? "Edit Prompt" : "New Prompt"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#666666] hover:text-[#F0F0F0] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label htmlFor="prompt-title" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
              Title
            </label>
            <input
              id="prompt-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama prompt..."
              required
              className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-[#F0F0F0] placeholder-[#444444] outline-none focus:border-[#C41E3A] transition-colors"
            />
          </div>

          {/* AI Tool + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prompt-ai-tool" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                AI Tool
              </label>
              <select
                id="prompt-ai-tool"
                value={aiTool}
                onChange={(e) => setAiTool(e.target.value as AiTool)}
                className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-[#F0F0F0] outline-none focus:border-[#C41E3A] transition-colors"
              >
                {AI_TOOLS.map((t) => (
                  <option key={t} value={t} className="bg-[#111111]">
                    {TOOL_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prompt-category" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                Category
              </label>
              <input
                id="prompt-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Opsional..."
                className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-[#F0F0F0] placeholder-[#444444] outline-none focus:border-[#C41E3A] transition-colors"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="prompt-content" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
              Content
            </label>
            <textarea
              id="prompt-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Isi prompt..."
              required
              rows={8}
              className="w-full resize-none rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-[#F0F0F0] placeholder-[#444444] outline-none focus:border-[#C41E3A] transition-colors leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[4px] border border-[rgba(139,0,0,0.25)] px-4 py-1.5 font-mono text-xs text-[#666666] hover:text-[#F0F0F0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="rounded-[4px] bg-[#8B0000] px-4 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[#C41E3A] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving..." : initial ? "Save Changes" : "Add Prompt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type AiTool = import("@/lib/database").AiTool;
