import { isAutoGradableQuestionType, isAutoGradableQuestionTypeId, type QuestionTypeKey } from '@cio/question-types';
import { ContentType } from '@cio/utils/constants/content';
import type { NonAutoGradableQuestionOffender } from '@cio/utils/validation/course';
import { getOrderedNavigableContent } from './content';
import type { Course, ExerciseConversionGroup, PublicConversionCountdown } from './types';

/**
 * Checks whether a question type ID or question type key is auto-gradable.
 */
export function isQuestionAutoGradable(typeIdOrKey: number | string | null | undefined): boolean {
  if (typeIdOrKey == null) return false;
  if (typeof typeIdOrKey === 'number') {
    return isAutoGradableQuestionTypeId(typeIdOrKey);
  }
  return isAutoGradableQuestionType(typeIdOrKey as QuestionTypeKey);
}

/**
 * Groups non-autogradable question offenders by exercise, ordering exercises matching
 * the Lesson tab sequence (using getOrderedNavigableContent) and preserving question order.
 */
export function groupOffendersByExercise(
  offenders: NonAutoGradableQuestionOffender[],
  course?: Course | null
): ExerciseConversionGroup[] {
  if (!offenders || offenders.length === 0) return [];

  // Map exercise position based on authoritative navigable content order
  const navigableItems = course ? getOrderedNavigableContent(course) : [];
  const exerciseOrderMap = new Map<string, number>();

  let exerciseIndex = 0;
  for (const item of navigableItems) {
    if (item.type === ContentType.Exercise) {
      exerciseOrderMap.set(item.id, exerciseIndex);
      exerciseIndex++;
    }
  }

  // Group offenders by exerciseId
  const groupedMap = new Map<string, ExerciseConversionGroup>();

  for (const offender of offenders) {
    let group = groupedMap.get(offender.exerciseId);
    if (!group) {
      group = {
        exerciseId: offender.exerciseId,
        exerciseTitle: offender.exerciseTitle || 'Untitled Exercise',
        questions: []
      };
      groupedMap.set(offender.exerciseId, group);
    }

    group.questions.push({
      questionId: offender.questionId,
      questionTitle: offender.questionTitle || 'Untitled question',
      typeId: offender.typeId
    });
  }

  // Sort groups by course lesson/exercise order
  return Array.from(groupedMap.values()).sort((a, b) => {
    const orderA = exerciseOrderMap.get(a.exerciseId) ?? 99999;
    const orderB = exerciseOrderMap.get(b.exerciseId) ?? 99999;
    return orderA - orderB;
  });
}

export interface CalculateCountdownParams {
  groups: ExerciseConversionGroup[];
  resolvedExerciseIds: Set<string> | Iterable<string>;
  currentExerciseId?: string | null;
  currentExerciseQuestions?: Array<{
    id?: string | number;
    questionTypeId?: number | null;
    deletedAt?: string | null;
  }> | null;
}

/**
 * Calculates real-time countdown numbers across the course and within the active exercise.
 */
export function calculateConversionCountdown(params: CalculateCountdownParams): PublicConversionCountdown {
  const { groups, resolvedExerciseIds, currentExerciseId, currentExerciseQuestions } = params;

  const resolvedSet = resolvedExerciseIds instanceof Set ? resolvedExerciseIds : new Set(resolvedExerciseIds);
  const totalExercises = groups.length;
  let totalQuestions = 0;
  let remainingQuestions = 0;
  let resolvedExercisesCount = 0;

  for (const group of groups) {
    totalQuestions += group.questions.length;
    const isExplicitlyResolved = resolvedSet.has(group.exerciseId);

    if (isExplicitlyResolved) {
      resolvedExercisesCount++;
      continue;
    }

    // If this is the active exercise being edited, evaluate live remaining non-autogradable questions
    if (currentExerciseId && group.exerciseId === currentExerciseId && Array.isArray(currentExerciseQuestions)) {
      const activeNonAutoGradable = currentExerciseQuestions.filter(
        (q) => !q.deletedAt && !isQuestionAutoGradable(q.questionTypeId)
      );

      if (activeNonAutoGradable.length === 0) {
        // Live resolved in editor
        resolvedExercisesCount++;
      } else {
        remainingQuestions += activeNonAutoGradable.length;
      }
    } else {
      // Pending resolution
      remainingQuestions += group.questions.length;
    }
  }

  const resolvedQuestions = Math.max(0, totalQuestions - remainingQuestions);
  const remainingExercises = Math.max(0, totalExercises - resolvedExercisesCount);
  const percentComplete = totalQuestions === 0 ? 100 : Math.round((resolvedQuestions / totalQuestions) * 100);
  const isFullyResolved = totalExercises > 0 && remainingQuestions === 0;

  return {
    totalExercises,
    resolvedExercises: resolvedExercisesCount,
    remainingExercises,
    totalQuestions,
    resolvedQuestions,
    remainingQuestions,
    percentComplete,
    isFullyResolved
  };
}

/**
 * Finds the next unresolved exercise group in sequence relative to the current exercise.
 */
export function getNextUnresolvedExercise(
  groups: ExerciseConversionGroup[],
  resolvedExerciseIds: Set<string> | Iterable<string>,
  currentExerciseId?: string | null
): ExerciseConversionGroup | null {
  if (!groups || groups.length === 0) return null;

  const resolvedSet = resolvedExerciseIds instanceof Set ? resolvedExerciseIds : new Set(resolvedExerciseIds);
  const unresolvedGroups = groups.filter((g) => !resolvedSet.has(g.exerciseId));

  if (unresolvedGroups.length === 0) return null;
  if (!currentExerciseId) return unresolvedGroups[0] ?? null;

  const currentIndex = groups.findIndex((g) => g.exerciseId === currentExerciseId);
  if (currentIndex < 0) return unresolvedGroups[0] ?? null;

  // Search forward after currentIndex
  for (let i = currentIndex + 1; i < groups.length; i++) {
    if (!resolvedSet.has(groups[i].exerciseId)) {
      return groups[i];
    }
  }

  // Wrap around to start if needed
  for (let i = 0; i < currentIndex; i++) {
    if (!resolvedSet.has(groups[i].exerciseId)) {
      return groups[i];
    }
  }

  return null;
}
