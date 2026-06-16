"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { saveUniversitySelection } from "@/lib/universities/actions";
import type { University } from "@/types/domain";
import { UniversityPicker, MAX_SELECTED } from "./UniversityPicker";

export interface UniversitySelectionFormProps {
  universities: University[];
  initialSelectedIds: string[];
}

export function UniversitySelectionForm({ universities, initialSelectedIds }: UniversitySelectionFormProps) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await saveUniversitySelection(selectedIds);
      } catch {
        setError("Something went wrong saving your list. Please try again.");
      }
    });
  }

  const count = selectedIds.length;

  return (
    <div className="relative flex flex-col gap-4 pb-28">
      <UniversityPicker universities={universities} selectedIds={selectedIds} onChange={setSelectedIds} />

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-stone-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-small text-stone-500">
            {count === 0
              ? "No universities selected yet"
              : `${count} / ${MAX_SELECTED} ${count === 1 ? "university" : "universities"} selected`}
          </p>
          <div className="flex flex-col items-end gap-1">
            {error && <p className="text-caption font-medium text-reach-700">{error}</p>}
            <Button size="lg" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving…" : "Save & see my fit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
