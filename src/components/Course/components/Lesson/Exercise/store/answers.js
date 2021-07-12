import { writable } from "svelte/store";

import { STATUS } from "../constants";

// export const userQuestionniareAnswers = writable({
//   answers: {},
//   scores: { gates: 60 },
//   currentQuestionIndex: 5,
//   isFinished: true,
//   progressValue: 100,
//   status: STATUS.REVIEWED,
// });

export const userQuestionniareAnswers = writable({
  answers: {},
  scores: {},
  currentQuestionIndex: 0,
  isFinished: false,
  progressValue: 100,
  status: STATUS.IN_PROGRESS,
});
