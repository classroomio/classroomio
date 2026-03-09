import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  DeleteSubmissionRequest,
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
        if (typeof result === 'string') {
          snackbar.error('Failed to update submission');
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
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete submission');
        }
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
        if (typeof result === 'string') {
          snackbar.error('Failed to update grades');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        }
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
        if (typeof result === 'string') {
          snackbar.error('Failed to update answer');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }
}

export const submissionApi = new SubmissionApi();
