import type { ExerciseSectionAfterBehavior, ExerciseSectionColorTheme } from '@cio/question-types';
import {
  clearQuestionnaireValidation,
  questionnaire,
  questionnaireMetaData
} from '$features/course/components/exercise/store';
import { getQuestionTypeId, getQuestionTypeOptionById } from '$features/course/components/exercise/question-type-utils';

import type { Exercise } from '$features/course/utils/types';
import type { ExerciseSectionState } from '$features/course/components/exercise/store';
import type { Question } from '$features/course/types';
import { UNTITLED_EXERCISE_SECTION_TITLE } from './exercise-section-utils';
import { exerciseApi } from '$features/course/api';
import { normalizeQuestionOrder } from '$features/course/components/exercise/order-utils';

export function hydrateExercisePageData(exercise: Exercise, exerciseId: string) {
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

      return {
        ...question,
        exerciseSectionId: question.exerciseSectionId ?? null,
        questionTypeId: questionType.id,
        questionType
      };
    });

    if (sections.length > 0) {
      const unsectionedQuestions = mappedQuestions.filter(
        (question) => !question.deletedAt && !question.exerciseSectionId
      );

      if (unsectionedQuestions.length > 0) {
        const untitledSectionId = crypto.randomUUID();
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

  clearQuestionnaireValidation();

  questionnaire.set({
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
  });

  questionnaireMetaData.update((metadata) => ({ ...metadata, exerciseId }));
}

export async function refreshExercisePageData(courseId: string, exerciseId: string) {
  await exerciseApi.get(courseId, exerciseId);

  if (!exerciseApi.exercise) return null;

  hydrateExercisePageData(exerciseApi.exercise, exerciseId);

  return exerciseApi.exercise;
}
