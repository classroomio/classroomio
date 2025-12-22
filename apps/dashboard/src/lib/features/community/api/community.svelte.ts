import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CommunityQuestionSuccess,
  CommunityQuestionsSuccess,
  CreateCommentResponse,
  CreateCommunityQuestionResponse,
  UpdateQuestionResponse,
  UpvotePostResponse
} from '../utils/types';
import { ZCommunityComment, ZCommunityQuestionUpdate, ZCreateCommunityQuestion } from '@cio/utils/validation/community';
import { currentOrgPath, currentOrg as currentOrgStore } from '$lib/utils/store/org';

import type { Course } from '$lib/utils/types';
import type { TCreateCommunityQuestion } from '@cio/utils/validation/community';
import { courses as coursesStore } from '$features/course/utils/store';
import { currentCommunityQuestion } from '../utils/store';
import { fetchCourses } from '$lib/utils/services/courses';
import generateSlug from '$lib/utils/functions/generateSlug';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { profile as profileStore } from '$lib/utils/store/user';
import { snackbar } from '$features/ui/snackbar/store';

/**
 * API class for Organization Community
 */
class CommunityApi extends BaseApiWithErrors {
  questions: CommunityQuestionsSuccess['data'] = $state([]);
  question: CommunityQuestionSuccess['data'] | null = $state(null);
  courses = $state<Course[]>([]);
  private coursesFetched = $state(false);
  isEditMode = $state(false);
  isEditing = $state(false);
  isCommenting = $state(false);
  editContent = $state<{
    title: string;
    body: string;
    courseId: string;
  }>({
    title: '',
    body: '',
    courseId: ''
  });
  comment = $state('');
  deleteCommentState = $state<{
    shouldDelete: boolean;
    commentId: string;
  }>({
    shouldDelete: false,
    commentId: ''
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
   * Handles API call, success/error handling, and navigation
   * @param orgId Organization ID
   * @param isLMS Whether this is in LMS context (affects navigation path)
   */
  async fetchCommunityQuestions({ orgId, isLMS = false }: { orgId: string; isLMS?: boolean }) {
    await this.execute<typeof classroomio.community.$get>({
      requestFn: () => classroomio.community.$get({ query: { orgId } }),
      logContext: 'fetching community questions',
      onSuccess: (response) => {
        this.questions = response.data;
      },
      onError: (result) => {
        console.error('Error loading community questions:', result);
        const basePath = isLMS ? '/lms' : get(currentOrgPath);
        goto(basePath);
      }
    });
  }

  /**
   * Fetches a single community question by slug
   * Handles API call, success/error handling, navigation, and store updates
   * @param slug Question slug
   * @param isLMS Whether this is in LMS context (affects navigation path and store updates)
   */
  async fetchCommunityQuestion({ slug, isLMS = false }: { slug: string; isLMS?: boolean }) {
    await this.execute<(typeof classroomio.community)[':slug']['$get']>({
      requestFn: () => classroomio.community[':slug'].$get({ param: { slug } }),
      logContext: 'fetching community question',
      onSuccess: (response) => {
        if (response.data) {
          this.question = response.data;

          currentCommunityQuestion.set({ title: response.data.title });
        }
      },
      onError: (result) => {
        console.error(`[${isLMS ? 'LMS' : 'ORG'}] Error loading community`, result);
        const basePath = isLMS ? '/lms' : get(currentOrgPath);
        goto(basePath);
      }
    });
  }

  /**
   * Creates a new community question
   * Handles validation, API call, success/error handling, and navigation
   * @param fields User-provided fields (title, body, courseId)
   * @param isLMS Whether this is in LMS context (affects navigation path)
   */
  async createQuestion(fields: TCreateCommunityQuestion, isLMS: boolean = false) {
    const result = ZCreateCommunityQuestion.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'community');
      return;
    }

    const slug = generateSlug(fields.title);
    const currentOrg = get(currentOrgStore);
    const profile = get(profileStore);

    if (!currentOrg?.id || !profile?.id) {
      snackbar.error('snackbar.community.error.missing_context');
      return;
    }

    await this.execute<CreateCommunityQuestionResponse>({
      requestFn: () =>
        classroomio.community.$post({
          json: {
            title: result.data.title,
            body: result.data.body,
            courseId: result.data.courseId || '',
            organizationId: currentOrg.id,
            authorProfileId: profile.id,
            votes: 0,
            slug
          }
        }),
      logContext: 'creating community question',
      onSuccess: (response) => {
        const questionData = Array.isArray(response.data) ? response.data[0] : response.data;
        const questionSlug = questionData?.slug || slug;

        // Show success message
        snackbar.success('snackbar.community.success.question_submitted');

        // Navigate to the question based on context
        const basePath = isLMS ? '/lms' : get(currentOrgPath);
        goto(`${basePath}/community/${questionSlug}`);

        // Mark as successful
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        console.error('Error creating question:', result);
        snackbar.error('snackbar.community.error.try_again');
        if (typeof result !== 'string' && 'error' in result) {
          this.handleValidationError(result);
        }
      }
    });
  }

  /**
   * Creates a comment for a community question
   * Handles validation, API call, and success/error handling
   * Uses this.comment state for the comment body
   * @param questionId Question ID
   * @param isLMS Whether this is in LMS context (affects store updates)
   * @param onSuccess Optional callback to execute on successful comment creation
   */
  async createComment(questionId: number, isLMS: boolean = false, onSuccess?: () => void) {
    const profile = get(profileStore);
    if (!profile?.id) {
      snackbar.error('snackbar.community.error.missing_context');
      return;
    }

    const result = ZCommunityComment.safeParse({
      body: this.comment,
      authorProfileId: profile.id,
      votes: 0
    });

    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'community');
      return;
    }

    this.isCommenting = true;
    await this.execute<CreateCommentResponse>({
      requestFn: () =>
        classroomio.community[':id'].comment.$post({
          param: { id: String(questionId) },
          // @ts-expect-error - the json type is not inferred correctly
          json: {
            body: result.data.body,
            authorProfileId: result.data.authorProfileId,
            votes: result.data.votes
          }
        }),
      logContext: 'submitting comment',
      onSuccess: (response) => {
        if (response.data) {
          this.answer = response.data;

          // Show success message
          snackbar.success('snackbar.community.success.comment_submitted');

          // Refetch the question to get updated comments with proper structure
          if (this.question && this.question.slug) {
            this.fetchCommunityQuestion({ slug: this.question.slug, isLMS });
          }

          // Call the onSuccess callback if provided
          onSuccess?.();
        }

        // Mark as successful
        this.success = true;
        this.errors = {};
        this.isCommenting = false;
      },
      onError: (result) => {
        console.error('Error creating comment:', result);
        snackbar.error('snackbar.community.error.comment_failed');
        if (typeof result !== 'string' && 'error' in result) {
          this.handleValidationError(result);
        }
        this.isCommenting = false;
      }
    });
  }

  /**
   * Upvotes a post (question or comment)
   * Handles API call and updates local state with returned vote count
   * @param id Post ID
   * @param isQuestion Boolean indicating if it's a question
   */
  async upvotePost({ id, isQuestion }: { id: number | string; isQuestion: boolean }) {
    await this.execute<UpvotePostResponse>({
      requestFn: () =>
        classroomio.community[':id'].upvote.$post({
          param: { id: id.toString() },
          // @ts-expect-error - the json type is not inferred correctly
          json: { isQuestion }
        }),
      logContext: 'upvoting post',
      onSuccess: (response) => {
        // Update local question state with the vote count returned from backend
        if (this.question && response.data) {
          const newVoteCount = response.data.votes;
          if (isQuestion && String(this.question.id) === String(id)) {
            this.question.votes = newVoteCount;
          } else if (!isQuestion) {
            // Update comment votes
            this.question.comments = this.question.comments.map((comment) => {
              if (String(comment.id) === String(id)) {
                return { ...comment, votes: newVoteCount };
              }
              return comment;
            });
          }
        }
      },
      onError: (result) => {
        console.error('Error upvoting post:', result);
        snackbar.error('snackbar.community.error.try_again');
      }
    });
  }

  /**
   * Updates a community question
   * Handles validation, API call, and success/error handling
   * @param questionId Question ID
   * @param fields User-provided fields (title, body, courseId)
   */
  async updateQuestion(questionId: number, fields: { title: string; body: string; courseId?: string }) {
    const result = ZCommunityQuestionUpdate.safeParse({
      title: fields.title,
      body: fields.body,
      courseId: fields.courseId || ''
    });

    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'community');
      return;
    }

    this.isEditing = true;
    await this.execute<UpdateQuestionResponse>({
      requestFn: () =>
        classroomio.community[':id'].$put({
          param: { id: String(questionId) },
          // @ts-expect-error - the json type is not inferred correctly
          json: {
            title: result.data.title,
            body: result.data.body,
            courseId: result.data.courseId
          }
        }),
      logContext: 'updating community question',
      onSuccess: () => {
        if (this.question) {
          this.question = { ...this.question, ...result.data };
        }

        console.log('this.question', this.question);

        // Show success message
        snackbar.success('snackbar.community.success.question_updated');

        // Exit edit mode on successful update
        this.exitEditMode();

        // Mark as successful
        this.success = true;
        this.errors = {};
        this.isEditing = false;
      },
      onError: (result) => {
        console.error('Error updating question:', result);
        snackbar.error('snackbar.community.error.update_failed');
        if (typeof result !== 'string' && 'error' in result) {
          this.handleValidationError(result);
        }
        this.isEditing = false;
      }
    });
  }

  /**
   * Enters edit mode and initializes edit content with question data
   * @param question Question data to populate edit form
   */
  enterEditMode(question: { title: string; body: string; courseId?: string }) {
    this.isEditMode = true;
    this.editContent = {
      title: question.title,
      body: question.body,
      courseId: question.courseId || ''
    };
  }

  /**
   * Exits edit mode and resets edit content
   */
  exitEditMode() {
    this.isEditMode = false;
    this.editContent = {
      title: '',
      body: '',
      courseId: ''
    };
  }

  /**
   * Deletes a question by its ID (including all comments)
   * Handles API call, success/error handling, and navigation
   * @param questionId Question ID
   * @param isLMS Whether this is in LMS context (affects navigation path)
   */
  async deleteQuestion(questionId: string, isLMS: boolean = false) {
    await this.execute<(typeof classroomio.community)[':id']['$delete']>({
      requestFn: () => classroomio.community[':id'].$delete({ param: { id: questionId } }),
      logContext: 'deleting community question',
      onSuccess: () => {
        // Show success message
        snackbar.success('snackbar.community.success.success_delete');

        // Navigate back to community page based on context
        const basePath = isLMS ? '/lms' : get(currentOrgPath);
        goto(`${basePath}/community`);

        // Mark as successful
        this.success = true;
      },
      onError: (result) => {
        console.error('Error deleting question:', result);
        snackbar.error('snackbar.community.error.delete_failed');
      }
    });
  }

  /**
   * Deletes a comment by its ID
   * Handles API call and success/error handling
   * Resets deleteComment state on success
   * @param commentId Comment ID
   */
  async deleteComment(commentId: string) {
    await this.execute<(typeof classroomio.community)[':id']['comment']['$delete']>({
      requestFn: () =>
        classroomio.community[':id'].comment.$delete({
          param: { id: commentId }
        }),
      logContext: 'deleting community comment',
      onSuccess: () => {
        // Remove comment from local state
        if (this.question) {
          this.question.comments = this.question.comments.filter((comment) => String(comment.id) !== commentId);
        }

        // Reset delete comment state
        this.deleteCommentState.shouldDelete = false;
        this.deleteCommentState.commentId = '';

        // Show success message
        snackbar.success('snackbar.community.success.success_delete');

        // Mark as successful
        this.success = true;
      },
      onError: (result) => {
        console.error('Error deleting comment:', result);
        snackbar.error('snackbar.community.error.delete_failed');
      }
    });
  }

  /**
   * Fetches courses for the organization
   * Checks store first, then fetches if needed
   * @param userId User ID
   * @param orgId Organization ID
   */
  async fetchCoursesForOrg(userId: string | null, orgId: string) {
    if (this.coursesFetched) return;

    // Check store first
    const courses = get(coursesStore);
    if (courses.length) {
      this.courses = [...courses];
      this.coursesFetched = true;
      return;
    }

    // Fetch from API
    const coursesResults = await fetchCourses(userId, orgId);
    if (coursesResults) {
      this.courses = coursesResults.allCourses || [];
      this.coursesFetched = true;
    }
  }
}

export const communityApi = new CommunityApi();
