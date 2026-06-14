"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { saveUniversitySelection } from "@/lib/universities/actions";
import type { University } from "@/types/domain";
import { UniversityPicker } from "./UniversityPicker";

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

  return (
    <div className="flex flex-col gap-6">
      <UniversityPicker universities={universities} selectedIds={selectedIds} onChange={setSelectedIds} />

      <div className="flex flex-col items-end gap-2 border-t border-stone-200 pt-4">
        {error && <p className="text-small font-medium text-reach-700">{error}</p>}
        <Button size="lg" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save & see my fit"}
        </Button>
        {selectedIds.length === 0 && (
          <p className="text-small text-stone-500">
            You can save an empty list and add universities later.
          </p>
        )}
      </div>
    </div>
  );
}
