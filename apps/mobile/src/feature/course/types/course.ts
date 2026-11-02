import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type EnrolledCoursesResponse = Extract<
  InferResponseType<ApiClient['organization']['courses']['enrolled']['$get'], 200>,
  { success: true }
>;

export type EnrolledCourse = EnrolledCoursesResponse['data'][number];

export type LearningStatus = 'in-progress' | 'not-started' | 'completed';
