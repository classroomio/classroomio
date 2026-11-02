import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';

export const accountQueryKey = (userId: string | null) => ['account', userId] as const;

export function useAccountQuery() {
  const api = useApi();
  const { userId } = useAuth();

  return useQuery({
    ...snapshotQueryOptions(accountQueryKey(userId), () => request(api.account.$get())),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000
  });
}
