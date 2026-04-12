import type { ExerciseQuestionModel } from './exercise-types';

const STAR_RATING_DEFAULT_MAX = 5;
const STAR_RATING_ABSOLUTE_MAX = 10;

/** Max star count for STAR questions (from `question.settings.maxStars`, clamped). */
export function getStarRatingMaxFromSettings(settings: ExerciseQuestionModel['settings']): number {
  const raw = settings?.maxStars;
  const parsed = typeof raw === 'number' ? raw : raw != null ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return STAR_RATING_DEFAULT_MAX;

  return Math.min(STAR_RATING_ABSOLUTE_MAX, Math.max(1, Math.floor(parsed)));
}

export function isValidStarRatingValue(value: unknown, maxStars: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= maxStars;
}
