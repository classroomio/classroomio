import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, snapshotQueryOptions, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { useCohortKeys } from '@/feature/cohort/helpers/use-cohort-keys';
import type { CohortPost, CohortPostsPage } from '@/feature/cohort/types/cohort';
import { previewReactionToggle } from '@/feature/newsfeed/helpers/reactions';
import type { ReactionType } from '@/feature/newsfeed/types/newsfeed';

const POSTS_PAGE_SIZE = 10;

type CohortPostPages = InfiniteData<CohortPostsPage, string | undefined>;

export function useCohortPostsQuery(cohortId: string) {
  const api = useApi();
  const keys = useCohortKeys(cohortId);

  return useInfiniteQuery({
    queryKey: keys.posts,
    queryFn: async ({ pageParam }) => {
      const response = await request(
        api.cohort[':cohortId'].newsfeed.$get({
          param: { cohortId },
          query: { limit: String(POSTS_PAGE_SIZE), ...(pageParam ? { cursor: pageParam } : {}) }
        })
      );
      if (!pageParam) writeQuerySnapshot(keys.posts, response.data);

      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined),
    initialData: () => {
      const firstPage = readQuerySnapshot<CohortPostsPage>(keys.posts);

      return firstPage ? { pages: [firstPage], pageParams: [undefined] } : undefined;
    },
    initialDataUpdatedAt: 0,
    enabled: keys.enabled
  });
}

/** One announcement, read from the cohort's feed. */
export function useCohortPost(cohortId: string, postId: string) {
  const posts = useCohortPostsQuery(cohortId);
  const post = posts.data?.pages.flatMap((page) => page.items).find((item) => item.id === postId);

  return { post, isPending: posts.isPending };
}

function withPost(pages: CohortPostPages | undefined, postId: string, update: (post: CohortPost) => CohortPost) {
  if (!pages) return pages;

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.map((post) => (post.id === postId ? update(post) : post))
    }))
  };
}

type ToggleReactionInput = { post: CohortPost; type: ReactionType; memberId: string };

/** Sets or clears the member's reaction on an announcement, showing it at once and rolling back if refused. */
export function useToggleCohortReactionMutation(cohortId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useCohortKeys(cohortId);

  const write = (postId: string, reaction: CohortPost['reaction']) =>
    queryClient.setQueryData<CohortPostPages>(keys.posts, (current) =>
      withPost(current, postId, (post) => ({ ...post, reaction }))
    );

  return useMutation({
    mutationFn: async ({ post, type, memberId }: ToggleReactionInput) => {
      const reaction = previewReactionToggle(post.reaction, memberId, type);
      const response = await request(
        api.cohort[':cohortId'].newsfeed[':feedId'].react.$put({
          param: { cohortId, feedId: post.id },
          json: { reaction }
        })
      );

      return response.data;
    },
    onMutate: async ({ post, type, memberId }) => {
      await queryClient.cancelQueries({ queryKey: keys.posts });
      write(post.id, previewReactionToggle(post.reaction, memberId, type));
    },
    onError: (_error, { post }) => write(post.id, post.reaction),
    onSuccess: (result, { post }) => {
      if (result?.reaction) write(post.id, result.reaction);
    }
  });
}

export function useCohortCommentsQuery(cohortId: string, postId: string) {
  const api = useApi();
  const keys = useCohortKeys(cohortId);

  return useQuery({
    ...snapshotQueryOptions(keys.comments(postId), async () => {
      const response = await request(
        api.cohort[':cohortId'].newsfeed[':feedId'].comments.$get({ param: { cohortId, feedId: postId } })
      );

      return response.data;
    }),
    enabled: keys.enabled && Boolean(postId)
  });
}

export function useCreateCohortCommentMutation(cohortId: string, postId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useCohortKeys(cohortId);

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await request(
        api.cohort[':cohortId'].newsfeed[':feedId'].comment.$post({
          param: { cohortId, feedId: postId },
          json: { content }
        })
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.setQueryData<CohortPostPages>(keys.posts, (current) =>
        withPost(current, postId, (post) => ({ ...post, commentCount: (post.commentCount ?? 0) + 1 }))
      );

      return queryClient.invalidateQueries({ queryKey: keys.comments(postId) });
    }
  });
}
