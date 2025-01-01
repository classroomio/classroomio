import { Profile } from '.';

export interface SubmissionItem {
  id: string;
  statusId: number;
  isEarly: boolean;
  submittedAt: string;
  exercise: {
    id: string;
    title: string;
  };
  answers: string;
  student: Partial<Profile>;
  lesson: {
    id: string;
    title: string;
  };
}

export interface SubmissionSection {
  id: number;
  title: string;
  value: number;
  items: SubmissionItem[] | [];
}

export interface SubmissionIdData {
  id: string;
  statusId: number;
  title: string;
  isEarly: boolean;
  questionAnswerByPoint: Record<string, string>;
  answers: Record<string, string>;
  questions: {
    id: number;
    title: string;
    order: number;
    points: number;
    question_type_id: number;
  }[];
  questionAnswers: {
    open_answer: string;
    question_id: number;
    answers: [];
  }[];
  student?: Partial<Profile>;
  feedback: string;
}
