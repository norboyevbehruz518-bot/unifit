import { describe, expect, it } from "vitest";
import universitiesSeed from "../../../../data/universities.seed.json";
import { mapUniversityRow, type UniversityRow } from "../universities";

describe("mapUniversityRow", () => {
  it("maps a seed row onto the University domain shape", () => {
    const row = universitiesSeed[0] as unknown as UniversityRow;
    const university = mapUniversityRow(row);

    expect(university.id).toBe(row.id);
    expect(university.name).toBe(row.name);
    expect(university.undergradEnrollment).toBe(row.undergrad_enrollment);
    expect(university.majorCategoriesOffered).toEqual(row.major_categories);
    expect(university.acceptanceRateOverall).toBe(row.acceptance_rate_overall);
    expect(university.costOfAttendanceUsd).toBe(row.cost_of_attendance_usd);
    expect(university.intlAidPolicy).toBe(row.intl_aid_policy);
    expect(university.cdsUrl).toBe(row.cds_url);
    expect(university.admissionSourceYear).toBe(row.admission_source_year);
  });

  it("maps field_confidence keys from snake_case to the camelCase University fields", () => {
    const row = universitiesSeed[0] as unknown as UniversityRow;
    const university = mapUniversityRow(row);

    expect(row.field_confidence.acceptance_rate_overall).toBe("estimated");
    expect(university.fieldConfidence.acceptanceRateOverall).toBe("estimated");
    expect(university.fieldConfidence.avgIntlAidUsd).toBe(row.field_confidence.avg_intl_aid_usd);
    // Unmapped DB-only fields (e.g. gpa_distribution) are dropped, not carried over.
    expect(university.fieldConfidence).not.toHaveProperty("gpa_distribution");
    expect(university.fieldConfidence).not.toHaveProperty("gpaDistribution");
  });

  it("preserves null vs. present admission stats", () => {
    const row: UniversityRow = {
      ...(universitiesSeed[0] as unknown as UniversityRow),
      act25: null,
      act50: null,
      act75: null,
    };
    const university = mapUniversityRow(row);

    expect(university.act25).toBeNull();
    expect(university.sat25).not.toBeNull();
  });
});
