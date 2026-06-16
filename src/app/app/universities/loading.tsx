export default function UniversitiesLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading universities…">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-56 animate-pulse rounded-md bg-stone-200" />
        <div className="h-5 w-80 animate-pulse rounded-md bg-stone-200" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-md bg-stone-200" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 w-full animate-pulse rounded-md bg-stone-100" />
        ))}
      </div>
    </div>
  );
}
