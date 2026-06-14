"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { FitCategory, FitResult, University } from "@/types/domain";
import { UniversityResultCard } from "./UniversityResultCard";

export interface CategorizedResult {
  university: University;
  result: FitResult & { category: FitCategory };
}

const SECTION_LABELS: Record<FitCategory, string> = {
  safety: "Safety",
  target: "Target",
  reach: "Reach",
};

type Order = "safety-first" | "reach-first";

const ORDERS: Record<Order, FitCategory[]> = {
  "safety-first": ["safety", "target", "reach"],
  "reach-first": ["reach", "target", "safety"],
};

const ORDER_OPTIONS = [
  { value: "safety-first", label: "Safety → Reach" },
  { value: "reach-first", label: "Reach → Safety" },
];

export function ResultsList({ results }: { results: CategorizedResult[] }) {
  const [order, setOrder] = useState<Order>("safety-first");

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        label="Order"
        options={ORDER_OPTIONS}
        value={order}
        onChange={(value) => setOrder(value as Order)}
      />

      {ORDERS[order].map((category) => {
        const items = results.filter((r) => r.result.category === category);
        if (items.length === 0) return null;

        return (
          <section key={category} className="flex flex-col gap-3">
            <h2 className="text-h2 font-semibold text-stone-900">
              {SECTION_LABELS[category]} ({items.length})
            </h2>
            <div className="flex flex-col gap-3">
              {items.map(({ university, result }) => (
                <UniversityResultCard key={university.id} university={university} result={result} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
