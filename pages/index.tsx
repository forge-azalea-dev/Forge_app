import { useEffect, useState } from "react";
import { InsightCard } from "@/components/InsightCard";
import { SkeletonLines } from "@/components/Skeleton";
import {
  ProjectRepo,
  SessionRepo,
  BillingRepo,
  PHASE_LABELS,
} from "@/lib/database";
import type { Project, Session, Billing } from "@/lib/database";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECENT_SESSIONS_LIMIT = 3;
const MAX_PROJECT_LIST = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  projects: Project[];
  sessions: Session[];
  billings: Billing[];
}

// ─── Style constants ──────────────────────────────────────────────────────────

const cardBaseClasses =
  "rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_0_8px_rgba(139,0,0,0.3)]";

const cardAccentClasses =
  "relative pl-3 before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-[color:var(--color-primary)] before:content-['']";

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    projects: [],
    sessions: [],
    billings: [],
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [projects, sessions, billings] = await Promise.all([
          ProjectRepo.getActive(),
          SessionRepo.getRecent(RECENT_SESSIONS_LIMIT),
          BillingRepo.getAll(),
        ]);
        setDashboardData({ projects, sessions, billings });
      } catch {
        // Leave empty arrays on error — no banner needed on dashboard
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const { projects, sessions, billings } = dashboardData;

  // Nearest active billing with a next_billing date
  const upcomingBilling =
    billings
      .filter(
        (b): b is Billing & { next_billing: string } =>
          b.status === "active" && b.next_billing !== null,
      )
      .sort((a, b) => (a.next_billing < b.next_billing ? -1 : 1))[0] ?? null;

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
        {/* ── Active Projects ───────────────────────────────────────────── */}
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

            {loading ? (
              <SkeletonLines lines={2} />
            ) : projects.length === 0 ? (
              <p className="text-xs text-[color:var(--color-muted)]">
                Belum ada project aktif.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[color:var(--color-muted)]">
                  {projects.length} project aktif
                </p>
                <ul className="space-y-0.5">
                  {projects.slice(0, MAX_PROJECT_LIST).map((project) => (
                    <li
                      key={project.id}
                      className="font-mono text-xs text-[color:var(--color-muted)]"
                    >
                      - {project.name} [{project.stack ?? "—"}]
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>

        {/* ── Current Phase ─────────────────────────────────────────────── */}
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

            {loading ? (
              <SkeletonLines lines={2} />
            ) : projects.length === 0 ? (
              <p className="text-xs text-[color:var(--color-muted)]">
                Belum ada project aktif.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-sm font-semibold text-[color:var(--color-text)]">
                  {PHASE_LABELS[projects[0].phase]}
                </p>
                <p className="text-xs text-[color:var(--color-muted)]">
                  {projects[0].name}
                </p>
              </div>
            )}
          </div>
        </article>

        {/* ── Recent Sessions ───────────────────────────────────────────── */}
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

            {loading ? (
              <SkeletonLines lines={2} />
            ) : sessions.length === 0 ? (
              <p className="text-xs text-[color:var(--color-muted)]">
                Belum ada sesi.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="font-mono text-xs text-[color:var(--color-muted)]"
                  >
                    - {session.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        {/* ── Billing Reminder ──────────────────────────────────────────── */}
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

            {loading ? (
              <SkeletonLines lines={2} />
            ) : upcomingBilling === null ? (
              <p className="text-xs text-[color:var(--color-muted)]">
                Tidak ada tagihan mendatang.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-xs text-[color:var(--color-muted)]">
                  {upcomingBilling.name} — {upcomingBilling.currency}{" "}
                  {upcomingBilling.amount}/{upcomingBilling.cycle}
                </p>
                <p className="text-xs text-[color:var(--color-muted)]">
                  {upcomingBilling.next_billing}
                </p>
              </div>
            )}
          </div>
        </article>
      </section>

      <InsightCard />
    </div>
  );
}
