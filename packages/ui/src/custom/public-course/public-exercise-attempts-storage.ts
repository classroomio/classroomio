import type { AnswerData } from '@cio/question-types';

/** Bump when persisted shape changes. */
export const PUBLIC_EXERCISE_ATTEMPTS_STORE_VERSION = 1;

export interface PublicExerciseStoredAttempt {
  /** ISO timestamp when the learner submitted answers. */
  savedAt: string;
  answersByKey: Record<string, AnswerData>;
  correctCount: number;
  totalGradable: number;
}

/** Plain deep clone — `structuredClone` throws on Svelte `$state` proxies. */
export function cloneAnswersByKey(answersByKey: Record<string, AnswerData>): Record<string, AnswerData> {
  return JSON.parse(JSON.stringify(answersByKey)) as Record<string, AnswerData>;
}

interface PersistedEnvelope {
  v: number;
  attempts: PublicExerciseStoredAttempt[];
}

/** Namespace localStorage keys — built by the consuming route (`courseSlug` + exercise `itemSlug`). */
export function publicExerciseAttemptsStorageKey(courseSlug: string, exerciseSlug: string): string {
  return `cio-public-exercise-attempts::v${PUBLIC_EXERCISE_ATTEMPTS_STORE_VERSION}::${courseSlug}::${exerciseSlug}`;
}

function isStoredAttempt(value: unknown): value is PublicExerciseStoredAttempt {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.savedAt === 'string' &&
    typeof row.answersByKey === 'object' &&
    row.answersByKey !== null &&
    typeof row.correctCount === 'number' &&
    Number.isFinite(row.correctCount) &&
    typeof row.totalGradable === 'number' &&
    Number.isFinite(row.totalGradable)
  );
}

/** Read persisted attempts — returns newest-last order. Empty if missing or malformed. */
export function readPublicExerciseAttempts(storageKey: string | null): PublicExerciseStoredAttempt[] {
  if (!storageKey || typeof localStorage === 'undefined') return [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    const envelope =
      parsed && typeof parsed === 'object' && 'attempts' in parsed ? (parsed as PersistedEnvelope) : null;

    if (!envelope || !Array.isArray(envelope.attempts)) return [];

    return envelope.attempts.filter(isStoredAttempt);
  } catch (error) {
    console.warn('readPublicExerciseAttempts: failed', error);
    return [];
  }
}

export function writePublicExerciseAttempts(storageKey: string | null, attempts: PublicExerciseStoredAttempt[]): void {
  if (!storageKey || typeof localStorage === 'undefined') return;

  try {
    const envelope: PersistedEnvelope = {
      v: PUBLIC_EXERCISE_ATTEMPTS_STORE_VERSION,
      attempts
    };
    localStorage.setItem(storageKey, JSON.stringify(envelope));
  } catch (error) {
    console.warn('writePublicExerciseAttempts: failed', error);
  }
}
