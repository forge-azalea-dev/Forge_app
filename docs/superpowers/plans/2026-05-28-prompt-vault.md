# Prompt Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buat Prompt Vault — halaman grid prompt cards dengan filter per AI tool, search, CRUD modal form, dan copy-to-clipboard dengan `use_count` tracking.

**Architecture:** Hook `usePrompts` manages semua state + data access (load all, client-side filter + search). `PromptCard` menampilkan card clickable untuk copy. `PromptForm` adalah modal create/edit. Page orchestrates semua. `PromptRepo` sudah tersedia di `lib/database/` — tidak perlu modifikasi DB layer.

**Tech Stack:** Next.js Pages Router · TypeScript strict · Tailwind CSS v4 · lucide-react · `PromptRepo` (existing) · `navigator.clipboard.writeText()`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `hooks/usePrompts.ts` | State: prompts, toolFilter, searchQuery, loading, error; CRUD + copyPrompt (clipboard + incrementUseCount optimistic) |
| Create | `components/prompts/PromptCard.tsx` | Card: title, ai_tool badge, category, 2-line content preview, use_count, hover edit/delete, click-to-copy flash |
| Create | `components/prompts/PromptForm.tsx` | Modal: create/edit form — title, content textarea, ai_tool select, category |
| Modify | `pages/prompts/index.tsx` | Full page: search bar, filter tabs, 3-col grid, modal management, empty state |

---

## Task 1: Hook `hooks/usePrompts.ts`

**Files:**
- Create: `hooks/usePrompts.ts`

- [ ] **Step 1.1: Buat `hooks/usePrompts.ts`**

```typescript
import { useState, useEffect, useCallback } from "react";
import { PromptRepo } from "@/lib/database";
import type { Prompt, CreatePrompt, UpdatePrompt } from "@/lib/database";
import type { AiTool } from "@/lib/database";

interface UsePromptsReturn {
  filteredPrompts: Prompt[];
  toolFilter: AiTool | "all";
  searchQuery: string;
  loading: boolean;
  error: string | null;
  setToolFilter: (filter: AiTool | "all") => void;
  setSearchQuery: (query: string) => void;
  createPrompt: (data: CreatePrompt) => Promise<void>;
  updatePrompt: (id: string, data: UpdatePrompt) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  copyPrompt: (id: string) => Promise<void>;
}

export function usePrompts(): UsePromptsReturn {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [toolFilter, setToolFilter] = useState<AiTool | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async (): Promise<void> => {
    try {
      const data = await PromptRepo.getAll();
      setPrompts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat prompts");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPrompts().finally(() => setLoading(false));
  }, [fetchPrompts]);

  const createPrompt = async (data: CreatePrompt): Promise<void> => {
    try {
      await PromptRepo.create(data);
      await fetchPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat prompt");
    }
  };

  const updatePrompt = async (id: string, data: UpdatePrompt): Promise<void> => {
    try {
      await PromptRepo.update(id, data);
      await fetchPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update prompt");
    }
  };

  const deletePrompt = async (id: string): Promise<void> => {
    try {
      await PromptRepo.delete(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus prompt");
    }
  };

  const copyPrompt = async (id: string): Promise<void> => {
    const prompt = prompts.find((p) => p.id === id);
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content);
      await PromptRepo.incrementUseCount(id);
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, use_count: p.use_count + 1, last_used: new Date().toISOString() }
            : p
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal copy prompt");
    }
  };

  const filteredPrompts = prompts.filter((p) => {
    const matchesTool = toolFilter === "all" || p.ai_tool === toolFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q);
    return matchesTool && matchesSearch;
  });

  return {
    filteredPrompts,
    toolFilter,
    searchQuery,
    loading,
    error,
    setToolFilter,
    setSearchQuery,
    createPrompt,
    updatePrompt,
    deletePrompt,
    copyPrompt,
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
git add hooks/usePrompts.ts
git commit -m "feat: add usePrompts hook — CRUD, clipboard copy, client-side filter + search"
```

---

## Task 2: `components/prompts/PromptCard.tsx`

**Files:**
- Create: `components/prompts/PromptCard.tsx` (directory `components/prompts/` — buat baru)

- [ ] **Step 2.1: Buat `components/prompts/PromptCard.tsx`**

```tsx
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Prompt } from "@/lib/database";

interface PromptCardProps {
  prompt: Prompt;
  onCopy: (id: string) => Promise<void>;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
}

const TOOL_BADGE: Record<string, string> = {
  claude:   "bg-[rgba(196,30,58,0.15)] text-[#C41E3A] border-[rgba(196,30,58,0.3)]",
  chatgpt:  "bg-[rgba(16,163,127,0.12)] text-[#10A37F] border-[rgba(16,163,127,0.3)]",
  ideogram: "bg-[rgba(99,102,241,0.12)] text-[#6366F1] border-[rgba(99,102,241,0.3)]",
  stitch:   "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]",
  cursor:   "bg-[rgba(59,130,246,0.12)] text-[#3B82F6] border-[rgba(59,130,246,0.3)]",
  custom:   "bg-[rgba(102,102,102,0.1)] text-[#666666] border-[rgba(102,102,102,0.25)]",
};

export function PromptCard({ prompt, onCopy, onEdit, onDelete }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCardClick = async () => {
    await onCopy(prompt.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lastUsedLabel = prompt.last_used
    ? new Date(prompt.last_used).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Belum pernah";

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer rounded-[6px] border border-[rgba(139,0,0,0.25)] bg-[#111111] px-4 py-4 space-y-2 transition-shadow hover:shadow-[0_0_8px_rgba(139,0,0,0.25)] select-none"
    >
      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
          className="p-1.5 rounded text-[#666666] hover:text-[#F0F0F0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          title="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
          className="p-1.5 rounded text-[#666666] hover:text-[#C41E3A] hover:bg-[rgba(139,0,0,0.1)] transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Title + tool badge */}
      <div className="flex items-start gap-2 pr-16">
        <p className="flex-1 truncate font-mono text-sm font-semibold text-[#F0F0F0]">
          {prompt.title}
        </p>
        <span
          className={`shrink-0 rounded-[3px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
            TOOL_BADGE[prompt.ai_tool] ?? TOOL_BADGE.custom
          }`}
        >
          {prompt.ai_tool}
        </span>
      </div>

      {/* Category */}
      {prompt.category && (
        <p className="font-mono text-[10px] text-[#555555]">{prompt.category}</p>
      )}

      {/* Content preview — 2 lines */}
      <p className="font-mono text-[11px] text-[#666666] line-clamp-2 leading-relaxed">
        {prompt.content}
      </p>

      {/* Footer: use_count + last_used */}
      <div className="flex items-center justify-between pt-1">
        <span className="font-mono text-[10px] text-[#444444]">
          ×{prompt.use_count} used
        </span>
        <span className="font-mono text-[10px] text-[#444444]">
          {lastUsedLabel}
        </span>
      </div>

      {/* Copied flash overlay */}
      {copied && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[6px] bg-[rgba(139,0,0,0.15)] backdrop-blur-[1px]">
          <span className="font-mono text-xs font-semibold text-[#C41E3A] uppercase tracking-widest">
            Copied!
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2.2: Build check**

```powershell
cd d:\Forge-Lab\forge
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 2.3: Commit**

```
git add components/prompts/PromptCard.tsx
git commit -m "feat: add PromptCard — tool badge, content preview, copy flash, hover edit/delete"
```

---

## Task 3: `components/prompts/PromptForm.tsx`

**Files:**
- Create: `components/prompts/PromptForm.tsx`

- [ ] **Step 3.1: Buat `components/prompts/PromptForm.tsx`**

```tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AI_TOOLS } from "@/lib/database";
import type { Prompt, CreatePrompt } from "@/lib/database";

interface PromptFormProps {
  initial: Prompt | null;
  onSubmit: (data: CreatePrompt) => Promise<void>;
  onClose: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  ideogram: "Ideogram",
  stitch: "Stitch",
  cursor: "Cursor",
  custom: "Custom",
};

export function PromptForm({ initial, onSubmit, onClose }: PromptFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [aiTool, setAiTool] = useState<AiTool>("claude");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setContent(initial.content);
      setAiTool(initial.ai_tool);
      setCategory(initial.category ?? "");
    } else {
      setTitle("");
      setContent("");
      setAiTool("claude");
      setCategory("");
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        ai_tool: aiTool,
        category: category.trim() || null,
        tags: null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[8px] border border-[rgba(139,0,0,0.3)] bg-[#111111] px-6 py-5 shadow-[0_0_24px_rgba(139,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.15em] text-[#F0F0F0]">
            {initial ? "Edit Prompt" : "New Prompt"}
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
              placeholder="Nama prompt..."
              required
              className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-[#F0F0F0] placeholder-[#444444] outline-none focus:border-[#C41E3A] transition-colors"
            />
          </div>

          {/* AI Tool + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                AI Tool
              </label>
              <select
                value={aiTool}
                onChange={(e) => setAiTool(e.target.value as AiTool)}
                className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-[#F0F0F0] outline-none focus:border-[#C41E3A] transition-colors"
              >
                {AI_TOOLS.map((t) => (
                  <option key={t} value={t} className="bg-[#111111]">
                    {TOOL_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Opsional..."
                className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-[#F0F0F0] placeholder-[#444444] outline-none focus:border-[#C41E3A] transition-colors"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Isi prompt..."
              required
              rows={8}
              className="w-full resize-none rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-[#F0F0F0] placeholder-[#444444] outline-none focus:border-[#C41E3A] transition-colors leading-relaxed"
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
              disabled={submitting || !title.trim() || !content.trim()}
              className="rounded-[4px] bg-[#8B0000] px-4 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[#C41E3A] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving..." : initial ? "Save Changes" : "Add Prompt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type AiTool = import("@/lib/database").AiTool;
```

- [ ] **Step 3.2: Build check**

```powershell
cd d:\Forge-Lab\forge
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3.3: Commit**

```
git add components/prompts/PromptForm.tsx
git commit -m "feat: add PromptForm modal — create/edit prompt, AI tool select"
```

---

## Task 4: Page `pages/prompts/index.tsx`

**Files:**
- Modify: `pages/prompts/index.tsx`

- [ ] **Step 4.1: Replace `pages/prompts/index.tsx` dengan full implementation**

```tsx
import { useState } from "react";
import { usePrompts } from "@/hooks/usePrompts";
import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptForm } from "@/components/prompts/PromptForm";
import { AI_TOOLS } from "@/lib/database";
import type { Prompt, CreatePrompt } from "@/lib/database";

type AiToolFilter = import("@/lib/database").AiTool | "all";

const TOOL_LABELS: Record<string, string> = {
  all: "All",
  claude: "Claude",
  chatgpt: "ChatGPT",
  ideogram: "Ideogram",
  stitch: "Stitch",
  cursor: "Cursor",
  custom: "Custom",
};

const FILTER_TABS: AiToolFilter[] = ["all", ...AI_TOOLS];

export default function PromptVaultPage() {
  const {
    filteredPrompts,
    toolFilter,
    searchQuery,
    loading,
    error,
    setToolFilter,
    setSearchQuery,
    createPrompt,
    updatePrompt,
    deletePrompt,
    copyPrompt,
  } = usePrompts();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Prompt | null>(null);

  const handleAddClick = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEditClick = (prompt: Prompt) => {
    setEditTarget(prompt);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleFormSubmit = async (data: CreatePrompt) => {
    if (editTarget) {
      await updatePrompt(editTarget.id, data);
    } else {
      await createPrompt(data);
    }
    handleFormClose();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus prompt ini?")) return;
    await deletePrompt(id);
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Prompt Vault
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Library prompt per AI tool.
        </p>
      </div>

      {/* Error bar */}
      {error && (
        <div className="rounded-[6px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-4 py-2">
          <p className="font-mono text-xs text-[#C41E3A]">{error}</p>
        </div>
      )}

      {/* Toolbar: search + add button */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari prompt..."
          className="flex-1 rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] placeholder-[#444444] outline-none focus:border-[#C41E3A] transition-colors"
        />
        <button
          type="button"
          onClick={handleAddClick}
          className="shrink-0 rounded-[4px] border border-[rgba(139,0,0,0.3)] bg-[#111111] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] hover:bg-[rgba(139,0,0,0.15)] hover:border-[#C41E3A] transition-colors"
        >
          + Add Prompt
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[rgba(139,0,0,0.2)]">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setToolFilter(tab)}
            className={`px-3 py-1.5 font-mono text-xs transition-colors ${
              toolFilter === tab
                ? "border-b-2 border-[#C41E3A] text-[#F0F0F0]"
                : "text-[#666666] hover:text-[#AAAAAA]"
            }`}
          >
            {TOOL_LABELS[tab] ?? tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center">
          <span className="font-mono text-[11px] text-[#666666]">Memuat...</span>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#666666]">
            {searchQuery
              ? "Tidak ada prompt yang cocok"
              : toolFilter === "all"
              ? "Belum ada prompt"
              : `Belum ada prompt untuk ${TOOL_LABELS[toolFilter] ?? toolFilter}`}
          </p>
          {!searchQuery && (
            <p className="mt-1 text-xs text-[#444444]">
              Klik &quot;+ Add Prompt&quot; untuk menambahkan.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onCopy={copyPrompt}
              onEdit={handleEditClick}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal form */}
      {formOpen && (
        <PromptForm
          initial={editTarget}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4.2: Build check final**

```powershell
cd d:\Forge-Lab\forge
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4.3: Commit**

```
git add pages/prompts/index.tsx
git commit -m "feat: Prompt Vault page — search, filter tabs, grid, copy clipboard, CRUD modal"
```

---

## Self-Review — Spec Coverage

| Spec requirement | Task |
|---|---|
| Grid prompt cards | Task 4 (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) |
| Filter tabs All + 6 AI tools | Task 4 (`FILTER_TABS = ["all", ...AI_TOOLS]`) |
| Search by title/content | Task 1 (client-side filter `p.title.includes(q) OR p.content.includes(q)`) |
| "+ Add Prompt" tombol → modal | Task 4 (`handleAddClick` → `setFormOpen(true)`) |
| Klik card → copy clipboard | Task 1 (`copyPrompt` → `navigator.clipboard.writeText`) |
| Increment use_count setelah copy | Task 1 (`PromptRepo.incrementUseCount` + optimistic state update) |
| "Copied!" flash feedback | Task 2 (local `copied` state, 1500ms timeout, overlay) |
| Hover → edit + delete tombol | Task 2 (`group` + `opacity-0 group-hover:opacity-100`) |
| Edit per card → modal prefilled | Task 3 (`useEffect([initial])` sync) + Task 4 (`handleEditClick`) |
| Delete per card | Task 2 (Trash2 button) + Task 4 (`handleDelete` + `window.confirm`) |
| PromptForm fields: title, content, ai_tool, category | Task 3 |
| PromptForm create vs edit mode | Task 3 (`initial` prop: null=create, Prompt=edit) |
| AI tool badge warna berbeda per tool | Task 2 (`TOOL_BADGE` record) |
| Preview content 2 baris truncated | Task 2 (`line-clamp-2`) |
| use_count + last_used display | Task 2 (footer row) |
| Empty state per tool | Task 4 (dynamic message berdasarkan `toolFilter` + `searchQuery`) |
| `navigator.clipboard.writeText()` | Task 1 (`copyPrompt`) |
| No `any` TypeScript | All tasks |
| Design system konsisten | All tasks (same colors, font-mono, border patterns) |
| AI tool badge colors sesuai spec | Task 2 (claude=#C41E3A, chatgpt=#10A37F, ideogram=#6366F1, stitch=#F59E0B, cursor=#3B82F6, custom=#666666) |
