import {
  CHECKBOX_FIXTURE,
  FILL_BLANK_FIXTURE,
  NUMERIC_FIXTURE,
  ORDERING_FIXTURE,
  RADIO_FIXTURE,
  STAR_FIXTURE,
  TRUE_FALSE_FIXTURE,
  WORD_BANK_FIXTURE,
  type QuestionStoryFixture
} from '../exercise-question/question-fixtures';

export type CheckpointTypeId =
  | 'RADIO'
  | 'CHECKBOX'
  | 'TRUE_FALSE'
  | 'NUMERIC'
  | 'FILL_BLANK'
  | 'WORD_BANK'
  | 'ORDERING'
  | 'STAR';

export type CheckpointTypeOption = {
  id: CheckpointTypeId;
  label: string;
  kicker: string;
  fixture: QuestionStoryFixture;
};

export const CHECKPOINT_TYPES: CheckpointTypeOption[] = [
  { id: 'RADIO', label: 'Single', kicker: 'Question · 0:45 · Single answer', fixture: RADIO_FIXTURE },
  { id: 'CHECKBOX', label: 'Multiple', kicker: 'Question · 1:20 · Multiple answers', fixture: CHECKBOX_FIXTURE },
  { id: 'TRUE_FALSE', label: 'T/F', kicker: 'Question · 2:14 · True / false', fixture: TRUE_FALSE_FIXTURE },
  { id: 'NUMERIC', label: 'Numeric', kicker: 'Question · 3:02 · Numeric', fixture: NUMERIC_FIXTURE },
  { id: 'FILL_BLANK', label: 'Blank', kicker: 'Question · 3:40 · Fill in the blank', fixture: FILL_BLANK_FIXTURE },
  { id: 'WORD_BANK', label: 'Word bank', kicker: 'Question · 4:10 · Word bank', fixture: WORD_BANK_FIXTURE },
  { id: 'ORDERING', label: 'Order', kicker: 'Question · 4:48 · Ordering', fixture: ORDERING_FIXTURE },
  { id: 'STAR', label: 'Stars', kicker: 'Question · 5:20 · Star rating', fixture: STAR_FIXTURE }
];

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Compact take-mode fixtures so options fit beside the pinned Continue footer. */
export function toOverlayQuestion(question: Record<string, unknown>): Record<string, unknown> {
  const cloned = cloneJson(question);
  const settings = isRecord(cloned.settings) ? { ...cloned.settings } : {};
  delete settings.imageUrls;
  delete settings.imageUrl;
  delete settings.videoUrls;
  delete settings.videoUrl;
  cloned.settings = settings;

  if (Array.isArray(cloned.options)) {
    cloned.options = cloned.options.map((option) => {
      if (!isRecord(option)) return option;

      const nextOption = { ...option };
      if (isRecord(nextOption.settings)) {
        const optionSettings = { ...nextOption.settings };
        delete optionSettings.imageUrl;
        nextOption.settings = optionSettings;
      }

      return nextOption;
    });
  }

  return cloned;
}

export function getCheckpointType(id: CheckpointTypeId): CheckpointTypeOption {
  const match = CHECKPOINT_TYPES.find((type) => type.id === id);

  if (!match) {
    return CHECKPOINT_TYPES[0];
  }

  return match;
}
