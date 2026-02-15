import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  DeleteSubmissionRequest,
  ListSubmissionsRequest,
  Submissions,
  UpdateSubmissionAnswerRequest,
  UpdateSubmissionRequest
} from '../utils/types';
import type { TSubmissionAnswerUpdate, TSubmissionUpdate } from '@cio/utils/validation/submission';
import { ZSubmissionAnswerUpdate, ZSubmissionUpdate } from '@cio/utils/validation/submission';

import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

/**
 * API class for submission operations
 */
export class SubmissionApi extends BaseApiWithErrors {
  data = $state<Submissions>([]);

  /**
   * Lists submissions for a course
   * Stores data in this.data so child components can access it
   */
  async list(courseId: string, exerciseId?: string, submittedBy?: string) {
    await this.execute<ListSubmissionsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission.$get({
          param: { courseId },
          query: { exerciseId, submittedBy }
        }),
      logContext: 'listing submissions',
      onSuccess: (response) => {
        if (response.data) {
          this.data = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to list submissions');
        }
      }
    });
  }

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
   * Updates a question answer in a submission
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
          snackbar.success('Answer updated successfully');
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
