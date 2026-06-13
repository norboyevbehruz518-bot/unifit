/**
 * Data confidence derivation — FIT_ALGORITHM.md §6.
 * Starts at "high" and applies the worst cap triggered by any field that
 * actually drove the score. A field that didn't drive the score doesn't
 * cap it (e.g., missing aid data where the student needs no aid).
 */

import type { DataConfidence } from "@/types/domain";
import type { ConfidenceInputs } from "./types";

export function deriveConfidence(inputs: ConfidenceInputs): DataConfidence {
  const lowTriggers = [
    inputs.percentilesMissingWithTest,
    inputs.meritAidUnknown,
    inputs.academicOnTierAnchorsOnly,
  ];
  if (lowTriggers.some(Boolean)) return "low";

  const mediumTriggers = [
    !inputs.intlPublished,
    inputs.gpaConverted,
    inputs.pathB,
    inputs.costEstimated,
    inputs.dataStale,
  ];
  if (mediumTriggers.some(Boolean)) return "medium";

  return "high";
}
