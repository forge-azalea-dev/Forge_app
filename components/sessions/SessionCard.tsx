import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import type { Session } from "@/lib/database";

interface SessionCardProps {
  session: Session;
  projectName: string | null;
  onEdit: (session: Session) => void;
  onDelete: (id: string) => void;
}

const SYSTEM_PROMPT =
  "You are a developer productivity assistant. Summarize this work session concisely in Bahasa Indonesia.\nFocus on what was accomplished, key decisions, and what comes next.\nMax 80 words. Be practical and direct.";

function buildSummarizePrompt(session: Session, projectName: string | null): string {
  const lines: string[] = [`SESSION: ${session.title}`];
  if (projectName !== null) lines.push(`Project: ${projectName}`);
  if (session.duration !== null) lines.push(`Durasi: ${session.duration} menit`);
  if (session.summary) lines.push(`Catatan: ${session.summary}`);
  if (session.decisions) lines.push(`Decisions: ${session.decisions}`);
  if (session.next_steps) lines.push(`Next Steps: ${session.next_steps}`);
  lines.push("\nGenerate ringkasan sesi ini.");
  return lines.join("\n");
}

function formatDuration(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("id-ID", { month: "short" });
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} • ${hh}:${mm}`;
}

export function SessionCard({
  session,
  projectName,
  onEdit,
  onDelete,
}: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [errorVisible, setErrorVisible] = useState(true);
  const { isConfigured, isLoading: isGenerating, error: aiError, generate } = useAI();
  const duration = formatDuration(session.duration);

  const handleSummarize = async () => {
    if (!isConfigured || isGenerating) return;
    setAiSummary(null);
    setErrorVisible(true);
    const result = await generate(SYSTEM_PROMPT, buildSummarizePrompt(session, projectName));
    if (result) setAiSummary(result);
  };

  return (
    <div
      onClick={() => setExpanded((prev) => !prev)}
      className="group relative cursor-pointer rounded-[6px] border border-[rgba(139,0,0,0.25)] bg-[#111111] px-4 py-4 space-y-2 transition-shadow hover:shadow-[0_0_8px_rgba(139,0,0,0.25)] select-none"
    >
      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isConfigured && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSummarize();
            }}
            disabled={isGenerating}
            className="p-1.5 rounded text-[#666666] hover:text-[#C41E3A] hover:bg-[rgba(139,0,0,0.1)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Summarize with AI"
          >
            {isGenerating ? (
              <span className="block h-3 w-3 animate-spin rounded-full border border-[#C41E3A] border-t-transparent" />
            ) : (
              <span className="font-mono text-[10px]">✨</span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(session);
          }}
          className="p-1.5 rounded text-[#666666] hover:text-[#F0F0F0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          title="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session.id);
          }}
          className="p-1.5 rounded text-[#666666] hover:text-[#C41E3A] hover:bg-[rgba(139,0,0,0.1)] transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Title + duration badge */}
      <div className="flex items-start gap-2 pr-16">
        <p className="flex-1 truncate font-mono text-sm font-semibold text-[#F0F0F0]">
          {session.title}
        </p>
        {duration && (
          <span className="shrink-0 rounded-[3px] border border-[rgba(139,0,0,0.3)] bg-[rgba(196,30,58,0.1)] px-1.5 py-0.5 font-mono text-[9px] text-[#C41E3A]">
            {duration}
          </span>
        )}
      </div>

      {/* Project name */}
      {projectName && (
        <p className="font-mono text-[10px] text-[#555555]">{projectName}</p>
      )}

      {/* Timestamp */}
      <p className="font-mono text-[10px] text-[#444444]">
        {formatTimestamp(session.started_at)}
      </p>

      {/* Summary preview — 2 lines (collapsed only) */}
      {!expanded && session.summary && (
        <p className="font-mono text-[11px] text-[#666666] line-clamp-2 leading-relaxed">
          {session.summary}
        </p>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="space-y-3 border-t border-[rgba(139,0,0,0.15)] pt-3">
          {session.summary && (
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[#444444]">
                Summary
              </p>
              <p className="font-mono text-[11px] text-[#AAAAAA] leading-relaxed whitespace-pre-wrap">
                {session.summary}
              </p>
            </div>
          )}
          {session.decisions && (
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[#444444]">
                Decisions
              </p>
              <p className="font-mono text-[11px] text-[#AAAAAA] leading-relaxed whitespace-pre-wrap">
                {session.decisions}
              </p>
            </div>
          )}
          {session.next_steps && (
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[#444444]">
                Next Steps
              </p>
              <p className="font-mono text-[11px] text-[#AAAAAA] leading-relaxed whitespace-pre-wrap">
                {session.next_steps}
              </p>
            </div>
          )}
          {!session.summary && !session.decisions && !session.next_steps && (
            <p className="font-mono text-[10px] text-[#444444]">
              Tidak ada detail.
            </p>
          )}
        </div>
      )}

      {/* AI summary panel */}
      {aiSummary !== null && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-1 rounded-[4px] border border-[rgba(139,0,0,0.2)] bg-[rgba(139,0,0,0.06)] px-3 py-2 space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#555555]">
              AI RINGKASAN
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAiSummary(null);
              }}
              className="font-mono text-[9px] text-[#555555] hover:text-[#F0F0F0] transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="font-mono text-[11px] text-[#AAAAAA] leading-relaxed whitespace-pre-wrap">
            {aiSummary}
          </p>
        </div>
      )}

      {/* AI error panel */}
      {aiError !== null && errorVisible && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-1 flex items-start justify-between gap-2"
        >
          <p className="font-mono text-[10px] text-[#C41E3A]">{aiError}</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setErrorVisible(false); }}
            className="shrink-0 font-mono text-[9px] text-[#555555] hover:text-[#F0F0F0] transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Expand/collapse indicator — only when there is content to show */}
      {(session.summary || session.decisions || session.next_steps) && (
        <div className="flex justify-end pt-0.5">
          <span className="font-mono text-[9px] text-[#444444]">
            {expanded ? "▲ tutup" : "▼ detail"}
          </span>
        </div>
      )}
    </div>
  );
}

