import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import type { CommunityQuestionSummary } from '@/feature/community/types/community';

import { communityQuestionsQueryKey } from './query-keys';

export function useCommunityQuestionsQuery() {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const queryKey = communityQuestionsQueryKey(userId, orgId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await request(api.community.$get({ query: { orgId: orgId ?? '' } }));
      writeQuerySnapshot(queryKey, response.data);

      return response.data;
    },
    initialData: () => readQuerySnapshot<CommunityQuestionSummary[]>(queryKey),
    initialDataUpdatedAt: 0,
    enabled: Boolean(userId && orgId)
  });
}
