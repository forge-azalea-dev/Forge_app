import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { SessionCard } from "@/components/sessions/SessionCard";
import { SessionForm } from "@/components/sessions/SessionForm";
import type { Session } from "@/lib/database";

type SessionFormData = Omit<import("@/lib/database").CreateSession, "started_at" | "ended_at">;

export default function SessionLogPage() {
  const {
    filteredSessions,
    projects,
    projectFilter,
    loading,
    error,
    setProjectFilter,
    createSession,
    updateSession,
    deleteSession,
  } = useSession();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Session | null>(null);

  const handleAddClick = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEditClick = (session: Session) => {
    setEditTarget(session);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleFormSubmit = async (data: SessionFormData): Promise<void> => {
    if (editTarget) {
      await updateSession(editTarget.id, {
        title: data.title,
        project_id: data.project_id,
        summary: data.summary,
        decisions: data.decisions,
        next_steps: data.next_steps,
        duration: data.duration,
      });
    } else {
      await createSession({
        title: data.title,
        project_id: data.project_id,
        summary: data.summary,
        decisions: data.decisions,
        next_steps: data.next_steps,
        duration: data.duration,
        started_at: new Date().toISOString(),
        ended_at: null,
      });
    }
    handleFormClose();
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm("Hapus sesi ini?")) return;
    await deleteSession(id);
  };

  const selectedProjectName =
    projectFilter !== "all"
      ? (projects.find((p) => p.id === projectFilter)?.name ?? null)
      : null;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Session Log
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Catatan aktivitas per sesi kerja.
        </p>
      </div>

      {/* Error bar */}
      {error && (
        <div className="rounded-[6px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-4 py-2">
          <p className="font-mono text-xs text-[#C41E3A]">{error}</p>
        </div>
      )}

      {/* Toolbar: project filter + add button */}
      <div className="flex items-center gap-3">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="flex-1 rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] outline-none focus:border-[#C41E3A] transition-colors"
        >
          <option value="all" className="bg-[#111111]">
            Semua Project
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#111111]">
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddClick}
          className="shrink-0 rounded-[4px] border border-[rgba(139,0,0,0.3)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[rgba(139,0,0,0.15)] hover:border-[#C41E3A] transition-colors"
        >
          + New Session
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center">
          <span className="font-mono text-[11px] text-[#666666]">Memuat...</span>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#666666]">
            {projectFilter !== "all"
              ? `Belum ada sesi untuk ${selectedProjectName ?? "project ini"}`
              : "Belum ada sesi"}
          </p>
          {projectFilter === "all" && (
            <p className="mt-1 text-xs text-[#444444]">
              Klik &quot;+ New Session&quot; untuk mencatat sesi kerja.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const project = projects.find((p) => p.id === session.project_id);
            return (
              <SessionCard
                key={session.id}
                session={session}
                projectName={project?.name ?? null}
                onEdit={handleEditClick}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}

      {/* Modal form */}
      {formOpen && (
        <SessionForm
          initial={editTarget}
          projects={projects}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
