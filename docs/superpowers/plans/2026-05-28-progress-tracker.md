# Progress Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buat Progress Tracker — halaman grid project cards dengan visual 6-fase pipeline per project yang bisa di-klik untuk update phase, plus status filter tabs dan status dropdown per card.

**Architecture:** Hook `useProgress` manage semua state dengan optimistic updates (UI update dulu, DB menyusul, rollback kalau gagal). `PipelineBar` adalah pure presentational component yang terima `phase` + `onPhaseClick`. `ProjectProgressCard` compose PipelineBar + status select. Page hanya orchestrate hook + components.

**Tech Stack:** Next.js Pages Router · TypeScript strict · Tailwind CSS v4 · lucide-react · `ProjectRepo` (existing)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `hooks/useProgress.ts` | State: projects, statusFilter, loading, error; optimistic updatePhase + updateStatus |
| Create | `components/progress/PipelineBar.tsx` | 6-phase horizontal bar, clickable pills, 3 visual states |
| Create | `components/progress/ProjectProgressCard.tsx` | Card: name, stack, status select dropdown, PipelineBar |
| Modify | `pages/progress/index.tsx` | Full page: header, filter tabs, 2-col grid, empty state |

---

## Task 1: Hook `hooks/useProgress.ts`

**Files:**
- Create: `hooks/useProgress.ts`

- [ ] **Step 1.1: Buat `hooks/useProgress.ts`**

```typescript
import { useState, useEffect, useCallback } from "react";
import { ProjectRepo } from "@/lib/database";
import type { Project } from "@/lib/database";
import type { Phase, ProjectStatus } from "@/lib/database";

interface UseProgressReturn {
  filteredProjects: Project[];
  statusFilter: ProjectStatus | "all";
  loading: boolean;
  error: string | null;
  setStatusFilter: (filter: ProjectStatus | "all") => void;
  updatePhase: (projectId: string, phase: Phase) => Promise<void>;
  updateStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
}

export function useProgress(): UseProgressReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (): Promise<void> => {
    try {
      const data = await ProjectRepo.getAll();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat projects");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProjects().finally(() => setLoading(false));
  }, [fetchProjects]);

  const updatePhase = async (projectId: string, phase: Phase): Promise<void> => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, phase } : p))
    );
    try {
      await ProjectRepo.update(projectId, { phase });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update phase");
      await fetchProjects();
    }
  };

  const updateStatus = async (projectId: string, status: ProjectStatus): Promise<void> => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status } : p))
    );
    try {
      await ProjectRepo.update(projectId, { status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update status");
      await fetchProjects();
    }
  };

  const filteredProjects =
    statusFilter === "all"
      ? projects
      : projects.filter((p) => p.status === statusFilter);

  return {
    filteredProjects,
    statusFilter,
    loading,
    error,
    setStatusFilter,
    updatePhase,
    updateStatus,
  };
}
```

- [ ] **Step 1.2: Build check**

```powershell
cd d:\Forge-Lab\forge
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 1.3: Commit**

```
git add hooks/useProgress.ts
git commit -m "feat: add useProgress hook — optimistic updatePhase + updateStatus"
```

---

## Task 2: `components/progress/PipelineBar.tsx`

**Files:**
- Create: `components/progress/PipelineBar.tsx` (directory `components/progress/` belum ada — buat otomatis)

- [ ] **Step 2.1: Buat `components/progress/PipelineBar.tsx`**

```tsx
import { PHASES, PHASE_LABELS } from "@/lib/database";
import type { Phase } from "@/lib/database";

interface PipelineBarProps {
  phase: Phase;
  onPhaseClick: (phase: Phase) => void;
}

export function PipelineBar({ phase, onPhaseClick }: PipelineBarProps) {
  const currentIndex = PHASES.indexOf(phase);

  return (
    <div className="flex items-center">
      {PHASES.map((p, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <button
            key={p}
            type="button"
            onClick={() => onPhaseClick(p)}
            title={`Set phase: ${PHASE_LABELS[p]}`}
            className={[
              "relative flex-1 px-1 py-1.5 text-center transition-all",
              "font-mono text-[9px] uppercase tracking-wider",
              "border-y border-r first:border-l first:rounded-l-[4px] last:rounded-r-[4px]",
              isCompleted
                ? "bg-[#8B0000] border-[#8B0000] text-white hover:bg-[#C41E3A] hover:border-[#C41E3A]"
                : isActive
                ? "bg-[rgba(139,0,0,0.15)] border-[#C41E3A] text-[#F0F0F0] shadow-[inset_0_0_8px_rgba(196,30,58,0.2)]"
                : "bg-[#111111] border-[rgba(139,0,0,0.2)] text-[#444444] hover:text-[#888888] hover:border-[rgba(139,0,0,0.35)]",
            ].join(" ")}
          >
            {PHASE_LABELS[p]}
          </button>
        );
      })}
    </div>
  );
}
```

**Visual spec:**
- Completed (i < currentIndex): `bg-[#8B0000]` solid maroon fill, white text
- Active (i === currentIndex): `bg-[rgba(139,0,0,0.15)]` with maroon border + inset glow, full text
- Upcoming (i > currentIndex): dark bg, muted text `#444444`
- Semua pill clickable → `onPhaseClick(p)`

- [ ] **Step 2.2: Build check**

```powershell
cd d:\Forge-Lab\forge
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 2.3: Commit**

```
git add components/progress/PipelineBar.tsx
git commit -m "feat: add PipelineBar component — clickable 6-phase pipeline"
```

---

## Task 3: `components/progress/ProjectProgressCard.tsx`

**Files:**
- Create: `components/progress/ProjectProgressCard.tsx`

- [ ] **Step 3.1: Buat `components/progress/ProjectProgressCard.tsx`**

```tsx
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
```

- [ ] **Step 3.2: Build check**

```powershell
cd d:\Forge-Lab\forge
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3.3: Commit**

```
git add components/progress/ProjectProgressCard.tsx
git commit -m "feat: add ProjectProgressCard — name, stack, status select, PipelineBar"
```

---

## Task 4: Page `pages/progress/index.tsx`

**Files:**
- Modify: `pages/progress/index.tsx`

- [ ] **Step 4.1: Replace `pages/progress/index.tsx` dengan full implementation**

```tsx
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
    <div className="space-y-4">
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
```

- [ ] **Step 4.2: Build check final**

```powershell
cd d:\Forge-Lab\forge
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4.3: Commit**

```
git add pages/progress/index.tsx
git commit -m "feat: Progress Tracker page — filter tabs, grid, optimistic updates"
```

---

## Self-Review — Spec Coverage

| Spec requirement | Task |
|---|---|
| Hook `useProgress` — load semua projects | Task 1 (`fetchProjects` → `ProjectRepo.getAll()`) |
| Hook — `updatePhase(projectId, phase)` | Task 1 (optimistic update + DB call) |
| Hook — `updateStatus(projectId, status)` | Task 1 (optimistic update + DB call) |
| Hook — filter by status | Task 1 (`filteredProjects` computed from `statusFilter`) |
| Hook — loading + error state | Task 1 |
| `PipelineBar` — 6 fase horizontal | Task 2 (iterates `PHASES` array) |
| `PipelineBar` — fase completed: filled maroon | Task 2 (`bg-[#8B0000]` for i < currentIndex) |
| `PipelineBar` — fase aktif: maroon border + glow | Task 2 (`border-[#C41E3A] shadow-[inset...]` for i === currentIndex) |
| `PipelineBar` — fase upcoming: muted | Task 2 (`text-[#444444]` for i > currentIndex) |
| `PipelineBar` — klik fase → trigger update | Task 2 (`onPhaseClick(p)` on button click) |
| `ProjectProgressCard` — nama project, stack | Task 3 |
| `ProjectProgressCard` — status badge (dropdown) | Task 3 (`<select>` with STATUS_STYLES) |
| `ProjectProgressCard` — PipelineBar di bawah | Task 3 |
| Page — header | Task 4 |
| Page — filter tabs status (All/Active/Paused/Completed) | Task 4 (`FILTER_TABS`) |
| Page — grid project cards | Task 4 (`grid-cols-1 sm:grid-cols-2`) |
| Page — empty state | Task 4 |
| Optimistic update | Task 1 (setProjects before DB call, rollback on error) |
| No `any` TypeScript | All tasks |
| Design system konsisten | All tasks (same colors, font-mono, border patterns) |
