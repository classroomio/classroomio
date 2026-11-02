import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type SuccessOf<Body> = Extract<Body, { success: true }>;

type CohortRoutes = ApiClient['cohort'][':cohortId'];
type FeedRoutes = CohortRoutes['newsfeed'][':feedId'];

type CohortsResponse = SuccessOf<InferResponseType<ApiClient['account']['cohorts']['$get'], 200>>;
type CohortResponse = SuccessOf<InferResponseType<CohortRoutes['$get'], 200>>;
type CohortCoursesResponse = SuccessOf<InferResponseType<CohortRoutes['courses']['$get'], 200>>;
type CohortMembersResponse = SuccessOf<InferResponseType<CohortRoutes['members']['$get'], 200>>;
type MyGoalsResponse = SuccessOf<InferResponseType<ApiClient['cohort']['my']['goals']['$get'], 200>>;
type CohortPostsResponse = SuccessOf<InferResponseType<CohortRoutes['newsfeed']['$get'], 200>>;
type CohortReactResponse = SuccessOf<InferResponseType<FeedRoutes['react']['$put'], 200>>;
type CohortCommentsResponse = SuccessOf<InferResponseType<FeedRoutes['comments']['$get'], 200>>;

export type LearnerCohort = CohortsResponse['data'][number];

export type Cohort = CohortResponse['data'];

export type CohortCourse = CohortCoursesResponse['data'][number];

export type CohortCourseInfo = NonNullable<CohortCourse['course']>;

export type CohortMember = CohortMembersResponse['data'][number];

export type CohortGoal = MyGoalsResponse['data'][number];

export type CohortGoalStatus = CohortGoal['status'];

export type CohortPostsPage = CohortPostsResponse['data'];

export type CohortPost = CohortPostsPage['items'][number];

export type CohortReactionResult = CohortReactResponse['data'];

export type CohortComment = CohortCommentsResponse['data'][number];
