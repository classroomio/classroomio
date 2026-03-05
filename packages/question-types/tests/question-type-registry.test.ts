import { describe, expect, it } from 'vitest';
import {
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
    key: QUESTION_TYPE_KEY.MATCHING,
    typename: 'MATCHING',
    id: 9,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.ORDERING,
    typename: 'ORDERING',
    id: 10,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.HOTSPOT,
    typename: 'HOTSPOT',
    id: 11,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.LINK,
    typename: 'LINK',
    id: 12,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  }
] as const;

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

  it('returns undefined for unknown typename and id lookups', () => {
    expect(getQuestionTypeByTypename('UNKNOWN')).toBeUndefined();
    expect(getQuestionTypeById(999)).toBeUndefined();
  });
});
