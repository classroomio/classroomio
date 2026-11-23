import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type PathRoutes = ApiClient['learning-path'];

type EnrolledResponse = Extract<InferResponseType<PathRoutes['enrolled']['$get'], 200>, { success: true }>;

type ExploreResponse = Extract<InferResponseType<PathRoutes['explore']['$get'], 200>, { success: true }>;

type LearnerResponse = Extract<InferResponseType<PathRoutes[':pathId']['learner']['$get'], 200>, { success: true }>;

export type EnrolledPath = EnrolledResponse['data'][number];

export type ExplorePath = ExploreResponse['data'][number];

export type LearnerPath = LearnerResponse['data'];

export type LearnerPathCourse = LearnerPath['courses'][number];
