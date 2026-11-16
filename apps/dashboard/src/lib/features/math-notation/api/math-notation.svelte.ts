import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { ZCourseMathNotationOverride, ZMathNotationSettings } from '@cio/utils/validation/math';
import type { TCourseMathNotationOverride, TMathNotationSettings } from '@cio/utils/validation/math';
import { snackbar } from '$features/ui/snackbar/store';

import type {
  CourseMathNotationView,
  GetCourseMathNotationRequest,
  GetOrgMathNotationRequest,
  OrgMathNotation,
  UpdateCourseMathNotationRequest,
  UpdateOrgMathNotationRequest
} from '../utils/types';

class MathNotationApi extends BaseApiWithErrors {
  orgSettings = $state<OrgMathNotation | null>(null);
  courseView = $state<CourseMathNotationView | null>(null);
  loading = $state(false);
  saving = $state(false);

  async fetchOrgSettings() {
    this.loading = true;

    try {
      await this.execute<GetOrgMathNotationRequest>({
        requestFn: () => classroomio.organization['math-notation'].$get(),
        logContext: 'fetching org math notation',
        onSuccess: (response) => {
          this.orgSettings = response.data;
        },
        onError: () => snackbar.error('mathNotation.snackbar.error')
      });
    } finally {
      this.loading = false;
    }
  }

  async updateOrgSettings(settings: TMathNotationSettings) {
    const result = ZMathNotationSettings.safeParse(settings);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }

    this.saving = true;
    this.success = false;

    try {
      await this.execute<UpdateOrgMathNotationRequest>({
        requestFn: () => classroomio.organization['math-notation'].$put({ json: result.data }),
        logContext: 'updating org math notation',
        onSuccess: (response) => {
          this.orgSettings = response.data;
          this.errors = {};
          this.success = true;
          snackbar.success('mathNotation.snackbar.saved');
        },
        onError: () => snackbar.error('mathNotation.snackbar.error')
      });
    } finally {
      this.saving = false;
    }
  }

  async fetchCourseView(courseId: string) {
    this.loading = true;

    try {
      await this.execute<GetCourseMathNotationRequest>({
        requestFn: () => classroomio.course[':courseId']['math-notation'].$get({ param: { courseId } }),
        logContext: 'fetching course math notation',
        onSuccess: (response) => {
          this.courseView = response.data;
        },
        onError: () => snackbar.error('mathNotation.snackbar.error')
      });
    } finally {
      this.loading = false;
    }
  }

  async updateCourseOverride(courseId: string, override: TCourseMathNotationOverride) {
    const result = ZCourseMathNotationOverride.safeParse(override);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }

    this.saving = true;
    this.success = false;

    try {
      await this.execute<UpdateCourseMathNotationRequest>({
        requestFn: () =>
          classroomio.course[':courseId']['math-notation'].$put({ param: { courseId }, json: result.data }),
        logContext: 'updating course math notation',
        onSuccess: () => {
          this.errors = {};
          this.success = true;
          snackbar.success('mathNotation.snackbar.saved');
        },
        onError: () => snackbar.error('mathNotation.snackbar.error')
      });
    } finally {
      this.saving = false;
    }
  }
}

export const mathNotationApi = new MathNotationApi();
