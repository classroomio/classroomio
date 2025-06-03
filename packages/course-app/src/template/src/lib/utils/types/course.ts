export type CourseType = 'paced' | 'live';

export type CourseFilterItem = {
  title: string;
  type: CourseType;
  checked: boolean;
};

export type Course = {
  title: string;
  description: string;
  banner: string;
  created_at: string;
  cost: number;
  currency: string;
  type: string;
  slug: string;
  lessonsCount?: number;
  sections: Section[];
};

export type Section = {
  title: string;
  sectionSlug: string;
  published: boolean;
  children: Lesson[];
};

export type Lesson = {
  title: string;
  filename: string;
};
