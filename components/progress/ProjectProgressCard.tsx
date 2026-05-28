import { PipelineBar } from "./PipelineBar";
import { PROJECT_STATUSES } from "@/lib/database";
import type { Project } from "@/lib/database";

interface ProjectProgressCardProps {
  project: Project;
  onPhaseClick: (projectId: string, phase: Phase) => void;
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active:
    "bg-[rgba(134,197,93,0.12)] text-[#86c55d] border-[rgba(134,197,93,0.3)]",
  paused:
    "bg-[rgba(255,200,0,0.08)] text-[#FFC800] border-[rgba(255,200,0,0.3)]",
  completed:
    "bg-[rgba(100,200,255,0.08)] text-[#64C8FF] border-[rgba(100,200,255,0.3)]",
  archived:
    "bg-[rgba(102,102,102,0.08)] text-[#666666] border-[rgba(102,102,102,0.25)]",
};

export function ProjectProgressCard({
  project,
  onPhaseClick,
  onStatusChange,
}: ProjectProgressCardProps) {
  return (
    <div className="rounded-[6px] border border-[rgba(139,0,0,0.25)] bg-[#111111] px-4 py-4 space-y-3">
      {/* Top row: name + status select */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-semibold text-[#F0F0F0]">
            {project.name}
          </p>
          {project.stack && (
            <p className="mt-0.5 truncate font-mono text-[10px] text-[#666666]">
              {project.stack}
            </p>
          )}
        </div>
        <select
          value={project.status}
          onChange={(e) =>
            onStatusChange(project.id, e.target.value as ProjectStatus)
          }
          className={`shrink-0 cursor-pointer rounded-[4px] border bg-transparent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider outline-none transition-colors ${
            STATUS_STYLES[project.status]
          }`}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-[#111111] text-[#F0F0F0]">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Pipeline bar */}
      <PipelineBar
        phase={project.phase}
        onPhaseClick={(phase) => onPhaseClick(project.id, phase)}
      />
    </div>
  );
}

// Type aliases for JSX casts
type Phase = import("@/lib/database").Phase;
type ProjectStatus = import("@/lib/database").ProjectStatus;
