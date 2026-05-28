# Session Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Session Log placeholder page with a fully functional timeline of work sessions — supporting create, edit, delete, expand-to-detail, and filter by project.

**Architecture:** A `useSession` hook owns all state and data access (sessions + projects), passing filtered sessions and project list to the page. The page manages modal state and delegates rendering to `SessionCard` (expandable timeline item) and `SessionForm` (create/edit modal). Client-side project filter mirrors the tool-filter pattern from Prompt Vault.

**Tech Stack:** Tauri v2 + Next.js Pages Router (static export) + TypeScript strict + Tailwind CSS v4 + SQLite via `@tauri-apps/plugin-sql` (`SessionRepo`, `ProjectRepo` from `@/lib/database`).

---

## Codebase Context (read before touching anything)

**Existing repos (do NOT modify):**

`lib/database/repositories/session.repo.ts`:
- `SessionRepo.getAll()` → `Session[]` ordered by `started_at DESC`
- `SessionRepo.getByProject(projectId)` → `Session[]`
- `SessionRepo.getById(id)` → `Session | null`
- `SessionRepo.create(data: CreateSession)` → `Session`
- `SessionRepo.update(id, data: UpdateSession)` → `Session | null` — SQL updates: `title, summary, decisions, next_steps, duration, ended_at` (NOT `project_id` or `started_at`)
- `SessionRepo.delete(id)` → `void`

`lib/database/repositories/project.repo.ts`:
- `ProjectRepo.getAll()` → `Project[]` ordered by `updated_at DESC`

**Types (`lib/database/types.ts`):**
```typescript
interface Session {
  id: string;
  project_id: string | null;
  title: string;
  summary: string | null;
  decisions: string | null;
  next_steps: string | null;
  duration: number | null;    // minutes
  started_at: string;         // ISO string
  ended_at: string | null;
  created_at: string;
}
type CreateSession = Omit<Session, "id" | "created_at">;
// = { project_id, title, summary, decisions, next_steps, duration, started_at, ended_at }

type UpdateSession = Partial<Omit<CreateSession, "started_at">>;
// = { project_id?, title?, summary?, decisions?, next_steps?, duration?, ended_at? }
// Note: even though project_id is in the type, the repo SQL does NOT update it.

interface Project { id: string; name: string; /* ...other fields */ }
```

**Barrel export `lib/database/index.ts`** — already exports `SessionRepo`, `ProjectRepo`, `Session`, `CreateSession`, `UpdateSession`, `Project`.

**Design tokens** (use these classes, no hardcoded colors unless in Tailwind opacity notation):
- `bg-[#0A0A0A]` — page background
- `bg-[#111111]` — card/surface
- `border-[rgba(139,0,0,0.25)]` — default border
- `text-[#F0F0F0]` — primary text
- `text-[#666666]` — muted label
- `text-[#444444]` — footer/meta text
- `text-[#AAAAAA]` — expanded body text
- `text-[#C41E3A]` — accent/crimson
- `bg-[#8B0000]` — primary button
- `hover:bg-[#C41E3A]` — primary button hover
- `hover:shadow-[0_0_8px_rgba(139,0,0,0.25)]` — card hover shadow
- Font: `font-mono` for all labels, timestamps, code-style text

**Pattern: optimistic delete** (from `usePrompts.ts`):
```typescript
const deleteX = async (id: string) => {
  setError(null);
  setItems((prev) => prev.filter((x) => x.id !== id)); // optimistic first
  try {
    await Repo.delete(id);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Gagal hapus");
    await fetchItems(); // rollback on error
  }
};
```

**Pattern: `useEffect([initial?.id])`** (from `PromptForm.tsx`) — narrow dependency to re-run effect only when record identity changes, not on every re-render with reference change.

**Pattern: `type X = import("@/lib/database").X;`** — type alias at bottom of component file, not at top import.

**Pattern: `max-h-[90vh] overflow-y-auto`** on inner modal div to prevent content clipping on short viewports.

---

## File Structure

```
hooks/
└── useSession.ts                  — NEW (create): all session state, CRUD, project filter

components/sessions/
├── SessionCard.tsx                — NEW (create): expandable timeline card
└── SessionForm.tsx                — NEW (create): create/edit modal

pages/sessions/
└── index.tsx                      — REPLACE placeholder with full functional page
```

---

## Task 1: `hooks/useSession.ts`

**Files:**
- Create: `hooks/useSession.ts`

**What it does:**
- Loads all sessions from `SessionRepo.getAll()` + all projects from `ProjectRepo.getAll()` in parallel on mount
- `projectFilter` state: `string | "all"` (string = project id)
- `filteredSessions` computed: filter sessions by `project_id === projectFilter` (or all)
- `setError(null)` at start of every mutation (prevents stale error bar)
- Optimistic delete: remove from state first, rollback on DB error
- `createSession` and `updateSession` are non-optimistic (call repo then re-fetch)

- [ ] **Step 1: Create `hooks/useSession.ts`**

```typescript
import { useState, useEffect, useCallback } from "react";
import { SessionRepo, ProjectRepo } from "@/lib/database";
import type { Session, CreateSession, UpdateSession, Project } from "@/lib/database";

interface UseSessionReturn {
  filteredSessions: Session[];
  projects: Project[];
  projectFilter: string | "all";
  loading: boolean;
  error: string | null;
  setProjectFilter: (filter: string | "all") => void;
  createSession: (data: CreateSession) => Promise<void>;
  updateSession: (id: string, data: UpdateSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState<string | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (): Promise<void> => {
    try {
      const data = await SessionRepo.getAll();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sesi");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSessions(),
      ProjectRepo.getAll()
        .then(setProjects)
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [fetchSessions]);

  const createSession = async (data: CreateSession): Promise<void> => {
    setError(null);
    try {
      await SessionRepo.create(data);
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat sesi");
    }
  };

  const updateSession = async (id: string, data: UpdateSession): Promise<void> => {
    setError(null);
    try {
      await SessionRepo.update(id, data);
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update sesi");
    }
  };

  const deleteSession = async (id: string): Promise<void> => {
    setError(null);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await SessionRepo.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus sesi");
      await fetchSessions();
    }
  };

  const filteredSessions = sessions.filter(
    (s) => projectFilter === "all" || s.project_id === projectFilter,
  );

  return {
    filteredSessions,
    projects,
    projectFilter,
    loading,
    error,
    setProjectFilter,
    createSession,
    updateSession,
    deleteSession,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `d:\Forge-Lab\forge`:
```powershell
npx tsc --noEmit
```
Expected: no errors related to `hooks/useSession.ts`.

- [ ] **Step 3: Commit**

```powershell
git add hooks/useSession.ts
git commit -m "feat: add useSession hook — CRUD, project filter, optimistic delete"
```

---

## Task 2: `components/sessions/SessionCard.tsx`

**Files:**
- Create: `components/sessions/SessionCard.tsx`

**What it does:**
- Receives `session`, `projectName: string | null`, `onEdit`, `onDelete` as props
- Click on card body → toggle `expanded` state
- Collapsed view: title, duration badge (if any), project name (if any), timestamp, 2-line summary preview
- Expanded view: full summary + decisions + next_steps sections, separated by a border
- Hover: edit (pencil) + delete (trash) buttons in top-right, `stopPropagation` to avoid toggle
- `formatDuration(minutes)` helper: `null` → `null`; 45 → `"45m"`; 90 → `"1h 30m"`; 120 → `"2h"`
- `formatTimestamp(iso)` helper: `"29 Mei 2026 • 14:30"` — uses `id-ID` locale for short month
- No `useRef` needed (no setTimeout)
- Type alias `type Session = import("@/lib/database").Session` at bottom of file

- [ ] **Step 1: Create `components/sessions/SessionCard.tsx`**

```tsx
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface SessionCardProps {
  session: Session;
  projectName: string | null;
  onEdit: (session: Session) => void;
  onDelete: (id: string) => void;
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
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

      {/* Expand/collapse indicator */}
      <div className="flex justify-end pt-0.5">
        <span className="font-mono text-[9px] text-[#444444]">
          {expanded ? "▲ tutup" : "▼ detail"}
        </span>
      </div>
    </div>
  );
}

type Session = import("@/lib/database").Session;
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```
Expected: no errors related to `components/sessions/SessionCard.tsx`.

- [ ] **Step 3: Commit**

```powershell
git add components/sessions/SessionCard.tsx
git commit -m "feat: add SessionCard — expandable timeline card, duration badge, hover edit/delete"
```

---

## Task 3: `components/sessions/SessionForm.tsx`

**Files:**
- Create: `components/sessions/SessionForm.tsx`

**What it does:**
- Props: `initial: Session | null`, `projects: Project[]`, `onSubmit: (data: SessionFormData) => Promise<void>`, `onClose: () => void`
- Local `SessionFormData` interface (not `CreateSession`) — the page handles create vs update translation
- `useEffect([initial?.id])` syncs form fields when record identity changes
- Fields: title (required), project_id (select — "No project" option + project list), summary (textarea), decisions (textarea), next_steps (textarea), duration (number input, minutes)
- `started_at` is NOT a form field — set by page at submit time
- Submitting state to disable button during async
- `max-h-[90vh] overflow-y-auto` on inner modal div
- Type aliases at bottom of file (not imports)
- Backdrop click closes modal; inner div stopPropagation

- [ ] **Step 1: Create `components/sessions/SessionForm.tsx`**

```tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SessionFormData {
  title: string;
  project_id: string | null;
  summary: string | null;
  decisions: string | null;
  next_steps: string | null;
  duration: number | null;
}

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
    const durationNum = durationInput.trim()
      ? Number(durationInput.trim())
      : null;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        project_id: projectId,
        summary: summary.trim() || null,
        decisions: decisions.trim() || null,
        next_steps: nextSteps.trim() || null,
        duration: durationNum && durationNum > 0 ? durationNum : null,
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```
Expected: no errors related to `components/sessions/SessionForm.tsx`.

- [ ] **Step 3: Commit**

```powershell
git add components/sessions/SessionForm.tsx
git commit -m "feat: add SessionForm modal — create/edit with project select, duration input"
```

---

## Task 4: `pages/sessions/index.tsx`

**Files:**
- Modify: `pages/sessions/index.tsx` (REPLACE entire file — current content is a placeholder)

**What it does:**
- Uses `useSession` hook for all data + mutations
- Page header (matches other pages: "Session Log" + subtitle)
- Error bar (matches Prompt Vault pattern)
- Toolbar: project filter dropdown (left) + "+ New Session" button (right)
- Timeline list: `space-y-3` vertical list of `SessionCard`s (not a grid — sessions are a timeline)
- Each `SessionCard` receives `projectName` looked up from `projects` array by `session.project_id`
- Empty state message (different for "no sessions" vs "no sessions for this project")
- Modal management: `formOpen` boolean + `editTarget: Session | null`
- `handleFormSubmit`: for create → build `CreateSession` with `started_at: new Date().toISOString()` + `ended_at: null`; for update → call `updateSession` with extracted `UpdateSession` fields
- `handleDelete`: `window.confirm` guard before calling `deleteSession`

- [ ] **Step 1: Replace `pages/sessions/index.tsx`**

```tsx
import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { SessionCard } from "@/components/sessions/SessionCard";
import { SessionForm } from "@/components/sessions/SessionForm";

interface SessionFormData {
  title: string;
  project_id: string | null;
  summary: string | null;
  decisions: string | null;
  next_steps: string | null;
  duration: number | null;
}

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

type Session = import("@/lib/database").Session;
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```
Expected: no errors related to `pages/sessions/index.tsx`.

- [ ] **Step 3: Run dev build check**

```powershell
npx next build
```
Expected: `✓ Compiled successfully` (or similar — no TypeScript/build errors).

If `.next` cache causes issues:
```powershell
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npx next build
```

- [ ] **Step 4: Commit**

```powershell
git add pages/sessions/index.tsx
git commit -m "feat: Session Log page — timeline, project filter, CRUD modal, expand/collapse"
```

---

## Smoke Test Checklist

After all 4 tasks are committed, run:
```powershell
cd d:\Forge-Lab\forge
npx tauri dev
```

| Test | Expected |
|------|----------|
| Buka halaman Session Log | Empty state "Belum ada sesi" |
| Klik "+ New Session" | Modal terbuka dengan judul "New Session" |
| Isi title saja → "Add Session" | Sesi muncul di list, modal tutup |
| Isi title + semua field → "Add Session" | Sesi muncul di list dengan preview |
| Klik card | Detail expand — decisions + next_steps tampil |
| Klik card lagi | Collapse — kembali ke preview 2 baris |
| Buka modal lagi — isi duration 90 → tambah | Card menampilkan badge "1h 30m" |
| Hover card → klik Pencil | Edit modal terbuka dengan data existing |
| Edit title → "Save Changes" | Title terupdate di list |
| Hover card → klik Trash | Confirm dialog → sesi terhapus |
| Tambah 2 sesi — satu dengan project, satu tanpa | Keduanya tampil, sesi dengan project ada label project |
| Pilih project di dropdown filter | Hanya sesi untuk project itu tampil |
| Pilih "Semua Project" | Semua sesi tampil kembali |
| Pilih project di dropdown filter tanpa sesi | Empty state "Belum ada sesi untuk [project]" |

---

## Post-Implementation

Update `CHECKPOINT.md`:
1. Add `pages/sessions/index.tsx` to functional pages list (remove from placeholder)
2. Add Phase 7 section (selesai) with file structure
3. Update latest commit hash
4. Add smoke test checklist for Phase 7
5. Update Phase 7 Candidates section (remove Session Log, list what's next if known)

Update memory file `C:\Users\ASUS\.claude\projects\d--Forge-Lab\memory\project_forge.md`:
1. Add Phase 7 entry (SELESAI — commit hash)
2. Update "Pages masih placeholder" to remove `pages/sessions/index.tsx`
