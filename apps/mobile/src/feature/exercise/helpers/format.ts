import type { ExerciseTranslator } from '@/feature/exercise/types/exercise';
import type { Formatters } from '@/feature/i18n/helpers/use-formatters';
import type { Locale } from '@/feature/i18n/types/i18n';

/** Rounds to one decimal place, the precision scores are shown at. */
export function formatScore(points: number, format: Formatters) {
  return format.number(Math.round(points * 10) / 10);
}

export function formatPoints(points: number, t: ExerciseTranslator, format: Formatters) {
  const rounded = Math.round(points * 100) / 100;

  return t('points', { count: rounded, points: format.number(rounded) });
}

const SIZE_KEYS = ['sizeBytes', 'sizeKilobytes', 'sizeMegabytes', 'sizeGigabytes'] as const;

export function formatFileSize(bytes: number | undefined, t: ExerciseTranslator, format: Formatters) {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '';

  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_KEYS.length - 1);
  const size = parseFloat((bytes / 1024 ** unitIndex).toFixed(1));

  return t(SIZE_KEYS[unitIndex] ?? 'sizeBytes', { count: size, size: format.number(size) });
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string | null | undefined, locale: Locale) {
  const date = parseDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function isPast(value: string | null | undefined) {
  const date = parseDate(value);

  return date !== null && date.getTime() < Date.now();
}
