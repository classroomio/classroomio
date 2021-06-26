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
      type: QUESTION_TYPE.CHECKBOX,
      title: "Who is the creator of React.js",
      options: [
        {
          value: "Dan Abrahmov",
        },
        {
          value: "Google",
        },
        {
          value: "Facebook",
        },
        {
          value: "Traversy Media",
        },
      ],
    },
    {
      id: "vue-founder",
      type: QUESTION_TYPE.CHECKBOX,
      title: "Who is the creator of Vue.js",
      options: [
        {
          value: "Evan Vue",
        },
        {
          value: "Mark Zukerberg",
        },
        {
          value: "Prince Charles",
        },
        {
          value: "Bill Gates",
        },
      ],
    },
    {
      id: "svelte-founder",
      type: QUESTION_TYPE.CHECKBOX,
      title: "Who is the creator of Svelte.js",
      options: [
        {
          value: "Hillary Svelte",
        },
        {
          value: "Mircosoft",
        },
        {
          value: "Elevate",
        },
        {
          value: "Coding Train",
        },
      ],
    },
    {
      id: "angular-founder",
      type: QUESTION_TYPE.CHECKBOX,
      title: "Who is the creator of Angular.js",
      options: [
        {
          value: "Laryy page",
        },
        {
          value: "Google",
        },
        {
          value: "Sales Force",
        },
      ],
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
                  id: question.options.length + 1,
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
