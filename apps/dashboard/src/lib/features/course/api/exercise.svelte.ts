import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CreateExerciseFromTemplateRequest,
  CreateExerciseRequest,
  DeleteExerciseRequest,
  Exercise,
  GetExerciseRequest,
  SubmitExerciseRequest,
  UpdateExerciseRequest,
  VideoRecordingPlaybackRequest,
  VideoRecordingUploadCompleteRequest,
  VideoRecordingUploadInitRequest
} from '../utils/types';
import type {
  TExerciseCreate,
  TExerciseSubmissionCreate,
  TExerciseUpdate,
  TExerciseVideoRecordingUploadComplete,
  TExerciseVideoRecordingUploadInit
} from '@cio/utils/validation/exercise';
import {
  ZExerciseCreate,
  ZExerciseSubmissionCreate,
  ZExerciseUpdate,
  ZExerciseVideoRecordingUploadComplete,
  ZExerciseVideoRecordingUploadInit
} from '@cio/utils/validation/exercise';

import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

/**
 * API class for exercise operations
 */
export class ExerciseApi extends BaseApiWithErrors {
  exercise = $state<Exercise | null>(null);

  /**
   * Gets an exercise by ID
   */
  async get(courseId: string, exerciseId: string) {
    await this.execute<GetExerciseRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise[':exerciseId'].$get({
          param: { courseId, exerciseId }
        }),
      logContext: 'fetching exercise',
      onSuccess: (response) => {
        if (response.data) {
          this.exercise = response.data as unknown as Exercise;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch exercise');
        }
      }
    });
  }

  /**
   * Creates a new exercise
   */
  async create(courseId: string, fields: Omit<TExerciseCreate, 'courseId'>) {
    const result = ZExerciseCreate.safeParse({ ...fields, courseId });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'exercise');
      return;
    }

    await this.execute<CreateExerciseRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'creating exercise',
      onSuccess: (response) => {
        if (response.data) {
          this.exercise = response.data as unknown as Exercise;
          snackbar.success('Exercise created successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to create exercise');
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
   * Updates an exercise
   */
  async update(courseId: string, exerciseId: string, fields: TExerciseUpdate) {
    this.success = false;
    const result = ZExerciseUpdate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'exercise');
      return;
    }
    this.errors = {};
    await this.execute<UpdateExerciseRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise[':exerciseId'].$put({
          param: { courseId, exerciseId },
          json: result.data
        }),
      logContext: 'updating exercise',
      onSuccess: (response) => {
        if (response.data) {
          this.exercise = response.data as unknown as Exercise;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        this.success = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to update exercise');
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
   * Deletes an exercise
   */
  async delete(courseId: string, exerciseId: string) {
    await this.execute<DeleteExerciseRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise[':exerciseId'].$delete({
          param: { courseId, exerciseId }
        }),
      logContext: 'deleting exercise',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Exercise deleted successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete exercise');
        }
      }
    });
  }

  /**
   * Submits an exercise
   */
  async submit(courseId: string, exerciseId: string, answers: TExerciseSubmissionCreate['answers']) {
    const result = ZExerciseSubmissionCreate.safeParse({ exerciseId, answers });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'exercise');
      return;
    }

    return await this.execute<SubmitExerciseRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise[':exerciseId'].submission.$post({
          param: { courseId, exerciseId },
          json: result.data
        }),
      logContext: 'submitting exercise',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Exercise submitted successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to submit exercise');
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

  async initVideoRecordingUpload(
    courseId: string,
    exerciseId: string,
    questionId: number | string,
    fields: TExerciseVideoRecordingUploadInit
  ) {
    const result = ZExerciseVideoRecordingUploadInit.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'exercise');
      return null;
    }

    return await this.execute<VideoRecordingUploadInitRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise[':exerciseId'].question[':questionId'][
          'video-recording'
        ].upload.init.$post({
          param: { courseId, exerciseId, questionId: String(questionId) },
          json: result.data
        }),
      logContext: 'initializing video recording upload'
    });
  }

  async completeVideoRecordingUpload(
    courseId: string,
    exerciseId: string,
    questionId: number | string,
    fields: TExerciseVideoRecordingUploadComplete
  ) {
    const result = ZExerciseVideoRecordingUploadComplete.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'exercise');
      return null;
    }

    return await this.execute<VideoRecordingUploadCompleteRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise[':exerciseId'].question[':questionId'][
          'video-recording'
        ].upload.complete.$post({
          param: { courseId, exerciseId, questionId: String(questionId) },
          json: result.data
        }),
      logContext: 'completing video recording upload'
    });
  }

  async getVideoRecordingPlaybackUrl(
    courseId: string,
    exerciseId: string,
    submissionId: string,
    questionId: number | string
  ) {
    return await this.execute<VideoRecordingPlaybackRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise[':exerciseId'].submission[':submissionId'].question[':questionId'][
          'video-recording'
        ].playback.$get({
          param: { courseId, exerciseId, submissionId, questionId: String(questionId) }
        }),
      logContext: 'getting video recording playback URL'
    });
  }

  /**
   * Creates an exercise from a template
   * @param courseId Course ID
   * @param lessonId Lesson ID
   * @param templateId Template ID
   * @returns The created exercise data or null on error
   */
  async createFromTemplate(
    courseId: string,
    templateId: number | string,
    options: { lessonId?: string; sectionId?: string; order?: number } = {}
  ) {
    const templateIdValue = Number(templateId);
    await this.execute<CreateExerciseFromTemplateRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['exercise']['from-template'].$post({
          param: { courseId },
          json: {
            lessonId: options.lessonId,
            sectionId: options.sectionId,
            order: options.order,
            templateId: templateIdValue
          }
        }),
      logContext: 'creating exercise from template',
      onSuccess: (response) => {
        if (response.data) {
          this.exercise = response.data as unknown as Exercise;
          snackbar.success('Exercise created successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to create exercise from template');
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
   * Checks if exercise is completed
   * NOTE: This route does not exist in the API. Use the submission list endpoint instead.
   */
}

export const exerciseApi = new ExerciseApi();
