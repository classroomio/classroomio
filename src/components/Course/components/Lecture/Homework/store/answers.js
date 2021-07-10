import { writable } from "svelte/store";

export const userQuestionniareAnswers = writable({
  answers: {},
  scores: {},
  currentQuestionIndex: 5,
  isFinished: true,
  progressValue: 100,
});
