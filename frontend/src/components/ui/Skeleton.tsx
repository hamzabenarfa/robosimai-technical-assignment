interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-sunken ${className}`}
      aria-hidden="true"
    />
  );
}

export function SceneListSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-panel border border-line bg-surface shadow-card"
        >
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SceneEditorSkeleton() {
  return (
    <div className="grid h-full grid-cols-1 gap-0 md:grid-cols-[220px_1fr_320px] md:grid-rows-[1fr_180px]">
      <aside className="hidden border-r border-line bg-surface p-4 md:block md:row-span-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-6 w-3/4" />
        <Skeleton className="mt-4 h-8 w-full" />
        <Skeleton className="mt-6 h-4 w-20" />
        <Skeleton className="mt-2 h-10 w-full" />
        <Skeleton className="mt-2 h-10 w-full" />
      </aside>
      <section className="min-h-[50vh] bg-viewport md:min-h-0">
        <div className="flex h-full min-h-[50vh] w-full items-center justify-center md:min-h-0">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/50" />
        </div>
      </section>
      <aside className="hidden border-l border-line bg-surface p-4 md:block md:row-span-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="mt-auto h-10 w-full" />
      </aside>
      <section className="border-t border-line bg-surface-subtle px-4 py-3 md:col-span-3 md:col-start-1 md:row-start-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-16 w-full" />
      </section>
    </div>
  );
}
