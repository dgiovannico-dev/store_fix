import { Skeleton } from "@/components/ui/skeleton";

/** Soft-nav placeholder for list/table HQ pages. */
export function TablePageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-6 flex flex-wrap gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="mt-6 space-y-2 rounded-[var(--radius)] border border-[var(--border)] p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Ticket detail hero + columns. */
export function TicketDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Skeleton className="h-40 w-full rounded-[var(--radius)]" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.85fr]">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
          <Skeleton className="h-36 w-full rounded-[var(--radius)]" />
        </div>
        <Skeleton className="h-72 w-full rounded-[var(--radius)]" />
      </div>
    </div>
  );
}

/** Phone-first vendor inbox / list. */
export function PhoneListSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[430px] space-y-3 px-4 py-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-56 max-w-full" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-[var(--radius)]" />
      ))}
    </div>
  );
}

/** Wallboard TV grid. */
export function WallboardSkeleton() {
  return (
    <div className="min-h-dvh bg-[var(--background)] p-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-24 w-36 rounded-[var(--radius)]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-[var(--radius)]" />
        ))}
      </div>
    </div>
  );
}

/** Create / edit form pages (tickets/new, RFQ new, store edit). */
export function FormPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="mt-4 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
        <Skeleton className="mt-2 h-11 w-36" />
      </div>
    </div>
  );
}

/** Vendor phone ticket detail (single column, not HQ 2-col). */
export function PhoneTicketDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[430px] space-y-4 px-4 py-6">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-28 w-full rounded-[var(--radius)]" />
      <Skeleton className="h-10 w-full rounded-[var(--radius)]" />
      <Skeleton className="h-40 w-full rounded-[var(--radius)]" />
      <Skeleton className="h-32 w-full rounded-[var(--radius)]" />
    </div>
  );
}

/** Intake chat wizard (segnala). */
export function WizardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[430px] space-y-4 px-4 py-6">
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-full max-w-xs" />
      <Skeleton className="h-28 w-full rounded-[var(--radius)]" />
      <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
    </div>
  );
}

/** PM calendar month grid. */
export function CalendarSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-16 w-full rounded-[var(--radius)] sm:h-20"
          />
        ))}
      </div>
    </div>
  );
}
