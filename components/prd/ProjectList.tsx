import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import type { Project } from "@/lib/database";

interface ProjectListProps {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectList({
  projects,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}: ProjectListProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setSubmitting(true);
      await onAdd(newName.trim());
      setNewName("");
      setAdding(false);
    } catch {
      // error handled by usePRD hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Hapus project ini? PRD terkait juga akan terhapus.")) return;
    await onDelete(id).catch(() => {});
  };

  return (
    <div className="flex h-full flex-col border-r border-[rgba(139,0,0,0.25)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(139,0,0,0.25)]">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666]">
          Projects
        </span>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-[#666666] hover:text-[#F0F0F0] transition-colors"
          title="New Project"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Inline add form */}
      {adding && (
        <form
          onSubmit={handleAdd}
          className="border-b border-[rgba(139,0,0,0.25)] px-3 py-2 space-y-2"
        >
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama project..."
            className="w-full bg-[#1A1A1A] border border-[rgba(139,0,0,0.25)] rounded px-2 py-1.5 text-xs text-[#F0F0F0] font-mono outline-none focus:border-[#C41E3A] transition-colors"
          />
          <div className="flex gap-1">
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="flex-1 bg-[#8B0000] hover:bg-[#C41E3A] disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-mono transition-colors"
            >
              {submitting ? "..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="flex-1 border border-[rgba(139,0,0,0.25)] text-[#666666] hover:text-[#F0F0F0] px-2 py-1 rounded text-xs font-mono transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-mono text-[11px] text-[#666666]">Belum ada project</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelect(project.id)}
              className={`group flex cursor-pointer items-center justify-between border-b border-[rgba(139,0,0,0.1)] px-4 py-3 transition-colors ${
                selectedId === project.id
                  ? "border-l-2 border-l-[#C41E3A] bg-[rgba(139,0,0,0.12)]"
                  : "hover:bg-[rgba(255,255,255,0.03)]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-mono text-xs ${
                    selectedId === project.id
                      ? "text-[#F0F0F0]"
                      : "text-[#AAAAAA]"
                  }`}
                >
                  {project.name}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                  {project.phase}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, project.id)}
                className="ml-2 rounded p-1 text-[#666666] opacity-0 transition-all hover:text-[#C41E3A] group-hover:opacity-100"
                title="Hapus project"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
