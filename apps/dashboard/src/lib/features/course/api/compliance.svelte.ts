import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CourseComplianceOverview,
  ExtendCourseComplianceRequest,
  GetCourseComplianceOverviewRequest,
  GetLearnerComplianceHistoryRequest,
  LearnerComplianceHistory,
  ResetCourseComplianceRequest,
  WaiveCourseComplianceRequest
} from '../utils/types';
import { snackbar } from '$features/ui/snackbar/store';
import {
  ZCourseComplianceExtend,
  ZCourseComplianceReset,
  ZCourseComplianceWaive,
  type TCourseComplianceExtend,
  type TCourseComplianceReset,
  type TCourseComplianceWaive
} from '@cio/utils/validation/course';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

export class ComplianceApi extends BaseApiWithErrors {
  overview = $state<CourseComplianceOverview | null>(null);
  learnerHistory = $state<LearnerComplianceHistory | null>(null);

  private overviewKey = $state<string | null>(null);
  private learnerHistoryKey = $state<string | null>(null);

  async getOverview(courseId: string) {
    const result = await this.execute<GetCourseComplianceOverviewRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].compliance.$get({
          param: { courseId }
        }),
      logContext: 'fetching course compliance overview',
      onSuccess: (response) => {
        this.overview = response.data;
        this.overviewKey = courseId;
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('snackbar.course.compliance.overview_failed');
        }
      }
    });

    return result?.data;
  }

  async ensureOverview(courseId: string) {
    if (this.overviewKey === courseId && this.overview) {
      return this.overview;
    }

    return this.getOverview(courseId);
  }

  async getLearnerHistory(courseId: string, profileId: string) {
    const result = await this.execute<GetLearnerComplianceHistoryRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].compliance.learners[':profileId'].$get({
          param: { courseId, profileId }
        }),
      logContext: 'fetching learner compliance history',
      onSuccess: (response) => {
        this.learnerHistory = response.data;
        this.learnerHistoryKey = `${courseId}:${profileId}`;
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('snackbar.course.compliance.history_failed');
        }
      }
    });

    return result?.data;
  }

  async ensureLearnerHistory(courseId: string, profileId: string) {
    const requestKey = `${courseId}:${profileId}`;
    if (this.learnerHistoryKey === requestKey && this.learnerHistory) {
      return this.learnerHistory;
    }

    return this.getLearnerHistory(courseId, profileId);
  }

  async resetCourseCompliance(courseId: string, fields: TCourseComplianceReset) {
    const result = ZCourseComplianceReset.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'course');
      return;
    }

    const response = await this.execute<ResetCourseComplianceRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].compliance.reset.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'resetting course compliance',
      onSuccess: () => {
        snackbar.success('snackbar.course.compliance.reset_success');
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('snackbar.course.compliance.reset_failed');
          return;
        }

        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
        }
      }
    });

    if (response?.data) {
      this.overviewKey = null;
      await this.getOverview(courseId);
    }

    return response?.data;
  }

  async extendCourseCompliance(courseId: string, fields: TCourseComplianceExtend) {
    const result = ZCourseComplianceExtend.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'course');
      return;
    }

    const response = await this.execute<ExtendCourseComplianceRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].compliance.extend.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'extending course compliance',
      onSuccess: () => {
        snackbar.success('snackbar.course.compliance.extend_success');
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('snackbar.course.compliance.extend_failed');
          return;
        }

        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
        }
      }
    });

    if (response?.data) {
      this.overviewKey = null;
      await this.getOverview(courseId);
    }

    return response?.data;
  }

  async waiveCourseCompliance(courseId: string, fields: TCourseComplianceWaive) {
    const result = ZCourseComplianceWaive.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'course');
      return;
    }

    const response = await this.execute<WaiveCourseComplianceRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].compliance.waive.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'waiving course compliance',
      onSuccess: () => {
        snackbar.success('snackbar.course.compliance.waive_success');
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('snackbar.course.compliance.waive_failed');
          return;
        }

        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
        }
      }
    });

    if (response?.data) {
      this.overviewKey = null;
      await this.getOverview(courseId);
    }

    return response?.data;
  }

  override reset() {
    super.reset();
    this.overview = null;
    this.learnerHistory = null;
    this.overviewKey = null;
    this.learnerHistoryKey = null;
  }
}

export const complianceApi = new ComplianceApi();
