import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { TIER_SHORT_LABELS, getSelectivityTier } from "@/lib/universities/tiers";
import type { University } from "@/types/domain";

export interface UniversityCardProps {
  university: University;
  selected: boolean;
  /** True when not selected and the selection cap has been reached. */
  disabled: boolean;
  onToggle: (id: string) => void;
}

/** A single checkable row in the university picker list. */
export function UniversityCard({ university, selected, disabled, onToggle }: UniversityCardProps) {
  const tier = getSelectivityTier(university.acceptanceRateOverall);

  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        disabled={disabled}
        onClick={() => onToggle(university.id)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
          disabled
            ? "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400"
            : "border-stone-200 bg-white text-stone-900 hover:border-ink-300 hover:bg-ink-50",
          selected && "border-ink-300 bg-ink-50",
        )}
      >
        <span className="flex flex-col">
          <span className="text-body font-medium">{university.name}</span>
          <span className="text-small text-stone-500">
            {university.city}, {university.state}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <Badge tone="neutral">{TIER_SHORT_LABELS[tier]}</Badge>
          <span className="tnum text-small text-stone-500">
            {university.acceptanceRateOverall}% accept
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-caption",
              selected ? "border-ink-600 bg-ink-600 text-white" : "border-stone-300 bg-white",
            )}
          >
            {selected && "✓"}
          </span>
        </span>
      </button>
    </li>
  );
}
