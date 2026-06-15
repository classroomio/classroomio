import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CreateProgramNewsfeedCommentRequest,
  CreateProgramNewsfeedRequest,
  DeleteProgramNewsfeedCommentRequest,
  DeleteProgramNewsfeedRequest,
  GetProgramNewsfeedCommentsRequest,
  ListProgramNewsfeed,
  ListProgramNewsfeedRequest,
  ProgramNewsfeedComment,
  ReactToProgramNewsfeedRequest,
  UpdateProgramNewsfeedRequest
} from '../utils/types';
import type {
  TCreateProgramNewsfeed,
  TCreateProgramNewsfeedComment,
  TUpdateProgramNewsfeed,
  TUpdateProgramReaction
} from '@cio/utils/validation/program';
import {
  ZCreateProgramNewsfeed,
  ZCreateProgramNewsfeedComment,
  ZUpdateProgramNewsfeed,
  ZUpdateProgramReaction
} from '@cio/utils/validation/program';
import { get } from 'svelte/store';
import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { profile } from '$lib/utils/store/user';
import { snackbar } from '$features/ui/snackbar/store';

export type ProgramNewsfeedCommentsByFeedId = {
  items: ProgramNewsfeedComment[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  cursor: string | null;
};

export class ProgramNewsfeedApi extends BaseApiWithErrors {
  feeds = $state<ListProgramNewsfeed>([]);

  commentsByFeedId = $state<Record<string, ProgramNewsfeedCommentsByFeedId>>({});

  isNewFeedModalOpen = $state(false);

  openNewFeedModal() {
    this.isNewFeedModalOpen = true;
  }

  closeNewFeedModal() {
    this.isNewFeedModalOpen = false;
  }

  async list(programId: string) {
    await this.execute<ListProgramNewsfeedRequest>({
      requestFn: () =>
        classroomio.program[':programId'].newsfeed.$get({
          param: { programId },
          query: {}
        }),
      logContext: 'listing program newsfeed',
      onSuccess: (response) => {
        this.feeds = response.data.items || [];
        this.commentsByFeedId = {};

        for (const feed of this.feeds) {
          this.initComments(feed.id, feed.commentCount);
        }
      },
      onError: () => {
        snackbar.error('snackbar.program.error.news_feed_fail');
      }
    });
  }

  async create(programId: string, fields: TCreateProgramNewsfeed) {
    this.success = false;

    if (isHtmlValueEmpty(fields.content)) {
      this.errors = mapZodErrorsToTranslations(
        ZCreateProgramNewsfeed.safeParse({ ...fields, content: '' }).error!,
        'newsfeed'
      );
      return;
    }

    const validationResult = ZCreateProgramNewsfeed.safeParse(fields);

    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error, 'newsfeed');
      return;
    }

    await this.execute<CreateProgramNewsfeedRequest>({
      requestFn: () =>
        classroomio.program[':programId'].newsfeed.$post({
          param: { programId },
          json: fields
        }),
      logContext: 'creating program newsfeed',
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
        snackbar.success('snackbar.program.success.post_created');
      }
    });
  }

  async update(programId: string, feedId: string, fields: TUpdateProgramNewsfeed) {
    this.success = false;

    if (fields.content !== undefined && isHtmlValueEmpty(fields.content)) {
      this.errors = mapZodErrorsToTranslations(
        ZUpdateProgramNewsfeed.safeParse({ ...fields, content: '' }).error!,
        'newsfeed'
      );
      return;
    }

    const validationResult = ZUpdateProgramNewsfeed.safeParse(fields);

    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error, 'newsfeed');
      return;
    }

    await this.execute<UpdateProgramNewsfeedRequest>({
      requestFn: () =>
        classroomio.program[':programId'].newsfeed[':feedId'].$put({
          param: { programId, feedId },
          json: fields
        }),
      logContext: 'updating program newsfeed',
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

        snackbar.success('snackbar.program.success.post_updated');
      }
    });
  }

  async react(programId: string, feedId: string, reaction: TUpdateProgramReaction['reaction']) {
    const validationResult = ZUpdateProgramReaction.safeParse({ reaction });

    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error, 'newsfeed');
      return;
    }

    await this.execute<ReactToProgramNewsfeedRequest>({
      requestFn: () =>
        classroomio.program[':programId'].newsfeed[':feedId'].react.$put({
          param: { programId, feedId },
          json: validationResult.data
        }),
      logContext: 'reacting to program newsfeed',
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
        snackbar.error('snackbar.program.error.reaction_error');
      }
    });
  }

  async delete(programId: string, feedId: string) {
    await this.execute<DeleteProgramNewsfeedRequest>({
      requestFn: () =>
        classroomio.program[':programId'].newsfeed[':feedId'].$delete({
          param: { programId, feedId }
        }),
      logContext: 'deleting program newsfeed',
      onSuccess: () => {
        this.feeds = this.feeds.filter((feed) => feed.id !== feedId);

        const { [feedId]: _removedComments, ...remainingComments } = this.commentsByFeedId;
        this.commentsByFeedId = remainingComments;

        snackbar.success('snackbar.program.success.feed_delete_success');
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

  async getComments(programId: string, feedId: string) {
    if (!this.commentsByFeedId[feedId]) {
      this.initComments(feedId, 0);
    }

    this.commentsByFeedId[feedId].isLoading = true;

    await this.execute<GetProgramNewsfeedCommentsRequest>({
      requestFn: () =>
        classroomio.program[':programId'].newsfeed[':feedId'].comments.$get({
          param: { programId, feedId }
        }),
      logContext: 'fetching program newsfeed comments',
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
    programId: string,
    feedId: string,
    content: string,
    author: { id: string; username: string; fullname: string; avatarUrl: string }
  ) {
    const validationResult = ZCreateProgramNewsfeedComment.safeParse({
      content: getTextFromHTML(content)
    } satisfies TCreateProgramNewsfeedComment);

    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error, 'newsfeed');
      return;
    }

    await this.execute<CreateProgramNewsfeedCommentRequest>({
      requestFn: () =>
        classroomio.program[':programId'].newsfeed[':feedId'].comment.$post({
          param: { programId, feedId },
          json: { content }
        }),
      logContext: 'creating program newsfeed comment',
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

        snackbar.success('snackbar.program.success.comment_added');
      }
    });
  }

  async deleteComment(programId: string, feedId: string, commentId: string) {
    await this.execute<DeleteProgramNewsfeedCommentRequest>({
      requestFn: () =>
        classroomio.program[':programId'].newsfeed[':feedId'].comment[':commentId'].$delete({
          param: { programId, feedId, commentId }
        }),
      logContext: 'deleting program newsfeed comment',
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

        snackbar.success('snackbar.program.success.comment_deleted');
      }
    });
  }
}

export const programNewsfeedApi = new ProgramNewsfeedApi();
