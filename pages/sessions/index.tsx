const containerClasses =
  "space-y-4 rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 shadow-[0_0_8px_rgba(139,0,0,0.3)]";

export default function SessionLogPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Session Log
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Catatan aktivitas per sesi kerja.
        </p>
      </header>

      <section className={containerClasses}>
        <div className="space-y-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]">
            Belum ada sesi
          </h2>
          <p className="text-xs text-[color:var(--color-muted)]">
            Belum ada sesi. Mulai sesi kerja pertama untuk melog apa yang kamu
            kerjakan, keputusan penting, dan hal yang perlu di-follow up.
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[4px] border border-transparent bg-[color:var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-accent)]"
          >
            + New Session
          </button>
        </div>
      </section>
    </div>
  );
}

