/**
 * generate-pool.ts
 *
 * Generates 500 virtual Uzbek applicant profiles, computes fit scores for all
 * 60 universities, and inserts the results into competitor_pool.
 *
 * Usage:
 *   npx tsx scripts/generate-pool.ts            # full run — inserts to DB
 *   npx tsx scripts/generate-pool.ts --dry-run  # compute only, no DB writes
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { calculateFitResult } from "../src/lib/fit-engine/index";
import { mapUniversityRow, type UniversityRow } from "../src/lib/data/universities";
import type {
  AidNeedLevel,
  ApScore,
  RubricAwardsLevel,
  RubricCommitmentLevel,
  RubricFocusLevel,
  RubricLeadershipLevel,
  StudentProfile,
} from "../src/types/domain";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PROFILE_COUNT = 500;
const BATCH_SIZE = 500; // one batch per university (500 rows each)
const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/** Box-Muller transform — returns one standard-normal sample scaled to (mean, std). */
function normalRandom(mean: number, std: number): number {
  const u1 = Math.random() || Number.EPSILON; // guard log(0)
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

function clampNum(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Fisher-Yates shuffle — returns a new shuffled copy. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Profile generation
// ---------------------------------------------------------------------------

const MAJOR_POOL = [
  "computer-science",
  "business",
  "engineering",
  "economics",
  "mathematics",
];

const AP_SUBJECTS_TOP5 = [
  "Calculus AB",
  "Calculus BC",
  "English Language & Composition",
  "Statistics",
  "Computer Science A",
];

function generateProfile(): StudentProfile {
  // SAT: N(1380, 120), rounded to nearest 10
  const sat =
    Math.round(clampNum(normalRandom(1380, 120), 1000, 1600) / 10) * 10;

  // IELTS: N(7.2, 0.5), rounded to nearest 0.5
  const ielts =
    Math.round(clampNum(normalRandom(7.2, 0.5), 5.5, 9.0) * 2) / 2;

  // GPA on 5.0-uz scale: N(4.6, 0.3)
  const gpa = parseFloat(
    clampNum(normalRandom(4.6, 0.3), 3.5, 5.0).toFixed(2),
  );

  // Aid need: 60% full, 30% partial, 10% none
  const aidRoll = Math.random();
  const aidNeedLevel: AidNeedLevel =
    aidRoll < 0.6 ? "full" : aidRoll < 0.9 ? "partial" : "none";

  // Budget correlated with aid need
  const annualBudgetUsd =
    aidNeedLevel === "full"
      ? Math.round(Math.random() * 5_000)
      : aidNeedLevel === "partial"
        ? Math.round(5_000 + Math.random() * 20_000)
        : Math.round(25_000 + Math.random() * 55_000);

  // Majors: 1 or 2 from pool
  const numMajors = Math.random() < 0.5 ? 1 : 2;
  const intendedMajors = shuffle(MAJOR_POOL).slice(0, numMajors);

  // AP scores: 40% chance of 1-3 exams, scores 3-5
  const apScores: ApScore[] = [];
  if (Math.random() < 0.4) {
    const n = randInt(1, 3);
    const subjects = shuffle([...AP_SUBJECTS_TOP5]).slice(0, n);
    for (const subject of subjects) {
      apScores.push({ subject, score: randInt(3, 5) });
    }
  }

  // Rubric — store level indices (engine converts via RUBRIC_POINTS)
  const rubric = {
    leadership: randInt(0, 3) as RubricLeadershipLevel,
    awards: randInt(0, 4) as RubricAwardsLevel,
    commitment: randInt(0, 3) as RubricCommitmentLevel,
    focus: randInt(0, 3) as RubricFocusLevel,
  };

  return {
    citizenship: "UZ",
    gpaValue: gpa,
    gpaScale: "5.0-uz",
    satTotal: sat,
    englishTest: "ielts",
    englishScore: ielts,
    aidNeedLevel,
    annualBudgetUsd,
    intendedMajors,
    apScores,
    rubric,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface PoolRow {
  university_id: string;
  academic_fit: number;
  overall_score: number;
  is_virtual: boolean;
}

async function main() {
  const startMs = Date.now();

  // --- Load universities from seed JSON (no DB call needed) ---
  const seedPath = resolve(import.meta.dirname, "../data/universities.seed.json");
  const seedRows = JSON.parse(readFileSync(seedPath, "utf-8")) as UniversityRow[];
  const universities = seedRows.map(mapUniversityRow);
  console.log(`Loaded ${universities.length} universities from seed JSON.`);

  // --- Generate profiles ---
  console.log(`Generating ${PROFILE_COUNT} virtual profiles…`);
  const profiles: StudentProfile[] = Array.from(
    { length: PROFILE_COUNT },
    generateProfile,
  );

  if (DRY_RUN) {
    // Compute a sample and print — no DB writes
    console.log("\n[DRY RUN] Computing sample fits…");
    const sample: PoolRow[] = [];
    const uni = universities[0]!;
    for (const profile of profiles) {
      const result = calculateFitResult(profile, uni);
      sample.push({
        university_id: uni.id,
        academic_fit: result.academicFit,
        overall_score: result.overall,
        is_virtual: true,
      });
    }
    const totalRows = PROFILE_COUNT * universities.length;
    console.log(`\nSample rows (first 5, university: ${uni.name}):`);
    for (const row of sample.slice(0, 5)) {
      console.log(
        `  university_id=${row.university_id}  academic_fit=${row.academic_fit.toFixed(2)}  overall_score=${row.overall_score.toFixed(2)}`,
      );
    }
    console.log(`\nTotal rows that would be inserted: ${totalRows.toLocaleString()}`);
    console.log("[DRY RUN] No data written to DB.");
    return;
  }

  // --- Supabase client (service role) ---
  process.loadEnvFile(".env.local");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // --- Compute fits and insert, one university at a time ---
  console.log(`\nComputing fits and inserting (${universities.length} batches of ${PROFILE_COUNT} rows)…`);
  let totalInserted = 0;
  let totalFailed = 0;

  for (let uIdx = 0; uIdx < universities.length; uIdx++) {
    const university = universities[uIdx]!;
    const batchNum = uIdx + 1;

    // Compute fit for all profiles against this university
    const rows: PoolRow[] = profiles.map((profile) => {
      const result = calculateFitResult(profile, university);
      return {
        university_id: university.id,
        academic_fit: result.academicFit,
        overall_score: result.overall,
        is_virtual: true,
      };
    });

    // Insert in sub-batches of BATCH_SIZE (500 rows = one pass here)
    const batchStart = Date.now();
    let batchInserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("competitor_pool").insert(chunk);
      if (error) {
        console.error(
          `  ✗ Batch ${batchNum}/${universities.length} (${university.name}) chunk ${i / BATCH_SIZE + 1} FAILED: ${error.message}`,
        );
        totalFailed += chunk.length;
      } else {
        batchInserted += chunk.length;
        totalInserted += chunk.length;
      }
    }

    const elapsed = Date.now() - batchStart;
    if (batchInserted > 0) {
      process.stdout.write(
        `  ✓ Batch ${batchNum}/${universities.length} (${university.name}) — ${batchInserted} rows (${elapsed}ms)\n`,
      );
    }
  }

  // --- Verification query ---
  console.log("\nVerifying row counts…");
  const { data: counts, error: countErr } = await supabase.rpc("sql" as never, {
    query:
      "SELECT university_id, COUNT(*)::int AS cnt FROM competitor_pool GROUP BY university_id ORDER BY cnt DESC LIMIT 5",
  });

  if (countErr || !counts) {
    // Fallback: direct select-based check
    const { data: fallback, error: fbErr } = await supabase
      .from("competitor_pool")
      .select("university_id")
      .limit(1);
    if (fbErr) {
      console.warn("  Could not run verification query:", fbErr.message);
    } else {
      console.log("  Verification via rpc unavailable — counts not shown, but inserts completed.");
    }
  } else {
    console.log("  Top 5 universities by row count:");
    for (const row of counts as { university_id: string; cnt: number }[]) {
      const status = row.cnt === PROFILE_COUNT ? "✓" : "✗ MISMATCH";
      console.log(`    ${status}  ${row.university_id}: ${row.cnt} rows`);
    }
  }

  // --- Summary ---
  const totalMs = Date.now() - startMs;
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Total rows inserted : ${totalInserted.toLocaleString()}`);
  if (totalFailed > 0) {
    console.log(`Total rows failed   : ${totalFailed.toLocaleString()}`);
  }
  console.log(`Total time          : ${(totalMs / 1000).toFixed(1)}s`);
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
