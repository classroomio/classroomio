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
  NewsfeedCommentsResponse,
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

import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

export type NewsfeedCommentsByFeedId = {
  items: NewsfeedCommentsResponse['items'];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  cursor: string | null;
};

/**
 * API class for newsfeed operations
 */
export class NewsfeedApi extends BaseApiWithErrors {
  feeds = $state<ListNewsfeed>([]);

  commentsByFeedId = $state<Record<string, NewsfeedCommentsByFeedId>>({});

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
          query: { courseId }
        }),
      logContext: 'listing newsfeed',
      onSuccess: (response) => {
        if (response.data) {
          this.feeds = Array.isArray(response.data) ? response.data : response.data.items || [];
          for (const feed of this.feeds) {
            this.initComments(feed.id, 0);
          }

          this.success = true;
          this.errors = {};
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
      onSuccess: (response) => {
        if (response.data) {
          this.success = true;
          this.errors = {};
        }
      },
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
          // Ensure feeds is an array before spreading
          const feedsArray = Array.isArray(this.feeds) ? this.feeds : [];
          this.feeds = [...feedsArray, response.data];
          this.success = true;
          this.errors = {};
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
          // Update local state
          const index = this.feeds.findIndex((f) => f.id === feedId);
          if (index !== -1) {
            this.feeds[index] = response.data;
          }
          this.success = true;
          this.errors = {};
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
          // Update local state
          const index = this.feeds.findIndex((f) => f.id === feedId);
          if (index !== -1) {
            this.feeds[index] = response.data;
          }
          this.success = true;
          this.errors = {};
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
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete post');
        }
      }
    });
  }

  /**
   * Initialize comment state for a feed
   */
  initComments(feedId: string, totalCount: number) {
    if (!this.commentsByFeedId[feedId]) {
      this.commentsByFeedId[feedId] = {
        items: [],
        totalCount,
        hasMore: totalCount > 0,
        isLoading: false,
        cursor: null
      };
    } else {
      this.commentsByFeedId[feedId].totalCount = totalCount;
      this.commentsByFeedId[feedId].hasMore = totalCount > this.commentsByFeedId[feedId].items.length;
    }
  }

  /**
   * Fetch paginated comments for a feed
   */
  async getComments(courseId: string, feedId: string, limit = 5) {
    if (!this.commentsByFeedId[feedId]) {
      this.initComments(feedId, 0);
    }

    this.commentsByFeedId[feedId].isLoading = true;

    await this.execute<GetNewsfeedCommentsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].comments.$get({
          param: { courseId, feedId },
          query: { limit: String(limit) }
        }),
      logContext: 'fetching newsfeed comments',
      onSuccess: (response) => {
        if (response.data) {
          this.commentsByFeedId[feedId] = {
            items: response.data.items,
            totalCount: response.data.totalCount,
            hasMore: response.data.hasMore,
            isLoading: false,
            cursor: response.data.nextCursor
          };
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        this.commentsByFeedId[feedId].isLoading = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch comments');
        }
      }
    });
  }

  /**
   * Load more comments (uses cursor)
   */
  async loadMoreComments(courseId: string, feedId: string, limit = 5) {
    const commentState = this.commentsByFeedId[feedId];
    if (!commentState || !commentState.hasMore || commentState.isLoading || !commentState.cursor) {
      return;
    }

    commentState.isLoading = true;

    await this.execute<GetNewsfeedCommentsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].comments.$get({
          param: { courseId, feedId },
          query: { cursor: commentState.cursor!, limit: String(limit) }
        }),
      logContext: 'loading more newsfeed comments',
      onSuccess: (response) => {
        if (response.data) {
          this.commentsByFeedId[feedId] = {
            items: [...commentState.items, ...response.data.items],
            totalCount: response.data.totalCount,
            hasMore: response.data.hasMore,
            isLoading: false,
            cursor: response.data.nextCursor
          };
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        this.commentsByFeedId[feedId].isLoading = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to load more comments');
        }
      }
    });
  }

  /**
   * Creates a newsfeed comment
   */
  async createComment(
    courseId: string,
    feedId: string,
    content: string,
    author: { id: string; username: string; fullname: string; avatarUrl: string }
  ) {
    const result = ZNewsfeedCommentCreate.safeParse({ courseNewsfeedId: feedId, content });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'newsfeed');
      return;
    }

    await this.execute<CreateNewsfeedCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed[':feedId'].comment.$post({
          param: { courseId, feedId },
          json: result.data
        }),
      logContext: 'creating newsfeed comment',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Comment added successfully');

          // Add comment to local state
          const commentState = this.commentsByFeedId[feedId];
          if (commentState) {
            const newComment = {
              ...response.data,
              author: {
                profile: {
                  id: author.id,
                  fullname: author.fullname,
                  username: author.username,
                  avatarUrl: author.avatarUrl
                }
              }
            };
            this.commentsByFeedId[feedId] = {
              ...commentState,
              items: [newComment, ...commentState.items],
              totalCount: commentState.totalCount + 1
            };
          }

          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to add comment');
        }
      }
    });
  }

  /**
   * Updates a newsfeed comment
   */
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
        if (response.data) {
          snackbar.success('Comment updated successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update comment');
        }
      }
    });
  }

  /**
   * Deletes a newsfeed comment
   */
  async deleteComment(courseId: string, feedId: string, commentId: string) {
    await this.execute<DeleteNewsfeedCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].newsfeed.comment[':commentId'].$delete({
          param: { courseId, commentId }
        }),
      logContext: 'deleting newsfeed comment',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Comment deleted successfully');

          // Remove comment from local state
          const commentState = this.commentsByFeedId[feedId];
          if (commentState) {
            this.commentsByFeedId[feedId] = {
              ...commentState,
              items: commentState.items.filter((item) => String(item.id) !== commentId),
              totalCount: Math.max(0, commentState.totalCount - 1)
            };
          }

          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete comment');
        }
      }
    });
  }
}

export const newsfeedApi = new NewsfeedApi();
