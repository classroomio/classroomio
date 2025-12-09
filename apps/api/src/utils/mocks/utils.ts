export interface CustomQuestionType {
  id: number;
  label: any;
}

export interface ExerciseTemplate {
  title: string;
  description: string;
  questionnaire: {
    questions: {
      title: string;
      name: string;
      points: number;
      order: number;
      question_type: CustomQuestionType;
      options: {
        label: string;
        is_correct: boolean;
      }[];
    }[];
  };
}

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
