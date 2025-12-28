import { QUESTION_TEMPLATE, QUESTION_TYPE, QUESTION_TYPES } from '$features/ui/question/constants';

import type { Question } from '$features/course/types';
import type { Writable } from 'svelte/store';
import { isUUID } from '$lib/utils/functions/isUUID';
import { questionnaireMetaData } from './answers';
import { writable } from 'svelte/store';

export const isQuestionnaireFetching = writable(false);
export const deleteConfirmation = writable({ open: false });
export const questionnaireOrder = writable({ open: false });

// {'question-id': { option: '', title: '', ... }}
export const questionnaireValidation = writable({});

export const questionnaire: Writable<{
  title?: string;
  due_by?: string;
  is_due_by_dirty?: boolean;
  is_title_dirty?: boolean;
  description?: string;
  is_description_dirty?: boolean;
  questions: Question[];
  totalSubmissions: number;
}> = writable({
  title: '',
  due_by: '',
  is_due_by_dirty: false,
  is_title_dirty: false,
  description: '',
  is_description_dirty: false,
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

export function validateQuestionnaire(questions) {
  const errors = {};

  for (const question of questions) {
    if (question.question_type.id === QUESTION_TYPE.TEXTAREA || question.deleted_at) {
      continue;
    }
    const qErrors = errors[question.id] || {};

    if (question.question_type.id !== QUESTION_TYPE.TEXTAREA) {
      const hasEmptyOptionLabel = question.options
        .filter((option) => !option.deleted_at)
        .some((option) => option.label.trim() === '');

      if (hasEmptyOptionLabel) {
        qErrors.option = 'Please enter a label for all options';
        errors[question.id] = { ...qErrors };
      }
    }

    const hasAnswer = question.options.filter((o) => !o.deleted_at).some((option) => option.is_correct);

    if (!hasAnswer) {
      qErrors.option = 'Please mark an option as the correct answer';
      errors[question.id] = { ...qErrors };
    }
  }

  questionnaireValidation.set(errors);

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
          question_type: QUESTION_TYPES[0],
          question_type_id: QUESTION_TYPES[0].id,
          options: [
            {
              id: '1-form',
              label: '',
              value: null,
              is_correct: false
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
                  is_correct: false
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

      q.questions[questionIndex].options[optionsIndex].deleted_at = new Date().toString();
      q.questions[questionIndex].options[optionsIndex].is_dirty = true;
      q.questions[questionIndex].is_dirty = true; // Mark as dirty if needed

      return q;
    });
  };
}

export function handleRemoveQuestion(questionId) {
  return () => {
    questionnaire.update((q) => {
      const questionIndex = q.questions.findIndex((qItem) => qItem.id === questionId);
      if (questionIndex === -1) return q;

      q.questions[questionIndex].deleted_at = new Date().toString();

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
                  option.is_correct = !option.is_correct;
                  option.is_dirty = true;
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
                  option.is_dirty = true;
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
