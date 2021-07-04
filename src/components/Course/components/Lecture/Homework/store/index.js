import { writable } from "svelte/store";
import {
  QUESTION_TEMPLATE,
  QUESTION_TYPE,
} from "../../../../../Question/constants";

export const questionnaire = writable({
  title: "Home task 1",
  description:
    "You will be to answer 10 questions, it isn't timed so you can take your time to answer. You can also continue from where you left off, you don't need to worry cause everything is automatically syncronized in the cloud.",
  questions: [
    {
      id: "react-founder",
      type: QUESTION_TYPE.RADIO,
      title: "Who is the creator of React.js",
      options: [
        {
          id: 1,
          value: "Dan Abrahmov",
        },
        {
          id: 2,
          value: "Google",
        },
        {
          id: 3,
          value: "Facebook",
        },
        {
          id: 4,
          value: "Traversy Media",
        },
      ],
      answers: [],
    },
    {
      id: "vue-founder",
      type: QUESTION_TYPE.CHECKBOX,
      title: "Who is the creator of Vue.js",
      code: `const name = 'Josh Perez';\nconst element = <h1>Hello, {name}</h1>;\n\nReactDOM.render(\n 
    element,\,
    document.getElementById('root')
  )
      `,
      options: [
        {
          id: 1,
          value: "Evan Vue",
        },
        {
          id: 2,
          value: "Mark Zukerberg",
        },
        {
          id: 3,
          value: "Prince Charles",
        },
        {
          id: 4,
          value: "Bill Gates",
        },
      ],
      answers: [],
    },
    {
      id: "svelte-founder",
      type: QUESTION_TYPE.CHECKBOX,
      title: "Who is the creator of Svelte.js",
      options: [
        {
          id: 1,
          value: "Hillary Svelte",
        },
        {
          id: 2,
          value: "Mircosoft",
        },
        {
          id: 3,
          value: "Elevate",
        },
        {
          id: 4,
          value: "Coding Train",
        },
      ],
      answers: [2],
    },
    {
      id: "angular-founder",
      type: QUESTION_TYPE.TEXTAREA,
      title: "Who is the creator of Angular.js",
      value: "",
    },
  ],
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
          id: questions.length + 1,
          value: "",
          answers: [],
          options: [
            {
              id: 1,
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
                  value: "",
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
            code: shouldAdd ? (question.code || "") : undefined,
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
            const selectOption = question.options.find(option => option.id === optionId);
            const newAnswers = [];

            if (question.answers.includes(selectOption.id)) {
              newAnswers.push(
                ...question.answers.filter(answer => answer !== selectOption.id)
              )
            } else {
              newAnswers.push(
                ...question.answers,
                selectOption.id
              )
            }

            return {
              ...question,
              answers: newAnswers
            };
          }

          return question;
        }),
      };
    });

  }
}
