export type Question = {
  id: number | string;
  value: string;
  name: string;
  title: string;
  type: number;
  points: number;
  order: number;
  question_type: {
    id: number;
    label: string;
  };
  question_type_id: number;
  code?: string;
  answers?: Array<any>;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
  is_dirty?: boolean;
  options: {
    id: number | string;
    label: string | null;
    value: string | null;
    is_correct: boolean;
    deleted_at?: string;
    is_dirty?: boolean;
  }[];
};
