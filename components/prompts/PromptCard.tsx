import { useState, useEffect, useRef } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Prompt } from "@/lib/database";

interface PromptCardProps {
  prompt: Prompt;
  onCopy: (id: string) => Promise<void>;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
}

const TOOL_BADGE: Partial<Record<AiTool, string>> = {
  claude:   "bg-[rgba(196,30,58,0.15)] text-[#C41E3A] border-[rgba(196,30,58,0.3)]",
  chatgpt:  "bg-[rgba(16,163,127,0.12)] text-[#10A37F] border-[rgba(16,163,127,0.3)]",
  ideogram: "bg-[rgba(99,102,241,0.12)] text-[#6366F1] border-[rgba(99,102,241,0.3)]",
  stitch:   "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]",
  cursor:   "bg-[rgba(59,130,246,0.12)] text-[#3B82F6] border-[rgba(59,130,246,0.3)]",
  custom:   "bg-[rgba(102,102,102,0.1)] text-[#666666] border-[rgba(102,102,102,0.25)]",
};

export function PromptCard({ prompt, onCopy, onEdit, onDelete }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCardClick = async () => {
    try {
      await onCopy(prompt.id);
    } catch {
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  const lastUsedLabel = prompt.last_used
    ? new Date(prompt.last_used).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Belum pernah";

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer rounded-[6px] border border-[rgba(139,0,0,0.25)] bg-[#111111] px-4 py-4 space-y-2 transition-shadow hover:shadow-[0_0_8px_rgba(139,0,0,0.25)] select-none"
    >
      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
          className="p-1.5 rounded text-[#666666] hover:text-[#F0F0F0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          title="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
          className="p-1.5 rounded text-[#666666] hover:text-[#C41E3A] hover:bg-[rgba(139,0,0,0.1)] transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Title + tool badge */}
      <div className="flex items-start gap-2 pr-16">
        <p className="flex-1 truncate font-mono text-sm font-semibold text-[#F0F0F0]">
          {prompt.title}
        </p>
        <span
          className={`shrink-0 rounded-[3px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
            TOOL_BADGE[prompt.ai_tool] ?? TOOL_BADGE.custom
          }`}
        >
          {prompt.ai_tool}
        </span>
      </div>

      {/* Category */}
      {prompt.category && (
        <p className="font-mono text-[10px] text-[#555555]">{prompt.category}</p>
      )}

      {/* Content preview — 2 lines */}
      <p className="font-mono text-[11px] text-[#666666] line-clamp-2 leading-relaxed">
        {prompt.content}
      </p>

      {/* Footer: use_count + last_used */}
      <div className="flex items-center justify-between pt-1">
        <span className="font-mono text-[10px] text-[#444444]">
          ×{prompt.use_count} used
        </span>
        <span className="font-mono text-[10px] text-[#444444]">
          {lastUsedLabel}
        </span>
      </div>

      {/* Copied flash overlay */}
      {copied && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[6px] bg-[rgba(139,0,0,0.15)] backdrop-blur-[1px] pointer-events-none">
          <span className="font-mono text-xs font-semibold text-[#C41E3A] uppercase tracking-widest">
            Copied!
          </span>
        </div>
      )}
    </div>
  );
}

type AiTool = import("@/lib/database").AiTool;
