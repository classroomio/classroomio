import {
  QUESTION_TYPE_KEY,
  getExerciseQuestionContractKey,
  getQuestionTypeById,
  type ExerciseQuestionModel,
  type ExerciseQuestionOption,
  type ExerciseQuestionTypeKey
} from '@cio/question-types';
import type { Question } from '$features/course/types';
import { DEFAULT_QUESTION_TYPE, QUESTION_TYPES } from '$features/ui/question/constants';
import { t } from '$lib/utils/functions/translations';

type QuestionTypeOption = (typeof QUESTION_TYPES)[number];

/** Label for exercise editor picker and lists (translations via labelKey when present). */
export function getExerciseEditorQuestionTypeLabel(
  questionType: Question['questionType'] | QuestionTypeOption | null | undefined
): string {
  if (!questionType) return t.get('course.navItem.lessons.exercises.all_exercises.edit_mode.select_type');
  if ('labelKey' in questionType && questionType.labelKey) return t.get(questionType.labelKey);
  return questionType.label ?? t.get('course.navItem.lessons.exercises.all_exercises.edit_mode.select_type');
}

const OPTION_QUESTION_TYPE_KEYS = new Set<ExerciseQuestionTypeKey>([
  QUESTION_TYPE_KEY.RADIO,
  QUESTION_TYPE_KEY.CHECKBOX,
  QUESTION_TYPE_KEY.TRUE_FALSE,
  QUESTION_TYPE_KEY.THUMBS
]);

export function getQuestionTypeId(question: Partial<Question>): number {
  const value = Number(question.questionTypeId ?? question.questionType?.id ?? DEFAULT_QUESTION_TYPE?.id ?? 1);
  return Number.isNaN(value) ? (DEFAULT_QUESTION_TYPE?.id ?? 1) : value;
}

export function getQuestionTypeOptionById(questionTypeId: number): QuestionTypeOption {
  return QUESTION_TYPES.find((questionType) => questionType.id === questionTypeId) ?? DEFAULT_QUESTION_TYPE;
}

export function getQuestionTypeKeyFromId(questionTypeId: number): ExerciseQuestionTypeKey {
  return getQuestionTypeById(questionTypeId)?.key ?? QUESTION_TYPE_KEY.RADIO;
}

export function getQuestionTypeKey(question: Partial<Question>): ExerciseQuestionTypeKey {
  return getQuestionTypeKeyFromId(getQuestionTypeId(question));
}

export function questionTypeSupportsOptions(questionTypeKey: ExerciseQuestionTypeKey): boolean {
  return OPTION_QUESTION_TYPE_KEYS.has(questionTypeKey);
}

export function toExerciseQuestionModel(question: Question): ExerciseQuestionModel {
  const options: ExerciseQuestionOption[] = (question.options || [])
    .filter((option) => !option.deletedAt)
    .map((option) => ({
      id: option.id,
      label: option.label || String(option.value ?? ''),
      value: option.value ?? undefined,
      isCorrect: option.isCorrect,
      settings:
        option.settings && typeof option.settings === 'object' && !Array.isArray(option.settings)
          ? { ...option.settings }
          : undefined
    }));

  const rawSettings = (question as Question & { settings?: Record<string, unknown> }).settings;
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const required =
    typeof (question as Question & { required?: boolean }).required === 'boolean'
      ? (question as Question & { required?: boolean }).required
      : typeof settings.required === 'boolean'
        ? settings.required
        : true;

  return {
    id: question.id,
    key: question.name ? String(question.name) : question.id ? String(question.id) : undefined,
    title: question.title || '',
    questionType: getQuestionTypeKey(question),
    points: Number(question.points || 0),
    required,
    options,
    settings
  };
}

export function getQuestionAnswerKey(question: Question, fallbackIndex = 0): string {
  return getExerciseQuestionContractKey(toExerciseQuestionModel(question), fallbackIndex);
}
