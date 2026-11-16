export const ANSWER_TIME_MAX_SECONDS = 10_800;

export type AnswerTiming = { startedAt: string; answeredAt: string };

function parseInstant(value: unknown): number | null {
  if (typeof value !== 'string') return null;

  const time = Date.parse(value);

  return Number.isFinite(time) ? time : null;
}

/**
 * Validates the start and answer times a client sends with an answer. Returns null unless both are real instants;
 * otherwise the times are normalised to ISO strings, the answer time is capped at `now`, the start never follows the
 * answer, and the span never exceeds `ANSWER_TIME_MAX_SECONDS`. Used for reporting only, never for grading.
 */
export function clampAnswerTiming(
  input: { startedAt?: unknown; answeredAt?: unknown },
  now: Date = new Date()
): AnswerTiming | null {
  const startedAt = parseInstant(input.startedAt);
  const answeredAt = parseInstant(input.answeredAt);
  if (startedAt === null || answeredAt === null) return null;

  const answeredAtClamped = Math.min(answeredAt, now.getTime());
  const earliestStart = answeredAtClamped - ANSWER_TIME_MAX_SECONDS * 1000;
  const startedAtClamped = Math.max(Math.min(startedAt, answeredAtClamped), earliestStart);

  return {
    startedAt: new Date(startedAtClamped).toISOString(),
    answeredAt: new Date(answeredAtClamped).toISOString()
  };
}

/**
 * Records when each question was started and answered while a student takes an exercise. A question starts when
 * the previous answer was given (or when the attempt began) and is answered at its latest change. An observation
 * that sets several answers at once is a restored draft, not an interaction, and is not timed.
 */
export function createAnswerTimingTracker(now: () => number = Date.now) {
  let cursor = now();
  const seen = new Map<string, unknown>();
  const timings = new Map<string, { startedAt: number; answeredAt: number }>();

  return {
    observe(answers: Record<string, unknown>) {
      const changedKeys = Object.keys(answers).filter((key) => seen.get(key) !== answers[key]);
      const isRestore = changedKeys.length > 1;

      for (const key of changedKeys) {
        seen.set(key, answers[key]);
        if (isRestore) continue;

        const answeredAt = now();
        timings.set(key, { startedAt: timings.get(key)?.startedAt ?? cursor, answeredAt });
        cursor = answeredAt;
      }
    },
    timingFor(key: string): AnswerTiming | undefined {
      const timing = timings.get(key);
      if (!timing) return undefined;

      return {
        startedAt: new Date(timing.startedAt).toISOString(),
        answeredAt: new Date(timing.answeredAt).toISOString()
      };
    },
    reset() {
      cursor = now();
      seen.clear();
      timings.clear();
    }
  };
}
