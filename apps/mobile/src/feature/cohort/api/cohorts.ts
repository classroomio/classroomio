import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

import { cohortsQueryKey } from './query-keys';

/** Cohorts the learner belongs to in the active organization. */
export function useCohortsQuery() {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(cohortsQueryKey(userId, orgId), async () => {
      const response = await request(api.account.cohorts.$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId)
  });
}
