import type { QuestionnaireState } from '$features/course/components/exercise/store';
import { questionnaire } from '$features/course/components/exercise/store';

const EXERCISE_DRAFT_STORAGE_PREFIX = 'classroomio:exercise-draft';

const EXERCISE_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredExerciseDraft {
  savedAt: number;
  questionnaire: QuestionnaireState;
}

function getStorageKey(courseId: string, exerciseId: string) {
  return `${EXERCISE_DRAFT_STORAGE_PREFIX}:${courseId}:${exerciseId}`;
}

export function clearExerciseDraft(courseId: string, exerciseId: string) {
  try {
    localStorage.removeItem(getStorageKey(courseId, exerciseId));
  } catch (error) {
    console.error('clearExerciseDraft error:', error);
  }
}

export function saveExerciseDraft(courseId: string, exerciseId: string, state: QuestionnaireState) {
  if (!courseId || !exerciseId) return;

  const draft: StoredExerciseDraft = { savedAt: Date.now(), questionnaire: state };

  try {
    localStorage.setItem(getStorageKey(courseId, exerciseId), JSON.stringify(draft));
  } catch (error) {
    console.error('saveExerciseDraft error:', error);
  }
}

function loadExerciseDraft(courseId: string, exerciseId: string): QuestionnaireState | null {
  if (!courseId || !exerciseId) return null;

  try {
    const stored = localStorage.getItem(getStorageKey(courseId, exerciseId));
    if (!stored) return null;

    const draft = JSON.parse(stored) as StoredExerciseDraft | null;
    const isExpired = Date.now() - (draft?.savedAt ?? 0) >= EXERCISE_DRAFT_MAX_AGE_MS;

    if (!draft?.questionnaire || isExpired) {
      clearExerciseDraft(courseId, exerciseId);
      return null;
    }

    return draft.questionnaire;
  } catch (error) {
    console.error('loadExerciseDraft error:', error);
    clearExerciseDraft(courseId, exerciseId);

    return null;
  }
}

export function restoreExerciseDraft(courseId: string, exerciseId: string) {
  const draft = loadExerciseDraft(courseId, exerciseId);

  if (!draft) return false;

  questionnaire.set(draft);

  return true;
}
