import { QUESTION_TYPE } from '@cio/utils/validation/constants';

import type { ExerciseMessageKey, QuestionTypeKey } from '@/feature/exercise/types/exercise';

export const QUESTION_TYPE_KEY_BY_ID: Readonly<Record<number, QuestionTypeKey>> = Object.fromEntries(
  Object.entries(QUESTION_TYPE).map(([key, id]) => [id, key as QuestionTypeKey])
);

export const QUESTION_TYPE_LABEL_KEY: Record<QuestionTypeKey, ExerciseMessageKey> = {
  RADIO: 'typeRadio',
  CHECKBOX: 'typeCheckbox',
  TEXTAREA: 'typeTextarea',
  TRUE_FALSE: 'typeTrueFalse',
  SHORT_ANSWER: 'typeShortAnswer',
  NUMERIC: 'typeNumeric',
  FILL_BLANK: 'typeFillBlank',
  FILE_UPLOAD: 'typeFileUpload',
  MATCHING: 'typeMatching',
  ORDERING: 'typeOrdering',
  HOTSPOT: 'typeHotspot',
  LINK: 'typeLink',
  WORD_BANK: 'typeWordBank',
  STAR: 'typeStar',
  VIDEO_RECORDING: 'typeVideoRecording',
  THUMBS: 'typeThumbs'
};

export const STAR_RATING_DEFAULT_MAX = 5;
export const STAR_RATING_ABSOLUTE_MAX = 10;

export const VIDEO_RECORDING_DEFAULT_MAX_SECONDS = 60;
export const VIDEO_RECORDING_PLATFORM_MAX_SECONDS = 120;
export const VIDEO_RECORDING_MIN_SECONDS = 1;
