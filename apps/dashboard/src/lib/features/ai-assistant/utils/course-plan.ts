export interface CoursePlanSectionItem {
  type: 'lesson' | 'exercise';
  title: string;
  description: string;
  order: number;
  hasExercise: boolean;
}

export interface CoursePlanSection {
  title: string;
  order: number;
  items: CoursePlanSectionItem[];
}

export interface CoursePlan {
  title: string;
  sections: CoursePlanSection[];
}
