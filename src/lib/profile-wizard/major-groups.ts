import majorCategories from "../../../data/major-categories.json";

export interface MajorOption {
  value: string;
  label: string;
}

export interface MajorGroup {
  label: string;
  options: MajorOption[];
}

const categoryById = new Map(
  (majorCategories as { id: string; label: string }[]).map((c) => [c.id, c]),
);

function group(label: string, ids: string[]): MajorGroup {
  return {
    label,
    options: ids.map((id) => {
      const category = categoryById.get(id);
      if (!category) throw new Error(`Unknown major category: ${id}`);
      return { value: category.id, label: category.label };
    }),
  };
}

/** Display label for a major category id, e.g. "computer-science" -> "Computer Science". */
export function majorLabel(id: string): string {
  return categoryById.get(id)?.label ?? id;
}

/** Field groupings for the major picker — approved grouping of the 17-category vocabulary. */
export const MAJOR_GROUPS: MajorGroup[] = [
  group("STEM", [
    "computer-science",
    "engineering",
    "mathematics",
    "biology",
    "chemistry",
    "physics",
  ]),
  group("Business & Social Sciences", [
    "business",
    "economics",
    "psychology",
    "political-science",
    "international-relations",
  ]),
  group("Humanities, Arts & Communication", [
    "communications",
    "design-art",
    "architecture",
    "humanities-languages",
  ]),
  group("Education & Health", ["education", "health-sciences"]),
];
