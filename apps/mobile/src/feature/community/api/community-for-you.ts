import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import type { CommunityForYouQuestion } from '@/feature/community/types/community';

import { communityForYouQueryKey } from './query-keys';

/** Questions the member asked, answered or follows, most recent activity first. */
export function useCommunityForYouQuery() {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const queryKey = communityForYouQueryKey(userId, orgId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await request(api.community['for-you'].$get());
      writeQuerySnapshot(queryKey, response.data);

      return response.data;
    },
    initialData: () => readQuerySnapshot<CommunityForYouQuestion[]>(queryKey),
    initialDataUpdatedAt: 0,
    enabled: Boolean(userId && orgId)
  });
}
