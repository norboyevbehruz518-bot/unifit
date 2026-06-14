import { Card } from "@/components/ui/Card";
import type { FitResult, University } from "@/types/domain";

export interface ActionNeededCardProps {
  university: University;
  result: FitResult;
}

/** A gated university — no score yet, just what would unlock it. */
export function ActionNeededCard({ university, result }: ActionNeededCardProps) {
  return (
    <Card>
      <h3 className="text-h3 font-semibold text-stone-900">{university.name}</h3>
      <p className="text-small text-stone-500">
        {university.city}, {university.state}
      </p>
      <ul className="mt-3 flex flex-col gap-2 text-small text-stone-700">
        {result.gatesFired.map((gate) => (
          <li key={gate.gate} className="rounded-md border border-target-200 bg-target-100 px-3 py-2">
            {gate.explanation}
          </li>
        ))}
      </ul>
    </Card>
  );
}
