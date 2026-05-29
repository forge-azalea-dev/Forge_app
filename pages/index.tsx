import { InsightCard } from "@/components/InsightCard";

const cardBaseClasses =
  "rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_0_8px_rgba(139,0,0,0.3)]";

const cardAccentClasses =
  "relative pl-3 before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-[color:var(--color-primary)] before:content-['']";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Command Center
        </h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Overview semua aktivitas Forge.
        </p>
      </header>

      <section className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        <article
          className={`${cardBaseClasses} ${cardAccentClasses} overflow-hidden`}
        >
          <div className="flex h-full flex-col gap-2 pl-5 pr-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]">
                Active Projects
              </h2>
              <span className="rounded-[2px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                snapshot
              </span>
            </div>
            <p className="text-xs text-[color:var(--color-muted)]">
              Ringkasan project yang sedang jalan. Integrasi detail datang di
              fase berikutnya.
            </p>
          </div>
        </article>

        <article
          className={`${cardBaseClasses} ${cardAccentClasses} overflow-hidden`}
        >
          <div className="flex h-full flex-col gap-2 pl-5 pr-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]">
                Current Phase
              </h2>
              <span className="rounded-[2px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                pipeline
              </span>
            </div>
            <p className="text-xs text-[color:var(--color-muted)]">
              Visualisasi posisi Forge di pipeline: PRD → UI/UX → Frontend →
              Backend → Integration → Deploy.
            </p>
          </div>
        </article>

        <article
          className={`${cardBaseClasses} ${cardAccentClasses} overflow-hidden`}
        >
          <div className="flex h-full flex-col gap-2 pl-5 pr-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]">
                Recent Sessions
              </h2>
              <span className="rounded-[2px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                timeline
              </span>
            </div>
            <p className="text-xs text-[color:var(--color-muted)]">
              Nanti akan terisi dengan log sesi kerja terakhir dan context
              penting per sesi.
            </p>
          </div>
        </article>

        <article
          className={`${cardBaseClasses} ${cardAccentClasses} overflow-hidden`}
        >
          <div className="flex h-full flex-col gap-2 pl-5 pr-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]">
                Billing Reminder
              </h2>
              <span className="rounded-[2px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                upcoming
              </span>
            </div>
            <p className="text-xs text-[color:var(--color-muted)]">
              Placeholder untuk pengingat subscription penting: Claude Pro,
              hosting, dan tool lain yang dipakai Forge.
            </p>
          </div>
        </article>
      </section>

      <InsightCard />
    </div>
  );
}

