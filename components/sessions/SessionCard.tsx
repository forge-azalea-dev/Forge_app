import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface SessionCardProps {
  session: Session;
  projectName: string | null;
  onEdit: (session: Session) => void;
  onDelete: (id: string) => void;
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
  const duration = formatDuration(session.duration);

  return (
    <div
      onClick={() => setExpanded((prev) => !prev)}
      className="group relative cursor-pointer rounded-[6px] border border-[rgba(139,0,0,0.25)] bg-[#111111] px-4 py-4 space-y-2 transition-shadow hover:shadow-[0_0_8px_rgba(139,0,0,0.25)] select-none"
    >
      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

type Session = import("@/lib/database").Session;
