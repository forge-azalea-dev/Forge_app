import { useProgress } from "@/hooks/useProgress";
import { ProjectProgressCard } from "@/components/progress/ProjectProgressCard";

type StatusFilter = import("@/lib/database").ProjectStatus | "all";

const FILTER_TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
];

export default function ProgressTrackerPage() {
  const {
    filteredProjects,
    statusFilter,
    loading,
    error,
    setStatusFilter,
    updatePhase,
    updateStatus,
  } = useProgress();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Progress Tracker
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Track fase development setiap project.
        </p>
      </div>

      {/* Error bar */}
      {error && (
        <div className="rounded-[6px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-4 py-2">
          <p className="font-mono text-xs text-[#C41E3A]">{error}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[rgba(139,0,0,0.2)]">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 font-mono text-xs transition-colors ${
              statusFilter === tab.value
                ? "border-b-2 border-[#C41E3A] text-[#F0F0F0]"
                : "text-[#666666] hover:text-[#AAAAAA]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center">
          <span className="font-mono text-[11px] text-[#666666]">Memuat...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#666666]">
            Belum ada project
          </p>
          <p className="mt-1 text-xs text-[#444444]">
            Tambah project di PRD Manager.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredProjects.map((project) => (
            <ProjectProgressCard
              key={project.id}
              project={project}
              onPhaseClick={updatePhase}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

