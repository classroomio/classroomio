import {
  QUESTION_TYPE_KEY_BY_ID,
  STAR_RATING_ABSOLUTE_MAX,
  STAR_RATING_DEFAULT_MAX,
  VIDEO_RECORDING_DEFAULT_MAX_SECONDS,
  VIDEO_RECORDING_PLATFORM_MAX_SECONDS
} from '@/feature/exercise/constants/question-types';
import type { Exercise, ExerciseOption, ExerciseQuestion, QuestionTypeKey } from '@/feature/exercise/types/exercise';

type Settings = Record<string, unknown>;

export function settingsOf(question: ExerciseQuestion): Settings {
  const settings: unknown = question.settings;

  return settings && typeof settings === 'object' && !Array.isArray(settings) ? (settings as Settings) : {};
}

export function questionKeyOf(question: ExerciseQuestion) {
  return String(question.id);
}

export function questionTypeOf(question: ExerciseQuestion): QuestionTypeKey | null {
  return QUESTION_TYPE_KEY_BY_ID[Number(question.questionTypeId)] ?? null;
}

export function isQuestionRequired(question: ExerciseQuestion) {
  return settingsOf(question).required !== false;
}

export function activeQuestionsOf(exercise: Exercise): ExerciseQuestion[] {
  return [...(exercise.questions ?? [])]
    .filter((question) => !('deletedAt' in question && question.deletedAt))
    .sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));
}

export function totalPointsOf(questions: ExerciseQuestion[]) {
  return questions.reduce((total, question) => total + Number(question.points ?? 0), 0);
}

export function activeOptionsOf(question: ExerciseQuestion): ExerciseOption[] {
  return (question.options ?? []).filter((option) => !('deletedAt' in option && option.deletedAt));
}

export function stringSetting(question: ExerciseQuestion, key: string) {
  const value = settingsOf(question)[key];

  return typeof value === 'string' ? value : '';
}

export function numberSetting(question: ExerciseQuestion, key: string) {
  const raw = settingsOf(question)[key];
  const value = typeof raw === 'number' ? raw : raw != null && raw !== '' ? Number(raw) : Number.NaN;

  return Number.isFinite(value) ? value : null;
}

export function stringListSetting(question: ExerciseQuestion, key: string) {
  const value = settingsOf(question)[key];

  return Array.isArray(value) ? value.map((item) => String(item ?? '')) : [];
}

export function questionImageUrlsOf(question: ExerciseQuestion) {
  const urls = stringListSetting(question, 'imageUrls').filter((url) => url.trim().length > 0);
  if (urls.length > 0) return urls;

  const legacy = stringSetting(question, 'imageUrl').trim();

  return legacy ? [legacy] : [];
}

export function starMaxOf(question: ExerciseQuestion) {
  const value = numberSetting(question, 'maxStars');
  if (value === null || value < 1) return STAR_RATING_DEFAULT_MAX;

  return Math.min(STAR_RATING_ABSOLUTE_MAX, Math.floor(value));
}

export function videoMaxSecondsOf(question: ExerciseQuestion) {
  const value = numberSetting(question, 'maxDurationSeconds');
  if (value === null || value <= 0) return VIDEO_RECORDING_DEFAULT_MAX_SECONDS;

  return Math.min(Math.round(value), VIDEO_RECORDING_PLATFORM_MAX_SECONDS);
}

export function characterLimitsOf(question: ExerciseQuestion) {
  const min = numberSetting(question, 'minCharacters');
  const max = numberSetting(question, 'maxCharacters');
  const minCharacters = min !== null && min >= 0 ? Math.floor(min) : undefined;
  const rawMax = max !== null && max >= 0 ? Math.floor(max) : undefined;
  const maxCharacters =
    minCharacters !== undefined && rawMax !== undefined && rawMax < minCharacters ? minCharacters : rawMax;

  return { minCharacters, maxCharacters };
}

export function fillBlankCountOf(question: ExerciseQuestion) {
  const accepted = stringSetting(question, 'acceptedAnswers')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);

  return Math.max(1, accepted.length);
}

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#x27': "'" };

/** Converts stored rich text (HTML from the web editor) to readable plain text. */
export function plainTextOf(html: string | null | undefined) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|#x27);/gi, (_, entity: string) => ENTITIES[entity.toLowerCase()] ?? '')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
