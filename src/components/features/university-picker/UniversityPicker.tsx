"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { getSelectivityTier } from "@/lib/universities/tiers";
import type { University } from "@/types/domain";
import { UniversityCard } from "./UniversityCard";

export const MAX_SELECTED = 12;

export interface UniversityPickerProps {
  universities: University[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function shouldShowUltraSelectiveTip(selected: University[]): boolean {
  if (selected.length < 2) return false;
  const tier1Count = selected.filter((u) => getSelectivityTier(u.acceptanceRateOverall) === 1).length;
  return tier1Count / selected.length >= 0.75;
}

export function UniversityPicker({ universities, selectedIds, onChange }: UniversityPickerProps) {
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const atMax = selectedIds.length >= MAX_SELECTED;

  const selectedUniversities = useMemo(
    () => universities.filter((u) => selectedSet.has(u.id)),
    [universities, selectedSet],
  );
  const showTip = shouldShowUltraSelectiveTip(selectedUniversities);

  const normalizedQuery = query.trim().toLowerCase();
  const visible = universities.filter((u) => {
    if (
      normalizedQuery &&
      !u.name.toLowerCase().includes(normalizedQuery) &&
      !u.state.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }
    return true;
  });

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((v) => v !== id));
    } else if (!atMax) {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Search universities"
        type="search"
        placeholder="Search by name or state…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {showTip && (
        <p
          role="status"
          className="rounded-md border border-target-200 bg-target-100 px-4 py-3 text-small font-medium text-target-700"
        >
          Tip: strong lists mix Reach, Target and Safety schools.
        </p>
      )}

      {atMax && (
        <p className="text-small text-stone-500">
          You&apos;ve picked {MAX_SELECTED} — remove one to add another.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {visible.length === 0 && (
          <li className="rounded-md border border-stone-200 bg-stone-50 px-4 py-6 text-center text-small text-stone-500">
            No universities match your search.
          </li>
        )}
        {visible.map((u) => (
          <UniversityCard
            key={u.id}
            university={u}
            selected={selectedSet.has(u.id)}
            disabled={!selectedSet.has(u.id) && atMax}
            onToggle={toggle}
          />
        ))}
      </ul>
    </div>
  );
}
