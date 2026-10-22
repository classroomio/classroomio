import { QUESTION_TYPE_KEY, type ExerciseQuestionModel, type QuestionTypeKey } from '@cio/question-types';
import type { TVideoCheckpointUpdate } from '@cio/utils/validation/lesson';
import { t } from '$lib/utils/functions/translations';
import type { VideoCheckpoint } from '$features/course/utils/types';
import {
  CHECKPOINT_COLLISION_GAP_SECONDS,
  CHECKPOINT_QUESTION_TYPE_KEYS,
  type CheckpointQuestionType,
  type CheckpointResumePolicy
} from './checkpoint-types';

export function isCheckpointQuestionType(value: string): value is CheckpointQuestionType {
  return (CHECKPOINT_QUESTION_TYPE_KEYS as readonly string[]).includes(value);
}

export function formatCheckpointTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function parseCheckpointTimestamp(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const clockMatch = trimmed.match(/^(\d+):([0-5]?\d)$/);
  if (clockMatch) {
    return Number(clockMatch[1]) * 60 + Number(clockMatch[2]);
  }

  const asNumber = Number(trimmed);
  if (!Number.isFinite(asNumber) || asNumber < 0) return null;

  return Math.floor(asNumber);
}

export function cloneCheckpointValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyStrings(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;

  return value.every((item) => String(item ?? '').trim().length > 0);
}

export function createEmptyCheckpointQuestion(questionType: CheckpointQuestionType): ExerciseQuestionModel {
  const id = crypto.randomUUID();

  if (questionType === QUESTION_TYPE_KEY.RADIO || questionType === QUESTION_TYPE_KEY.CHECKBOX) {
    return {
      id,
      key: id,
      title: '',
      questionType,
      points: 1,
      required: true,
      settings: {},
      options: [
        { id: 1, label: '', isCorrect: true },
        { id: 2, label: '', isCorrect: false }
      ]
    };
  }

  if (questionType === QUESTION_TYPE_KEY.TRUE_FALSE) {
    return {
      id,
      key: id,
      title: '',
      questionType,
      points: 1,
      required: true,
      settings: { correctValue: true },
      options: [
        {
          id: 1,
          label: t.get('course.navItem.lessons.materials.tabs.video.checkpoints.true_label'),
          value: 'true',
          isCorrect: true
        },
        {
          id: 2,
          label: t.get('course.navItem.lessons.materials.tabs.video.checkpoints.false_label'),
          value: 'false',
          isCorrect: false
        }
      ]
    };
  }

  if (questionType === QUESTION_TYPE_KEY.NUMERIC) {
    return {
      id,
      key: id,
      title: '',
      questionType,
      points: 1,
      required: true,
      settings: { correctValue: 0, tolerance: 0 },
      options: []
    };
  }

  if (questionType === QUESTION_TYPE_KEY.STAR) {
    return {
      id,
      key: id,
      title: '',
      questionType,
      points: 1,
      required: true,
      settings: { correctValue: 1, maxStars: 5 },
      options: []
    };
  }

  if (questionType === QUESTION_TYPE_KEY.FILL_BLANK) {
    return {
      id,
      key: id,
      title: '',
      questionType,
      points: 1,
      required: true,
      settings: { acceptedAnswers: '' },
      options: []
    };
  }

  if (questionType === QUESTION_TYPE_KEY.WORD_BANK) {
    return {
      id,
      key: id,
      title: '',
      questionType,
      points: 1,
      required: true,
      settings: { template: '___', correctAnswers: [''], distractors: [] },
      options: []
    };
  }

  return {
    id,
    key: id,
    title: '',
    questionType,
    points: 1,
    required: true,
    settings: { items: ['', ''] },
    options: [
      { id: 'order-1', label: '', value: '' },
      { id: 'order-2', label: '', value: '' }
    ]
  };
}

export function toOverlayCheckpointQuestion(question: ExerciseQuestionModel): ExerciseQuestionModel {
  const cloned = cloneCheckpointValue(question);
  const settings = isRecord(cloned.settings) ? { ...cloned.settings } : {};
  delete settings.imageUrls;
  delete settings.imageUrl;
  delete settings.videoUrls;
  delete settings.videoUrl;
  cloned.settings = settings;

  if (Array.isArray(cloned.options)) {
    cloned.options = cloned.options.map((option) => {
      if (!isRecord(option.settings)) return option;

      const optionSettings = { ...option.settings };
      delete optionSettings.imageUrl;

      return { ...option, settings: optionSettings };
    });
  }

  return cloned;
}

export function isCheckpointAnswerComplete(answer: unknown): boolean {
  if (!isRecord(answer) || typeof answer.type !== 'string') return false;

  switch (answer.type) {
    case 'RADIO':
      return Number.isFinite(Number(answer.optionId));
    case 'CHECKBOX':
      return Array.isArray(answer.optionIds) && answer.optionIds.length > 0;
    case 'TRUE_FALSE':
      return typeof answer.value === 'boolean';
    case 'NUMERIC':
      return typeof answer.value === 'number' && Number.isFinite(answer.value);
    case 'FILL_BLANK':
      return nonEmptyStrings(answer.values);
    case 'WORD_BANK':
      return nonEmptyStrings(answer.filledBlanks);
    case 'ORDERING':
      return Array.isArray(answer.orderedValues) && answer.orderedValues.length > 0;
    case 'STAR':
      return typeof answer.value === 'number' && Number.isInteger(answer.value) && answer.value >= 1;
    default:
      return false;
  }
}

export function findCheckpointCollision(
  checkpoints: VideoCheckpoint[],
  timestampSeconds: number,
  excludeId?: string
): VideoCheckpoint | undefined {
  return checkpoints.find((checkpoint) => {
    if (excludeId && checkpoint.id === excludeId) return false;

    return Math.abs(checkpoint.timestampSeconds - timestampSeconds) < CHECKPOINT_COLLISION_GAP_SECONDS;
  });
}

export function getActiveOptions(question: ExerciseQuestionModel) {
  return (question.options ?? []).filter((option) => option.label.trim().length > 0 || option.value);
}

export function validateCheckpointQuestion(question: ExerciseQuestionModel): string | null {
  if (!question.title.trim()) {
    return 'title';
  }

  const questionType = question.questionType as QuestionTypeKey;

  if (questionType === QUESTION_TYPE_KEY.RADIO || questionType === QUESTION_TYPE_KEY.CHECKBOX) {
    const options = getActiveOptions(question);
    if (options.length < 2) return 'options';
    if (!options.some((option) => option.isCorrect)) return 'correct';
  }

  if (questionType === QUESTION_TYPE_KEY.NUMERIC) {
    if (!Number.isFinite(Number(question.settings?.correctValue))) return 'correct';
  }

  if (questionType === QUESTION_TYPE_KEY.STAR) {
    const maxStars = Number(question.settings?.maxStars ?? 5);
    const correctValue = Number(question.settings?.correctValue);
    if (!Number.isInteger(correctValue) || correctValue < 1 || correctValue > maxStars) return 'correct';
  }

  if (questionType === QUESTION_TYPE_KEY.FILL_BLANK) {
    if (!String(question.settings?.acceptedAnswers ?? '').trim()) return 'correct';
  }

  if (questionType === QUESTION_TYPE_KEY.WORD_BANK) {
    const template = String(question.settings?.template ?? '');
    const blankCount = (template.match(/_{3,}/g) ?? []).length;
    if (blankCount < 1) return 'template';
    const answers = Array.isArray(question.settings?.correctAnswers) ? question.settings.correctAnswers : [];
    if (answers.length < blankCount || answers.some((value) => !String(value ?? '').trim())) return 'correct';
  }

  if (questionType === QUESTION_TYPE_KEY.ORDERING) {
    const options = getActiveOptions(question);
    if (options.length < 2) return 'options';
  }

  return null;
}

export function checkpointPercent(timestampSeconds: number, durationSeconds: number): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;

  return Math.min(100, Math.max(0, (timestampSeconds / durationSeconds) * 100));
}

export function toCheckpointRequestBody(input: {
  timestampSeconds: number;
  resumePolicy: CheckpointResumePolicy;
  question: ExerciseQuestionModel;
}): TVideoCheckpointUpdate {
  const { question } = input;

  return {
    timestampSeconds: input.timestampSeconds,
    questionType: question.questionType as CheckpointQuestionType,
    title: question.title.trim(),
    settings: { ...(question.settings ?? {}) },
    resumePolicy: input.resumePolicy,
    options: getActiveOptions(question).map((option) => ({
      label: option.label,
      value: option.value ?? null,
      isCorrect: option.isCorrect ?? false,
      settings: option.settings ?? {}
    }))
  };
}
