import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../university.schema.json';
import seed from '../universities.seed.json';
import majorCategories from '../major-categories.json';

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const VALID_CATEGORY_IDS = new Set(majorCategories.map((c) => c.id));
const VALID_CONFIDENCE_LEVELS = new Set(['verified-intl', 'verified-overall', 'estimated', 'missing']);

type SeedRecord = (typeof seed)[number];

describe('universities.seed.json', () => {
  it('contains exactly 62 records', () => {
    expect(seed.length).toBe(62);
  });

  it('has unique ids', () => {
    const ids = seed.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const u of seed as SeedRecord[]) {
    describe(u.id, () => {
      it('conforms to university.schema.json', () => {
        const valid = validate(u);
        expect(valid, JSON.stringify(validate.errors)).toBe(true);
      });

      it('major_categories are all from data/major-categories.json', () => {
        for (const category of u.major_categories) {
          expect(VALID_CATEGORY_IDS.has(category)).toBe(true);
        }
      });

      it('field_confidence values are valid confidence levels', () => {
        for (const level of Object.values(u.field_confidence)) {
          expect(VALID_CONFIDENCE_LEVELS.has(level as string)).toBe(true);
        }
      });

      it('SAT bands are non-decreasing when present', () => {
        if (u.sat25 !== null && u.sat50 !== null && u.sat75 !== null) {
          expect(u.sat25).toBeLessThanOrEqual(u.sat50);
          expect(u.sat50).toBeLessThanOrEqual(u.sat75);
        }
      });

      it('ACT bands are non-decreasing when present', () => {
        if (u.act25 !== null && u.act50 !== null && u.act75 !== null) {
          expect(u.act25).toBeLessThanOrEqual(u.act50);
          expect(u.act50).toBeLessThanOrEqual(u.act75);
        }
      });

      it('intl acceptance rate does not exceed overall when both present', () => {
        if (u.acceptance_rate_intl !== null) {
          expect(u.acceptance_rate_intl).toBeLessThanOrEqual(u.acceptance_rate_overall);
        }
      });
    });
  }
});
