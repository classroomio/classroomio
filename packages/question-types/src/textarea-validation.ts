import type { ExerciseQuestionModel } from './exercise-types';

export interface TextareaCharacterLimits {
  minCharacters?: number;
  maxCharacters?: number;
}

export interface TextareaAnswerValidation extends TextareaCharacterLimits {
  characterCount: number;
  isValid: boolean;
  reason: 'below_min' | 'above_max' | null;
}

type SettingsLike = Pick<ExerciseQuestionModel, 'settings'> | Record<string, unknown> | null | undefined;

export function sanitizeTextareaCharacterLimit(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 0) return undefined;

  return Math.floor(parsed);
}

function resolveSettings(input: SettingsLike): Record<string, unknown> {
  if (!input || typeof input !== 'object') return {};

  if ('settings' in input && input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings)) {
    return input.settings as Record<string, unknown>;
  }

  return input as Record<string, unknown>;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/gi, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

export function getTextareaCharacterLimits(input: SettingsLike): TextareaCharacterLimits {
  const settings = resolveSettings(input);
  const minCharacters = sanitizeTextareaCharacterLimit(settings.minCharacters);
  const rawMaxCharacters = sanitizeTextareaCharacterLimit(settings.maxCharacters);
  const maxCharacters =
    minCharacters !== undefined && rawMaxCharacters !== undefined && rawMaxCharacters < minCharacters
      ? minCharacters
      : rawMaxCharacters;

  return {
    minCharacters,
    maxCharacters
  };
}

export function getTextareaAnswerText(value: string | null | undefined): string {
  const html = String(value ?? '');

  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, '\n')
      .replace(/<li\b[^>]*>/gi, '- ')
      .replace(/<[^>]*>/g, '')
      .replace(/\r\n?/g, '\n')
  ).trim();
}

export function getTextareaAnswerCharacterCount(value: string | null | undefined): number {
  return getTextareaAnswerText(value).length;
}

export function validateTextareaAnswer(
  value: string | null | undefined,
  input: SettingsLike
): TextareaAnswerValidation {
  const { minCharacters, maxCharacters } = getTextareaCharacterLimits(input);
  const characterCount = getTextareaAnswerCharacterCount(value);

  if (minCharacters !== undefined && characterCount < minCharacters) {
    return {
      characterCount,
      minCharacters,
      maxCharacters,
      isValid: false,
      reason: 'below_min'
    };
  }

  if (maxCharacters !== undefined && characterCount > maxCharacters) {
    return {
      characterCount,
      minCharacters,
      maxCharacters,
      isValid: false,
      reason: 'above_max'
    };
  }

  return {
    characterCount,
    minCharacters,
    maxCharacters,
    isValid: true,
    reason: null
  };
}
