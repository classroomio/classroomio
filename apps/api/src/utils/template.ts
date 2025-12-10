import { ExerciseTemplate } from '@api/types/template';

export function calculateTotalPoints(template: ExerciseTemplate): number {
  let totalPoints = 0;

  template.questionnaire.questions.forEach((question) => {
    totalPoints += question.points;
  });

  return totalPoints;
}
