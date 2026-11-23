import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const assignmentsQueryKey = (userId: string | null, orgId: string | null) =>
  ['assignments', userId, orgId] as const;

export const learningHistoryQueryKey = (userId: string | null, orgId: string | null) =>
  ['learning-history', userId, orgId] as const;

/** Exercises across the learner's courses: upcoming first, then submitted, then graded. */
export function useAssignmentsQuery(enabled = true) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(assignmentsQueryKey(userId, orgId), async () => {
      const response = await request(api.account.assignments.$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId) && enabled
  });
}

/** Courses the learner has completed, compliance courses excluded. */
export function useLearningHistoryQuery(enabled = true) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(learningHistoryQueryKey(userId, orgId), async () => {
      const response = await request(api.account['learning-history'].$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId) && enabled
  });
}
