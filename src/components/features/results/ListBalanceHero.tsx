import { cn } from "@/lib/utils";
import type { ListBalance } from "@/types/domain";

const PLURALS = { Reach: "Reaches", Target: "Targets", Safety: "Safeties" } as const;

function pluralize(count: number, noun: keyof typeof PLURALS): string {
  return `${count} ${count === 1 ? noun : PLURALS[noun]}`;
}

/**
 * The killer feature: list-balance summary as the hero element. Impossible
 * to miss — large, color-coded by classification, with the advisory
 * sentence front and center.
 */
export function ListBalanceHero({ balance }: { balance: ListBalance }) {
  const isBalanced = balance.classification === "balanced";

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-6",
        isBalanced ? "border-safety-200 bg-safety-100" : "border-target-200 bg-target-100",
      )}
    >
      <h1 className={cn("text-h1 font-semibold", isBalanced ? "text-safety-700" : "text-target-700")}>
        Your list: {pluralize(balance.reachCount, "Reach")},{" "}
        {pluralize(balance.targetCount, "Target")}, {pluralize(balance.safetyCount, "Safety")}
      </h1>
      <p className={cn("mt-2 text-body", isBalanced ? "text-safety-700" : "text-target-700")}>
        {balance.advisory}
      </p>
    </div>
  );
}
