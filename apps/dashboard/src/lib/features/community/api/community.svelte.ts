import type {
  CommunityQuestionsSuccess,
  CommunityQuestionSuccess,
  SubmitCommentData
} from '$lib/features/org/utils/types';
import { BaseApi, classroomio } from '$lib/utils/services/api';

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
  answer = $state<SubmitCommentData>({
    id: '0',
    body: '',
    votes: 0,
    createdAt: '',
    authorId: ''
  });

  /**
   * Fetches community questions for an organization
   * @param orgId Organization ID
   * @returns Community questions data (organizationId, courseId, title, votes, createdAt, slug, comments, authorFullname, courseTitle)
   */
  async fetchCommunityQuestions({ orgId }: { orgId: string }) {
    return this.execute<typeof classroomio.community.questions.$get>({
      requestFn: () => classroomio.community.questions.$get({ query: { orgId } }),
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
    return this.execute<(typeof classroomio.community.question)[':slug']['$get']>({
      requestFn: () => classroomio.community.question[':slug'].$get({ param: { slug } }),
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
    return this.execute<typeof classroomio.community.question.$post>({
      requestFn: () =>
        classroomio.community.question.$post({
          json: { title, body, courseId, organizationId, authorProfileId, votes, slug }
        }),
      logContext: 'fetching community question'
    });
  }

  /**
   * Submits a comment for a community question
   * @param Comment (body, questionId, authorId, votes)
   * @returns Single comment for a community question
   */
  async submitComment({
    body,
    questionId,
    authorId,
    votes
  }: {
    body: string;
    questionId: number;
    authorId: string;
    votes: number;
  }) {
    return this.execute<typeof classroomio.community.comment.$post>({
      requestFn: () => classroomio.community.comment.$post({ json: { body, questionId, authorId, votes } }),
      logContext: 'submitting comment',
      onSuccess: (response) => {
        this.answer = response.data;
      }
    });
  }

  /**
   * Upvotes a comment or question, depending on the isQuestion param
   * @param Comment (id, votes, isQuestion)
   */
  async handleUpvote({ id, votes, isQuestion }: { id: number | string; votes: number; isQuestion: boolean }) {
    return this.execute<typeof classroomio.community.comment.$put>({
      requestFn: () => classroomio.community.comment.$put({ json: { id, votes, isQuestion } }),
      logContext: 'upvoting comment/question'
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
    return this.execute<(typeof classroomio.community.question)[':id']['$put']>({
      requestFn: () =>
        classroomio.community.question[':id'].$put({
          param: { id: String(id) },
          json: { title, body, courseId }
        }),
      logContext: 'updating community question'
    });
  }

  /**
   * Deletes a question by its ID
   * @param Id (id)
   */
  async handleDeleteQuestionById({ id }: { id: number }) {
    return this.execute<typeof classroomio.community.question.$delete>({
      requestFn: () => classroomio.community.question.$delete({ json: { id } }),
      logContext: 'deleting community question'
    });
  }

  /**
   * Deletes a comment by its ID
   * @param Id (id)
   */
  async handleDeleteCommentById({ id }: { id: string }) {
    return this.execute<(typeof classroomio.community.comment)[':id']['$delete']>({
      requestFn: () => classroomio.community.comment[':id'].$delete({ param: { id } }),
      logContext: 'deleting community comment'
    });
  }

  /**
   * Deletes a comment for a question by question ID
   * @param questionId (questionId)
   */
  async handleDeleteCommentByQuestionId({ questionId }: { questionId: number }) {
    return this.execute<(typeof classroomio.community.comments)[':questionId']['$delete']>({
      requestFn: () =>
        classroomio.community.comments[':questionId'].$delete({ param: { questionId: String(questionId) } }),
      logContext: 'deleting comment by question'
    });
  }
}

export const communityApi = new CommunityApi();
