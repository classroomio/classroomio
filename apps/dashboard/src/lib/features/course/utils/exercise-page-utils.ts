import type { Exercise } from '$features/course/utils/types';
import type { Question } from '$features/course/types';
import { exerciseApi } from '$features/course/api';
import {
  clearQuestionnaireValidation,
  questionnaire,
  questionnaireMetaData
} from '$features/course/components/exercise/store';
import { getQuestionTypeId, getQuestionTypeOptionById } from '$features/course/components/exercise/question-type-utils';
import { normalizeQuestionOrder } from '$features/course/components/exercise/order-utils';

export function hydrateExercisePageData(exercise: Exercise, exerciseId: string) {
  let questions: Question[] = [];

  if (exercise.questions && Array.isArray(exercise.questions)) {
    const mappedQuestions = exercise.questions.map((question) => {
      const questionType = getQuestionTypeOptionById(getQuestionTypeId(question));

      return {
        ...question,
        questionTypeId: questionType.id,
        questionType
      };
    });

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
    totalSubmissions: 0,
    allowMultipleAttempts: !!exercise.allowMultipleAttempts
  });

  questionnaireMetaData.update((metadata) => ({ ...metadata, exerciseId }));
}

export async function refreshExercisePageData(courseId: string, exerciseId: string) {
  await exerciseApi.get(courseId, exerciseId);

  if (!exerciseApi.exercise) return null;

  hydrateExercisePageData(exerciseApi.exercise, exerciseId);

  return exerciseApi.exercise;
}
