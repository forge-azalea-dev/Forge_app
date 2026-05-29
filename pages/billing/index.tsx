import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useBilling } from "@/hooks/useBilling";
import { BillingCard } from "@/components/billing/BillingCard";
import { BillingForm } from "@/components/billing/BillingForm";
import { SkeletonList } from "@/components/Skeleton";
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
      {loading && <SkeletonList rows={4} />}

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
