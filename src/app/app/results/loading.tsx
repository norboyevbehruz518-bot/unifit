export default function ResultsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading results…">
      <div className="h-28 w-full animate-pulse rounded-xl bg-stone-200" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-stone-100" />
        ))}
      </div>
    </div>
  );
}
