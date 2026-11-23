import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type GoalsResponse = Extract<InferResponseType<ApiClient['account']['goals']['$get'], 200>, { success: true }>;

export type GoalsSummary = GoalsResponse['data'];

export type StreakDay = GoalsSummary['streak']['days'][number];

export type StreakMilestone = GoalsSummary['milestones'][number];
