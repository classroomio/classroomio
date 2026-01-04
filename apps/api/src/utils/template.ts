import { TNewExerciseTemplate } from '@db/types';

export function calculateTotalPoints(template: TNewExerciseTemplate): number {
  let totalPoints = 0;

  if (!template.questionnaire) {
    return 0;
  }

  template.questionnaire.questions.forEach((question) => {
    totalPoints += question.points;
  });

  return totalPoints;
}
