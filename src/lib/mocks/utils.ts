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
