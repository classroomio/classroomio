import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const certificatesQueryKey = (userId: string | null, orgId: string | null) =>
  ['account', 'certificates', userId, orgId] as const;

export function useCertificatesQuery() {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    queryKey: certificatesQueryKey(userId, orgId),
    queryFn: async () => {
      const response = await request(api.account.certificates.$get());

      return response.data;
    },
    enabled: Boolean(userId && orgId)
  });
}
