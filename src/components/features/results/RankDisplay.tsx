"use client";

import { useEffect, useState } from "react";
import { getRank, type RankData } from "@/lib/ranking/getRank";

interface RankDisplayProps {
  universityId: string;
  academicFit: number;
}

export function RankDisplay({ universityId, academicFit }: RankDisplayProps) {
  const [rankData, setRankData] = useState<RankData | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    getRank(universityId, academicFit).then((data) => {
      if (!cancelled) setRankData(data);
    });
    return () => { cancelled = true; };
  }, [universityId, academicFit]);

  // Loading skeleton
  if (rankData === "loading") {
    return (
      <div className="flex flex-col gap-1.5 border-t border-stone-100 pt-3">
        <div className="h-4 w-56 animate-pulse rounded bg-stone-200" />
      </div>
    );
  }

  // Error / no data / percentile below 10 — hide entirely
  if (!rankData || rankData.percentile < 10) return null;

  const { rank, total, percentile } = rankData;
  const showBar = percentile >= 50;

  return (
    <div className="flex flex-col gap-1.5 border-t border-stone-100 pt-3">
      <p className="text-small text-stone-600">
        You rank{" "}
        <span className="font-semibold text-stone-900">#{rank}</span> of{" "}
        <span className="font-semibold text-stone-900">{total}</span> students
        targeting this university
        {showBar && (
          <> — <span className="font-semibold text-stone-900">top {100 - percentile + 1}%</span></>
        )}
      </p>

      {showBar && (
        <div
          className="relative h-1.5 w-full overflow-hidden rounded-full bg-stone-200"
          role="progressbar"
          aria-valuenow={percentile}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Ranked in the top ${100 - percentile + 1}% of applicants`}
        >
          <div
            className="h-full rounded-full bg-ink-600 transition-all duration-500"
            style={{ width: `${percentile}%` }}
          />
        </div>
      )}
    </div>
  );
}
