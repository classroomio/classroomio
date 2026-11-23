import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { deviceTimeZone } from '@/feature/goals/helpers/time-zone';
import type { GoalsSummary } from '@/feature/goals/types/goals';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const goalsQueryKey = (userId: string | null, orgId: string | null) => ['goals', userId, orgId] as const;

/** The learner's streak, weekly lesson goal and milestones, counted in the device's time zone. */
export function useGoalsQuery(enabled = true) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(goalsQueryKey(userId, orgId), async () => {
      const response = await request(api.account.goals.$get({ query: { timezone: deviceTimeZone() } }));

      return response.data;
    }),
    enabled: Boolean(userId && orgId) && enabled
  });
}

export function useUpdateWeeklyTargetMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const queryKey = goalsQueryKey(userId, orgId);

  return useMutation({
    mutationFn: async (weeklyLessonTarget: number) => {
      const response = await request(api.account.goals.$put({ json: { weeklyLessonTarget } }));

      return response.data;
    },
    onMutate: async (weeklyLessonTarget) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GoalsSummary>(queryKey);
      if (previous) {
        queryClient.setQueryData<GoalsSummary>(queryKey, {
          ...previous,
          weeklyGoal: {
            ...previous.weeklyGoal,
            target: weeklyLessonTarget,
            isReached: previous.weeklyGoal.completed >= weeklyLessonTarget
          }
        });
      }

      return { previous };
    },
    onError: (_error, _target, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (data) => queryClient.setQueryData(queryKey, data)
  });
}

/** Saves the device's time zone so streak reminders arrive in the learner's evening. */
export function useSyncTimeZone() {
  const api = useApi();

  return async () => {
    await request(api.account.goals.timezone.$put({ json: { timezone: deviceTimeZone() } }));
  };
}
