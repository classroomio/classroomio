import { COURSE_TYPE } from '$lib/utils/types';
import { writable } from 'svelte/store';

export type LMSCourse = {
  id: string;
  logo: string;
  title: string;
  total_course: number;
  isPathway: boolean;
  description: string;
  progress_rate: number;
  total_lessons: number;
  currency: string;
  total_count: number;
  slug: string;
  type: COURSE_TYPE;
  total_students: number;
  is_published: boolean;
  pathway_course: {
    course: {
      lesson: {
        is_complete: boolean;
      }[];
    };
  }[];
};

export const lmsCourses = writable<LMSCourse[]>([]);
