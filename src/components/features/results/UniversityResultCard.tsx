import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import type { FitResult, University } from "@/types/domain";
import { DataConfidenceBadge } from "./DataConfidenceBadge";
import { RankDisplay } from "./RankDisplay";

const CATEGORY_LABELS = { reach: "Reach", target: "Target", safety: "Safety" } as const;

export interface UniversityResultCardProps {
  university: University;
  result: FitResult;
  hasAlumni?: boolean;
}

export function UniversityResultCard({ university, result, hasAlumni }: UniversityResultCardProps) {
  const tone = result.category ?? "ink";

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-h3 font-semibold text-stone-900">{university.name}</h3>
          <p className="text-small text-stone-500">
            {university.city}, {university.state}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {result.category && <Badge tone={result.category}>{CATEGORY_LABELS[result.category]}</Badge>}
          <span className="tnum text-h2 font-semibold text-stone-900">{Math.round(result.overall)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <ScoreBar label="Academic fit" value={result.academicFit} tone={tone} />
        <ScoreBar label="Practical fit" value={result.practicalFit} tone={tone} />
        <ScoreBar label="Profile fit" value={result.profileFit} tone={tone} />
      </div>

      <RankDisplay universityId={university.id} academicFit={result.academicFit} />

      {result.explanations.specialNote && (
        <div className="mt-4 rounded-md border border-ink-100 bg-ink-50 px-3 py-2.5 text-small text-ink-800">
          {result.explanations.specialNote}
        </div>
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <DataConfidenceBadge confidence={result.dataConfidence} />
        <div className="flex flex-col items-end gap-1.5">
          <Link
            href={`/app/ranking/${university.id}`}
            className="text-small font-medium text-ink-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          >
            See your ranking →
          </Link>
          {hasAlumni && (
            <Link
              href={`/app/alumni/${university.id}`}
              className="text-small font-medium text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Meet alumni →
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
