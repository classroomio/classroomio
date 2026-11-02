import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import type { CommunityForYouQuestion, CommunityQuestion } from '@/feature/community/types/community';

import { useCommunityCache } from './community-cache';
import { communityQuestionQueryKey } from './query-keys';

/** One question with its answers. Fetching it marks the question read, so For you drops its unread marker. */
export function useCommunityQuestionQuery(slug: string) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const cache = useCommunityCache();
  const queryKey = communityQuestionQueryKey(userId, orgId, slug);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await request(api.community[':slug'].$get({ param: { slug } }));
      writeQuerySnapshot(queryKey, response.data);
      cache.queryClient.setQueryData<CommunityForYouQuestion[]>(cache.keys.forYou, (current) =>
        current?.map((question) => (question.slug === slug ? { ...question, hasUnread: false } : question))
      );

      return response.data;
    },
    initialData: () => readQuerySnapshot<CommunityQuestion>(queryKey),
    initialDataUpdatedAt: 0,
    enabled: Boolean(userId && orgId && slug)
  });
}
