const containerClasses =
  "space-y-4 rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 shadow-[0_0_8px_rgba(139,0,0,0.3)]";

const tabs: string[] = ["All", "Claude", "Ideogram", "Stitch", "ChatGPT", "Custom"];

export default function PromptVaultPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Prompt Vault
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Library prompt per AI tool.
        </p>
      </header>

      <section className={containerClasses}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-0.5">
            {tabs.map((tab, index) => {
              const isActive = index === 0;
              return (
                <button
                  key={tab}
                  type="button"
                  className={[
                    "px-3 py-1 text-xs font-medium transition",
                    "rounded-[3px]",
                    isActive
                      ? "bg-[color:var(--color-primary)] text-[color:var(--color-text)]"
                      : "text-[color:var(--color-muted)] hover:bg-[rgba(255,255,255,0.04)]",
                  ].join(" ")}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-[rgba(139,0,0,0.3)]"
          >
            + Add Prompt
          </button>
        </div>

        <div className="mt-3 space-y-2 rounded-[4px] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
            Empty State
          </p>
          <p className="text-xs text-[color:var(--color-muted)]">
            Belum ada prompt tersimpan. Tambahkan prompt pertama untuk Claude,
            Ideogram, Stitch, atau tool lain yang kamu pakai setiap hari.
          </p>
        </div>
      </section>
    </div>
  );
}

