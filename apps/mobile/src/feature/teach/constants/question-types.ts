import type { en } from '@/feature/teach/translations/en';
import type { QuestionTypeKey } from '@/feature/teach/types/teach';

/** `teachCatalog` keys naming each question type. */
export const QUESTION_TYPE_KEYS = {
  RADIO: 'questionTypeRadio',
  CHECKBOX: 'questionTypeCheckbox',
  TEXTAREA: 'questionTypeTextarea',
  TRUE_FALSE: 'questionTypeTrueFalse',
  SHORT_ANSWER: 'questionTypeShortAnswer',
  NUMERIC: 'questionTypeNumeric',
  FILL_BLANK: 'questionTypeFillBlank',
  FILE_UPLOAD: 'questionTypeFileUpload',
  MATCHING: 'questionTypeMatching',
  ORDERING: 'questionTypeOrdering',
  HOTSPOT: 'questionTypeHotspot',
  LINK: 'questionTypeLink',
  WORD_BANK: 'questionTypeWordBank',
  STAR: 'questionTypeStar',
  VIDEO_RECORDING: 'questionTypeVideoRecording',
  THUMBS: 'questionTypeThumbs'
} as const satisfies Record<QuestionTypeKey, keyof typeof en>;

export type AnswerKind = 'written' | 'video' | 'file' | 'link' | 'image' | 'choices';

/** How an answer reads in a queue row, so a tutor can tell what to expect before opening it. */
export const ANSWER_KINDS: Record<QuestionTypeKey, AnswerKind> = {
  RADIO: 'choices',
  CHECKBOX: 'choices',
  TRUE_FALSE: 'choices',
  THUMBS: 'choices',
  STAR: 'choices',
  TEXTAREA: 'written',
  SHORT_ANSWER: 'written',
  FILL_BLANK: 'written',
  WORD_BANK: 'written',
  NUMERIC: 'written',
  MATCHING: 'written',
  ORDERING: 'written',
  HOTSPOT: 'image',
  LINK: 'link',
  FILE_UPLOAD: 'file',
  VIDEO_RECORDING: 'video'
};

export const ANSWER_KIND_KEYS = {
  written: 'answerKindWritten',
  video: 'answerKindVideo',
  file: 'answerKindFile',
  link: 'answerKindLink',
  image: 'answerKindImage',
  choices: 'answerKindChoices'
} as const satisfies Record<AnswerKind, keyof typeof en>;

export const ANSWER_KIND_ORDER: AnswerKind[] = ['written', 'video', 'file', 'link', 'image', 'choices'];
