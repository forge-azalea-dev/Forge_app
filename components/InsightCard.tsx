import { useState } from "react";
import type { ReactNode } from "react";
import { useAI } from "@/hooks/useAI";
import { ProjectRepo, BillingRepo, SessionRepo } from "@/lib/database";
import type { Project, Billing, Session } from "@/lib/database";

const RECENT_SESSIONS_LIMIT = 5;

const SYSTEM_PROMPT = `You are a senior developer assistant. Analyze the developer's current workflow data and generate a concise insight report in Bahasa Indonesia.

Format your response in markdown with these sections:
## Status Overview
## Prioritas Sekarang
## Perhatian Billing
## Saran

Keep it brief, practical, and actionable. Max 300 words.`;

function buildUserPrompt(
  projects: Project[],
  billing: Billing[],
  sessions: Session[],
): string {
  const projectLines =
    projects
      .map((p) => `- ${p.name} [${p.stack ?? "—"}] fase: ${p.phase}`)
      .join("\n") || "Tidak ada project aktif.";

  const sessionLines =
    sessions
      .map((s) => `- ${s.title}${s.duration ? ` (${s.duration}m)` : ""}`)
      .join("\n") || "Tidak ada sesi.";

  const billingLines =
    billing
      .map(
        (b) =>
          `- ${b.name}: ${b.currency} ${b.amount}/${b.cycle} [${b.status}]${b.next_billing ? ` — next: ${b.next_billing}` : ""}`,
      )
      .join("\n") || "Tidak ada billing.";

  return `DATA WORKFLOW DEVELOPER:

ACTIVE PROJECTS (${projects.length}):
${projectLines}

RECENT SESSIONS (${sessions.length}):
${sessionLines}

BILLING (${billing.length} items):
${billingLines}

Generate insight report berdasarkan data di atas.`;
}

const H2_CLASSES =
  "font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text)] mt-4 mb-1";
const MUTED_TEXT_CLASSES = "text-xs text-[color:var(--color-muted)]";

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let liBuffer: ReactNode[] = [];

  const flushList = (key: number) => {
    if (liBuffer.length > 0) {
      nodes.push(
        <ul key={`ul-${key}`} className="list-disc ml-4">
          {liBuffer}
        </ul>,
      );
      liBuffer = [];
    }
  };

  const parseInline = (content: string, key: string): ReactNode => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length === 1) return content;
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={`${key}-b-${i}`} className="text-[color:var(--color-text)]">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </>
    );
  };

  lines.forEach((line, idx) => {
    if (line.startsWith("## ")) {
      flushList(idx);
      nodes.push(
        <h2 key={`h2-${idx}`} className={H2_CLASSES}>
          {line.slice(3).trim()}
        </h2>,
      );
    } else if (line.startsWith("- ")) {
      liBuffer.push(
        <li key={`li-${idx}`} className={MUTED_TEXT_CLASSES}>
          {parseInline(line.slice(2), `li-${idx}`)}
        </li>,
      );
    } else if (line.trim() === "") {
      flushList(idx);
    } else {
      flushList(idx);
      nodes.push(
        <p key={`p-${idx}`} className={`${MUTED_TEXT_CLASSES} mb-1`}>
          {parseInline(line, `p-${idx}`)}
        </p>,
      );
    }
  });

  flushList(lines.length);

  return nodes;
}

export function InsightCard() {
  const { isConfigured, isLoading: isGenerating, error: aiError, generate } = useAI();
  const [insight, setInsight] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!isConfigured || isGenerating) return;

    setInsight(null);

    try {
      const [projects, billing, allSessions] = await Promise.all([
        ProjectRepo.getActive(),
        BillingRepo.getAll(),
        SessionRepo.getAll(),
      ]);

      const sessions = allSessions.slice(0, RECENT_SESSIONS_LIMIT);
      const userPrompt = buildUserPrompt(projects, billing, sessions);
      const result = await generate(SYSTEM_PROMPT, userPrompt);

      if (result) setInsight(result);
    } catch (err) {
      console.error("Failed to fetch workflow data:", err);
    }
  };

  return (
    <div className="space-y-3">
      {!isConfigured ? (
        <p className="font-mono text-xs text-[color:var(--color-muted)]">
          Konfigurasi API key di Settings untuk menggunakan AI Insights.
        </p>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-[4px] border border-[rgba(139,0,0,0.4)] bg-transparent px-4 py-2 font-mono text-xs text-[color:var(--color-text)] transition-colors hover:border-[color:var(--color-primary)] hover:bg-[rgba(139,0,0,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border border-[color:var(--color-primary)] border-t-transparent" />
              Generating...
            </>
          ) : (
            "✨ Generate Insights"
          )}
        </button>
      )}

      {aiError !== null && (
        <p className="font-mono text-xs text-[#C41E3A]">{aiError}</p>
      )}

      {insight !== null && (
        <div className="rounded-[6px] border border-[rgba(139,0,0,0.2)] bg-[color:var(--color-surface)] px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
              AI INSIGHTS
            </span>
            <button
              onClick={() => setInsight(null)}
              className="font-mono text-[10px] text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
            >
              ✕ Dismiss
            </button>
          </div>
          <div className="space-y-1">{renderMarkdown(insight)}</div>
        </div>
      )}
    </div>
  );
}
