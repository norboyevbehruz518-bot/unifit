import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { DataConfidence } from "@/types/domain";

const LABELS: Record<DataConfidence, string> = {
  high: "High confidence data",
  medium: "Medium confidence data",
  low: "Low confidence data",
};

const TONES: Record<DataConfidence, BadgeTone> = {
  high: "ink",
  medium: "neutral",
  low: "target",
};

export function DataConfidenceBadge({ confidence }: { confidence: DataConfidence }) {
  return <Badge tone={TONES[confidence]}>{LABELS[confidence]}</Badge>;
}
