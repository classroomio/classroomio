import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { NewsfeedCommentThread, NewsfeedPage, NewsfeedPost } from '@/feature/teach/types/teach';

import { teachKeys, useTeachScope } from './teach-scope';

const PAGE_SIZE = 10;

export function useCourseNewsfeedQuery(courseId: string) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useInfiniteQuery({
    queryKey: teachKeys.newsfeed(userId, orgId, courseId),
    queryFn: async ({ pageParam }) => {
      const query = pageParam ? { cursor: pageParam, limit: String(PAGE_SIZE) } : { limit: String(PAGE_SIZE) };
      const response = await request(api.course[':courseId'].newsfeed.$get({ param: { courseId }, query }));

      return response.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : null),
    enabled: enabled && Boolean(courseId)
  });
}

function useUpdateCachedPosts(courseId: string) {
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return (update: (items: NewsfeedPost[]) => NewsfeedPost[]) => {
    queryClient.setQueryData<InfiniteData<NewsfeedPage, string | null>>(
      teachKeys.newsfeed(userId, orgId, courseId),
      (data) => data && { ...data, pages: data.pages.map((page) => ({ ...page, items: update(page.items) })) }
    );
  };
}

export function useCreateAnnouncementMutation(courseId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return useMutation({
    mutationFn: async ({ content, isPinned }: { content: string; isPinned: boolean }) => {
      const response = await request(
        api.course[':courseId'].newsfeed.$post({ param: { courseId }, json: { courseId, content, isPinned } })
      );

      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teachKeys.newsfeed(userId, orgId, courseId) })
  });
}

export function usePinPostMutation(courseId: string) {
  const api = useApi();
  const updatePosts = useUpdateCachedPosts(courseId);

  return useMutation({
    mutationFn: async ({ feedId, isPinned }: { feedId: string; isPinned: boolean }) => {
      const response = await request(
        api.course[':courseId'].newsfeed[':feedId'].$put({ param: { courseId, feedId }, json: { isPinned } })
      );

      return response.data;
    },
    onSuccess: (_data, { feedId, isPinned }) =>
      updatePosts((items) => items.map((item) => (item.id === feedId ? { ...item, isPinned } : item)))
  });
}

export function useDeletePostMutation(courseId: string) {
  const api = useApi();
  const updatePosts = useUpdateCachedPosts(courseId);

  return useMutation({
    mutationFn: async (feedId: string) => {
      const response = await request(
        api.course[':courseId'].newsfeed[':feedId'].$delete({ param: { courseId, feedId } })
      );

      return response.data;
    },
    onSuccess: (_data, feedId) => updatePosts((items) => items.filter((item) => item.id !== feedId))
  });
}

export function usePostCommentsQuery(courseId: string, feedId: string) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: teachKeys.comments(userId, orgId, courseId, feedId),
    queryFn: async () => {
      const response = await request(
        api.course[':courseId'].newsfeed[':feedId'].comments.$get({
          param: { courseId, feedId },
          query: { limit: '50', childLimit: '20', maxDepth: '6' }
        })
      );

      return response.data;
    },
    enabled: enabled && Boolean(courseId && feedId)
  });
}

export function useDeleteCommentMutation(courseId: string, feedId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();
  const updatePosts = useUpdateCachedPosts(courseId);

  return useMutation({
    mutationFn: async (commentId: number) => {
      const response = await request(
        api.course[':courseId'].newsfeed.comment[':commentId'].$delete({
          param: { courseId, commentId: String(commentId) }
        })
      );

      return response.data;
    },
    onSuccess: (deleted, commentId) => {
      const removedCount = 1 + deleted.deletedDescendantCount;

      queryClient.setQueryData<NewsfeedCommentThread>(teachKeys.comments(userId, orgId, courseId, feedId), (thread) => {
        if (!thread) return thread;

        const removedIds = new Set([commentId]);
        let grew = true;
        while (grew) {
          const before = removedIds.size;
          for (const item of thread.items) {
            if (item.parentId !== null && removedIds.has(item.parentId)) removedIds.add(item.id);
          }
          grew = removedIds.size > before;
        }

        return { ...thread, items: thread.items.filter((item) => !removedIds.has(item.id)) };
      });

      updatePosts((items) =>
        items.map((item) =>
          item.id === feedId ? { ...item, commentCount: Math.max(0, item.commentCount - removedCount) } : item
        )
      );
    }
  });
}
