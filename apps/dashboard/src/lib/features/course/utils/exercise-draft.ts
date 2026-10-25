import type { QuestionnaireState } from '$features/course/components/exercise/store';
import { questionnaire } from '$features/course/components/exercise/store';
import { get } from 'svelte/store';
import { mergeExerciseStates } from './exercise-state-merge';

const EXERCISE_DRAFT_STORAGE_PREFIX = 'classroomio:exercise-draft';

const EXERCISE_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredExerciseDraft {
  baseQuestionnaire: QuestionnaireState;
  savedAt: number;
  questionnaire: QuestionnaireState;
}

export interface PendingExerciseDraft {
  baseQuestionnaire: QuestionnaireState;
  questionnaire: QuestionnaireState;
  savedAt: number;
}

export interface RestoredExerciseDraft {
  baseState: QuestionnaireState;
  conflictCount: number;
  remoteState: QuestionnaireState;
}

/** Drafts are local to the browser profile that wrote them, so a different account on the same device never sees them. */
function getStorageKey(courseId: string, exerciseId: string, profileId: string) {
  return `${EXERCISE_DRAFT_STORAGE_PREFIX}:${profileId}:${courseId}:${exerciseId}`;
}

export function clearExerciseDraft(courseId: string, exerciseId: string, profileId: string) {
  if (!courseId || !exerciseId || !profileId) return;

  try {
    localStorage.removeItem(getStorageKey(courseId, exerciseId, profileId));
  } catch (error) {
    console.error('clearExerciseDraft error:', error);
  }
}

export function saveExerciseDraft(
  courseId: string,
  exerciseId: string,
  profileId: string,
  state: QuestionnaireState,
  baseQuestionnaire: QuestionnaireState
) {
  if (!courseId || !exerciseId || !profileId) return;

  const draft: StoredExerciseDraft = { baseQuestionnaire, savedAt: Date.now(), questionnaire: state };

  try {
    localStorage.setItem(getStorageKey(courseId, exerciseId, profileId), JSON.stringify(draft));
  } catch (error) {
    console.error('saveExerciseDraft error:', error);
  }
}

function loadExerciseDraft(courseId: string, exerciseId: string, profileId: string): StoredExerciseDraft | null {
  if (!courseId || !exerciseId || !profileId) return null;

  try {
    const stored = localStorage.getItem(getStorageKey(courseId, exerciseId, profileId));
    if (!stored) return null;

    const draft = JSON.parse(stored) as StoredExerciseDraft | null;
    const isExpired = Date.now() - (draft?.savedAt ?? 0) >= EXERCISE_DRAFT_MAX_AGE_MS;

    if (!draft?.baseQuestionnaire || !draft.questionnaire || isExpired) {
      clearExerciseDraft(courseId, exerciseId, profileId);
      return null;
    }

    return draft;
  } catch (error) {
    console.error('loadExerciseDraft error:', error);
    clearExerciseDraft(courseId, exerciseId, profileId);

    return null;
  }
}

/**
 * Looks up a pending draft without applying it or touching the live editor state. The caller
 * decides whether to restore or discard it (e.g. after asking the teacher to confirm), since a
 * draft may belong to edits they meant to abandon.
 */
export function peekExerciseDraft(
  courseId: string,
  exerciseId: string,
  profileId: string
): PendingExerciseDraft | null {
  const draft = loadExerciseDraft(courseId, exerciseId, profileId);

  if (!draft) return null;

  return { baseQuestionnaire: draft.baseQuestionnaire, questionnaire: draft.questionnaire, savedAt: draft.savedAt };
}

/**
 * Applies a previously peeked draft: three-way merges it against the exercise's current live
 * state (the freshly hydrated server copy) and writes the result into the editor. Only call this
 * once the teacher has agreed to restore the draft.
 */
export function applyExerciseDraft(
  courseId: string,
  exerciseId: string,
  profileId: string
): RestoredExerciseDraft | null {
  const draft = loadExerciseDraft(courseId, exerciseId, profileId);

  if (!draft) return null;

  const remoteState = get(questionnaire);
  const restoredState = mergeExerciseStates(draft.baseQuestionnaire, draft.questionnaire, remoteState, 'local');
  questionnaire.set(restoredState.state);

  return {
    baseState: structuredClone(draft.baseQuestionnaire),
    conflictCount: restoredState.conflictCount,
    remoteState: structuredClone(remoteState)
  } satisfies RestoredExerciseDraft;
}
