const containerClasses =
  "space-y-4 rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 shadow-[0_0_8px_rgba(139,0,0,0.3)]";

export default function PrdManagerPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          PRD Manager
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Kelola Product Requirements Document per project.
        </p>
      </header>

      <section className={containerClasses}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-7 w-7 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)]" />
          <div className="space-y-2">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]">
              Belum ada PRD
            </h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              Mulai dengan membuat PRD pertama untuk project utama kamu. Forge
              akan menyimpan struktur, scope, dan keputusan penting di satu
              tempat.
            </p>
            <button
              type="button"
              className="mt-1 inline-flex items-center justify-center rounded-[4px] border border-transparent bg-[color:var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-accent)]"
            >
              + New PRD
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

