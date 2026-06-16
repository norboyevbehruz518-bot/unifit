/**
 * generate-pool.ts
 *
 * Generates virtual Uzbek applicant competitor profiles for every university.
 * Pool size is tier-based (acceptance rate bands), each university gets its
 * own independently generated pool.
 *
 * Usage:
 *   npx tsx scripts/generate-pool.ts            # full run — inserts to DB
 *   npx tsx scripts/generate-pool.ts --dry-run  # sample 4 universities, no DB writes
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
  SelectivityTier,
  StudentProfile,
  University,
} from "../src/types/domain";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZE = 500;
const DRY_RUN = process.argv.includes("--dry-run");

/** Universities shown in the dry-run sample (one per tier). */
const DRY_RUN_IDS = ["mit", "nyu", "penn-state-university-park", "arizona-state"];

// ---------------------------------------------------------------------------
// Tier / pool-size helpers
// ---------------------------------------------------------------------------

// acceptanceRateOverall is stored as a percentage (e.g. 3.7 means 3.7%, not 0.037)
const TIER_BOUNDS = {
  tier1Max: 10,  // < 10% → Tier 1
  tier2Max: 25,  // 10–25% → Tier 2
  tier3Max: 50,  // 25–50% → Tier 3
                 // > 50% → Tier 4
} as const;

function tierForUniversity(uni: University): SelectivityTier {
  const r = uni.acceptanceRateOverall; // already in % (0–100)
  if (r < TIER_BOUNDS.tier1Max) return 1;
  if (r < TIER_BOUNDS.tier2Max) return 2;
  if (r < TIER_BOUNDS.tier3Max) return 3;
  return 4;
}

/** Random pool size within the tier's band. */
function poolSizeForUniversity(uni: University): number {
  const tier = tierForUniversity(uni);
  const [lo, hi]: [number, number] =
    tier === 1 ? [750, 900]
    : tier === 2 ? [450, 600]
    : tier === 3 ? [250, 400]
    : [100, 200];
  return randInt(lo, hi);
}

// ---------------------------------------------------------------------------
// Uzbek name generation
// ---------------------------------------------------------------------------

const MALE_FIRST: string[] = [
  "Jasur", "Bobur", "Sherzod", "Ulugbek", "Doniyor",
  "Sardor", "Jahongir", "Mirzo", "Firdavs", "Sanjar",
  "Dilshod", "Nodir", "Murod", "Bekzod", "Otabek",
  "Alisher", "Zafar", "Eldor", "Humoyun", "Kamol",
];

const FEMALE_FIRST: string[] = [
  "Nilufar", "Zulfiya", "Malika", "Barno", "Shahnoza",
  "Gulnora", "Dilorom", "Maftuna", "Feruza", "Nargiza",
  "Ozoda", "Sabohat", "Iroda", "Muhabbat", "Dildora",
  "Kamola", "Lola", "Munira", "Sarvinoz", "Hulkar",
];

/** Last-name stems — female gets -ova/-eva suffix automatically. */
const LAST_STEMS: string[] = [
  "Toshmatov", "Karimov", "Rahimov", "Yusupov", "Hasanov",
  "Nazarov", "Abdullayev", "Mirzayev", "Ergashev", "Qodirov",
  "Ismoilov", "Sobirov", "Tillayev", "Ruziyev", "Xolmatov",
  "Normatov", "Boymurodov", "Holiqov", "Tursunov", "Mamadaliyev",
];

function randomName(): string {
  const isFemale = Math.random() < 0.5;
  const first = isFemale
    ? FEMALE_FIRST[randInt(0, FEMALE_FIRST.length - 1)]!
    : MALE_FIRST[randInt(0, MALE_FIRST.length - 1)]!;

  const stem = LAST_STEMS[randInt(0, LAST_STEMS.length - 1)]!;
  const last = isFemale
    ? stem.endsWith("ev") || stem.endsWith("ov")
      ? stem.slice(0, -2) + (stem.endsWith("ev") ? "eva" : "ova")
      : stem + "a"
    : stem;

  return `${first} ${last}`;
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function normalRandom(mean: number, std: number): number {
  const u1 = Math.random() || Number.EPSILON;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

function clampNum(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

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
  const sat = Math.round(clampNum(normalRandom(1380, 120), 1100, 1600) / 10) * 10;
  const ielts = Math.round(clampNum(normalRandom(7.2, 0.5), 6.0, 9.0) * 2) / 2;
  const gpa = parseFloat(clampNum(normalRandom(4.6, 0.3), 3.5, 5.0).toFixed(2));

  const aidRoll = Math.random();
  const aidNeedLevel: AidNeedLevel =
    aidRoll < 0.6 ? "full" : aidRoll < 0.9 ? "partial" : "none";

  const annualBudgetUsd =
    aidNeedLevel === "full"
      ? Math.round(Math.random() * 5_000)
      : aidNeedLevel === "partial"
        ? Math.round(5_000 + Math.random() * 20_000)
        : Math.round(25_000 + Math.random() * 55_000);

  const numMajors = Math.random() < 0.5 ? 1 : 2;
  const intendedMajors = shuffle(MAJOR_POOL).slice(0, numMajors);

  const apScores: ApScore[] = [];
  if (Math.random() < 0.4) {
    const n = randInt(1, 3);
    const subjects = shuffle([...AP_SUBJECTS_TOP5]).slice(0, n);
    for (const subject of subjects) {
      apScores.push({ subject, score: randInt(3, 5) });
    }
  }

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
// Row type
// ---------------------------------------------------------------------------

interface PoolRow {
  university_id: string;
  academic_fit: number;
  overall_score: number;
  is_virtual: boolean;
  name: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startMs = Date.now();

  const seedPath = resolve(import.meta.dirname, "../data/universities.seed.json");
  const seedRows = JSON.parse(readFileSync(seedPath, "utf-8")) as UniversityRow[];
  const universities = seedRows.map(mapUniversityRow);
  console.log(`Loaded ${universities.length} universities from seed JSON.`);

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Sampling 4 universities (one per tier)…\n");

    const samples = universities.filter((u) => DRY_RUN_IDS.includes(u.id));
    // Sort to match the requested order
    samples.sort((a, b) => DRY_RUN_IDS.indexOf(a.id) - DRY_RUN_IDS.indexOf(b.id));

    for (const uni of samples) {
      const tier = tierForUniversity(uni);
      const poolSize = poolSizeForUniversity(uni);

      // Generate the pool for this university
      const rows: PoolRow[] = [];
      for (let i = 0; i < poolSize; i++) {
        const profile = generateProfile();
        const result = calculateFitResult(profile, uni);
        rows.push({
          university_id: uni.id,
          academic_fit: result.academicFit,
          overall_score: result.overall,
          is_virtual: true,
          name: randomName(),
        });
      }

      const acceptPct = uni.acceptanceRateOverall.toFixed(1);
      console.log(`── ${uni.name} (${uni.id})`);
      console.log(`   Accept rate: ${acceptPct}%  →  Tier ${tier}  →  pool size: ${poolSize}`);
      console.log(`   3 sample rows:`);
      for (const row of rows.slice(0, 3)) {
        console.log(
          `     name=${row.name.padEnd(25)}  academic_fit=${row.academic_fit.toFixed(2)}  overall=${row.overall_score.toFixed(2)}`,
        );
      }
      console.log();
    }

    console.log("[DRY RUN] No data written to DB.");
    return;
  }

  // --- Load env and create Supabase client (service role) ---
  process.loadEnvFile(".env.local");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // --- Compute total for progress display ---
  const totalExpected = universities.reduce(
    (sum, uni) => sum + poolSizeForUniversity(uni),
    0,
  );
  console.log(
    `\nExpected total rows: ~${totalExpected.toLocaleString()} (tier-based pool sizes)\n`,
  );

  let totalInserted = 0;
  let totalFailed = 0;

  for (let uIdx = 0; uIdx < universities.length; uIdx++) {
    const uni = universities[uIdx]!;
    const tier = tierForUniversity(uni);
    const poolSize = poolSizeForUniversity(uni);
    const batchNum = uIdx + 1;

    // Generate independent pool for this university
    const rows: PoolRow[] = [];
    for (let i = 0; i < poolSize; i++) {
      const profile = generateProfile();
      const result = calculateFitResult(profile, uni);
      rows.push({
        university_id: uni.id,
        academic_fit: result.academicFit,
        overall_score: result.overall,
        is_virtual: true,
        name: randomName(),
      });
    }

    // Insert in chunks of BATCH_SIZE
    const batchStart = Date.now();
    let batchInserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("competitor_pool").insert(chunk);
      if (error) {
        console.error(
          `  ✗ ${batchNum}/${universities.length} (${uni.name}) chunk FAILED: ${error.message}`,
        );
        totalFailed += chunk.length;
      } else {
        batchInserted += chunk.length;
        totalInserted += chunk.length;
      }
    }

    const elapsed = Date.now() - batchStart;
    process.stdout.write(
      `  ✓ ${batchNum}/${universities.length} (${uni.name}) [Tier ${tier}] — ${batchInserted} rows (${elapsed}ms)\n`,
    );
  }

  // --- Per-university verification (sample 5 universities) ---
  console.log("\nVerifying counts (5 spot-checks)…");
  const spotCheck = universities.slice(0, 5);
  for (const uni of spotCheck) {
    const { count, error } = await supabase
      .from("competitor_pool")
      .select("*", { count: "exact", head: true })
      .eq("university_id", uni.id);
    if (error) {
      console.warn(`  ? ${uni.id}: error — ${error.message}`);
    } else {
      console.log(`  ${uni.id}: ${count ?? 0} rows`);
    }
  }

  const totalMs = Date.now() - startMs;
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Total rows inserted : ${totalInserted.toLocaleString()}`);
  if (totalFailed > 0) console.log(`Total rows failed   : ${totalFailed.toLocaleString()}`);
  console.log(`Total time          : ${(totalMs / 1000).toFixed(1)}s`);
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
