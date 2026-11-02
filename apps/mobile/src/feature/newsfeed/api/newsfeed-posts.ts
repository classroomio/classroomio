import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { POSTS_PAGE_SIZE } from '@/feature/newsfeed/constants/thread';
import { useNewsfeedKeys } from '@/feature/newsfeed/helpers/use-newsfeed-keys';
import type { NewsfeedPage, NewsfeedPost } from '@/feature/newsfeed/types/newsfeed';

export type NewsfeedPages = InfiniteData<NewsfeedPage, string | undefined>;

export function useNewsfeedPostsQuery(courseId: string) {
  const api = useApi();
  const keys = useNewsfeedKeys(courseId);

  return useInfiniteQuery({
    queryKey: keys.posts,
    queryFn: async ({ pageParam }) => {
      const response = await request(
        api.course[':courseId'].newsfeed.$get({
          param: { courseId },
          query: { limit: String(POSTS_PAGE_SIZE), ...(pageParam ? { cursor: pageParam } : {}) }
        })
      );
      if (!pageParam) writeQuerySnapshot(keys.posts, response.data);

      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined),
    initialData: () => {
      const firstPage = readQuerySnapshot<NewsfeedPage>(keys.posts);

      return firstPage ? { pages: [firstPage], pageParams: [undefined] } : undefined;
    },
    initialDataUpdatedAt: 0,
    enabled: keys.enabled
  });
}

function findPost(pages: NewsfeedPages | undefined, postId: string) {
  for (const page of pages?.pages ?? []) {
    const post = page.items.find((item) => item.id === postId);
    if (post) return post;
  }

  return undefined;
}

/**
 * One post, read from the loaded feed when it is there. Opened directly, it falls back to the single-post
 * route, which returns no author details.
 */
export function useNewsfeedPostQuery(courseId: string, postId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useNewsfeedKeys(courseId);
  const cached = findPost(queryClient.getQueryData<NewsfeedPages>(keys.posts), postId);

  return useQuery({
    queryKey: keys.post(postId),
    queryFn: async (): Promise<NewsfeedPost> => {
      const fromFeed = findPost(queryClient.getQueryData<NewsfeedPages>(keys.posts), postId);
      const response = await request(
        api.course[':courseId'].newsfeed[':feedId'].$get({ param: { courseId, feedId: postId } })
      );
      const post: NewsfeedPost = {
        authorProfileId: null,
        authorFullname: null,
        authorUsername: null,
        authorAvatarUrl: null,
        commentCount: 0,
        ...fromFeed,
        ...response.data
      };
      writeQuerySnapshot(keys.post(postId), post);

      return post;
    },
    initialData: () => cached ?? readQuerySnapshot<NewsfeedPost>(keys.post(postId)),
    initialDataUpdatedAt: cached ? Date.now() : 0,
    enabled: keys.enabled && Boolean(postId)
  });
}
