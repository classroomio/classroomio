import type { CustomQuestionType } from '$lib/utils/types';
import type { ExerciseTemplate } from '$lib/utils/types';

export const QuestionTypes: CustomQuestionType[] = [
  {
    id: 1,
    label: 'RADIO'
  },
  {
    id: 2,
    label: 'CHECKBOX'
  },
  {
    id: 3,
    label: 'TEXTAREA'
  }
];

export function calculateTotalPoints(template: ExerciseTemplate): number {
  let totalPoints = 0;

  template.questionnaire.questions.forEach((question) => {
    totalPoints += question.points;
  });

  return totalPoints;
}

export function shuffleOptions(
  array: Array<{
    label: string;
    is_correct: boolean;
  }>
) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}
