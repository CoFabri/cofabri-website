// src/components/developer-portal/DirectorySkeleton.tsx

function SkeletonCard() {
  return (
    <div className="flex min-h-[234px] flex-col rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-center gap-3.5">
        <div className="size-11 shrink-0 animate-pulse rounded-[10px] bg-muted" />
        <div className="flex-1">
          <div className="h-3.5 w-3/5 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-2.5 w-2/5 animate-pulse rounded bg-muted/70" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <div className="h-2.5 w-full animate-pulse rounded bg-muted/70" />
        <div className="h-2.5 w-3/4 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="flex-1 min-h-[18px]" />
      <div className="border-t border-border/70 pt-4">
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function DirectorySkeleton() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function AccessStatSkeleton() {
  return (
    <div className="w-[300px] shrink-0 rounded-xl border border-border bg-card p-5">
      <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
      <div className="mt-3.5 border-t border-border/70 pt-3.5">
        <div className="h-2.5 w-full animate-pulse rounded bg-muted/70" />
      </div>
    </div>
  );
}
