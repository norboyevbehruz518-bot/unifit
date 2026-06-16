export default function RankingLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Back + header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-stone-200" />
        <div className="h-7 w-64 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-28 animate-pulse rounded bg-stone-100" />
      </div>

      {/* Hero card skeleton */}
      <div className="flex flex-col items-center gap-3 rounded-lg border border-stone-200 bg-white p-8 shadow-card">
        <div className="h-14 w-24 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-56 animate-pulse rounded bg-stone-100" />
        <div className="h-3 w-36 animate-pulse rounded bg-stone-100" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-card">
        <div className="border-b border-stone-100 px-4 py-3">
          <div className="h-3 w-40 animate-pulse rounded bg-stone-100" />
        </div>
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 border-t border-stone-100 px-4 py-3 ${i === 5 ? "bg-ink-50" : ""}`}
          >
            <div className="h-3 w-6 animate-pulse rounded bg-stone-200" />
            <div className="h-3 flex-1 animate-pulse rounded bg-stone-100" />
            <div className="h-3 w-8 animate-pulse rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
