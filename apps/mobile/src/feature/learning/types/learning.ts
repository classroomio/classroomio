import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type AssignmentsResponse = Extract<
  InferResponseType<ApiClient['account']['assignments']['$get'], 200>,
  { success: true }
>;

type HistoryResponse = Extract<
  InferResponseType<ApiClient['account']['learning-history']['$get'], 200>,
  { success: true }
>;

export type Assignment = AssignmentsResponse['data'][number];

export type AssignmentStatus = Assignment['status'];

export type HistoryCourse = HistoryResponse['data'][number];

export type StatusFilter = 'all' | 'in-progress' | 'not-started';

export type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

export type DurationFilter = 'all' | 'short' | 'medium' | 'long';

export type LearningFilters = { status: StatusFilter; level: LevelFilter; duration: DurationFilter };

export type ContentTypeFilter = 'all' | 'paths' | 'courses';

export type ExploreFilters = { type: ContentTypeFilter; level: LevelFilter; duration: DurationFilter };
