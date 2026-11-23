import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';
import {
  ZAddLearningPathMembers,
  ZCreateLearningPath,
  type TUpdateLearningPath
} from '@cio/utils/validation/learning-path/learning-path';
import { mapZodErrorsToTranslations } from '$lib/utils/validation/validation';
import { t } from '$lib/utils/functions/translations';
import { findInvalidEmails } from '../utils/learning-path-utils';
import type {
  AddLearningPathCourseRequest,
  AddLearningPathMembersRequest,
  AddLearningPathMembersResult,
  CreateLearningPathRequest,
  DeleteLearningPathRequest,
  GetLearningPathRequest,
  LearningPathCourseOption,
  LearningPathDetail,
  LearningPathList,
  LearningPathMember,
  ListLearningPathCourseOptionsRequest,
  ListLearningPathMembersRequest,
  ListLearningPathsRequest,
  RemoveLearningPathCourseRequest,
  RemoveLearningPathMemberRequest,
  ReorderLearningPathCoursesRequest,
  UpdateLearningPathRequest
} from '../utils/types';

const ERROR_KEYS: Record<string, string> = {
  LEARNING_PATH_COURSE_ALREADY_ADDED: 'learning_paths.errors.course_already_added',
  LEARNING_PATH_NOT_FOUND: 'learning_paths.errors.not_found',
  VALIDATION_ERROR: 'learning_paths.errors.activate_needs_course'
};

function errorKey(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';

  return ERROR_KEYS[code] ?? 'snackbar.something';
}

class LearningPathApi extends BaseApiWithErrors {
  list = $state<LearningPathList | null>(null);
  path = $state<LearningPathDetail | null>(null);
  members = $state<LearningPathMember[] | null>(null);
  courseOptions = $state<LearningPathCourseOption[]>([]);
  isSaving = $state(false);

  async listPaths() {
    await this.execute<ListLearningPathsRequest>({
      requestFn: () => classroomio['learning-path'].$get(),
      logContext: 'listing learning paths',
      onSuccess: (result) => {
        this.list = result.data;
      }
    });
  }

  async createPath(fields: { name: string; description: string }) {
    const parsed = ZCreateLearningPath.safeParse({
      name: fields.name,
      description: fields.description.trim() || undefined
    });
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return null;
    }

    const result = await this.execute<CreateLearningPathRequest>({
      requestFn: () => classroomio['learning-path'].$post({ json: parsed.data }),
      logContext: 'creating learning path',
      onError: (error) => snackbar.error(errorKey(error))
    });

    return result?.data ?? null;
  }

  async loadPath(pathId: string) {
    await this.execute<GetLearningPathRequest>({
      requestFn: () => classroomio['learning-path'][':pathId'].$get({ param: { pathId } }),
      logContext: 'loading learning path',
      onSuccess: (result) => {
        this.path = result.data;
      },
      onError: (error) => snackbar.error(errorKey(error))
    });
  }

  async updatePath(pathId: string, fields: TUpdateLearningPath) {
    this.isSaving = true;

    try {
      const result = await this.execute<UpdateLearningPathRequest>({
        requestFn: () => classroomio['learning-path'][':pathId'].$put({ param: { pathId }, json: fields }),
        logContext: 'updating learning path',
        onSuccess: async () => {
          snackbar.success('learning_paths.settings.saved');
          await this.loadPath(pathId);
        },
        onError: (error) => snackbar.error(errorKey(error))
      });

      return Boolean(result);
    } finally {
      this.isSaving = false;
    }
  }

  async deletePath(pathId: string) {
    const result = await this.execute<DeleteLearningPathRequest>({
      requestFn: () => classroomio['learning-path'][':pathId'].$delete({ param: { pathId } }),
      logContext: 'deleting learning path',
      onSuccess: () => snackbar.success('learning_paths.settings.deleted'),
      onError: (error) => snackbar.error(errorKey(error))
    });

    return Boolean(result);
  }

  async loadCourseOptions(pathId: string) {
    await this.execute<ListLearningPathCourseOptionsRequest>({
      requestFn: () => classroomio['learning-path'][':pathId']['course-options'].$get({ param: { pathId } }),
      logContext: 'loading course options',
      onSuccess: (result) => {
        this.courseOptions = result.data;
      }
    });
  }

  async addCourses(pathId: string, courseIds: string[]) {
    for (const courseId of courseIds) {
      await this.execute<AddLearningPathCourseRequest>({
        requestFn: () =>
          classroomio['learning-path'][':pathId'].courses.$post({ param: { pathId }, json: { courseId } }),
        logContext: 'adding course to learning path',
        onError: (error) => snackbar.error(errorKey(error))
      });
    }

    snackbar.success('learning_paths.courses.added');
    await this.loadPath(pathId);
  }

  async reorderCourses(pathId: string, courseIds: string[]) {
    await this.execute<ReorderLearningPathCoursesRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId'].courses.order.$put({ param: { pathId }, json: { courseIds } }),
      logContext: 'reordering learning path courses',
      onError: async (error) => {
        snackbar.error(errorKey(error));
        await this.loadPath(pathId);
      }
    });
  }

  async removeCourse(pathId: string, courseId: string) {
    await this.execute<RemoveLearningPathCourseRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId'].courses[':courseId'].$delete({ param: { pathId, courseId } }),
      logContext: 'removing course from learning path',
      onSuccess: async () => {
        snackbar.success('learning_paths.courses.removed');
        await this.loadPath(pathId);
      },
      onError: (error) => snackbar.error(errorKey(error))
    });
  }

  async loadMembers(pathId: string) {
    await this.execute<ListLearningPathMembersRequest>({
      requestFn: () => classroomio['learning-path'][':pathId'].members.$get({ param: { pathId } }),
      logContext: 'loading learning path members',
      onSuccess: (result) => {
        this.members = result.data;
      }
    });
  }

  async addMembers(pathId: string, emails: string[]): Promise<AddLearningPathMembersResult | null> {
    const parsed = ZAddLearningPathMembers.safeParse({ emails });
    if (!parsed.success) {
      const invalidEmails = findInvalidEmails(emails);
      this.errors = invalidEmails.length
        ? { emails: t.get('learning_paths.people.invalid_emails', { emails: invalidEmails.join(', ') }) }
        : mapZodErrorsToTranslations(parsed.error);
      return null;
    }

    const result = await this.execute<AddLearningPathMembersRequest>({
      requestFn: () => classroomio['learning-path'][':pathId'].members.$post({ param: { pathId }, json: parsed.data }),
      logContext: 'adding learning path members',
      onSuccess: async () => {
        await Promise.all([this.loadMembers(pathId), this.loadPath(pathId)]);
      },
      onError: (error) => snackbar.error(errorKey(error))
    });

    return result?.data ?? null;
  }

  async removeMember(pathId: string, memberId: string) {
    await this.execute<RemoveLearningPathMemberRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId'].members[':memberId'].$delete({ param: { pathId, memberId } }),
      logContext: 'removing learning path member',
      onSuccess: async () => {
        snackbar.success('learning_paths.people.removed');
        await Promise.all([this.loadMembers(pathId), this.loadPath(pathId)]);
      },
      onError: (error) => snackbar.error(errorKey(error))
    });
  }

  resetWorkspace() {
    this.path = null;
    this.members = null;
    this.courseOptions = [];
  }
}

export const learningPathApi = new LearningPathApi();
