import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import type { FitResult, University } from "@/types/domain";
import { DataConfidenceBadge } from "./DataConfidenceBadge";

const CATEGORY_LABELS = { reach: "Reach", target: "Target", safety: "Safety" } as const;

export interface UniversityResultCardProps {
  university: University;
  result: FitResult;
}

export function UniversityResultCard({ university, result }: UniversityResultCardProps) {
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

      <div className="mt-4 flex items-center justify-between gap-3">
        <DataConfidenceBadge confidence={result.dataConfidence} />
        <details className="group">
          <summary className="cursor-pointer text-small font-medium text-ink-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600">
            Why this score?
          </summary>
          <div className="mt-3 flex flex-col gap-2 text-small text-stone-700">
            <p>{result.explanations.overall}</p>
            <p>{result.explanations.academic}</p>
            <p>{result.explanations.practical}</p>
            <p>{result.explanations.profile}</p>
          </div>
        </details>
      </div>
    </Card>
  );
}
