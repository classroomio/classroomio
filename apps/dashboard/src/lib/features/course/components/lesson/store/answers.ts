import { STATUS } from '../exercise/constants';
import { writable } from 'svelte/store';

// export const questionnaireMetaData = writable({
//   answers: {},
//   scores: { gates: 60 },
//   currentQuestionIndex: 5,
//   isFinished: true,
//   progressValue: 100,
//   status: STATUS.GRADED,
// });
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
