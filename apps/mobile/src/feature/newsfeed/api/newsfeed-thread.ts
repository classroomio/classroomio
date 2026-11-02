import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAccountQuery } from '@/feature/account/api/account';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import {
  CHILD_PAGE_SIZE,
  FETCH_DEPTH,
  MORE_REPLIES_PAGE_SIZE,
  ROOT_PAGE_SIZE
} from '@/feature/newsfeed/constants/thread';
import {
  childCursorOf,
  EMPTY_THREAD,
  insertComment,
  mergeThreadPage,
  removeComment,
  updateCommentContent
} from '@/feature/newsfeed/helpers/comment-thread';
import { useNewsfeedKeys } from '@/feature/newsfeed/helpers/use-newsfeed-keys';
import type { CommentThread, NewsfeedComment, NewsfeedPost, NewsfeedViewer } from '@/feature/newsfeed/types/newsfeed';

import type { NewsfeedPages } from './newsfeed-posts';

type PageQuery = { rootId?: number; cursor?: string; childCursor?: string; limit: number; childLimit: number };

function useFetchThreadPage(courseId: string, postId: string) {
  const api = useApi();

  return async ({ rootId, cursor, childCursor, limit, childLimit }: PageQuery) => {
    const query: Record<string, string> = {
      limit: String(limit),
      childLimit: String(childLimit),
      maxDepth: String(FETCH_DEPTH)
    };
    if (rootId !== undefined) query.rootId = String(rootId);
    if (cursor) query.cursor = cursor;
    if (childCursor) query.childCursor = childCursor;

    const response = await request(
      api.course[':courseId'].newsfeed[':feedId'].comments.$get({ param: { courseId, feedId: postId }, query })
    );

    return response.data;
  };
}

export function useCommentThreadQuery(courseId: string, postId: string) {
  const keys = useNewsfeedKeys(courseId);
  const fetchPage = useFetchThreadPage(courseId, postId);
  const queryKey = keys.thread(postId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const page = await fetchPage({ limit: ROOT_PAGE_SIZE, childLimit: CHILD_PAGE_SIZE });
      const thread = mergeThreadPage(EMPTY_THREAD, page);
      writeQuerySnapshot(queryKey, thread);

      return thread;
    },
    initialData: () => readQuerySnapshot<CommentThread>(queryKey),
    initialDataUpdatedAt: 0,
    enabled: keys.enabled && Boolean(postId)
  });
}

/** Loads the next page of top-level comments, or the next replies under one comment. */
export function useLoadMoreCommentsMutation(courseId: string, postId: string) {
  const queryClient = useQueryClient();
  const keys = useNewsfeedKeys(courseId);
  const fetchPage = useFetchThreadPage(courseId, postId);
  const queryKey = keys.thread(postId);

  return useMutation({
    mutationFn: async (target: { kind: 'roots' } | { kind: 'replies'; parentId: number }) => {
      const thread = queryClient.getQueryData<CommentThread>(queryKey) ?? EMPTY_THREAD;
      if (target.kind === 'roots') {
        return fetchPage({
          cursor: thread.rootCursor ?? undefined,
          limit: ROOT_PAGE_SIZE,
          childLimit: CHILD_PAGE_SIZE
        });
      }

      return fetchPage({
        rootId: target.parentId,
        childCursor: childCursorOf(thread, target.parentId),
        limit: 1,
        childLimit: MORE_REPLIES_PAGE_SIZE
      });
    },
    onSuccess: (page) => {
      queryClient.setQueryData<CommentThread>(queryKey, (current) => mergeThreadPage(current ?? EMPTY_THREAD, page));
    }
  });
}

function adjustCommentCount(pages: NewsfeedPages | undefined, postId: string, delta: number) {
  if (!pages) return pages;

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.map((post) =>
        post.id === postId ? { ...post, commentCount: Math.max(0, post.commentCount + delta) } : post
      )
    }))
  };
}

export function useCreateCommentMutation(courseId: string, postId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useNewsfeedKeys(courseId);
  const account = useAccountQuery();
  const queryKey = keys.thread(postId);

  return useMutation({
    mutationFn: async ({ content, parent }: { content: string; parent: NewsfeedComment | null }) => {
      const response = await request(
        api.course[':courseId'].newsfeed[':feedId'].comment.$post({
          param: { courseId, feedId: postId },
          json: { courseNewsfeedId: postId, content, ...(parent ? { parentId: parent.id } : {}) }
        })
      );

      return response.data;
    },
    onSuccess: (created, { parent }) => {
      const profile = account.data?.profile;
      const comment: NewsfeedComment = {
        id: created.id,
        parentId: created.parentId,
        replyToCommentId: created.replyToCommentId,
        courseNewsfeedId: created.courseNewsfeedId,
        authorId: created.authorId,
        content: created.content,
        createdAt: created.createdAt,
        depth: parent ? parent.depth + 1 : 0,
        authorProfileId: profile?.id ?? null,
        authorFullname: profile?.fullname ?? null,
        authorUsername: profile?.username ?? null,
        authorAvatarUrl: profile?.avatarUrl ?? null,
        replyToAuthorFullname: null,
        directReplyCount: 0,
        descendantCount: 0,
        loadedChildCount: 0,
        hasMoreChildren: false
      };

      queryClient.setQueryData<CommentThread>(queryKey, (current) => insertComment(current ?? EMPTY_THREAD, comment));
      if (!parent) {
        queryClient.setQueryData<NewsfeedPages>(keys.posts, (current) => adjustCommentCount(current, postId, 1));
        queryClient.setQueryData<NewsfeedPost>(keys.post(postId), (current) =>
          current ? { ...current, commentCount: current.commentCount + 1 } : current
        );
      }
      queryClient.setQueryData<NewsfeedViewer>(keys.viewer, (current) =>
        current && !current.groupMemberId ? { ...current, groupMemberId: created.authorId } : current
      );
    }
  });
}

export function useUpdateCommentMutation(courseId: string, postId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useNewsfeedKeys(courseId);

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      await request(
        api.course[':courseId'].newsfeed.comment[':commentId'].$put({
          param: { courseId, commentId: String(commentId) },
          json: { content }
        })
      );
    },
    onSuccess: (_result, { commentId, content }) => {
      queryClient.setQueryData<CommentThread>(keys.thread(postId), (current) =>
        current ? updateCommentContent(current, commentId, content) : current
      );
    }
  });
}

export function useDeleteCommentMutation(courseId: string, postId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useNewsfeedKeys(courseId);

  return useMutation({
    mutationFn: async (comment: NewsfeedComment) => {
      const response = await request(
        api.course[':courseId'].newsfeed.comment[':commentId'].$delete({
          param: { courseId, commentId: String(comment.id) }
        })
      );

      return response.data;
    },
    onSuccess: (deleted, comment) => {
      const removedCount = 1 + (deleted.deletedDescendantCount ?? 0);
      queryClient.setQueryData<CommentThread>(keys.thread(postId), (current) =>
        current ? removeComment(current, comment.id, removedCount) : current
      );
      if (comment.parentId === null) {
        queryClient.setQueryData<NewsfeedPages>(keys.posts, (current) => adjustCommentCount(current, postId, -1));
        queryClient.setQueryData<NewsfeedPost>(keys.post(postId), (current) =>
          current ? { ...current, commentCount: Math.max(0, current.commentCount - 1) } : current
        );
      }
    }
  });
}
