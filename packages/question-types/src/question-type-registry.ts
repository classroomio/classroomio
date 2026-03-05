import { QUESTION_TYPE_KEY, type QuestionTypeKey } from './question-type-keys';
import type { QuestionTypeMetadata } from './question-type-types';

export const QUESTION_TYPE_REGISTRY: readonly QuestionTypeMetadata[] = [
  {
    key: QUESTION_TYPE_KEY.RADIO,
    typename: 'RADIO',
    label: 'Single answer',
    id: 1,
    autoGradable: true,
    supportsPartialCredit: false,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.CHECKBOX,
    typename: 'CHECKBOX',
    label: 'Multiple answers',
    id: 2,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.TEXTAREA,
    typename: 'TEXTAREA',
    label: 'Paragraph',
    id: 3,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  },
  {
    key: QUESTION_TYPE_KEY.TRUE_FALSE,
    typename: 'TRUE_FALSE',
    label: 'True/False',
    id: 4,
    autoGradable: true,
    supportsPartialCredit: false,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.SHORT_ANSWER,
    typename: 'SHORT_ANSWER',
    label: 'Short answer',
    id: 5,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  },
  {
    key: QUESTION_TYPE_KEY.NUMERIC,
    typename: 'NUMERIC',
    label: 'Numeric answer',
    id: 6,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.FILL_BLANK,
    typename: 'FILL_BLANK',
    label: 'Fill in the blank',
    id: 7,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.FILE_UPLOAD,
    typename: 'FILE_UPLOAD',
    label: 'File upload',
    id: 8,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  },
  {
    key: QUESTION_TYPE_KEY.MATCHING,
    typename: 'MATCHING',
    label: 'Matching',
    id: 9,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.ORDERING,
    typename: 'ORDERING',
    label: 'Ordering',
    id: 10,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.HOTSPOT,
    typename: 'HOTSPOT',
    label: 'Hotspot',
    id: 11,
    autoGradable: true,
    supportsPartialCredit: true,
    manualGradingRequired: false
  },
  {
    key: QUESTION_TYPE_KEY.LINK,
    typename: 'LINK',
    label: 'Links',
    id: 12,
    autoGradable: false,
    supportsPartialCredit: false,
    manualGradingRequired: true
  }
] as const;

export const QUESTION_TYPE_BY_KEY = Object.freeze(
  QUESTION_TYPE_REGISTRY.reduce(
    (acc, type) => {
      acc[type.key] = type;
      return acc;
    },
    {} as Record<QuestionTypeKey, QuestionTypeMetadata>
  )
);

export const QUESTION_TYPE_IDS = Object.freeze(
  QUESTION_TYPE_REGISTRY.reduce(
    (acc, type) => {
      acc[type.key] = type.id;
      return acc;
    },
    {} as Record<QuestionTypeKey, number>
  )
);

export const QUESTION_TYPE_TYPENAME_TO_KEY = Object.freeze(
  QUESTION_TYPE_REGISTRY.reduce(
    (acc, type) => {
      acc[type.typename] = type.key;
      return acc;
    },
    {} as Record<string, QuestionTypeKey>
  )
);

export const QUESTION_TYPE_ID_TO_KEY = Object.freeze(
  QUESTION_TYPE_REGISTRY.reduce(
    (acc, type) => {
      acc[type.id] = type.key;
      return acc;
    },
    {} as Record<number, QuestionTypeKey>
  )
);
