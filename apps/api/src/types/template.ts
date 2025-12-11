export interface CustomQuestionType {
  id: number;
  label: any;
}

export interface ExerciseTemplate {
  id?: string;
  tag: string;
  title: string;
  description: string;
  questions?: number;
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
