import type { InferResponseType } from '@cio/api/rpc-types';
import { classroomio } from '$lib/utils/services/api';

// Org Courses types
export type GetOrgCoursesRequest = typeof classroomio.organization.courses.$get;
export type OrgCoursesResponse = InferResponseType<GetOrgCoursesRequest> | null;
export type OrgCoursesSuccess = Extract<InferResponseType<GetOrgCoursesRequest>, { success: true }>;
export type OrgCourses = OrgCoursesSuccess['data'];

// User Enrolled Courses types
export type GetUserEnrolledCoursesRequest = typeof classroomio.organization.courses.enrolled.$get;
export type UserEnrolledCoursesResponse = InferResponseType<GetUserEnrolledCoursesRequest> | null;
export type UserEnrolledCoursesSuccess = Extract<InferResponseType<GetUserEnrolledCoursesRequest>, { success: true }>;
export type UserEnrolledCourses = UserEnrolledCoursesSuccess['data'];

// Recommended Courses types
export type GetRecommendedCoursesRequest = typeof classroomio.organization.courses.recommended.$get;
export type RecommendedCoursesResponse = InferResponseType<GetRecommendedCoursesRequest> | null;
export type RecommendedCoursesSuccess = Extract<InferResponseType<GetRecommendedCoursesRequest>, { success: true }>;
export type RecommendedCourses = RecommendedCoursesSuccess['data'];

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
  // TODO: Fix this when we refactor exercises
  answers?: Array<unknown>;
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
