import cx from "@/lib/cx";

export function Skeleton({ className, dark = false, style }) {
  return <div aria-hidden="true" style={style} className={cx(dark ? "skeleton-dark" : "skeleton", className)} />;
}

function Loading({ label = "Loading", className, children }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="mb-8 border-b border-line pb-6">
      <Skeleton className="mb-4 h-3 w-28" />
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
    </div>
  );
}

export function StatRowSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-line bg-paper p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-5 h-8 w-16" />
          <Skeleton className="mt-3 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }) {
  const bars = [42, 68, 55, 80, 36, 72, 60, 88, 50, 64];
  return (
    <Loading label="Loading chart" className={cx("rounded-xl border border-line bg-paper p-5", className)}>
      <Skeleton className="h-4 w-40" />
      <div className="mt-6 flex h-48 items-end gap-3">
        {bars.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    </Loading>
  );
}

export function TableSkeleton({ rows = 6, columns = 4 }) {
  return (
    <Loading label="Loading table" className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className="flex items-center justify-between gap-4 border-b border-line p-4">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="hidden h-10 w-28 sm:block" />
      </div>
      <div className="hidden border-b border-line bg-canvas px-5 py-3 md:flex md:gap-6">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0 md:gap-6">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 md:flex-row md:gap-6">
            {Array.from({ length: columns - 1 }, (_, c) => (
              <Skeleton key={c} className={cx("h-3.5", c === 0 ? "w-40 md:flex-1" : "hidden md:block md:flex-1")} />
            ))}
          </div>
        </div>
      ))}
    </Loading>
  );
}

export function CardGridSkeleton({ count = 6, className }) {
  return (
    <Loading label="Loading" className={cx("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-line bg-paper">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </Loading>
  );
}

export function ProfileSkeleton() {
  return (
    <Loading label="Loading profile" className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl border border-line bg-paper p-6">
        <Skeleton className="mx-auto size-28 rounded-full" />
        <Skeleton className="mx-auto mt-5 h-5 w-40" />
        <Skeleton className="mx-auto mt-3 h-3.5 w-28" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-paper p-6">
        <Skeleton className="h-5 w-48" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

export function ChatSkeleton() {
  const bubbles = [
    ["left", "w-2/3"],
    ["left", "w-1/2"],
    ["right", "w-3/5"],
    ["left", "w-2/5"],
    ["right", "w-1/2"],
    ["right", "w-1/3"],
  ];
  return (
    <Loading label="Loading conversation" className="flex h-full flex-col gap-3 p-6">
      {bubbles.map(([side, width], i) => (
        <div key={i} className={cx("flex", side === "right" ? "justify-end" : "justify-start")}>
          <Skeleton className={cx("h-11 rounded-xl", width)} />
        </div>
      ))}
    </Loading>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading label="Loading dashboard">
      <HeaderSkeleton />
      <StatRowSkeleton />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartSkeleton />
        <div className="rounded-xl border border-line bg-paper p-5">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="mt-5 flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

export function PageSkeleton() {
  return (
    <Loading label="Loading page">
      <HeaderSkeleton />
      <TableSkeleton />
    </Loading>
  );
}
