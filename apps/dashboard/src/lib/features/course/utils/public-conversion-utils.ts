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
 * Maps an array of non-autogradable question offenders by their respective exercise IDs.
 *
 * @param offenders - Array of question offenders.
 * @returns Map indexing offenders by exerciseId.
 */
function mapOffendersByExercise(offenders: NonAutoGradableQuestionOffender[] = []) {
  const map = new Map<string, NonAutoGradableQuestionOffender[]>();
  for (const offender of offenders) {
    const list = map.get(offender.exerciseId) ?? [];
    list.push(offender);
    map.set(offender.exerciseId, list);
  }
  return map;
}

/**
 * Merges initial baseline offenders with current live offenders, preserving the baseline
 * problem count for each exercise and incorporating newly detected problem exercises.
 */
export function getAllKnownOffenders(
  initialOffenders: NonAutoGradableQuestionOffender[] = [],
  currentOffenders: NonAutoGradableQuestionOffender[] = []
): NonAutoGradableQuestionOffender[] {
  const initialByExercise = mapOffendersByExercise(initialOffenders);
  const currentByExercise = mapOffendersByExercise(currentOffenders);
  const allExerciseIds = new Set([...initialByExercise.keys(), ...currentByExercise.keys()]);
  const merged: NonAutoGradableQuestionOffender[] = [];

  for (const exerciseId of allExerciseIds) {
    const initialList = initialByExercise.get(exerciseId) ?? [];
    const currentList = currentByExercise.get(exerciseId) ?? [];

    if (currentList.length > initialList.length) {
      merged.push(...currentList);
    } else {
      merged.push(...initialList);
    }
  }

  return merged;
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
  /** Exercise conversion groups across the course. */
  groups: ExerciseConversionGroup[];
  /** Live current offenders reflecting the latest sync state. */
  offenders?: NonAutoGradableQuestionOffender[];
  resolvedExerciseIds: Set<string> | Iterable<string>;
  currentExerciseId?: string | null;
  currentExerciseQuestions?: QuestionLike[] | null;
}

/**
 * Calculates real-time countdown numbers across the course and within the active exercise.
 */
export function calculateConversionCountdown(params: CalculateCountdownParams): PublicConversionCountdown {
  const { groups, offenders = [], resolvedExerciseIds, currentExerciseId, currentExerciseQuestions } = params;

  const resolvedSet = resolvedExerciseIds instanceof Set ? resolvedExerciseIds : new Set(resolvedExerciseIds);
  const processedExerciseIds = new Set<string>();
  let totalExercises = 0;
  let totalQuestions = 0;
  let remainingQuestions = 0;
  let resolvedExercisesCount = 0;

  // Process known exercise groups
  for (const group of groups) {
    processedExerciseIds.add(group.exerciseId);
    totalExercises++;

    const baselineCount = group.questions.length;

    let exerciseTotal: number;
    let exerciseRemaining: number;

    if (currentExerciseId && group.exerciseId === currentExerciseId && Array.isArray(currentExerciseQuestions)) {
      // Active exercise: count live manual questions in the editor
      const activeManual = getManualQuestionsFromList(currentExerciseQuestions);
      const activeManualCount = activeManual.length;

      exerciseTotal = Math.max(baselineCount, activeManualCount);
      exerciseRemaining = activeManualCount;
    } else if (resolvedSet.has(group.exerciseId)) {
      // Explicitly resolved
      exerciseTotal = baselineCount;
      exerciseRemaining = 0;
    } else {
      // Non-active, non-resolved: count current offenders for this exercise
      const exerciseOffenders = offenders.filter((o) => o.exerciseId === group.exerciseId);
      const offendersCount = exerciseOffenders.length;

      exerciseTotal = Math.max(baselineCount, offendersCount);
      exerciseRemaining = offendersCount;
    }

    totalQuestions += exerciseTotal;
    remainingQuestions += exerciseRemaining;

    if (exerciseRemaining === 0) {
      resolvedExercisesCount++;
    }
  }

  // Account for active exercise with unsaved manual questions not yet in groups
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
