export function calculateTotalPoints(template): number {
  let totalPoints = 0;

  template.questionnaire.questions.forEach((question) => {
    totalPoints += question.points;
  });

  return totalPoints;
}
