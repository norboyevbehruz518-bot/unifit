import { Card } from "@/components/ui/Card";

function SkeletonCard() {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="h-5 w-48 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-stone-100" />
        <div className="h-6 w-40 animate-pulse rounded bg-stone-100" />
        <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
        <div className="flex gap-1.5">
          <div className="h-6 w-24 animate-pulse rounded bg-stone-100" />
          <div className="h-6 w-32 animate-pulse rounded bg-stone-100" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded bg-stone-100" />
      </div>
    </Card>
  );
}

export default function AlumniLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="h-4 w-16 animate-pulse rounded bg-stone-200" />
        <div className="h-7 w-64 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-stone-100" />
      </div>
      <div className="flex flex-col gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
