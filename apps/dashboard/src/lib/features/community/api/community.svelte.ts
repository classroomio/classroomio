import { BaseApi, classroomio } from '$lib/utils/services/api';
import type {
  CommunityQuestionsSuccess,
  CommunityQuestionSuccess,
  CreateCommentResponse,
  CreateCommunityQuestionResponse,
  UpdateQuestionResponse,
  UpvotePostResponse
} from '../utils/types';

/**
 * API class for Organization Community
 */
class CommunityApi extends BaseApi {
  questions = $state<CommunityQuestionsSuccess['data']>([]);
  question = $state<CommunityQuestionSuccess['data']>({
    id: 0,
    title: '',
    body: '',
    votes: 0,
    createdAt: '',
    courseId: '',
    courseTitle: '',
    slug: '',
    authorId: '',
    authorFullname: '',
    authorAvatarUrl: '',
    organizationId: '',
    comments: []
  });
  answer = $state<{
    id: number;
    body: string;
    votes: number;
    createdAt: string;
    authorId: number;
  }>({
    body: '',
    votes: 0,
    createdAt: '',
    authorId: 0,
    id: 0
  });

  /**
   * Fetches community questions for an organization
   * @param orgId Organization ID
   * @returns Community questions data (organizationId, courseId, title, votes, createdAt, slug, comments, authorFullname, courseTitle)
   */
  async fetchCommunityQuestions({ orgId }: { orgId: string }) {
    return this.execute<typeof classroomio.community.$get>({
      requestFn: () => classroomio.community.$get({ query: { orgId } }),
      logContext: 'fetching community questions',
      onSuccess: (response) => {
        this.questions = response.data;
      }
    });
  }

  /**
   * Fetches a single community question by slug
   * @param slug Question slug
   * @returns Single community question with comments
   */
  async fetchCommunityQuestion({ slug }: { slug: string }) {
    return this.execute<(typeof classroomio.community)[':slug']['$get']>({
      requestFn: () => classroomio.community[':slug'].$get({ param: { slug } }),
      logContext: 'fetching community question',
      onSuccess: (response) => {
        this.question = response.data;
      }
    });
  }

  /**
   * Adds community question
   * @param params (title, body, courseId, organizationId, authorProfileId, votes, slug)
   * @returns Community Questions
   */
  async addCommunityQuestion({
    title,
    body,
    courseId,
    organizationId,
    authorProfileId,
    votes,
    slug
  }: {
    title: string;
    body: string;
    courseId: string;
    organizationId: string;
    authorProfileId: string;
    votes: number;
    slug: string;
  }) {
    return this.execute<CreateCommunityQuestionResponse>({
      requestFn: () =>
        classroomio.community.$post({
          json: { title, body, courseId, organizationId, authorProfileId, votes, slug }
        }),
      logContext: 'creating community question'
    });
  }

  /**
   * Submits a comment for a community question
   * @param Comment (id, body, authorProfileId, votes)
   * @returns Single comment for a community question
   */
  async createComment({
    id,
    body,
    authorProfileId,
    votes
  }: {
    id: number;
    body: string;
    authorProfileId: string;
    votes: number;
  }) {
    return this.execute<CreateCommentResponse>({
      requestFn: () =>
        classroomio.community[':id'].comment.$post({
          param: { id: String(id) },
          // @ts-expect-error - the json type is not inferred correctly
          json: { body, authorProfileId, votes }
        }),
      logContext: 'submitting comment',
      onSuccess: (response) => {
        this.answer = response.data;
      }
    });
  }

  /**
   * Upvotes a post
   * @param id Post ID
   * @param votes Number of votes
   * @param isQuestion Boolean indicating if it's a question
   */
  async upvotePost({ id, votes, isQuestion }: { id: number; votes: number; isQuestion: boolean }) {
    return this.execute<UpvotePostResponse>({
      requestFn: () =>
        classroomio.community[':id'].upvote.$post({
          param: { id: String(id) },
          // @ts-expect-error - the json type is not inferred correctly
          json: { votes, isQuestion }
        }),
      logContext: 'upvoting post'
    });
  }

  /**
   * Updates a question
   * @param Comment (id, title, body, courseId)
   */
  async handleUpdateQuestion({
    id,
    title,
    body,
    courseId
  }: {
    id: number;
    title: string;
    body: string;
    courseId: string;
  }) {
    return this.execute<UpdateQuestionResponse>({
      requestFn: () =>
        classroomio.community[':id'].$put({
          param: { id: String(id) },
          // @ts-expect-error - the json type is not inferred correctly
          json: { title, body, courseId }
        }),
      logContext: 'updating community question'
    });
  }

  /**
   * Deletes a question by its ID
   * @param Id (id)
   */
  async handleDeleteQuestionById({ id }: { id: string }) {
    return this.execute<(typeof classroomio.community)[':id']['$delete']>({
      requestFn: () => classroomio.community[':id'].$delete({ param: { id } }),
      logContext: 'deleting community question'
    });
  }

  /**
   * Deletes a comment by its ID
   * @param id Post ID
   */
  async handleDeleteCommentById({ id }: { id: string }) {
    return this.execute<(typeof classroomio.community)[':id']['comment']['$delete']>({
      requestFn: () =>
        classroomio.community[':id'].comment.$delete({
          param: { id }
        }),
      logContext: 'deleting community comment'
    });
  }

  /**
   * Deletes all comments for a question by question ID
   * @param questionId Question ID
   */
  async handleDeleteCommentByQuestionId({ questionId }: { questionId: string }) {
    return this.execute<(typeof classroomio.community)[':questionId']['comments']['$delete']>({
      requestFn: () =>
        classroomio.community[':questionId'].comments.$delete({
          param: { questionId }
        }),
      logContext: 'deleting all comments for question'
    });
  }
}

export const communityApi = new CommunityApi();
