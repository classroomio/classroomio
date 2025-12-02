import { TCourse } from '@db/types';

// Response types
export interface CloneCourseResponse {
  success: boolean;
  course: TCourse;
}

export interface CloneCourseErrorResponse {
  error: string;
  details?: string;
}
