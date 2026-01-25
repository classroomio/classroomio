import { QUESTION_TEMPLATE, QUESTION_TYPES } from '$features/ui/question/constants';

import type { Question } from '$features/course/types';
import { STATUS } from './constants';
import type { Writable } from 'svelte/store';
import { isUUID } from '$lib/utils/functions/isUUID';
import { writable } from 'svelte/store';

export const isQuestionnaireFetching = writable(false);
export const deleteConfirmation = writable({ open: false });
export const questionnaireOrder = writable({ open: false });

// {'question-id': { option: '', title: '', ... }}
export const questionnaireValidation = writable({});

const initAnswerState = {
  answers: {},
  scores: {},
  grades: {},
  totalPossibleGrade: 0,
  finalTotalGrade: 0,
  currentQuestionIndex: 0,
  isFinished: false,
  progressValue: 100,
  status: STATUS.PENDING,
  comment: ''
};

export const questionnaireMetaData = writable(initAnswerState);

export const questionnaire: Writable<{
  title?: string | null;
  dueBy?: string | null;
  isDueByDirty?: boolean;
  isTitleDirty?: boolean;
  description?: string | null;
  isDescriptionDirty?: boolean;
  questions: Question[];
  totalSubmissions: number;
}> = writable({
  title: '',
  dueBy: '',
  isDueByDirty: false,
  isTitleDirty: false,
  description: '',
  isDescriptionDirty: false,
  questions: [],
  totalSubmissions: 0
});

export function reset() {
  questionnaireMetaData.update((metaData) => {
    metaData.answers = {};
    metaData.currentQuestionIndex = 0;
    metaData.isFinished = false;
    return metaData;
  });
}

/**
 * Maps Zod validation errors to UI format: { questionId: { option: 'error message' } }
 * This is used to display errors in the edit-mode component
 */
export function mapZodErrorsToQuestionErrors(
  zodErrors: Record<string, string>,
  questions: Question[]
): Record<string, { option?: string; title?: string; points?: string }> {
  const errors: Record<string, { option?: string; title?: string; points?: string }> = {};
  for (const [path, message] of Object.entries(zodErrors)) {
    const pathParts = path.split('.');
    const questionIndex = pathParts[0] === 'questions' ? parseInt(pathParts[1]) : -1;

    if (questionIndex >= 0 && questionIndex < questions.length) {
      const question = questions[questionIndex];
      if (question && !question.deletedAt) {
        const qErrors = errors[question.id] || {};

        // Check if error is related to options
        if (path.includes('options')) {
          qErrors.option = message;
        } else if (path.includes('question')) {
          qErrors.title = message;
        } else if (path.includes('points')) {
          qErrors.points = message;
        }

        errors[question.id] = { ...qErrors };
      }
    }
  }

  return errors;
}

export function handleAddQuestion() {
  questionnaire.update((q) => {
    const { questions } = q;
    return {
      ...q,
      questions: [
        ...questions,
        {
          ...QUESTION_TEMPLATE,
          id: `${questions.length + 1}-form`,
          name: `${questions.length + 1}-form`,
          value: '',
          points: 0,
          order: questions.length,
          questionType: QUESTION_TYPES[0],
          questionTypeId: QUESTION_TYPES[0].id,
          options: [
            {
              id: '1-form',
              label: '',
              value: null,
              isCorrect: false
            }
          ]
        }
      ]
    };
  });
}

export function handleAddOption(questionId) {
  return () => {
    questionnaire.update((_questionnaire) => {
      const { questions } = _questionnaire;
      return {
        ..._questionnaire,
        questions: questions.map((question) => {
          if (question.id === questionId) {
            return {
              ...question,
              options: [
                ...question.options,
                {
                  id: `${new Date().getTime()}-form`,
                  label: '',
                  value: '',
                  isCorrect: false
                }
              ]
            };
          }

          return question;
        })
      };
    });
  };
}

export function handleRemoveOption(questionId, optionId) {
  return () => {
    questionnaire.update((q) => {
      const questionIndex = q.questions.findIndex((qItem) => qItem.id === questionId);
      if (questionIndex === -1) return q;

      const optionsIndex = q.questions[questionIndex].options.findIndex((oItem) => oItem.id === optionId);
      if (optionsIndex === -1) return q;

      q.questions[questionIndex].options[optionsIndex].deletedAt = new Date().toString();
      q.questions[questionIndex].options[optionsIndex].isDirty = true;
      q.questions[questionIndex].isDirty = true; // Mark as dirty if needed

      return q;
    });
  };
}

export function handleRemoveQuestion(questionId) {
  return () => {
    questionnaire.update((q) => {
      const questionIndex = q.questions.findIndex((qItem) => qItem.id === questionId);
      if (questionIndex === -1) return q;

      q.questions[questionIndex].deletedAt = new Date().toString();

      return q;
    });
  };
}

export function handleCode(questionId, shouldAdd = true) {
  questionnaire.update((q) => {
    const questionIndex = q.questions.findIndex((qItem) => qItem.id === questionId);
    if (questionIndex === -1) return q;

    const question = q.questions[questionIndex];
    q.questions[questionIndex].code = shouldAdd ? question.code || '' : undefined;

    return q;
  });
}

export function handleAnswerSelect(questionId, optionId) {
  return () => {
    questionnaire.update((q) => {
      const { questions } = q;

      return {
        ...q,
        questions: questions.map((question) => {
          if (question.id === questionId) {
            return {
              ...question,
              options: question.options.map((option) => {
                if (option.id === optionId) {
                  option.isCorrect = !option.isCorrect;
                  option.isDirty = true;
                }
                return option;
              })
            };
          }

          return question;
        })
      };
    });
  };
}

export function addDynamicValue(questionId, optionId) {
  return (e) => {
    questionnaire.update((q) => {
      const { questions } = q;

      return {
        ...q,
        questions: questions.map((question) => {
          if (question.id === questionId) {
            return {
              ...question,
              options: question.options.map((option) => {
                if (option.id === optionId) {
                  const label = e.target.value;

                  if (!isUUID(option.value || '')) {
                    option.value = label.split(' ').join('-');
                  }

                  option.label = label;
                  option.isDirty = true;
                }

                return option;
              })
            };
          }

          return question;
        })
      };
    });
  };
}
