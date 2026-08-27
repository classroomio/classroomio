import { isAutoGradableQuestionType, isAutoGradableQuestionTypeId, type QuestionTypeKey } from '@cio/question-types';
import { ContentType } from '@cio/utils/constants/content';
import type { NonAutoGradableQuestionOffender } from '@cio/utils/validation/course';
import { getOrderedNavigableContent } from './content';
import type { Course, ExerciseConversionGroup, PublicConversionCountdown } from './types';

export type QuestionLike = {
  id?: string | number;
  questionTypeId?: number | null;
  questionType?: { id?: number | null; key?: string | null } | null;
  deletedAt?: string | null;
};

/**
 * Checks whether a question, question type ID, or question type key is auto-gradable.
 */
export function isQuestionAutoGradable(target: number | string | QuestionLike | null | undefined): boolean {
  if (target == null) return false;
  if (typeof target === 'number') {
    return isAutoGradableQuestionTypeId(target);
  }
  if (typeof target === 'string') {
    return isAutoGradableQuestionType(target as QuestionTypeKey);
  }
  if (typeof target === 'object') {
    const typeId = Number(target.questionTypeId ?? target.questionType?.id);
    if (Number.isFinite(typeId)) {
      return isAutoGradableQuestionTypeId(typeId);
    }
    const typeKey = target.questionType?.key;
    if (typeKey) {
      return isAutoGradableQuestionType(typeKey as QuestionTypeKey);
    }
  }
  return false;
}

/**
 * Filters an array of question-like items to only active non-deleted manual questions.
 */
export function getManualQuestionsFromList<T extends QuestionLike>(questions: T[]): T[] {
  return questions.filter((q) => !q.deletedAt && !isQuestionAutoGradable(q));
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

/**
 * Counts unresolved initial questions and brand-new manual questions in a list,
 * by comparing each entry's ID against the frozen initial baseline set.
 *
 * Returns { unresolvedInitial, newManual } where:
 *   - unresolvedInitial: questions whose ID matches the original baseline (still problematic)
 *   - newManual: questions whose ID is NOT in the baseline (added during the session)
 */
function classifyManualQuestions(
  initialQuestionIdSet: Set<string>,
  items: Array<{ id: string | number | undefined | null }>
): { unresolvedInitial: number; newManual: number } {
  let unresolvedInitial = 0;
  let newManual = 0;

  for (const item of items) {
    const idStr = item.id != null ? String(item.id) : null;
    if (idStr && initialQuestionIdSet.has(idStr)) {
      unresolvedInitial++;
    } else {
      newManual++;
    }
  }

  return { unresolvedInitial, newManual };
}

export interface CalculateCountdownParams {
  /** Exercise groups from the frozen initial baseline (initialOffenders). */
  groups: ExerciseConversionGroup[];
  /** Live current offenders reflecting the latest sync state. */
  offenders?: NonAutoGradableQuestionOffender[];
  resolvedExerciseIds: Set<string> | Iterable<string>;
  currentExerciseId?: string | null;
  currentExerciseQuestions?: QuestionLike[] | null;
}

/**
 * Calculates real-time countdown numbers across the course and within the active exercise.
 *
 * For each exercise the algorithm classifies current manual questions by comparing their IDs
 * against the frozen initial baseline:
 *
 *   - unresolvedInitial: manual questions whose ID is in the baseline (still problematic)
 *   - newManual: manual questions whose ID is NOT in the baseline (added during session)
 *   - exerciseTotal = baselineCount + newManual
 *   - exerciseRemaining = unresolvedInitial + newManual
 *
 * This correctly distinguishes "resolved 2 originals + added 1 new" (total=3, remaining=1, 67%)
 * from "resolved 1 of 2 originals" (total=2, remaining=1, 50%).
 *
 * Since initialOffenders is frozen after session start, the baseline IDs never change.
 * New questions (whether with client temp IDs or server-assigned IDs) are never in the
 * baseline set, so they're always classified as newManual — immune to ID changes on save.
 */
export function calculateConversionCountdown(params: CalculateCountdownParams): PublicConversionCountdown {
  const { groups, offenders = [], resolvedExerciseIds, currentExerciseId, currentExerciseQuestions } = params;

  const resolvedSet = resolvedExerciseIds instanceof Set ? resolvedExerciseIds : new Set(resolvedExerciseIds);
  const processedExerciseIds = new Set<string>();
  let totalExercises = 0;
  let totalQuestions = 0;
  let remainingQuestions = 0;
  let resolvedExercisesCount = 0;

  // --- Pass 1: exercises from the initial baseline ---
  for (const group of groups) {
    processedExerciseIds.add(group.exerciseId);
    totalExercises++;

    const baselineCount = group.questions.length;
    const initialQuestionIdSet = new Set(group.questions.map((q) => String(q.questionId)));

    let exerciseTotal: number;
    let exerciseRemaining: number;

    if (currentExerciseId && group.exerciseId === currentExerciseId && Array.isArray(currentExerciseQuestions)) {
      // Active exercise: classify live editor questions against the frozen baseline
      const activeManual = getManualQuestionsFromList(currentExerciseQuestions);

      const { unresolvedInitial, newManual } = classifyManualQuestions(
        initialQuestionIdSet,
        activeManual.map((q) => ({ id: q.id }))
      );

      exerciseTotal = baselineCount + newManual;
      exerciseRemaining = unresolvedInitial + newManual;
    } else if (resolvedSet.has(group.exerciseId)) {
      // Explicitly resolved
      exerciseTotal = baselineCount;
      exerciseRemaining = 0;
    } else {
      // Non-active, non-resolved: classify current offenders against the frozen baseline
      const exerciseOffenders = offenders.filter((o) => o.exerciseId === group.exerciseId);
      const { unresolvedInitial, newManual } = classifyManualQuestions(
        initialQuestionIdSet,
        exerciseOffenders.map((o) => ({ id: o.questionId }))
      );

      exerciseTotal = baselineCount + newManual;
      exerciseRemaining = unresolvedInitial + newManual;
    }

    totalQuestions += exerciseTotal;
    remainingQuestions += exerciseRemaining;

    if (exerciseRemaining === 0) {
      resolvedExercisesCount++;
    }
  }

  // --- Pass 2: exercises that appeared after session start (in offenders but not in baseline) ---
  const newProblemExercises = new Map<string, number>();
  for (const o of offenders) {
    if (processedExerciseIds.has(o.exerciseId)) continue;
    if (o.exerciseId === currentExerciseId) continue; // handled in pass 3
    newProblemExercises.set(o.exerciseId, (newProblemExercises.get(o.exerciseId) ?? 0) + 1);
  }
  for (const [, count] of newProblemExercises) {
    totalExercises++;
    totalQuestions += count;
    remainingQuestions += count;
  }

  // --- Pass 3: current exercise not in any previous pass ---
  if (currentExerciseId && !processedExerciseIds.has(currentExerciseId) && Array.isArray(currentExerciseQuestions)) {
    const manualCount = getManualQuestionsFromList(currentExerciseQuestions).length;

    if (manualCount > 0) {
      totalExercises++;
      totalQuestions += manualCount;
      remainingQuestions += manualCount;
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
