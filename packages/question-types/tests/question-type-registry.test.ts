import { describe, expect, it } from 'vitest';
import {
  AUTO_GRADABLE_QUESTION_TYPE_IDS,
  QUESTION_TYPE_BY_KEY,
  QUESTION_TYPE_ID_TO_KEY,
  QUESTION_TYPE_IDS,
  QUESTION_TYPE_KEY,
  QUESTION_TYPE_REGISTRY,
  QUESTION_TYPE_TYPENAME_TO_KEY,
  getQuestionTypeById,
  getQuestionTypeByKey,
  getQuestionTypeByTypename,
  getQuestionTypeId,
  isAutoGradableQuestionType,
  isAutoGradableQuestionTypeId,
  requiresManualGrading,
  supportsPartialCredit
} from '../src';

const EXPECTED_REGISTRY = [
  {
    key: QUESTION_TYPE_KEY.RADIO,
    typename: 'RADIO',
    id: 1,
    autoGradable: true,
    supportsPartialCredit: false,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.CHECKBOX,
    typename: 'CHECKBOX',
    id: 2,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.TEXTAREA,
    typename: 'TEXTAREA',
    id: 3,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  },
  {
    key: QUESTION_TYPE_KEY.TRUE_FALSE,
    typename: 'TRUE_FALSE',
    id: 4,
    autoGradable: true,
    supportsPartialCredit: false,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.SHORT_ANSWER,
    typename: 'SHORT_ANSWER',
    id: 5,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  },
  {
    key: QUESTION_TYPE_KEY.NUMERIC,
    typename: 'NUMERIC',
    id: 6,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.FILL_BLANK,
    typename: 'FILL_BLANK',
    id: 7,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.FILE_UPLOAD,
    typename: 'FILE_UPLOAD',
    id: 8,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  },
  {
    key: QUESTION_TYPE_KEY.ORDERING,
    typename: 'ORDERING',
    id: 9,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.LINK,
    typename: 'LINK',
    id: 10,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  },
  {
    key: QUESTION_TYPE_KEY.WORD_BANK,
    typename: 'WORD_BANK',
    id: 11,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.STAR,
    typename: 'STAR',
    id: 12,
    autoGradable: true,
    supportsPartialCredit: false,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.VIDEO_RECORDING,
    typename: 'VIDEO_RECORDING',
    id: 13,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  },
  {
    key: QUESTION_TYPE_KEY.THUMBS,
    typename: 'THUMBS',
    id: 14,
    autoGradable: true,
    supportsPartialCredit: false,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.MATCHING,
    typename: 'MATCHING',
    id: 15,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false,
    disabled: true
  },
  {
    key: QUESTION_TYPE_KEY.HOTSPOT,
    typename: 'HOTSPOT',
    id: 16,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false,
    disabled: true
  }
] as const;

// Canonical `question_type` rows in the database (the source of truth ids are
// resolved against). Ids 1-14 are the live rows in insertion order; MATCHING and
// HOTSPOT are intentionally absent (built-but-disabled). This list guards against
// the registry id ever drifting from the DB again.
const CANONICAL_DB_QUESTION_TYPES: ReadonlyArray<{ id: number; typename: string }> = [
  { id: 1, typename: 'RADIO' },
  { id: 2, typename: 'CHECKBOX' },
  { id: 3, typename: 'TEXTAREA' },
  { id: 4, typename: 'TRUE_FALSE' },
  { id: 5, typename: 'SHORT_ANSWER' },
  { id: 6, typename: 'NUMERIC' },
  { id: 7, typename: 'FILL_BLANK' },
  { id: 8, typename: 'FILE_UPLOAD' },
  { id: 9, typename: 'ORDERING' },
  { id: 10, typename: 'LINK' },
  { id: 11, typename: 'WORD_BANK' },
  { id: 12, typename: 'STAR' },
  { id: 13, typename: 'VIDEO_RECORDING' },
  { id: 14, typename: 'THUMBS' }
];

describe('question type registry', () => {
  it('contains exactly the supported question type keys', () => {
    expect(new Set(QUESTION_TYPE_REGISTRY.map((entry) => entry.key))).toEqual(
      new Set(Object.values(QUESTION_TYPE_KEY))
    );
  });

  it('builds frozen key, typename, and id lookup maps', () => {
    expect(Object.isFrozen(QUESTION_TYPE_BY_KEY)).toBe(true);
    expect(Object.isFrozen(QUESTION_TYPE_IDS)).toBe(true);
    expect(Object.isFrozen(QUESTION_TYPE_TYPENAME_TO_KEY)).toBe(true);
    expect(Object.isFrozen(QUESTION_TYPE_ID_TO_KEY)).toBe(true);
  });

  it('keeps metadata, lookups, ids, and capability flags in sync', () => {
    for (const expected of EXPECTED_REGISTRY) {
      const metadata = QUESTION_TYPE_REGISTRY.find((entry) => entry.key === expected.key);
      expect(metadata).toBeDefined();
      expect(metadata).toMatchObject(expected);

      expect(QUESTION_TYPE_BY_KEY[expected.key]).toEqual(metadata);
      expect(QUESTION_TYPE_IDS[expected.key]).toBe(expected.id);
      expect(QUESTION_TYPE_TYPENAME_TO_KEY[expected.typename]).toBe(expected.key);
      expect(QUESTION_TYPE_ID_TO_KEY[expected.id]).toBe(expected.key);

      expect(getQuestionTypeByKey(expected.key)).toEqual(metadata);
      expect(getQuestionTypeByTypename(expected.typename)).toEqual(metadata);
      expect(getQuestionTypeById(expected.id)).toEqual(metadata);
      expect(getQuestionTypeId(expected.key)).toBe(expected.id);

      expect(isAutoGradableQuestionType(expected.key)).toBe(expected.autoGradable);
      expect(supportsPartialCredit(expected.key)).toBe(expected.supportsPartialCredit);
      expect(requiresManualGrading(expected.key)).toBe(expected.manualGradingRequired);
    }
  });

  it('registry ids match the canonical question_type DB rows (no drift)', () => {
    for (const row of CANONICAL_DB_QUESTION_TYPES) {
      const key = QUESTION_TYPE_TYPENAME_TO_KEY[row.typename];
      expect(key, `typename ${row.typename} missing from registry`).toBeDefined();
      expect(QUESTION_TYPE_IDS[key], `id mismatch for ${row.typename}`).toBe(row.id);
    }
  });

  it('keeps disabled types appended after every DB-backed type', () => {
    const dbIds = new Set(CANONICAL_DB_QUESTION_TYPES.map((row) => row.id));
    const maxDbId = Math.max(...CANONICAL_DB_QUESTION_TYPES.map((row) => row.id));

    for (const entry of QUESTION_TYPE_REGISTRY) {
      if (entry.disabled) {
        // Disabled types have no DB row and must sit past the live id range.
        expect(dbIds.has(entry.id), `disabled ${entry.typename} must not reuse a DB id`).toBe(false);
        expect(entry.id).toBeGreaterThan(maxDbId);
      } else {
        expect(dbIds.has(entry.id), `enabled ${entry.typename} must map to a DB row`).toBe(true);
      }
    }
  });

  it('returns undefined for unknown typename and id lookups', () => {
    expect(getQuestionTypeByTypename('UNKNOWN')).toBeUndefined();
    expect(getQuestionTypeById(999)).toBeUndefined();
  });

  it('AUTO_GRADABLE_QUESTION_TYPE_IDS matches registry flag by id', () => {
    const expectedIds = QUESTION_TYPE_REGISTRY.filter((entry) => entry.autoGradable).map((entry) => entry.id);
    expect(AUTO_GRADABLE_QUESTION_TYPE_IDS).toEqual(expectedIds);
  });

  it('isAutoGradableQuestionTypeId agrees with isAutoGradableQuestionType for every registry entry', () => {
    for (const entry of QUESTION_TYPE_REGISTRY) {
      expect(isAutoGradableQuestionTypeId(entry.id)).toBe(entry.autoGradable);
      expect(isAutoGradableQuestionTypeId(entry.id)).toBe(isAutoGradableQuestionType(entry.key));
    }
    expect(isAutoGradableQuestionTypeId(9999)).toBe(false);
  });
});
