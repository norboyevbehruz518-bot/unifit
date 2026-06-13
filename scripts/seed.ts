/**
 * Seeds the public.universities table from data/universities.seed.json.
 *
 * Idempotent: upserts by `id`, so re-running updates existing rows rather
 * than creating duplicates.
 *
 * Run: npx tsx scripts/seed.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * .env.local.
 */

import { createClient } from "@supabase/supabase-js";
import seed from "../data/universities.seed.json";

process.loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (expected in .env.local)",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const { data, error } = await supabase
    .from("universities")
    .upsert(seed, { onConflict: "id" })
    .select("id");

  if (error) {
    throw error;
  }

  console.log(`Upserted ${data?.length ?? 0} universities.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
