import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const alumni = [
  {
    university_id: "harvard",
    full_name: "Abdulaziz Sobirov",
    country: "Uzbekistan",
    major: "Mathematics & Statistics",
    year_admitted: 2024,
    scholarship: "$366,000 full scholarship",
    extracurriculars: [
      "Zakovat national champion",
      "Math & robotics olympiads",
      "Research intern at PhD robotics lab",
    ],
    honors: [
      "Zakovat Students League champion 2022–23",
      "International science olympiad medals",
    ],
    linkedin_url: "linkedin.com/in/abdulaziz-sobirov-150407bbc",
    bio: "From Khiva to Harvard — robotics, math olympiads, and engineering projects opened the door.",
    is_verified: true,
  },
  {
    university_id: "harvard",
    full_name: "Azizbek Zaylobiddinov",
    country: "Uzbekistan",
    major: "TBD",
    year_admitted: 2025,
    scholarship: "Full scholarship",
    extracurriculars: [],
    honors: [],
    linkedin_url: "linkedin.com/in/azizbekzaylobiddinov",
    bio: "Harvard '29 from Fergana — proving that students from Uzbekistan's countryside can reach the world's best universities.",
    is_verified: true,
  },
  {
    university_id: "stanford",
    full_name: "Farangiz Murodiy",
    country: "Uzbekistan",
    major: "Symbolic Systems (Human-Centered AI)",
    year_admitted: 2023,
    scholarship: "Full scholarship (tuition, housing, food, flights)",
    extracurriculars: [
      "Co-founded Central Asian Student Association at Stanford",
      "College admissions mentor",
    ],
    honors: [],
    linkedin_url: "linkedin.com/in/farangiz-murodiy",
    bio: "First Uzbek woman at Stanford — now building community for Central Asian students in Silicon Valley.",
    is_verified: true,
  },
  {
    university_id: "princeton",
    full_name: "Sayfullo Saidov",
    country: "Uzbekistan",
    major: "Civil & Environmental Engineering",
    year_admitted: 2024,
    scholarship: "$357,000 full scholarship",
    extracurriculars: [
      "Freshman Academy mentee",
      "International experience in Japan",
    ],
    honors: [],
    linkedin_url: "linkedin.com/in/sayfullo-saidov",
    bio: "From Bukhara to Princeton — chemical engineering and a global perspective shaped by living in Japan.",
    is_verified: true,
  },
  {
    university_id: "brown",
    full_name: "Allomakhon Fayzullaeva",
    country: "Uzbekistan",
    major: "Economics & International and Public Affairs",
    year_admitted: 2024,
    scholarship: "$376,000 full scholarship",
    extracurriculars: [
      "Private IELTS tutor",
      "Goethe-Institut PASCH scholarship",
      "Online college courses on Coursera",
    ],
    honors: [
      "Dean's scholarship at Academic Lyceum",
      "PASCH-Youth Courses scholarship",
    ],
    linkedin_url: "linkedin.com/in/allomakhon",
    bio: "From a public lyceum in Tashkent to Brown — gap year, hard work, and a passion for gender equality in Uzbekistan.",
    is_verified: true,
  },
  {
    university_id: "upenn",
    full_name: "Gulrukh Sodikova",
    country: "Uzbekistan",
    major: "Philosophy, Politics and Economics (PPE)",
    year_admitted: 2024,
    scholarship: "Full scholarship",
    extracurriculars: [
      "Zakovat Students League",
      "Presidential School Tashkent",
    ],
    honors: [],
    linkedin_url: "linkedin.com/in/gulrukh-sodikova-153462271",
    bio: "PPE at Penn — combining philosophy, politics and economics to understand and shape the world.",
    is_verified: true,
  },
  {
    university_id: "yale",
    full_name: "Khosilmurod Abdukholikov",
    country: "Uzbekistan",
    major: "Computer Science & Philosophy",
    year_admitted: 2024,
    scholarship: "Full scholarship",
    extracurriculars: ["Learning German", "Community education work"],
    honors: [],
    linkedin_url: "linkedin.com/in/khosilmurod",
    bio: "From public school No.60 in Jizzakh to Yale — proving rural Uzbekistan can reach the Ivy League.",
    is_verified: true,
  },
];

async function main() {
  console.log("Clearing existing verified alumni...");
  const { error: delError } = await supabase
    .from("alumni")
    .delete()
    .eq("is_verified", true);
  if (delError) {
    console.error("Delete failed:", delError.message);
    process.exit(1);
  }

  console.log(`Inserting ${alumni.length} alumni...`);
  const { error: insertError } = await supabase.from("alumni").insert(alumni);
  if (insertError) {
    console.error("Insert failed:", insertError.message);
    process.exit(1);
  }

  console.log(`Done — ${alumni.length} alumni seeded.`);
  for (const a of alumni) {
    console.log(`  ✓ ${a.full_name} → ${a.university_id} (${a.year_admitted})`);
  }
}

main();
