import { writable } from 'svelte/store';
import {
  QUESTION_TEMPLATE,
  QUESTION_TYPE,
} from '../../../../Question/constants';
import { questionnaireMetaData } from './answers';
import { isUUID } from '../../../../../utils/functions/isUUID';

export const isQuestionnaireFetching = writable(false);
export const deleteConfirmation = writable({ open: false });

// {'question-id': { option: '', title: '', ... }}
export const questionnaireValidation = writable({});

export const questionnaire = writable({
  title: '',
  due_by: '',
  is_due_by_dirty: false,
  is_title_dirty: false,
  description: '',
  is_description_dirty: false,
  questions: [],
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
    if (
      question.question_type.id === QUESTION_TYPE.TEXTAREA ||
      question.deleted_at
    ) {
      continue;
    }
    const qErrors = errors[question.id] || {};

    const hasAnswer = question.options
      .filter((o) => !o.deleted_at)
      .some((option) => option.is_correct);

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
          question_type: {
            id: QUESTION_TYPE.RADIO,
          },
          options: [
            {
              id: '1-form',
              label: '',
              value: null,
              is_correct: false,
            },
          ],
        },
      ],
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
                  id: `${question.options.length + 1}-form`,
                  label: '',
                  value: '',
                  is_correct: false,
                },
              ],
            };
          }

          return question;
        }),
      };
    });
  };
}

export function handleRemoveOption(questionId, optionId) {
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
                  option.deleted_at = new Date();
                }
                return option;
              }),
            };
          }

          return question;
        }),
      };
    });
  };
}

export function handleRemoveQuestion(questionId) {
  return () => {
    questionnaire.update((q) => {
      const { questions } = q;

      return {
        ...q,
        questions: questions.map((q) => {
          if (q.id === questionId) {
            q.deleted_at = new Date();
          }
          return q;
        }),
      };
    });
  };
}

export function handleCode(questionId, shouldAdd = true) {
  questionnaire.update((q) => {
    const { questions } = q;

    return {
      ...q,
      questions: questions.map((question) => {
        if (question.id === questionId) {
          return {
            ...question,
            code: shouldAdd ? question.code || '' : undefined,
          };
        }

        return question;
      }),
    };
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
              }),
            };
          }

          return question;
        }),
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

                  if (!isUUID(option.value)) {
                    option.value = label.split(' ').join('-');
                  }

                  option.label = label;
                  option.is_dirty = true;
                }

                return option;
              }),
            };
          }

          return question;
        }),
      };
    });
  };
}
