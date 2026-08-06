import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CreateNewsfeedCommentRequest,
  CreateNewsfeedRequest,
  DeleteNewsfeedCommentRequest,
  DeleteNewsfeedRequest,
  GetNewsfeedCommentsRequest,
  GetNewsfeedRequest,
  ListNewsfeed,
  ListNewsfeedRequest,
  NewsfeedComment,
  NewsfeedCommentsResponse,
  NewsfeedNodeState,
  NewsfeedThreadIngestMode,
  NewsfeedThreadState,
  ReactToNewsfeedRequest,
  UpdateNewsfeedCommentRequest,
  UpdateNewsfeedRequest
} from '../utils/types';
import type { TNewsfeedCreate, TNewsfeedReactionUpdate, TNewsfeedUpdate } from '@cio/utils/validation/newsfeed';
import {
  ZNewsfeedCommentCreate,
  ZNewsfeedCommentUpdate,
  ZNewsfeedCreate,
  ZNewsfeedReactionUpdate,
  ZNewsfeedUpdate
} from '@cio/utils/validation/newsfeed';

import { get } from 'svelte/store';
import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { profile } from '$lib/utils/store/user';
import { snackbar } from '$features/ui/snackbar/store';

/**
 * API class for newsfeed operations
 */
export class NewsfeedApi extends BaseApiWithErrors {
  feeds = $state<ListNewsfeed>([]);

  commentById = $state<Record<string, NewsfeedComment>>({});

  childIdsByParent = $state<Record<string, number[]>>({});

  commentStateById = $state<Record<string, NewsfeedNodeState>>({});

  threadByFeedId = $state<Record<string, NewsfeedThreadState>>({});

  isNewFeedModalOpen = $state(false);

  /**
   * Opens the new feed modal
   */
  openNewFeedModal() {
    this.isNewFeedModalOpen = true;
  }

  /**
   * Closes the new feed modal
   */
  closeNewFeedModal() {
    this.isNewFeedModalOpen = false;
  }

  /**
   * Lists newsfeed items for a course
   */
  async list(courseId: string) {
    await this.execute<ListNewsfeedRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed.$get({
          param: { courseId },
          query: {}
        }),
      logContext: 'listing newsfeed',
      onSuccess: (response) => {
        if (response.data) {
          this.feeds = Array.isArray(response.data) ? response.data : response.data.items || [];
          for (const feed of this.feeds) {
            this.initComments(feed.id, feed.commentCount || 0);
          }
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to list newsfeed');
        }
      }
    });
  }

  /**
   * Gets a newsfeed item by ID
   */
  async get(courseId: string, feedId: string) {
    await this.execute<GetNewsfeedRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].$get({
          param: { courseId, feedId }
        }),
      logContext: 'fetching newsfeed item',
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch newsfeed item');
        }
      }
    });
  }

  /**
   * Creates a new newsfeed item
   */
  async create(courseId: string, fields: TNewsfeedCreate) {
    if (isHtmlValueEmpty(fields.content)) {
      this.errors = mapZodErrorsToTranslations(
        ZNewsfeedCreate.safeParse({ ...fields, content: '', courseId }).error!,
        'newsfeed'
      );
      return;
    }

    const result = ZNewsfeedCreate.safeParse({ ...fields, courseId });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'newsfeed');
      return;
    }

    await this.execute<CreateNewsfeedRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'creating newsfeed',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Post created successfully');
          const feedsArray = Array.isArray(this.feeds) ? this.feeds : [];
          const author = get(profile);

          const newFeed = {
            ...response.data,
            authorProfileId: author.id,
            authorFullname: author.fullname,
            authorUsername: author.username,
            authorAvatarUrl: author.avatarUrl,
            commentCount: 0
          };

          this.feeds = [...feedsArray, newFeed];
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to create post');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Updates a newsfeed item (content and isPinned only)
   */
  async update(courseId: string, feedId: string, fields: TNewsfeedUpdate) {
    if (fields.content !== undefined && isHtmlValueEmpty(fields.content)) {
      this.errors = mapZodErrorsToTranslations(
        ZNewsfeedUpdate.safeParse({ ...fields, content: '' }).error!,
        'newsfeed'
      );
      snackbar.error(this.errors.content ?? 'Failed to update post');
      return;
    }

    const result = ZNewsfeedUpdate.safeParse(fields);

    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'newsfeed');
      return;
    }

    await this.execute<UpdateNewsfeedRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].$put({
          param: { courseId, feedId },
          json: result.data
        }),
      logContext: 'updating newsfeed',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Post updated successfully');
          this.feeds = this.feeds.map((feed) => {
            if (feed.id !== feedId) {
              return feed;
            }

            return {
              ...feed,
              ...response.data,
              authorProfileId: feed.authorProfileId,
              authorFullname: feed.authorFullname,
              authorUsername: feed.authorUsername,
              authorAvatarUrl: feed.authorAvatarUrl
            };
          });
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update post');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Updates a newsfeed item's reaction
   */
  async react(courseId: string, feedId: string, reaction: TNewsfeedReactionUpdate['reaction']) {
    const result = ZNewsfeedReactionUpdate.safeParse({ reaction });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'newsfeed');
      return;
    }

    await this.execute<ReactToNewsfeedRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].react.$put({
          param: { courseId, feedId },
          json: result.data
        }),
      logContext: 'updating newsfeed reaction',
      onSuccess: (response) => {
        if (response.data) {
          this.feeds = this.feeds.map((feed) => {
            if (feed.id !== feedId) {
              return feed;
            }

            return {
              ...feed,
              ...response.data,
              authorProfileId: feed.authorProfileId,
              authorFullname: feed.authorFullname,
              authorUsername: feed.authorUsername,
              authorAvatarUrl: feed.authorAvatarUrl
            };
          });
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update reaction');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Deletes a newsfeed item
   */
  async delete(courseId: string, feedId: string) {
    await this.execute<DeleteNewsfeedRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].$delete({
          param: { courseId, feedId }
        }),
      logContext: 'deleting newsfeed',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Post deleted successfully');
          this.feeds = this.feeds.filter((feed) => feed.id !== feedId);
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete post');
        }
      }
    });
  }

  initComments(feedId: string, totalCommentCount: number) {
    const existing = this.threadByFeedId[feedId];
    if (!existing) {
      this.threadByFeedId[feedId] = {
        rootIds: [],
        totalRootCount: 0,
        totalCommentCount,
        hasMore: totalCommentCount > 0,
        cursor: null,
        isLoading: false
      };
      return;
    }

    existing.totalCommentCount = totalCommentCount;
  }

  private nodeState(id: number): NewsfeedNodeState | undefined {
    return this.commentStateById[String(id)];
  }

  private ancestorIds(id: number): number[] {
    const ancestors: number[] = [];
    let parentId = this.nodeState(id)?.parentId ?? null;

    while (parentId !== null && ancestors.indexOf(parentId) === -1) {
      ancestors.push(parentId);
      parentId = this.nodeState(parentId)?.parentId ?? null;
    }

    return ancestors;
  }

  private bumpDescendants(id: number, delta: number) {
    for (const ancestorId of [id, ...this.ancestorIds(id)]) {
      const state = this.nodeState(ancestorId);
      if (!state) continue;

      state.descendantCount = Math.max(0, state.descendantCount + delta);
    }
  }

  /** Prunes a comment and every loaded descendant. Returns how many were removed locally. */
  private removeSubtree(id: number): number {
    const key = String(id);
    const childIds = this.childIdsByParent[key] ?? [];
    let removed = 1;

    for (const childId of [...childIds]) {
      removed += this.removeSubtree(childId);
    }

    delete this.childIdsByParent[key];
    delete this.commentById[key];
    delete this.commentStateById[key];

    return removed;
  }

  /**
   * The single write path for server data. Counts are re-authored from the response on
   * every ingest, so they cannot drift at any depth.
   */
  private ingest(feedId: string, data: NewsfeedCommentsResponse, mode: NewsfeedThreadIngestMode) {
    const thread = this.threadByFeedId[feedId];

    for (const item of data.items) {
      const key = String(item.id);
      const previous = this.commentStateById[key];

      this.commentById[key] = item;
      this.commentStateById[key] = {
        depth: item.depth,
        parentId: item.parentId,
        directReplyCount: item.directReplyCount,
        descendantCount: item.descendantCount,
        loadedChildCount: item.loadedChildCount,
        childCursor: previous?.childCursor ?? null,
        hasMoreChildren: item.hasMoreChildren,
        isLoading: false,
        isOptimistic: false
      };
    }

    const childIds = new Map<string, number[]>();
    for (const item of data.items) {
      if (item.parentId === null) continue;

      const key = String(item.parentId);
      const siblings = childIds.get(key) ?? [];
      siblings.push(item.id);
      childIds.set(key, siblings);
    }

    for (const [parentKey, incoming] of childIds) {
      const isReplacedParent = mode === 'replaceChildren' && parentKey === String(data.rootId);
      const existing = mode === 'replaceRoots' || isReplacedParent ? [] : (this.childIdsByParent[parentKey] ?? []);
      const merged = [...existing];
      for (const id of incoming) {
        if (merged.indexOf(id) === -1) merged.push(id);
      }
      merged.sort((a, b) => b - a);
      this.childIdsByParent[parentKey] = merged;
    }

    if (!thread) return;

    const incomingRootIds = data.items.filter((item) => item.depth === 0).map((item) => item.id);

    if (mode === 'replaceRoots' || mode === 'appendRoots') {
      const base = mode === 'replaceRoots' ? [] : thread.rootIds;
      const merged = [...base];
      for (const id of incomingRootIds) {
        if (merged.indexOf(id) === -1) merged.push(id);
      }
      thread.rootIds = merged;
      thread.hasMore = data.hasMore;
      thread.cursor = data.nextCursor;
    }

    thread.totalRootCount = data.totalRootCount;
    thread.totalCommentCount = data.totalCommentCount;

    if ((mode === 'appendChildren' || mode === 'replaceChildren') && data.rootId !== null) {
      const rootState = this.nodeState(data.rootId);
      if (rootState) {
        rootState.childCursor = data.nextCursor;
        rootState.hasMoreChildren = data.hasMore;
        rootState.loadedChildCount = (this.childIdsByParent[String(data.rootId)] ?? []).length;
      }
    }
  }

  async getThread(
    courseId: string,
    feedId: string,
    options: { limit?: number; childLimit?: number; maxDepth?: number } = {}
  ) {
    if (!this.threadByFeedId[feedId]) {
      this.initComments(feedId, 0);
    }

    this.threadByFeedId[feedId].isLoading = true;

    await this.execute<GetNewsfeedCommentsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].comments.$get({
          param: { courseId, feedId },
          query: {
            limit: String(options.limit ?? 5),
            childLimit: String(options.childLimit ?? 3),
            maxDepth: String(options.maxDepth ?? 3)
          }
        }),
      logContext: 'fetching newsfeed comment thread',
      onSuccess: (response) => {
        if (response.data) this.ingest(feedId, response.data, 'replaceRoots');
        this.threadByFeedId[feedId].isLoading = false;
      },
      onError: (result) => {
        this.threadByFeedId[feedId].isLoading = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch comments');
        }
      }
    });
  }

  async loadMoreComments(courseId: string, feedId: string, limit = 5) {
    const thread = this.threadByFeedId[feedId];
    if (!thread || thread.isLoading || !thread.hasMore) return;

    thread.isLoading = true;

    await this.execute<GetNewsfeedCommentsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].comments.$get({
          param: { courseId, feedId },
          query: {
            limit: String(limit),
            ...(thread.cursor ? { cursor: thread.cursor } : {})
          }
        }),
      logContext: 'loading more newsfeed comments',
      onSuccess: (response) => {
        if (response.data) this.ingest(feedId, response.data, 'appendRoots');
        thread.isLoading = false;
      },
      onError: (result) => {
        thread.isLoading = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to load more comments');
        }
      }
    });
  }

  /**
   * Loads more of a comment's subtree. With the node's stored cursor this pages its
   * remaining children; without one it re-roots the fetch, which is what continuing a
   * thread past the indent cap needs.
   */
  async loadMoreReplies(
    courseId: string,
    feedId: string,
    parentId: number,
    options: { childLimit?: number; maxDepth?: number; fromStart?: boolean } = {}
  ) {
    const state = this.nodeState(parentId);
    if (!state || state.isLoading) return;

    const cursor = options.fromStart ? null : state.childCursor;
    state.isLoading = true;

    await this.execute<GetNewsfeedCommentsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].comments.$get({
          param: { courseId, feedId },
          query: {
            rootId: String(parentId),
            childLimit: String(options.childLimit ?? 3),
            maxDepth: String(options.maxDepth ?? 3),
            ...(cursor ? { childCursor: cursor } : {})
          }
        }),
      logContext: 'loading more newsfeed replies',
      onSuccess: (response) => {
        if (response.data) this.ingest(feedId, response.data, options.fromStart ? 'replaceChildren' : 'appendChildren');
        const current = this.nodeState(parentId);
        if (current) current.isLoading = false;
      },
      onError: (result) => {
        const current = this.nodeState(parentId);
        if (current) current.isLoading = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to load more replies');
        }
      }
    });
  }

  async createComment(
    courseId: string,
    feedId: string,
    content: string,
    author: { id: string; profileId: string; username: string; fullname: string; avatarUrl: string },
    parentId?: number
  ) {
    const result = ZNewsfeedCommentCreate.safeParse({ courseNewsfeedId: feedId, content, parentId });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'newsfeed');
      return;
    }

    const parentState = parentId === undefined ? undefined : this.nodeState(parentId);
    const tempId = -Date.now();
    const tempKey = String(tempId);

    const optimistic = {
      id: tempId,
      parentId: parentId ?? null,
      replyToCommentId: null,
      courseNewsfeedId: feedId,
      authorId: author.id,
      content,
      createdAt: new Date().toISOString(),
      depth: (parentState?.depth ?? -1) + 1,
      authorProfileId: author.profileId,
      authorFullname: author.fullname,
      authorUsername: author.username,
      authorAvatarUrl: author.avatarUrl,
      replyToAuthorFullname: null,
      directReplyCount: 0,
      descendantCount: 0,
      loadedChildCount: 0,
      hasMoreChildren: false
    } as NewsfeedComment;

    this.commentById[tempKey] = optimistic;
    this.commentStateById[tempKey] = {
      depth: optimistic.depth,
      parentId: optimistic.parentId,
      directReplyCount: 0,
      descendantCount: 0,
      loadedChildCount: 0,
      childCursor: null,
      hasMoreChildren: false,
      isLoading: false,
      isOptimistic: true
    };

    const thread = this.threadByFeedId[feedId];
    if (parentId === undefined) {
      if (thread) {
        thread.rootIds = [tempId, ...thread.rootIds];
        thread.totalRootCount += 1;
      }
    } else {
      const siblings = this.childIdsByParent[String(parentId)] ?? [];
      this.childIdsByParent[String(parentId)] = [tempId, ...siblings];
      if (parentState) {
        parentState.directReplyCount += 1;
        parentState.loadedChildCount += 1;
      }
      this.bumpDescendants(parentId, 1);
    }
    if (thread) thread.totalCommentCount += 1;

    const rollback = () => {
      this.removeSubtree(tempId);
      if (parentId === undefined) {
        if (thread) {
          thread.rootIds = thread.rootIds.filter((id) => id !== tempId);
          thread.totalRootCount = Math.max(0, thread.totalRootCount - 1);
        }
      } else {
        this.childIdsByParent[String(parentId)] = (this.childIdsByParent[String(parentId)] ?? []).filter(
          (id) => id !== tempId
        );
        const current = this.nodeState(parentId);
        if (current) {
          current.directReplyCount = Math.max(0, current.directReplyCount - 1);
          current.loadedChildCount = Math.max(0, current.loadedChildCount - 1);
        }
        this.bumpDescendants(parentId, -1);
      }
      if (thread) thread.totalCommentCount = Math.max(0, thread.totalCommentCount - 1);
    };

    await this.execute<CreateNewsfeedCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].comment.$post({
          param: { courseId, feedId },
          json: result.data
        }),
      logContext: 'creating newsfeed comment',
      onSuccess: (response) => {
        if (!response.data) {
          rollback();
          return;
        }

        const realId = Number(response.data.id);
        const realKey = String(realId);

        this.commentById[realKey] = { ...optimistic, id: realId, createdAt: response.data.createdAt };
        this.commentStateById[realKey] = { ...this.commentStateById[tempKey], isOptimistic: false };
        delete this.commentById[tempKey];
        delete this.commentStateById[tempKey];

        const swap = (ids: number[]) => ids.map((id) => (id === tempId ? realId : id));
        if (parentId === undefined) {
          if (thread) thread.rootIds = swap(thread.rootIds);
        } else {
          this.childIdsByParent[String(parentId)] = swap(this.childIdsByParent[String(parentId)] ?? []);
        }
      },
      onError: (result) => {
        rollback();
        if (typeof result === 'string') {
          snackbar.error('Failed to add comment');
        }
      }
    });
  }

  async updateComment(courseId: string, commentId: string, content: string) {
    const result = ZNewsfeedCommentUpdate.safeParse({ content });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'newsfeed');
      return;
    }

    await this.execute<UpdateNewsfeedCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed.comment[':commentId'].$put({
          param: { courseId, commentId },
          json: result.data
        }),
      logContext: 'updating newsfeed comment',
      onSuccess: (response) => {
        if (!response.data) return;

        snackbar.success('Comment updated successfully');

        const existing = this.commentById[commentId];
        if (existing) existing.content = response.data.content ?? content;
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update comment');
        }
      }
    });
  }

  async deleteComment(courseId: string, feedId: string, commentId: string) {
    await this.execute<DeleteNewsfeedCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed.comment[':commentId'].$delete({
          param: { courseId, commentId }
        }),
      logContext: 'deleting newsfeed comment',
      onSuccess: (response) => {
        if (!response.data) return;

        snackbar.success('Comment deleted successfully');

        const numericId = Number(commentId);
        const state = this.nodeState(numericId);
        const parentId = state?.parentId ?? null;
        // Server truth: the cascade also removed descendants this client never loaded.
        const removedTotal = 1 + Number(response.data.deletedDescendantCount ?? 0);

        this.removeSubtree(numericId);

        const thread = this.threadByFeedId[feedId];
        if (parentId === null) {
          if (thread) {
            thread.rootIds = thread.rootIds.filter((id) => id !== numericId);
            thread.totalRootCount = Math.max(0, thread.totalRootCount - 1);
          }
        } else {
          this.childIdsByParent[String(parentId)] = (this.childIdsByParent[String(parentId)] ?? []).filter(
            (id) => id !== numericId
          );
          const parentState = this.nodeState(parentId);
          if (parentState) {
            parentState.directReplyCount = Math.max(0, parentState.directReplyCount - 1);
            parentState.loadedChildCount = Math.max(0, parentState.loadedChildCount - 1);
          }
          this.bumpDescendants(parentId, -removedTotal);
        }

        if (thread) thread.totalCommentCount = Math.max(0, thread.totalCommentCount - removedTotal);
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete comment');
        }
      }
    });
  }
}

export const newsfeedApi = /* @__PURE__ */ new NewsfeedApi();
