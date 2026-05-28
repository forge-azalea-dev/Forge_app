import { PHASES, PHASE_LABELS } from "@/lib/database";
import type { Phase } from "@/lib/database";

interface PipelineBarProps {
  phase: Phase;
  onPhaseClick: (phase: Phase) => void;
}

export function PipelineBar({ phase, onPhaseClick }: PipelineBarProps) {
  const currentIndex = PHASES.indexOf(phase);

  return (
    <div className="flex items-center">
      {PHASES.map((p, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <button
            key={p}
            type="button"
            onClick={() => onPhaseClick(p)}
            title={`Set phase: ${PHASE_LABELS[p]}`}
            className={[
              "relative flex-1 px-1 py-1.5 text-center transition-all",
              "font-mono text-[9px] uppercase tracking-wider",
              "border-y border-r first:border-l first:rounded-l-[4px] last:rounded-r-[4px]",
              isCompleted
                ? "bg-[#8B0000] border-[#8B0000] text-white hover:bg-[#C41E3A] hover:border-[#C41E3A]"
                : isActive
                ? "bg-[rgba(139,0,0,0.15)] border-[#C41E3A] text-[#F0F0F0] shadow-[inset_0_0_8px_rgba(196,30,58,0.2)]"
                : "bg-[#111111] border-[rgba(139,0,0,0.2)] text-[#444444] hover:text-[#888888] hover:border-[rgba(139,0,0,0.35)]",
            ].join(" ")}
          >
            {PHASE_LABELS[p]}
          </button>
        );
      })}
    </div>
  );
}
