import { writable } from 'svelte/store';
import {
  QUESTION_TEMPLATE,
  QUESTION_TYPE,
} from '../../../../../Question/constants';

export const questionnaire = writable({
  title: '',
  description: '',
  questions: [],
});

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
          value: '',
          answers: [],
          options: [
            {
              id: '1',
              value: null,
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
                  id: question.options[question.options.length - 1].id + 1,
                  value: '',
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
              options: [
                ...question.options.filter((option) => option.id !== optionId),
              ],
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
        questions: questions.filter((q) => q.id !== questionId),
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
            const selectOption = question.options.find(
              (option) => option.id === optionId
            );
            const newAnswers = [];

            if (question.type === QUESTION_TYPE.RADIO) {
              newAnswers.push(optionId);
            } else if (question.answers.includes(selectOption.id)) {
              newAnswers.push(
                ...question.answers.filter(
                  (answer) => answer !== selectOption.id
                )
              );
            } else {
              newAnswers.push(...question.answers, selectOption.id);
            }

            return {
              ...question,
              answers: newAnswers,
            };
          }

          return question;
        }),
      };
    });
  };
}
