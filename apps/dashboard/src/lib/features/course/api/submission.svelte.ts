import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  BulkAcceptAiReviewsRequest,
  BulkAcceptAiReviewsSuccess,
  DecideAiReviewRequest,
  DeleteSubmissionRequest,
  RequestAiReviewRequest,
  RequestAiReviewSuccess,
  UpdateSubmissionAnswerRequest,
  UpdateSubmissionGradesRequest,
  UpdateSubmissionRequest
} from '../utils/types';
import type {
  TSubmissionAnswerUpdate,
  TSubmissionGradesUpdate,
  TSubmissionUpdate
} from '@cio/utils/validation/submission';
import { ZSubmissionAnswerUpdate, ZSubmissionGradesUpdate, ZSubmissionUpdate } from '@cio/utils/validation/submission';

import type { TAiReviewDecisionBody } from '@cio/utils/validation/math';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

/**
 * API class for submission operations
 */
export class SubmissionApi extends BaseApiWithErrors {
  /**
   * Updates a submission
   */
  async update(courseId: string, submissionId: string, fields: TSubmissionUpdate) {
    const result = ZSubmissionUpdate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'submission');
      return;
    }

    await this.execute<UpdateSubmissionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission[':submissionId'].$put({
          param: { courseId, submissionId },
          json: result.data
        }),
      logContext: 'updating submission',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Submission updated successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (result.field) {
          this.errors[result.field] = result.message;
          snackbar.error(result.message);
        } else {
          this.errors.general = result.message;
          snackbar.error(result.message);
        }
      }
    });
  }

  /**
   * Deletes a submission
   */
  async delete(courseId: string, submissionId: string) {
    await this.execute<DeleteSubmissionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission[':submissionId'].$delete({
          param: { courseId, submissionId }
        }),
      logContext: 'deleting submission',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Submission deleted successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: () => {
        snackbar.error('Failed to delete submission');
      }
    });
  }

  /**
   * Updates all grades (answer points + total + feedback) in a single request
   */
  async updateGrades(courseId: string, submissionId: string, data: TSubmissionGradesUpdate) {
    const result = ZSubmissionGradesUpdate.safeParse(data);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'submission');
      return;
    }

    await this.execute<UpdateSubmissionGradesRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission[':submissionId'].grades.$put({
          param: { courseId, submissionId },
          json: result.data
        }),
      logContext: 'updating submission grades',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('snackbar.submissions.success.grading');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (result.field) {
          this.errors[result.field] = result.message;
        }

        snackbar.error(result.message);
      }
    });
  }

  /**
   * Updates a question answer in a submission.
   * Does not show a snackbar (caller shows one when saving multiple answers).
   */
  async updateAnswer(courseId: string, submissionId: string, data: TSubmissionAnswerUpdate) {
    const result = ZSubmissionAnswerUpdate.safeParse(data);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'submission');
      return;
    }

    await this.execute<UpdateSubmissionAnswerRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission[':submissionId'].answer.$put({
          param: { courseId, submissionId },
          json: result.data
        }),
      logContext: 'updating submission answer',
      onSuccess: (response) => {
        if (response.data) {
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (result.field) {
          this.errors[result.field] = result.message;
        }

        snackbar.error(result.message);
      }
    });
  }
}

/**
 * API class for the AI suggestions on worked-solution and paragraph working
 */
export class AiReviewApi extends BaseApiWithErrors {
  /** Last suggestion returned by `request`. */
  review = $state<RequestAiReviewSuccess['data'] | null>(null);
  /** Last bulk accept result. */
  bulkResult = $state<BulkAcceptAiReviewsSuccess['data'] | null>(null);

  async request(courseId: string, submissionId: string, questionId: number) {
    this.review = null;

    await this.execute<RequestAiReviewRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission[':submissionId']['ai-review'].$post({
          param: { courseId, submissionId },
          json: { questionId }
        }),
      logContext: 'requesting an AI review of working',
      onSuccess: (response) => {
        this.review = response.data;
        this.success = true;
      },
      onError: (result) => {
        snackbar.error(result.message);
      }
    });

    return this.review;
  }

  async decide(courseId: string, submissionId: string, decision: TAiReviewDecisionBody) {
    await this.execute<DecideAiReviewRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission[':submissionId']['ai-review'].decision.$put({
          param: { courseId, submissionId },
          json: decision
        }),
      logContext: 'recording a decision on an AI suggestion',
      onSuccess: () => {
        this.success = true;
      },
      onError: (result) => {
        snackbar.error(result.message);
      }
    });
  }

  async acceptConfident(courseId: string, exerciseId: string) {
    this.bulkResult = null;

    await this.execute<BulkAcceptAiReviewsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission['ai-review'].accept[':exerciseId'].$post({
          param: { courseId, exerciseId },
          json: {}
        }),
      logContext: 'accepting confident AI suggestions',
      onSuccess: (response) => {
        this.bulkResult = response.data;
        this.success = true;
      },
      onError: (result) => {
        snackbar.error(result.message);
      }
    });

    return this.bulkResult;
  }
}

export const aiReviewApi = /* @__PURE__ */ new AiReviewApi();

export const submissionApi = /* @__PURE__ */ new SubmissionApi();
