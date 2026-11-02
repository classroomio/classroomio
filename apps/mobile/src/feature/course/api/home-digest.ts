import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const homeDigestQueryKey = (userId: string | null, orgId: string | null) =>
  ['home', 'digest', userId, orgId] as const;

/** The server's Home summary: compliance due soon, the overdue count and the next live class. */
export function useHomeDigestQuery() {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(homeDigestQueryKey(userId, orgId), async () => {
      const response = await request(api.account['home-digest'].$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId)
  });
}
