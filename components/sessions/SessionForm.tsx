import { useState, useEffect } from "react";
import { X } from "lucide-react";

type SessionFormData = Omit<import("@/lib/database").CreateSession, "started_at" | "ended_at">;

interface SessionFormProps {
  initial: Session | null;
  projects: Project[];
  onSubmit: (data: SessionFormData) => Promise<void>;
  onClose: () => void;
}

export function SessionForm({
  initial,
  projects,
  onSubmit,
  onClose,
}: SessionFormProps) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setProjectId(initial.project_id);
      setSummary(initial.summary ?? "");
      setDecisions(initial.decisions ?? "");
      setNextSteps(initial.next_steps ?? "");
      setDurationInput(initial.duration != null ? String(initial.duration) : "");
    } else {
      setTitle("");
      setProjectId(null);
      setSummary("");
      setDecisions("");
      setNextSteps("");
      setDurationInput("");
    }
  }, [initial?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const parsed = parseInt(durationInput.trim(), 10);
    const durationNum = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        project_id: projectId,
        summary: summary.trim() || null,
        decisions: decisions.trim() || null,
        next_steps: nextSteps.trim() || null,
        duration: durationNum,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-[#F0F0F0] placeholder-[#444444] outline-none focus:border-[#C41E3A] transition-colors";

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
            {initial ? "Edit Session" : "New Session"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-[#666666] hover:text-[#F0F0F0] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama sesi..."
              required
              className={inputClass}
            />
          </div>

          {/* Project + Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                Project
              </label>
              <select
                value={projectId ?? ""}
                onChange={(e) =>
                  setProjectId(e.target.value || null)
                }
                className={inputClass}
              >
                <option value="" className="bg-[#111111]">
                  — No project —
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#111111]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                Duration (menit)
              </label>
              <input
                type="number"
                min="1"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                placeholder="e.g. 90"
                className={inputClass}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
              Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ringkasan sesi..."
              rows={3}
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </div>

          {/* Decisions */}
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
              Decisions
            </label>
            <textarea
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
              placeholder="Keputusan penting..."
              rows={3}
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </div>

          {/* Next Steps */}
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
              Next Steps
            </label>
            <textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="Follow-up atau langkah berikutnya..."
              rows={3}
              className={`${inputClass} resize-none leading-relaxed`}
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
              disabled={submitting || !title.trim()}
              className="rounded-[4px] bg-[#8B0000] px-4 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[#C41E3A] disabled:opacity-50 transition-colors"
            >
              {submitting
                ? "Saving..."
                : initial
                ? "Save Changes"
                : "Add Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type Session = import("@/lib/database").Session;
type Project = import("@/lib/database").Project;
