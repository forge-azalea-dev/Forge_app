const containerClasses =
  "space-y-4 rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 shadow-[0_0_8px_rgba(139,0,0,0.3)]";

const placeholderSuggestion = "Claude Pro";

export default function BillingTrackerPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Billing Tracker
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Monitor subscription &amp; tagihan SaaS.
        </p>
      </header>

      <section className={containerClasses}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search subscriptions..."
                className="h-8 w-full rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 text-xs text-[color:var(--color-text)] outline-none ring-0 transition focus:border-[color:var(--color-accent)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-[rgba(255,255,255,0.04)]"
            >
              Filter
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-[4px] border border-transparent bg-[color:var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-accent)]"
            >
              + Add Subscription
            </button>
          </div>
        </div>

        <div className="mt-2 space-y-2 rounded-[4px] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
            Belum ada subscription tercatat
          </p>
          <p className="text-xs text-[color:var(--color-muted)]">
            Tambahkan subscription pertama kamu. Contoh awal yang direkomendasikan:
            <span className="font-mono text-[11px] text-[color:var(--color-text)]">
              {" "}
              {placeholderSuggestion}
            </span>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

