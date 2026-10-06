import { ContentType } from '@cio/utils/constants/content';
import { getOrderedNavigableContent, type ContentItem } from './content';
import type { Course } from './types';

const DEFAULT_THRESHOLD = 100;
const DEFAULT_EXERCISE_MIN_SCORE_PERCENT = 100;

type CompletionRulesCourse = Pick<Course, 'type' | 'compliance' | 'certificate'>;

export type FinalExerciseState =
  | { kind: 'none' }
  | { kind: 'found'; id: string; title: string }
  | { kind: 'missing'; id: string };

export type CompletionRulesSummary = {
  threshold: number;
  deadline: string | null;
  finalExercise: FinalExerciseState;
  exerciseMinScorePercent: number | null;
};

/** Every exercise in the course, in the order learners meet them across sections. Feeds the final-exercise picker. */
export function getCourseExercises(course: Course | null): ContentItem[] {
  return getOrderedNavigableContent(course).filter((item) => item.type === ContentType.Exercise);
}

/**
 * Matches the stored final-exercise id against the course's exercises. `missing` means the id is still stored but
 * the exercise was deleted; completion no longer applies the rule in that case.
 */
export function resolveFinalExercise(
  exercises: Pick<ContentItem, 'id' | 'title'>[],
  requiredExerciseId: string | null | undefined
): FinalExerciseState {
  if (!requiredExerciseId) return { kind: 'none' };

  const exercise = exercises.find((item) => item.id === requiredExerciseId);
  if (!exercise) return { kind: 'missing', id: requiredExerciseId };

  return { kind: 'found', id: exercise.id, title: exercise.title };
}

/**
 * Minimum score used when none is stored. Mirrors the API's effective certificate settings: compliance courses fall
 * back to their passing score before the 100% default.
 */
export function getDefaultExerciseMinScorePercent(course: Pick<Course, 'type' | 'compliance'> | null): number {
  const compliancePassingScore = course?.type === 'COMPLIANCE' ? course.compliance?.passingScore : null;

  return typeof compliancePassingScore === 'number' ? compliancePassingScore : DEFAULT_EXERCISE_MIN_SCORE_PERCENT;
}

/** Stored minimum score, or the effective default when a final exercise is set without one. */
export function getEffectiveExerciseMinScorePercent(course: CompletionRulesCourse | null): number | null {
  const storedMinScore = course?.certificate?.exerciseMinScorePercent;
  if (typeof storedMinScore === 'number') return storedMinScore;

  if (!course?.certificate?.requiredExerciseId) return null;

  return getDefaultExerciseMinScorePercent(course);
}

/** The completion rules as the API applies them, for read-only display outside the course Settings tab. */
export function getCompletionRulesSummary(course: Course | null): CompletionRulesSummary {
  const certificate = course?.certificate;
  const storedThreshold = certificate?.threshold;
  const exercises = getCourseExercises(course);
  const finalExercise = resolveFinalExercise(exercises, certificate?.requiredExerciseId);
  const exerciseMinScorePercent = finalExercise.kind === 'found' ? getEffectiveExerciseMinScorePercent(course) : null;

  return {
    threshold: typeof storedThreshold === 'number' ? storedThreshold : DEFAULT_THRESHOLD,
    deadline: certificate?.deadline ?? null,
    finalExercise,
    exerciseMinScorePercent
  };
}
