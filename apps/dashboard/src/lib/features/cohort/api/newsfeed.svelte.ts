import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CreateCohortNewsfeedCommentRequest,
  CreateCohortNewsfeedRequest,
  DeleteCohortNewsfeedCommentRequest,
  DeleteCohortNewsfeedRequest,
  GetCohortNewsfeedCommentsRequest,
  CohortNewsfeedComment,
  ListCohortNewsfeed,
  ListCohortNewsfeedRequest,
  ReactToCohortNewsfeedRequest,
  UpdateCohortNewsfeedRequest
} from '../utils/types';
import type {
  TCreateCohortNewsfeed,
  TCreateCohortNewsfeedComment,
  TUpdateCohortNewsfeed,
  TUpdateCohortReaction
} from '@cio/utils/validation/cohort';
import {
  ZCreateCohortNewsfeed,
  ZCreateCohortNewsfeedComment,
  ZUpdateCohortNewsfeed,
  ZUpdateCohortReaction
} from '@cio/utils/validation/cohort';
import { get } from 'svelte/store';
import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { profile } from '$lib/utils/store/user';
import { snackbar } from '$features/ui/snackbar/store';

export type CohortNewsfeedCommentsByFeedId = {
  items: CohortNewsfeedComment[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  cursor: string | null;
};

export class CohortNewsfeedApi extends BaseApiWithErrors {
  feeds = $state<ListCohortNewsfeed>([]);

  commentsByFeedId = $state<Record<string, CohortNewsfeedCommentsByFeedId>>({});

  isNewFeedModalOpen = $state(false);

  openNewFeedModal() {
    this.isNewFeedModalOpen = true;
  }

  closeNewFeedModal() {
    this.isNewFeedModalOpen = false;
  }

  async list(cohortId: string) {
    await this.execute<ListCohortNewsfeedRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].newsfeed.$get({
          param: { cohortId },
          query: {}
        }),
      logContext: 'listing cohort newsfeed',
      onSuccess: (response) => {
        this.feeds = response.data.items || [];
        this.commentsByFeedId = {};

        for (const feed of this.feeds) {
          this.initComments(feed.id, feed.commentCount);
        }
      },
      onError: () => {
        snackbar.error('snackbar.cohort.error.news_feed_fail');
      }
    });
  }

  async create(cohortId: string, fields: TCreateCohortNewsfeed) {
    this.success = false;

    if (isHtmlValueEmpty(fields.content)) {
      this.errors = mapZodErrorsToTranslations(
        ZCreateCohortNewsfeed.safeParse({ ...fields, content: '' }).error!,
        'newsfeed'
      );
      return;
    }

    const validationResult = ZCreateCohortNewsfeed.safeParse(fields);

    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error, 'newsfeed');
      return;
    }

    await this.execute<CreateCohortNewsfeedRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].newsfeed.$post({
          param: { cohortId },
          json: fields
        }),
      logContext: 'creating cohort newsfeed',
      onSuccess: (response) => {
        const author = get(profile);
        const newFeed = {
          ...response.data,
          authorProfileId: author.id,
          authorFullname: author.fullname,
          authorUsername: author.username,
          authorAvatarUrl: author.avatarUrl,
          commentCount: 0
        };

        this.feeds = [newFeed, ...this.feeds];
        this.initComments(newFeed.id, 0);
        snackbar.success('snackbar.cohort.success.post_created');
      }
    });
  }

  async update(cohortId: string, feedId: string, fields: TUpdateCohortNewsfeed) {
    this.success = false;

    if (fields.content !== undefined && isHtmlValueEmpty(fields.content)) {
      this.errors = mapZodErrorsToTranslations(
        ZUpdateCohortNewsfeed.safeParse({ ...fields, content: '' }).error!,
        'newsfeed'
      );
      return;
    }

    const validationResult = ZUpdateCohortNewsfeed.safeParse(fields);

    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error, 'newsfeed');
      return;
    }

    await this.execute<UpdateCohortNewsfeedRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].newsfeed[':feedId'].$put({
          param: { cohortId, feedId },
          json: fields
        }),
      logContext: 'updating cohort newsfeed',
      onSuccess: (response) => {
        const index = this.feeds.findIndex((feed) => feed.id === feedId);
        if (index === -1) {
          return;
        }

        const existingFeed = this.feeds[index];
        this.feeds[index] = {
          ...existingFeed,
          ...response.data,
          authorProfileId: existingFeed.authorProfileId,
          authorFullname: existingFeed.authorFullname,
          authorUsername: existingFeed.authorUsername,
          authorAvatarUrl: existingFeed.authorAvatarUrl,
          commentCount: existingFeed.commentCount
        };

        snackbar.success('snackbar.cohort.success.post_updated');
      }
    });
  }

  async react(cohortId: string, feedId: string, reaction: TUpdateCohortReaction['reaction']) {
    const validationResult = ZUpdateCohortReaction.safeParse({ reaction });

    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error, 'newsfeed');
      return;
    }

    await this.execute<ReactToCohortNewsfeedRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].newsfeed[':feedId'].react.$put({
          param: { cohortId, feedId },
          json: validationResult.data
        }),
      logContext: 'reacting to cohort newsfeed',
      onSuccess: (response) => {
        const index = this.feeds.findIndex((feed) => feed.id === feedId);
        if (index === -1) {
          return;
        }

        const existingFeed = this.feeds[index];
        this.feeds[index] = {
          ...existingFeed,
          ...response.data,
          authorProfileId: existingFeed.authorProfileId,
          authorFullname: existingFeed.authorFullname,
          authorUsername: existingFeed.authorUsername,
          authorAvatarUrl: existingFeed.authorAvatarUrl,
          commentCount: existingFeed.commentCount
        };
      },
      onError: () => {
        snackbar.error('snackbar.cohort.error.reaction_error');
      }
    });
  }

  async delete(cohortId: string, feedId: string) {
    await this.execute<DeleteCohortNewsfeedRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].newsfeed[':feedId'].$delete({
          param: { cohortId, feedId }
        }),
      logContext: 'deleting cohort newsfeed',
      onSuccess: () => {
        this.feeds = this.feeds.filter((feed) => feed.id !== feedId);

        const { [feedId]: _removedComments, ...remainingComments } = this.commentsByFeedId;
        this.commentsByFeedId = remainingComments;

        snackbar.success('snackbar.cohort.success.feed_delete_success');
      }
    });
  }

  initComments(feedId: string, totalCount: number) {
    if (!this.commentsByFeedId[feedId]) {
      this.commentsByFeedId[feedId] = {
        items: [],
        totalCount,
        hasMore: false,
        isLoading: false,
        cursor: null
      };
      return;
    }

    this.commentsByFeedId[feedId].totalCount = totalCount;
  }

  async getComments(cohortId: string, feedId: string) {
    if (!this.commentsByFeedId[feedId]) {
      this.initComments(feedId, 0);
    }

    this.commentsByFeedId[feedId].isLoading = true;

    await this.execute<GetCohortNewsfeedCommentsRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].newsfeed[':feedId'].comments.$get({
          param: { cohortId, feedId }
        }),
      logContext: 'fetching cohort newsfeed comments',
      onSuccess: (response) => {
        this.commentsByFeedId[feedId] = {
          items: response.data,
          totalCount: response.data.length,
          hasMore: false,
          isLoading: false,
          cursor: null
        };
      },
      onError: () => {
        this.commentsByFeedId[feedId].isLoading = false;
      }
    });
  }

  async createComment(
    cohortId: string,
    feedId: string,
    content: string,
    author: { id: string; username: string; fullname: string; avatarUrl: string }
  ) {
    const validationResult = ZCreateCohortNewsfeedComment.safeParse({
      content: getTextFromHTML(content)
    } satisfies TCreateCohortNewsfeedComment);

    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error, 'newsfeed');
      return;
    }

    await this.execute<CreateCohortNewsfeedCommentRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].newsfeed[':feedId'].comment.$post({
          param: { cohortId, feedId },
          json: { content }
        }),
      logContext: 'creating cohort newsfeed comment',
      onSuccess: (response) => {
        const existingCommentState = this.commentsByFeedId[feedId];
        if (!existingCommentState) {
          return;
        }

        const newComment = {
          ...response.data,
          authorProfileId: author.id,
          authorFullname: author.fullname,
          authorUsername: author.username,
          authorAvatarUrl: author.avatarUrl
        };

        this.commentsByFeedId[feedId] = {
          ...existingCommentState,
          items: [newComment, ...existingCommentState.items],
          totalCount: existingCommentState.totalCount + 1
        };

        const feedIndex = this.feeds.findIndex((feed) => feed.id === feedId);
        if (feedIndex !== -1) {
          this.feeds[feedIndex] = {
            ...this.feeds[feedIndex],
            commentCount: this.feeds[feedIndex].commentCount + 1
          };
        }

        snackbar.success('snackbar.cohort.success.comment_added');
      }
    });
  }

  async deleteComment(cohortId: string, feedId: string, commentId: string) {
    await this.execute<DeleteCohortNewsfeedCommentRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].newsfeed[':feedId'].comment[':commentId'].$delete({
          param: { cohortId, feedId, commentId }
        }),
      logContext: 'deleting cohort newsfeed comment',
      onSuccess: () => {
        const existingCommentState = this.commentsByFeedId[feedId];
        if (!existingCommentState) {
          return;
        }

        this.commentsByFeedId[feedId] = {
          ...existingCommentState,
          items: existingCommentState.items.filter((item) => String(item.id) !== commentId),
          totalCount: Math.max(0, existingCommentState.totalCount - 1)
        };

        const feedIndex = this.feeds.findIndex((feed) => feed.id === feedId);
        if (feedIndex !== -1) {
          this.feeds[feedIndex] = {
            ...this.feeds[feedIndex],
            commentCount: Math.max(0, this.feeds[feedIndex].commentCount - 1)
          };
        }

        snackbar.success('snackbar.cohort.success.comment_deleted');
      }
    });
  }
}

export const cohortNewsfeedApi = new CohortNewsfeedApi();
