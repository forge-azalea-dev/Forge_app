const containerClasses =
  "space-y-4 rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 shadow-[0_0_8px_rgba(139,0,0,0.3)]";

const stages: string[] = [
  "PRD",
  "UI/UX",
  "Frontend",
  "Backend",
  "Integration",
  "Deploy",
];

export default function ProgressTrackerPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Progress Tracker
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Track fase development setiap project.
        </p>
      </header>

      <section className={containerClasses}>
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]">
          Pipeline Overview
        </h2>
        <p className="mb-4 text-xs text-[color:var(--color-muted)]">
          Representasi statis pipeline. Nantinya akan terhubung dengan status
          project nyata.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {stages.map((stage, index) => {
            const isLast = index === stages.length - 1;
            return (
              <div key={stage} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 items-center justify-center rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-text)]">
                      {stage}
                    </span>
                  </div>
                </div>
                {!isLast && (
                  <div className="h-px w-8 bg-gradient-to-r from-[color:var(--color-border)] to-transparent" />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

