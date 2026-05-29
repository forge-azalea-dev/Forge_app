function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-[2px] ${className ?? ""}`} />;
}

const ROW_WIDTHS = ["w-2/3", "w-1/2", "w-3/4"];

export function SkeletonLines({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-2.5 ${ROW_WIDTHS[i % ROW_WIDTHS.length]}`} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 space-y-2"
        >
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      ))}
    </div>
  );
}
