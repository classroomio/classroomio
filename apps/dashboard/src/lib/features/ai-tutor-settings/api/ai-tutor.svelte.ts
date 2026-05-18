import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { ZAiTutorSettingsUpdate, ZCourseAiTutorOverride } from '@cio/utils/validation/agent';
import { snackbar } from '$features/ui/snackbar/store';

import type {
  CourseAiTutorOverride,
  CourseAiTutorView,
  GetCourseAiTutorRequest,
  GetOrgAiTutorRequest,
  OrgAiTutorSettings,
  UpdateCourseAiTutorRequest,
  UpdateOrgAiTutorRequest
} from '../utils/types';

class AiTutorApi extends BaseApiWithErrors {
  orgSettings = $state<OrgAiTutorSettings | null>(null);
  courseSettings = $state<CourseAiTutorView | null>(null);
  loading = $state(false);
  saving = $state(false);

  async fetchOrgSettings() {
    this.loading = true;

    try {
      await this.execute<GetOrgAiTutorRequest>({
        requestFn: () => classroomio.organization['ai-tutor'].$get(),
        logContext: 'fetching org AI tutor settings',
        onSuccess: (response) => {
          this.orgSettings = response.data;
        }
      });
    } finally {
      this.loading = false;
    }
  }

  async updateOrgSettings(patch: Partial<OrgAiTutorSettings>) {
    const result = ZAiTutorSettingsUpdate.safeParse(patch);

    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }

    this.saving = true;

    try {
      await this.execute<UpdateOrgAiTutorRequest>({
        requestFn: () => classroomio.organization['ai-tutor'].$put({ json: result.data }),
        logContext: 'updating org AI tutor settings',
        onSuccess: (response) => {
          this.orgSettings = response.data;
          this.errors = {};
          snackbar.success('aiTutor.snackbar.saved');
        },
        onError: (result) => {
          if (typeof result !== 'string' && 'field' in result && result.field) {
            this.errors[result.field] = result.error;
          }
        }
      });
    } finally {
      this.saving = false;
    }
  }

  async fetchCourseSettings(courseId: string) {
    this.loading = true;

    try {
      await this.execute<GetCourseAiTutorRequest>({
        requestFn: () => classroomio.course[':courseId']['ai-tutor'].$get({ param: { courseId } }),
        logContext: 'fetching course AI tutor settings',
        onSuccess: (response) => {
          this.courseSettings = response.data;
        }
      });
    } finally {
      this.loading = false;
    }
  }

  async updateCourseSettings(courseId: string, patch: CourseAiTutorOverride) {
    const result = ZCourseAiTutorOverride.safeParse(patch ?? {});

    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }

    this.saving = true;

    try {
      await this.execute<UpdateCourseAiTutorRequest>({
        requestFn: () =>
          classroomio.course[':courseId']['ai-tutor'].$put({
            param: { courseId },
            json: result.data
          }),
        logContext: 'updating course AI tutor settings',
        onSuccess: (response) => {
          if (this.courseSettings) {
            this.courseSettings = { ...this.courseSettings, override: response.data };
          }
          this.errors = {};
          snackbar.success('aiTutor.snackbar.saved');
        }
      });
    } finally {
      this.saving = false;
    }
  }
}

export const aiTutorApi = new AiTutorApi();
