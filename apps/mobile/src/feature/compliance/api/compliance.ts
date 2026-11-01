import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const complianceQueryKey = (userId: string | null, orgId: string | null) =>
  ['account', 'compliance', userId, orgId] as const;

export function useComplianceQuery() {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(complianceQueryKey(userId, orgId), async () => {
      const response = await request(api.account.compliance.$get());

      return response.data;
    }),
    enabled: Boolean(userId && orgId)
  });
}
