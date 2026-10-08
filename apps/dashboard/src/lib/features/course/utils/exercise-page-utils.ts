import type { ExerciseSectionAfterBehavior, ExerciseSectionColorTheme } from '@cio/question-types';
import { QUESTION_TYPE_KEY, normalizeThumbsQuestion } from '@cio/question-types';
import {
  clearQuestionnaireValidation,
  questionnaire,
  questionnaireMetaData,
  type QuestionnaireState
} from '$features/course/components/exercise/store';
import {
  getQuestionTypeId,
  getQuestionTypeKey,
  getQuestionTypeOptionById
} from '$features/course/components/exercise/question-type-utils';

import type { Exercise } from '$features/course/utils/types';
import type { ExerciseSectionState } from '$features/course/components/exercise/store';
import type { Question } from '$features/course/types';
import { UNTITLED_EXERCISE_SECTION_TITLE } from './exercise-section-utils';
import { exerciseApi } from '$features/course/api';
import { normalizeQuestionOrder } from '$features/course/components/exercise/order-utils';
import { get, writable } from 'svelte/store';
import { hasQuestionnaireChanges, mergeExerciseStates } from './exercise-state-merge';

export interface ExerciseRemoteUpdateNotice {
  baseState: QuestionnaireState;
  conflictCount: number;
  exerciseId: string;
  remoteState: QuestionnaireState;
  source: 'draft' | 'remote';
  type: 'conflict' | 'merged';
}

const serverExerciseStates = new Map<string, QuestionnaireState>();

export const exerciseRemoteUpdateNotice = writable<ExerciseRemoteUpdateNotice | null>(null);

function snapshotQuestionnaireState(state: QuestionnaireState) {
  return structuredClone(state);
}

function getStableUntitledSectionId(exerciseId: string) {
  const leadingNibble = Number.parseInt(exerciseId[0] ?? '', 16);
  if (Number.isNaN(leadingNibble)) return exerciseId;

  return `${((leadingNibble + 8) % 16).toString(16)}${exerciseId.slice(1)}`;
}

function toQuestionnaireState(exercise: Exercise): QuestionnaireState {
  let questions: Question[] = [];

  const sections: ExerciseSectionState[] = Array.isArray(exercise.sections)
    ? exercise.sections
        .map((section) => ({
          id: section.id,
          title: section.title,
          description: section.description ?? null,
          order: section.order,
          colorTheme: section.colorTheme as ExerciseSectionColorTheme,
          afterBehavior: section.afterBehavior as unknown as ExerciseSectionAfterBehavior
        }))
        .sort((left, right) => left.order - right.order)
    : [];

  const exerciseQuestions = [...(Array.isArray(exercise.questions) ? exercise.questions : [])];

  if (exerciseQuestions.length > 0) {
    const mappedQuestions: Question[] = exerciseQuestions.map((question) => {
      const questionType = getQuestionTypeOptionById(getQuestionTypeId(question));
      const baseQuestion = {
        ...question,
        exerciseSectionId: question.exerciseSectionId ?? null,
        questionTypeId: questionType.id,
        questionType
      };

      if (getQuestionTypeKey(baseQuestion) !== QUESTION_TYPE_KEY.THUMBS) {
        return baseQuestion;
      }

      const normalized = normalizeThumbsQuestion({
        settings: (baseQuestion as Question & { settings?: Record<string, unknown> }).settings,
        options: baseQuestion.options
      });

      return {
        ...baseQuestion,
        settings: normalized.settings,
        options: normalized.options
      };
    });

    if (sections.length > 0) {
      const unsectionedQuestions = mappedQuestions.filter(
        (question) => !question.deletedAt && !question.exerciseSectionId
      );

      if (unsectionedQuestions.length > 0) {
        const untitledSectionId = getStableUntitledSectionId(exercise.id);
        const nextSectionOrder =
          sections.reduce((highestOrder, section) => Math.max(highestOrder, section.order), -1) + 1;
        sections.push({
          id: untitledSectionId,
          title: UNTITLED_EXERCISE_SECTION_TITLE,
          description: null,
          order: nextSectionOrder,
          colorTheme: 'blue',
          afterBehavior: { action: 'continue' },
          isDirty: true
        });

        for (const question of unsectionedQuestions) {
          question.exerciseSectionId = untitledSectionId;
          question.isDirty = true;
        }
      }
    }

    questions = normalizeQuestionOrder(mappedQuestions);
  }

  return {
    title: exercise.title,
    description: exercise.description,
    dueBy: exercise.dueBy,
    isTitleDirty: false,
    isDescriptionDirty: false,
    isDueByDirty: false,
    questions,
    sections,
    sectionDisplayMode: exercise.sectionDisplayMode ?? 'one_question',
    totalSubmissions: 0,
    allowMultipleAttempts: !!exercise.allowMultipleAttempts,
    completionPolicy: (exercise.completionPolicy as 'submitted' | 'passed' | undefined) ?? 'submitted',
    passThreshold: exercise.passThreshold ?? 100,
    slug: exercise.slug ?? ''
  };
}

export function hydrateExercisePageData(exercise: Exercise, exerciseId: string) {
  const nextState = toQuestionnaireState(exercise);

  clearQuestionnaireValidation();
  questionnaire.set(nextState);
  serverExerciseStates.set(exerciseId, snapshotQuestionnaireState(nextState));
  exerciseRemoteUpdateNotice.set(null);

  questionnaireMetaData.update((metadata) => ({ ...metadata, exerciseId }));
}

export function reconcileExercisePageData(exercise: Exercise, exerciseId: string) {
  const remoteState = toQuestionnaireState(exercise);
  const baseState = serverExerciseStates.get(exerciseId);
  const localState = get(questionnaire);

  if (!baseState) {
    hydrateExercisePageData(exercise, exerciseId);
    return;
  }

  const localMerge = mergeExerciseStates(baseState, localState, remoteState, 'local');
  serverExerciseStates.set(exerciseId, snapshotQuestionnaireState(remoteState));

  if (!localMerge.hadRemoteChanges) return;

  if (!localMerge.hadLocalChanges) {
    clearQuestionnaireValidation();
    questionnaire.set(remoteState);
    exerciseRemoteUpdateNotice.set(null);
    return;
  }

  questionnaire.set(localMerge.state);

  exerciseRemoteUpdateNotice.set({
    baseState: snapshotQuestionnaireState(baseState),
    conflictCount: localMerge.conflictCount,
    exerciseId,
    remoteState: snapshotQuestionnaireState(remoteState),
    source: 'remote',
    type: localMerge.conflictCount > 0 ? 'conflict' : 'merged'
  });
}

export function dismissExerciseRemoteUpdateNotice() {
  exerciseRemoteUpdateNotice.set(null);
}

export function applyAssistantExerciseConflicts(exerciseId: string) {
  const notice = get(exerciseRemoteUpdateNotice);
  if (!notice || notice.exerciseId !== exerciseId) return;

  const currentState = get(questionnaire);
  const assistantMerge = mergeExerciseStates(notice.baseState, currentState, notice.remoteState, 'remote');
  questionnaire.set(assistantMerge.state);
  exerciseRemoteUpdateNotice.set(null);
}

export function clearExercisePageState(exerciseId: string) {
  serverExerciseStates.delete(exerciseId);
  const notice = get(exerciseRemoteUpdateNotice);
  if (notice?.exerciseId === exerciseId) {
    exerciseRemoteUpdateNotice.set(null);
  }
}

export function hasUnsavedExerciseState(exerciseId: string, state: QuestionnaireState = get(questionnaire)) {
  const baseState = serverExerciseStates.get(exerciseId);
  if (!baseState) return false;

  return hasQuestionnaireChanges(baseState, state);
}

export function getExerciseServerState(exerciseId: string) {
  const state = serverExerciseStates.get(exerciseId);

  return state ? snapshotQuestionnaireState(state) : null;
}

export async function refreshExercisePageData(courseId: string, exerciseId: string) {
  await exerciseApi.get(courseId, exerciseId);

  const activeExerciseId = get(questionnaireMetaData).exerciseId;
  if (activeExerciseId !== exerciseId || exerciseApi.exercise?.id !== exerciseId) return null;

  reconcileExercisePageData(exerciseApi.exercise, exerciseId);

  return exerciseApi.exercise;
}
