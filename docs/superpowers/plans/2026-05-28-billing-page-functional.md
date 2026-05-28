# Billing Page Functional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Billing UI to SQLite database via BillingRepo — CRUD lengkap dengan search, filter, seed data awal.

**Architecture:** Pages Router (static export) — semua logic client-side. Data via `BillingRepo` dari `lib/database`. State di-manage custom hook `useBilling`. No Server Components, no API routes.

**Tech Stack:** Next.js Pages Router · TypeScript strict · Tailwind CSS v4 · lucide-react v1.16 · `@tauri-apps/plugin-sql` via BillingRepo

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `lib/database/db.ts` | Tambah `seedInitialData()` |
| Modify | `pages/_app.tsx` | Panggil `seedInitialData()` setelah `getDb()` |
| Create | `hooks/useBilling.ts` | State + CRUD + search/filter logic |
| Create | `components/billing/BillingCard.tsx` | Satu card per subscription |
| Create | `components/billing/BillingForm.tsx` | Modal form create/edit |
| Modify | `pages/billing/index.tsx` | Full functional page, ganti placeholder |

---

## Task 1: Seed Data — `lib/database/db.ts` + `pages/_app.tsx`

**Files:**
- Modify: `lib/database/db.ts`
- Modify: `pages/_app.tsx`

- [ ] **Step 1.1: Tambah `seedInitialData` di `lib/database/db.ts`**

```typescript
// === FILE: lib/database/db.ts ===
import Database from "@tauri-apps/plugin-sql";
import { SCHEMA_SQL } from "./schema";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const db = await Database.load("sqlite:forge.db");
  await initSchema(db);
  dbInstance = db;
  return db;
}

async function initSchema(db: Database): Promise<void> {
  const statements = SCHEMA_SQL.split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await db.execute(`${statement};`);
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export async function seedInitialData(): Promise<void> {
  const db = await getDb();
  const existing = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM billing"
  );
  if (existing[0].count > 0) return;

  const { BillingRepo } = await import("./repositories/billing.repo");
  await BillingRepo.create({
    name: "Claude Pro",
    description: "Anthropic Claude AI - Pro Plan",
    amount: 20,
    currency: "USD",
    cycle: "monthly",
    billing_date: 1,
    next_billing: null,
    status: "active",
    category: "AI Tools",
    url: "https://claude.ai",
    notes: null,
  });
}
```

- [ ] **Step 1.2: Update `pages/_app.tsx` — panggil `seedInitialData` setelah DB init**

```typescript
// === FILE: pages/_app.tsx ===
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { getDb, seedInitialData } from "@/lib/database";

type AppComponentWithLayout = AppProps["Component"] & {
  noLayout?: boolean;
};

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    getDb()
      .then(() => seedInitialData())
      .catch((error: unknown) => {
        console.error("Database initialization failed", error);
      });
  }, []);

  const PageComponent = Component as AppComponentWithLayout;

  if (PageComponent.noLayout) {
    return <PageComponent {...pageProps} />;
  }

  return (
    <Layout>
      <PageComponent {...pageProps} />
    </Layout>
  );
}
```

- [ ] **Step 1.3: Update `lib/database/index.ts` — export `seedInitialData`**

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
  CreatePrompt,
  UpdatePrompt,
  CreateSession,
  UpdateSession,
  CreateBilling,
  UpdateBilling,
} from "./types";
export { ProjectRepo } from "./repositories/project.repo";
export { PromptRepo } from "./repositories/prompt.repo";
export { SessionRepo } from "./repositories/session.repo";
export { BillingRepo } from "./repositories/billing.repo";
```

- [ ] **Step 1.4: Build check**

```powershell
cd d:\Forge-Lab\forge
npm run build
```

Expected: `✓ Compiled successfully` — no TypeScript errors.

- [ ] **Step 1.5: Commit**

```bash
git add lib/database/db.ts lib/database/index.ts pages/_app.tsx
git commit -m "feat: add seedInitialData for Claude Pro default entry"
```

---

## Task 2: Custom Hook — `hooks/useBilling.ts`

**Files:**
- Create: `hooks/useBilling.ts`

- [ ] **Step 2.1: Buat file `hooks/useBilling.ts`**

```typescript
// === FILE: hooks/useBilling.ts ===
import { useState, useEffect, useCallback } from "react";
import { BillingRepo } from "@/lib/database";
import type { Billing, CreateBilling, UpdateBilling } from "@/lib/database";
import type { BillingStatus } from "@/lib/database";

interface UseBillingReturn {
  billings: Billing[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: BillingStatus | "all";
  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: BillingStatus | "all") => void;
  createBilling: (data: CreateBilling) => Promise<void>;
  updateBilling: (id: string, data: UpdateBilling) => Promise<void>;
  deleteBilling: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useBilling(): UseBillingReturn {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BillingStatus | "all">("all");

  const fetchBillings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Billing[];
      if (searchQuery.trim()) {
        data = await BillingRepo.search(searchQuery.trim());
      } else if (statusFilter !== "all") {
        data = await BillingRepo.filterByStatus(statusFilter);
      } else {
        data = await BillingRepo.getAll();
      }

      setBillings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data billing");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const createBilling = async (data: CreateBilling): Promise<void> => {
    try {
      setError(null);
      await BillingRepo.create(data);
      await fetchBillings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat billing");
      throw err;
    }
  };

  const updateBilling = async (id: string, data: UpdateBilling): Promise<void> => {
    try {
      setError(null);
      await BillingRepo.update(id, data);
      await fetchBillings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update billing");
      throw err;
    }
  };

  const deleteBilling = async (id: string): Promise<void> => {
    try {
      setError(null);
      await BillingRepo.delete(id);
      await fetchBillings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus billing");
      throw err;
    }
  };

  return {
    billings,
    loading,
    error,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    createBilling,
    updateBilling,
    deleteBilling,
    refetch: fetchBillings,
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
git add hooks/useBilling.ts
git commit -m "feat: add useBilling hook with search, filter, CRUD"
```

---

## Task 3: BillingCard Component

**Files:**
- Create: `components/billing/BillingCard.tsx`

- [ ] **Step 3.1: Buat file `components/billing/BillingCard.tsx`**

```tsx
// === FILE: components/billing/BillingCard.tsx ===
import { Pencil, Trash2 } from "lucide-react";
import type { Billing } from "@/lib/database";
import type { BillingStatus } from "@/lib/database";

interface BillingCardProps {
  billing: Billing;
  onEdit: (billing: Billing) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: BillingStatus) => void;
}

const STATUS_BADGE: Record<BillingStatus, string> = {
  active: "bg-[#2d5016] text-[#86c55d]",
  paused: "bg-[#7a4a00] text-[#f5a623]",
  cancelled: "bg-[rgba(139,0,0,0.2)] text-[#666666]",
};

const STATUS_LABELS: Record<BillingStatus, string> = {
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
};

const CYCLE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  "one-time": "One-time",
};

const NEXT_STATUS: Record<BillingStatus, BillingStatus> = {
  active: "paused",
  paused: "active",
  cancelled: "active",
};

export function BillingCard({ billing, onEdit, onDelete, onToggleStatus }: BillingCardProps) {
  const isActive = billing.status === "active";

  return (
    <div
      className={`group relative rounded-lg p-4 transition-shadow hover:shadow-[0_0_8px_rgba(139,0,0,0.3)] bg-[#111111] ${
        isActive
          ? "border border-[rgba(139,0,0,0.25)] border-l-2 border-l-[#C41E3A]"
          : "border border-[rgba(139,0,0,0.25)]"
      }`}
    >
      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(billing)}
          className="p-1.5 rounded text-[#666666] hover:text-[#F0F0F0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          title="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(billing.id)}
          className="p-1.5 rounded text-[#666666] hover:text-[#C41E3A] hover:bg-[rgba(139,0,0,0.1)] transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Name + Amount */}
      <div className="pr-14">
        <p className="font-mono text-sm font-semibold text-[#F0F0F0] leading-tight">
          {billing.name}
        </p>
        <p className="font-mono text-lg font-bold text-[#C41E3A] mt-0.5">
          {billing.currency} {billing.amount.toLocaleString()}
        </p>
      </div>

      {/* Cycle + Billing date */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-wider bg-[#1A1A1A] border border-[rgba(139,0,0,0.2)] rounded px-2 py-0.5 text-[#666666]">
          {CYCLE_LABELS[billing.cycle] ?? billing.cycle}
        </span>
        <span className="text-xs text-[#666666]">
          tagihan tiap tgl {billing.billing_date}
        </span>
      </div>

      {/* Category */}
      {billing.category && (
        <p className="mt-1 text-[11px] text-[#666666] font-mono">{billing.category}</p>
      )}

      {/* Status badge — click to toggle */}
      <div className="mt-3">
        <button
          onClick={() => onToggleStatus(billing.id, NEXT_STATUS[billing.status])}
          className={`text-[10px] font-mono uppercase tracking-wider rounded px-2 py-0.5 transition-opacity hover:opacity-80 ${STATUS_BADGE[billing.status]}`}
          title="Klik untuk toggle status"
        >
          {STATUS_LABELS[billing.status]}
        </button>
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
git add components/billing/BillingCard.tsx
git commit -m "feat: add BillingCard component"
```

---

## Task 4: BillingForm Component

**Files:**
- Create: `components/billing/BillingForm.tsx`

- [ ] **Step 4.1: Buat file `components/billing/BillingForm.tsx`**

```tsx
// === FILE: components/billing/BillingForm.tsx ===
import { useState } from "react";
import { X } from "lucide-react";
import type { Billing, CreateBilling, UpdateBilling } from "@/lib/database";
import { BILLING_CYCLES, BILLING_STATUSES } from "@/lib/database";

interface BillingFormProps {
  initial?: Partial<Billing>;
  onSubmit: (data: CreateBilling | UpdateBilling) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

const CURRENCIES = ["USD", "IDR"] as const;

const INPUT_CLASS =
  "w-full bg-[#1A1A1A] border border-[rgba(139,0,0,0.25)] rounded px-3 py-2 text-[#F0F0F0] text-sm focus:outline-none focus:border-[#C41E3A] transition-colors";
const LABEL_CLASS =
  "block text-xs font-mono text-[#666666] mb-1 uppercase tracking-wider";

export function BillingForm({
  initial = {},
  onSubmit,
  onCancel,
  isEdit = false,
}: BillingFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState(initial.name ?? "");
  const [amount, setAmount] = useState(initial.amount?.toString() ?? "");
  const [currency, setCurrency] = useState<string>(initial.currency ?? "USD");
  const [cycle, setCycle] = useState<string>(initial.cycle ?? "monthly");
  const [billingDate, setBillingDate] = useState(
    initial.billing_date?.toString() ?? "1"
  );
  const [status, setStatus] = useState<string>(initial.status ?? "active");
  const [category, setCategory] = useState(initial.category ?? "");
  const [url, setUrl] = useState(initial.url ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    const parsedDate = parseInt(billingDate, 10);

    if (!name.trim()) {
      setFormError("Nama subscription wajib diisi");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Amount harus lebih dari 0");
      return;
    }
    if (isNaN(parsedDate) || parsedDate < 1 || parsedDate > 31) {
      setFormError("Billing date harus antara 1-31");
      return;
    }

    const data: CreateBilling = {
      name: name.trim(),
      amount: parsedAmount,
      currency,
      cycle: cycle as CreateBilling["cycle"],
      billing_date: parsedDate,
      next_billing: null,
      status: status as CreateBilling["status"],
      category: category.trim() || null,
      url: url.trim() || null,
      description: description.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      setSubmitting(true);
      await onSubmit(data);
    } catch {
      setFormError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-[rgba(139,0,0,0.25)] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[#F0F0F0]">
            {isEdit ? "Edit Subscription" : "Add Subscription"}
          </h2>
          <button
            onClick={onCancel}
            className="text-[#666666] hover:text-[#F0F0F0] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className={LABEL_CLASS}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Claude Pro"
            />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={LABEL_CLASS}>Amount *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={INPUT_CLASS}
                placeholder="20"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={INPUT_CLASS}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cycle + Billing Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Cycle</label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className={INPUT_CLASS}
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Billing Date *</label>
              <input
                type="number"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                className={INPUT_CLASS}
                min="1"
                max="31"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={INPUT_CLASS}
            >
              {BILLING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Category + URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={INPUT_CLASS}
                placeholder="AI Tools"
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={INPUT_CLASS}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={LABEL_CLASS}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${INPUT_CLASS} resize-none h-16`}
              placeholder="Deskripsi singkat..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className={LABEL_CLASS}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${INPUT_CLASS} resize-none h-16`}
              placeholder="Catatan tambahan..."
            />
          </div>

          {/* Error */}
          {formError && (
            <p className="text-xs text-[#C41E3A] font-mono">{formError}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="bg-transparent border border-[rgba(139,0,0,0.25)] text-[#666666] hover:text-[#F0F0F0] px-4 py-2 rounded text-sm font-mono transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#8B0000] hover:bg-[#C41E3A] disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-mono transition-colors"
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Build check**

```powershell
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4.3: Commit**

```bash
git add components/billing/BillingForm.tsx
git commit -m "feat: add BillingForm modal component"
```

---

## Task 5: Billing Page — Full Functional

**Files:**
- Modify: `pages/billing/index.tsx`

- [ ] **Step 5.1: Replace `pages/billing/index.tsx` dengan full implementation**

```tsx
// === FILE: pages/billing/index.tsx ===
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useBilling } from "@/hooks/useBilling";
import { BillingCard } from "@/components/billing/BillingCard";
import { BillingForm } from "@/components/billing/BillingForm";
import type { Billing, CreateBilling, UpdateBilling } from "@/lib/database";
import type { BillingStatus } from "@/lib/database";

const FILTER_TABS: { label: string; value: BillingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Cancelled", value: "cancelled" },
];

export default function BillingPage() {
  const {
    billings,
    loading,
    error,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    createBilling,
    updateBilling,
    deleteBilling,
  } = useBilling();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Billing | null>(null);

  const activeItems = billings.filter((b) => b.status === "active");
  const totalActive = activeItems.length;
  const monthlyTotal = activeItems.reduce((sum, b) => {
    if (b.cycle === "monthly") return sum + b.amount;
    if (b.cycle === "yearly") return sum + b.amount / 12;
    return sum;
  }, 0);
  const yearlyTotal = activeItems.reduce((sum, b) => {
    if (b.cycle === "monthly") return sum + b.amount * 12;
    if (b.cycle === "yearly") return sum + b.amount;
    return sum;
  }, 0);

  const handleCreate = async (data: CreateBilling | UpdateBilling) => {
    await createBilling(data as CreateBilling);
    setShowForm(false);
  };

  const handleUpdate = async (data: CreateBilling | UpdateBilling) => {
    if (!editTarget) return;
    await updateBilling(editTarget.id, data as UpdateBilling);
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Hapus subscription ini?")) return;
    deleteBilling(id).catch(console.error);
  };

  const handleToggleStatus = (id: string, status: BillingStatus) => {
    updateBilling(id, { status }).catch(console.error);
  };

  const formatNumber = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            Billing Tracker
          </h1>
          <p className="text-sm text-[color:var(--color-muted)]">
            Monitor subscription &amp; tagihan SaaS.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-[color:var(--color-primary)] px-3 py-1.5 text-xs font-mono font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-accent)]"
        >
          <Plus size={12} />
          Add Subscription
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search subscriptions..."
          className="h-8 w-full rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] pl-8 pr-3 text-xs text-[color:var(--color-text)] outline-none transition focus:border-[color:var(--color-accent)]"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[color:var(--color-border)]">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 text-xs font-mono transition-colors border-b-2 -mb-px ${
              statusFilter === tab.value
                ? "border-[color:var(--color-accent)] text-[color:var(--color-text)]"
                : "border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      {totalActive > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Aktif", value: String(totalActive) },
            { label: "Bulan Ini", value: `~${formatNumber(monthlyTotal)}` },
            { label: "Tahunan", value: `~${formatNumber(yearlyTotal)}` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-[color:var(--color-muted)]">
                {item.label}
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-[color:var(--color-text)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <span className="font-mono text-xs text-[color:var(--color-muted)]">
            Memuat data...
          </span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-[6px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-4 py-3">
          <p className="font-mono text-xs text-[#C41E3A]">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && billings.length === 0 && (
        <div className="rounded-[6px] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
            Belum ada subscription tercatat
          </p>
          <p className="mt-2 text-xs text-[color:var(--color-muted)]">
            Klik{" "}
            <span className="font-mono text-[color:var(--color-text)]">
              + Add Subscription
            </span>{" "}
            untuk mulai.
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && billings.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {billings.map((billing) => (
            <BillingCard
              key={billing.id}
              billing={billing}
              onEdit={setEditTarget}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <BillingForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {/* Edit modal */}
      {editTarget && (
        <BillingForm
          initial={editTarget}
          isEdit
          onSubmit={handleUpdate}
          onCancel={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5.2: Build check final**

```powershell
npm run build
```

Expected: `✓ Compiled successfully` — no TypeScript errors, no lint errors.

- [ ] **Step 5.3: Commit**

```bash
git add pages/billing/index.tsx
git commit -m "feat: billing page fully functional — CRUD, search, filter, summary"
```

---

## Task 6: Smoke Test di Tauri

- [ ] **Step 6.1: Jalankan Tauri dev server**

```powershell
cd d:\Forge-Lab\forge
npx tauri dev
```

- [ ] **Step 6.2: Verifikasi checklist**

| Test | Expected |
|------|----------|
| Buka halaman Billing | Claude Pro muncul sebagai item pertama |
| Summary bar terlihat | Total Aktif: 1 · Bulan Ini: ~20 · Tahunan: ~240 |
| Klik "+ Add Subscription" | Modal BillingForm terbuka |
| Isi form → klik "Add Subscription" | Data tersimpan, modal tutup, list refresh |
| Hover card → klik Pencil | Edit modal terbuka dengan data existing |
| Edit data → "Save Changes" | Data terupdate di list |
| Hover card → klik Trash | Confirm dialog muncul → data terhapus |
| Klik status badge di card | Status toggle (active→paused→active) |
| Ketik di search box | List filter realtime |
| Klik tab "Active" / "Paused" | Filter bekerja |

- [ ] **Step 6.3: Final commit (update CHECKPOINT.md)**

Update `CHECKPOINT.md` dengan status Phase 3 selesai:

```bash
git add CHECKPOINT.md
git commit -m "chore: update checkpoint — phase 3 billing CRUD complete"
```

---

## Self-Review — Spec Coverage

| Spec requirement | Task yang implements |
|---|---|
| Verify Tauri SQL Plugin | Task 1 (already done Phase 2, noted) |
| `hooks/useBilling.ts` | Task 2 |
| `components/billing/BillingForm.tsx` | Task 4 |
| `components/billing/BillingCard.tsx` | Task 3 |
| `pages/billing/index.tsx` — list, search, filter | Task 5 |
| `pages/billing/index.tsx` — add/edit/delete | Task 5 |
| `pages/billing/index.tsx` — loading/error/empty state | Task 5 |
| `pages/billing/index.tsx` — summary bar | Task 5 |
| `pages/billing/index.tsx` — toggle status | Task 5 |
| Seed data Claude Pro | Task 1 |
| Test run manual | Task 6 |

Semua requirement dari spec covered. ✓
