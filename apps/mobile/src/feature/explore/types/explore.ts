import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type CourseRoutes = ApiClient['organization']['courses'];

type ExploreCoursesResponse = Extract<InferResponseType<CourseRoutes['recommended']['$get'], 200>, { success: true }>;

type ExploreCourseResponse = Extract<
  InferResponseType<CourseRoutes['recommended'][':courseId']['$get'], 200>,
  { success: true }
>;

type EnrollResponse = Extract<
  InferResponseType<ApiClient['course'][':courseId']['enroll']['$post'], 200>,
  { success: true }
>;

export type ExploreCoursesPage = Pick<ExploreCoursesResponse, 'data' | 'pagination'>;

export type ExploreCourseSummary = ExploreCoursesResponse['data'][number];

export type ExploreCourse = ExploreCourseResponse['data'];

export type EnrollResult = EnrollResponse['data'];
