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
