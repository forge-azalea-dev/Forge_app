# PRD Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buat PRD Manager — split-panel page dengan project list di kiri dan PRD editor di kanan, CRUD lengkap.

**Architecture:** Semua data via existing repos (`ProjectRepo`) + new `PrdRepo`. Hook `usePRD` manage state terpusat. `PrdRepo.upsert` handle create-or-update untuk 1 PRD per project. `PRDEditor` sync form via `useEffect([project.id, prd?.id])` agar reset bersih saat ganti project.

**Tech Stack:** Next.js Pages Router · TypeScript strict · Tailwind CSS v4 · lucide-react · `ProjectRepo` + new `PrdRepo`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `lib/database/types.ts` | Tambah `CreatePrd`, `UpdatePrd` types |
| Create | `lib/database/repositories/prd.repo.ts` | `getByProject`, `upsert`, `delete` |
| Modify | `lib/database/index.ts` | Export `PrdRepo`, `CreatePrd`, `UpdatePrd` |
| Create | `hooks/usePRD.ts` | State: projects, selectedProject, activePrd, saveAll |
| Create | `components/prd/ProjectList.tsx` | Left panel — list, add inline, delete |
| Create | `components/prd/PRDEditor.tsx` | Right panel — form edit project + PRD content |
| Modify | `pages/prd/index.tsx` | Split layout: ProjectList + PRDEditor |

---

## Task 1: PrdRepo + Types + Index Export

**Files:**
- Modify: `lib/database/types.ts`
- Create: `lib/database/repositories/prd.repo.ts`
- Modify: `lib/database/index.ts`

- [ ] **Step 1.1: Tambah `CreatePrd` dan `UpdatePrd` di `lib/database/types.ts`**

Append ke bawah file (setelah `UpdateBilling`):

```typescript
export type CreatePrd = Omit<Prd, "id" | "created_at" | "updated_at">;
export type UpdatePrd = Partial<Omit<CreatePrd, "project_id">>;
```

- [ ] **Step 1.2: Buat `lib/database/repositories/prd.repo.ts`**

```typescript
// === FILE: lib/database/repositories/prd.repo.ts ===
import { getDb, generateId, now } from "../db";
import type { Prd } from "../types";

export const PrdRepo = {
  async getByProject(project_id: string): Promise<Prd | null> {
    const db = await getDb();
    const results = await db.select<Prd[]>(
      "SELECT * FROM prds WHERE project_id = $1 ORDER BY created_at ASC LIMIT 1",
      [project_id]
    );
    return results[0] ?? null;
  },

  async upsert(
    project_id: string,
    data: { title: string; content: string | null }
  ): Promise<Prd> {
    const existing = await this.getByProject(project_id);

    if (existing) {
      const db = await getDb();
      await db.execute(
        "UPDATE prds SET title=$1, content=$2, updated_at=$3 WHERE id=$4",
        [data.title, data.content, now(), existing.id]
      );
      return (await this.getByProject(project_id))!;
    }

    const db = await getDb();
    const id = generateId();
    const timestamp = now();
    await db.execute(
      `INSERT INTO prds (id, project_id, title, content, version, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, project_id, data.title, data.content, "1.0", timestamp, timestamp]
    );
    return (await this.getByProject(project_id))!;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM prds WHERE id = $1", [id]);
  },
};
```

- [ ] **Step 1.3: Update `lib/database/index.ts` — tambah PrdRepo + types**

Replace seluruh file:

```typescript
// === FILE: lib/database/index.ts ===
export { getDb, generateId, now, seedInitialData } from "./db";
export {
  SCHEMA_SQL,
  PHASES,
  PHASE_LABELS,
  AI_TOOLS,
  BILLING_CYCLES,
  PROJECT_STATUSES,
  BILLING_STATUSES,
} from "./schema";
export type {
  Phase,
  AiTool,
  BillingCycle,
  ProjectStatus,
  BillingStatus,
} from "./schema";
export type {
  Project,
  Prd,
  Prompt,
  Session,
  Billing,
  CreateProject,
  UpdateProject,
  CreatePrd,
  UpdatePrd,
  CreatePrompt,
  UpdatePrompt,
  CreateSession,
  UpdateSession,
  CreateBilling,
  UpdateBilling,
} from "./types";
export { ProjectRepo } from "./repositories/project.repo";
export { PrdRepo } from "./repositories/prd.repo";
export { PromptRepo } from "./repositories/prompt.repo";
export { SessionRepo } from "./repositories/session.repo";
export { BillingRepo } from "./repositories/billing.repo";
```

- [ ] **Step 1.4: Build check**

```powershell
cd d:\Forge-Lab\forge
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 1.5: Commit**

```bash
git add lib/database/types.ts lib/database/repositories/prd.repo.ts lib/database/index.ts
git commit -m "feat: add PrdRepo with upsert, update types + index export"
```

---

## Task 2: Hook `hooks/usePRD.ts`

**Files:**
- Create: `hooks/usePRD.ts`

- [ ] **Step 2.1: Buat `hooks/usePRD.ts`**

```typescript
// === FILE: hooks/usePRD.ts ===
import { useState, useEffect, useCallback } from "react";
import { ProjectRepo, PrdRepo } from "@/lib/database";
import type { Project, Prd } from "@/lib/database";
import type { Phase, ProjectStatus } from "@/lib/database";

export interface PrdFormData {
  name: string;
  stack: string | null;
  description: string | null;
  figma_url: string | null;
  repo_url: string | null;
  phase: Phase;
  status: ProjectStatus;
  prd_title: string;
  prd_content: string | null;
}

interface UsePRDReturn {
  projects: Project[];
  selectedProjectId: string | null;
  selectedProject: Project | null;
  activePrd: Prd | null;
  loading: boolean;
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
  selectProject: (id: string) => void;
  createProject: (name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveAll: (data: PrdFormData) => Promise<void>;
}

export function usePRD(): UsePRDReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activePrd, setActivePrd] = useState<Prd | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    try {
      const data = await ProjectRepo.getAll();
      setProjects(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat projects");
      return [];
    }
  }, []);

  // Initial load — auto-select first project
  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then((data) => {
        if (data.length > 0) {
          setSelectedProjectId((current) => current ?? data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [fetchProjects]);

  // Load PRD setiap kali selected project berubah
  useEffect(() => {
    if (!selectedProjectId) {
      setActivePrd(null);
      return;
    }
    PrdRepo.getByProject(selectedProjectId)
      .then(setActivePrd)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat PRD");
      });
  }, [selectedProjectId]);

  const selectProject = (id: string) => {
    setSelectedProjectId(id);
    setSavedAt(null);
  };

  const createProject = async (name: string): Promise<void> => {
    try {
      setError(null);
      const project = await ProjectRepo.create({
        name,
        description: null,
        stack: null,
        phase: "prd",
        status: "active",
        figma_url: null,
        repo_url: null,
      });
      await fetchProjects();
      setSelectedProjectId(project.id);
      setSavedAt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat project");
      throw err;
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    try {
      setError(null);
      await ProjectRepo.delete(id);
      const updated = await fetchProjects();
      if (selectedProjectId === id) {
        const next = updated.find((p) => p.id !== id) ?? null;
        setSelectedProjectId(next?.id ?? null);
        setActivePrd(null);
        setSavedAt(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus project");
      throw err;
    }
  };

  const saveAll = async (data: PrdFormData): Promise<void> => {
    if (!selectedProjectId) return;
    try {
      setSaving(true);
      setError(null);
      await ProjectRepo.update(selectedProjectId, {
        name: data.name,
        description: data.description,
        stack: data.stack,
        figma_url: data.figma_url,
        repo_url: data.repo_url,
        phase: data.phase,
        status: data.status,
      });
      const prd = await PrdRepo.upsert(selectedProjectId, {
        title: data.prd_title,
        content: data.prd_content,
      });
      setActivePrd(prd);
      await fetchProjects();
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  return {
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
  };
}
```

- [ ] **Step 2.2: Build check**

```powershell
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 2.3: Commit**

```bash
git add hooks/usePRD.ts
git commit -m "feat: add usePRD hook — project + PRD state management"
```

---

## Task 3: `components/prd/ProjectList.tsx`

**Files:**
- Create: `components/prd/ProjectList.tsx`

- [ ] **Step 3.1: Buat `components/prd/ProjectList.tsx`**

```tsx
// === FILE: components/prd/ProjectList.tsx ===
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
```

- [ ] **Step 3.2: Build check**

```powershell
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3.3: Commit**

```bash
git add components/prd/ProjectList.tsx
git commit -m "feat: add ProjectList component — inline add, hover delete"
```

---

## Task 4: `components/prd/PRDEditor.tsx`

**Files:**
- Create: `components/prd/PRDEditor.tsx`

- [ ] **Step 4.1: Buat `components/prd/PRDEditor.tsx`**

```tsx
// === FILE: components/prd/PRDEditor.tsx ===
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
                  {PHASE_LABELS[p]}
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
```

- [ ] **Step 4.2: Build check**

```powershell
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4.3: Commit**

```bash
git add components/prd/PRDEditor.tsx
git commit -m "feat: add PRDEditor component — project + PRD form with save feedback"
```

---

## Task 5: Page `pages/prd/index.tsx`

**Files:**
- Modify: `pages/prd/index.tsx`

- [ ] **Step 5.1: Replace `pages/prd/index.tsx` dengan full implementation**

```tsx
// === FILE: pages/prd/index.tsx ===
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
```

**Catatan `key={selectedProject.id}`:** Ini memaksa PRDEditor remount saat project ganti, memastikan local state form bersih. PRD content akan sync via `useEffect([project.id, prd?.id])` di dalam PRDEditor.

- [ ] **Step 5.2: Build check final**

```powershell
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5.3: Commit**

```bash
git add pages/prd/index.tsx
git commit -m "feat: PRD Manager page — split panel, project list + PRD editor"
```

---

## Self-Review — Spec Coverage

| Spec requirement | Task |
|---|---|
| Hook `usePRD` — getAll, create, update, delete projects | Task 2 |
| Hook `usePRD` — getPrdByProject, savePrd | Task 2 (`saveAll` calls `PrdRepo.upsert`) |
| Hook — loading + error state | Task 2 |
| `ProjectList` — list, active state, add/delete | Task 3 |
| `PRDEditor` — form: judul, stack, deskripsi, konten PRD, figma_url, repo_url, phase, status | Task 4 |
| `PRDEditor` — Save button | Task 4 |
| `PRDEditor` — "Tersimpan" indicator setelah sukses | Task 4 (`savedLabel`) |
| Page — split layout kiri/kanan | Task 5 |
| Page — auto-select project pertama | Task 2 (`current ?? data[0].id`) |
| Page — empty state kalau belum ada project | Task 5 |
| Page — "+ New Project" | Task 3 (via `+` button di ProjectList header) |
| Semua DB call dalam try/catch | Task 2 (semua method di `usePRD`) |
| No `any` TypeScript | All tasks |
| Design system konsisten dengan Billing | All tasks (same CSS vars + class patterns) |
