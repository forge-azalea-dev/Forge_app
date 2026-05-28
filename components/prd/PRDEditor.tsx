import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import type { Project, Prd } from "@/lib/database";
import type { PrdFormData } from "@/hooks/usePRD";
import { PHASES, PHASE_LABELS, PROJECT_STATUSES } from "@/lib/database";

interface PRDEditorProps {
  project: Project;
  prd: Prd | null;
  saving: boolean;
  savedAt: Date | null;
  onSave: (data: PrdFormData) => Promise<void>;
}

const INPUT_CLASS =
  "w-full bg-[#1A1A1A] border border-[rgba(139,0,0,0.25)] rounded px-3 py-2 text-[#F0F0F0] text-sm focus:outline-none focus:border-[#C41E3A] transition-colors";
const LABEL_CLASS =
  "block text-xs font-mono text-[#666666] mb-1 uppercase tracking-wider";

export function PRDEditor({
  project,
  prd,
  saving,
  savedAt,
  onSave,
}: PRDEditorProps) {
  const [name, setName] = useState(project.name);
  const [stack, setStack] = useState(project.stack ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [figmaUrl, setFigmaUrl] = useState(project.figma_url ?? "");
  const [repoUrl, setRepoUrl] = useState(project.repo_url ?? "");
  const [phase, setPhase] = useState(project.phase);
  const [status, setStatus] = useState(project.status);
  const [prdTitle, setPrdTitle] = useState(prd?.title ?? "");
  const [prdContent, setPrdContent] = useState(prd?.content ?? "");

  // Sync form saat project atau PRD ganti (termasuk async load PRD)
  useEffect(() => {
    setName(project.name);
    setStack(project.stack ?? "");
    setDescription(project.description ?? "");
    setFigmaUrl(project.figma_url ?? "");
    setRepoUrl(project.repo_url ?? "");
    setPhase(project.phase);
    setStatus(project.status);
    setPrdTitle(prd?.title ?? "");
    setPrdContent(prd?.content ?? "");
  }, [project.id, prd?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: name.trim() || project.name,
      stack: stack.trim() || null,
      description: description.trim() || null,
      figma_url: figmaUrl.trim() || null,
      repo_url: repoUrl.trim() || null,
      phase,
      status,
      prd_title: prdTitle.trim() || project.name,
      prd_content: prdContent.trim() || null,
    });
  };

  const savedLabel = savedAt
    ? `Tersimpan ${savedAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : null;

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[rgba(139,0,0,0.25)] px-6 py-3">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#666666]">
          PRD Editor
        </h2>
        <div className="flex items-center gap-3">
          {savedLabel && (
            <span className="font-mono text-[11px] text-[#86c55d]">{savedLabel}</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#8B0000] px-3 py-1.5 text-xs font-mono text-white transition-colors hover:bg-[#C41E3A] disabled:opacity-50"
          >
            <Save size={12} />
            {saving ? "Menyimpan..." : "Save"}
          </button>
        </div>
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {/* Project Name */}
        <div>
          <label className={LABEL_CLASS}>Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Nama project"
          />
        </div>

        {/* PRD Title */}
        <div>
          <label className={LABEL_CLASS}>Judul PRD</label>
          <input
            type="text"
            value={prdTitle}
            onChange={(e) => setPrdTitle(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Contoh: Forge v1.0 — Product Requirements Document"
          />
        </div>

        {/* Stack + Phase */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Tech Stack</label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Next.js, Tauri, SQLite"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Phase</label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as Phase)}
              className={INPUT_CLASS}
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {PHASE_LABELS[p as Phase]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status + Figma URL */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className={INPUT_CLASS}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Figma URL</label>
            <input
              type="text"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              className={INPUT_CLASS}
              placeholder="https://figma.com/..."
            />
          </div>
        </div>

        {/* Repo URL */}
        <div>
          <label className={LABEL_CLASS}>Repo URL</label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className={INPUT_CLASS}
            placeholder="https://github.com/..."
          />
        </div>

        {/* Description */}
        <div>
          <label className={LABEL_CLASS}>Deskripsi Project</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${INPUT_CLASS} h-20 resize-none`}
            placeholder="Deskripsi singkat tentang project ini..."
          />
        </div>

        {/* PRD Content */}
        <div>
          <label className={LABEL_CLASS}>Konten PRD</label>
          <textarea
            value={prdContent}
            onChange={(e) => setPrdContent(e.target.value)}
            className={`${INPUT_CLASS} h-64 resize-none`}
            placeholder={
              "Tulis PRD di sini...\n\n## Overview\n## Goals\n## Features\n## Technical Requirements"
            }
          />
        </div>
      </div>
    </form>
  );
}

// Type aliases untuk dipakai di JSX tanpa import ganda
type Phase = import("@/lib/database").Phase;
type ProjectStatus = import("@/lib/database").ProjectStatus;
