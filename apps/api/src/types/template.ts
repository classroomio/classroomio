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
