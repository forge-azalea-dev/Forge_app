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
