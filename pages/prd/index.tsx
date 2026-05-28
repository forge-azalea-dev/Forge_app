import { usePRD } from "@/hooks/usePRD";
import { ProjectList } from "@/components/prd/ProjectList";
import { PRDEditor } from "@/components/prd/PRDEditor";

export default function PrdManagerPage() {
  const {
    projects,
    selectedProjectId,
    selectedProject,
    activePrd,
    loading,
    saving,
    savedAt,
    error,
    selectProject,
    createProject,
    deleteProject,
    saveAll,
  } = usePRD();

  return (
    <div className="flex flex-col space-y-0">
      {/* Page header */}
      <div className="mb-4 space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          PRD Manager
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Kelola Product Requirements Document per project.
        </p>
      </div>

      {/* Error bar */}
      {error && (
        <div className="mb-3 rounded-[6px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-4 py-2">
          <p className="font-mono text-xs text-[#C41E3A]">{error}</p>
        </div>
      )}

      {/* Split panel */}
      <div
        className="flex overflow-hidden rounded-[6px] border border-[rgba(139,0,0,0.25)]"
        style={{ minHeight: "600px" }}
      >
        {/* Left: project list */}
        <div className="w-56 flex-shrink-0 bg-[#111111]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <span className="font-mono text-[11px] text-[#666666]">Memuat...</span>
            </div>
          ) : (
            <ProjectList
              projects={projects}
              selectedId={selectedProjectId}
              onSelect={selectProject}
              onAdd={createProject}
              onDelete={deleteProject}
            />
          )}
        </div>

        {/* Right: editor or empty state */}
        <div className="flex-1 overflow-hidden bg-[#0A0A0A]">
          {!loading && selectedProject ? (
            <PRDEditor
              key={selectedProject.id}
              project={selectedProject}
              prd={activePrd}
              saving={saving}
              savedAt={savedAt}
              onSave={saveAll}
            />
          ) : !loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="space-y-2 text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#666666]">
                  Belum ada project
                </p>
                <p className="text-xs text-[#666666]">
                  Klik{" "}
                  <span className="font-mono text-[#F0F0F0]">+</span>{" "}
                  di panel kiri untuk mulai.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
