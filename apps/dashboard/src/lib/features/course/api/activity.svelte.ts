import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';
import { mapZodErrorsToTranslations } from '$lib/utils/validation/validation';
import {
  ZActivityAttachPackage,
  ZActivityCreate,
  ZActivityLaunch,
  ZActivityUpdate
} from '@cio/utils/validation/activity';
import { ZScormSettings } from '@cio/utils/validation/activity/scorm';
import type { TActivityCreate, TActivityLaunch, TActivityUpdate } from '@cio/utils/validation/activity';
import type { TScormSettings } from '@cio/utils/validation/activity/scorm';
import type {
  Activity,
  ActivityEditor,
  ActivityLearnerAttempts,
  ActivityResultsLearners,
  ActivityResultsPagination,
  ActivityResultsSummary,
  AttachActivityPackageRequest,
  CreateActivityRequest,
  DeleteActivityRequest,
  DetachActivityPackageRequest,
  GetActivityLearnerResultRequest,
  GetActivityProgressRequest,
  GetActivityRequest,
  GetActivityResultsRequest,
  LaunchActivityData,
  LaunchActivityRequest,
  ResetActivityLearnerRequest,
  UpdateActivityRequest,
  UpdateActivitySettingsRequest
} from '../utils/types';
import type { TScormResultsQuery } from '@cio/utils/validation/activity/report';

/**
 * API class for course activity operations (SCORM packages in version 1).
 */
export class ActivityApi extends BaseApiWithErrors {
  activity = $state<Activity | null>(null);
  editor = $state<ActivityEditor | null>(null);
  results = $state<ActivityResultsLearners>([]);
  resultsSummary = $state<ActivityResultsSummary | null>(null);
  resultsPagination = $state<ActivityResultsPagination | null>(null);
  learnerAttempts = $state<ActivityLearnerAttempts | null>(null);
  launchResult = $state<LaunchActivityData | null>(null);
  launching = $state(false);

  /**
   * Launches an activity module for the learner. Stores the launch result
   * (player URL, mode, modules) for the player page.
   * @returns The launch result, or undefined when validation or the request fails.
   */
  async launch(
    courseId: string,
    activityId: string,
    fields: TActivityLaunch = {}
  ): Promise<LaunchActivityData | undefined> {
    const result = ZActivityLaunch.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'activity');
      return;
    }
    this.errors = {};
    this.launching = true;
    let launched: LaunchActivityData | undefined;
    try {
      await this.execute<LaunchActivityRequest>({
        requestFn: () =>
          classroomio.course[':courseId'].activity[':activityId'].launch.$post({
            param: { courseId, activityId },
            json: result.data
          }),
        logContext: 'launching activity',
        onSuccess: (response) => {
          if (response.data) {
            launched = response.data;
            this.launchResult = response.data;
            this.success = true;
            this.errors = {};
          }
        },
        onError: (result) => {
          this.success = false;
          if (typeof result === 'string') {
            snackbar.error('snackbar.activity.launch_failed');
            return;
          }
          if ('error' in result) {
            this.errors.general = result.error;
            snackbar.error(result.error);
          }
        }
      });
    } finally {
      this.launching = false;
    }

    return launched;
  }

  /**
   * Refreshes the module ticks and locks of the current launch without
   * relaunching, so a running module is left alone. Keeps the launch as is
   * when the request fails or the activity is unavailable.
   */
  async refreshProgress(courseId: string, activityId: string) {
    await this.execute<GetActivityProgressRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].progress.$get({ param: { courseId, activityId } }),
      logContext: 'refreshing activity progress',
      onSuccess: (response) => {
        const launch = this.launchResult;
        if (!response.data || !launch?.available || response.data.units.length === 0) return;

        this.launchResult = { ...launch, units: response.data.units };
      }
    });
  }

  /**
   * Gets an activity by ID
   */
  async get(courseId: string, activityId: string) {
    return this.execute<GetActivityRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].$get({
          param: { courseId, activityId }
        }),
      logContext: 'fetching activity',
      onSuccess: (response) => {
        if (response.data) {
          this.activity = response.data.activity;
          this.editor = response.data.editor;
        }
      }
    });
  }

  /**
   * Creates a new activity
   * @returns The created activity, or undefined when validation or the request fails.
   */
  async create(courseId: string, fields: TActivityCreate): Promise<Activity | undefined> {
    const result = ZActivityCreate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'activity');
      return;
    }
    this.errors = {};
    let createdActivity: Activity | undefined;
    await this.execute<CreateActivityRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'creating activity',
      onSuccess: (response) => {
        if (response.data) {
          createdActivity = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        this.success = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to create activity');
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

    return createdActivity;
  }

  /**
   * Updates an activity
   */
  async update(courseId: string, activityId: string, fields: TActivityUpdate) {
    this.success = false;
    const result = ZActivityUpdate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'activity');
      return;
    }
    this.errors = {};
    await this.execute<UpdateActivityRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].$put({
          param: { courseId, activityId },
          json: result.data
        }),
      logContext: 'updating activity',
      onSuccess: (response) => {
        if (response.data) {
          this.activity = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        this.success = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to update activity');
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
   * Saves SCORM kind settings
   */
  async updateSettings(courseId: string, activityId: string, fields: TScormSettings) {
    this.success = false;
    const result = ZScormSettings.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'activity');
      return;
    }
    this.errors = {};
    await this.execute<UpdateActivitySettingsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].settings.$put({
          param: { courseId, activityId },
          json: result.data
        }),
      logContext: 'updating activity settings',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        this.success = false;
        if (typeof result === 'string') {
          snackbar.error('snackbar.activity.settings_failed');
          return;
        }
        if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Attaches a processed package asset to an activity
   */
  async attachPackage(courseId: string, activityId: string, assetId: string) {
    this.success = false;
    const result = ZActivityAttachPackage.safeParse({ assetId });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'activity');
      return;
    }
    this.errors = {};
    await this.execute<AttachActivityPackageRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].package.$put({
          param: { courseId, activityId },
          json: result.data
        }),
      logContext: 'attaching package',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        this.success = false;
        if (typeof result === 'string') {
          snackbar.error('snackbar.activity.attach_failed');
          return;
        }
        if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Detaches the package from an activity. The asset stays in the Media Manager.
   */
  async detachPackage(courseId: string, activityId: string) {
    await this.execute<DetachActivityPackageRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].package.$delete({
          param: { courseId, activityId }
        }),
      logContext: 'detaching package',
      onSuccess: () => {
        snackbar.success('snackbar.activity.detached');
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('snackbar.activity.detach_failed');
        }
      }
    });
  }

  /**
   * Deletes an activity
   */
  async delete(courseId: string, activityId: string) {
    await this.execute<DeleteActivityRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].$delete({
          param: { courseId, activityId }
        }),
      logContext: 'deleting activity',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('snackbar.success_delete');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete activity');
        }
      }
    });
  }

  /**
   * Lists paged learner results with the summary header for the Results tab.
   */
  async listResults(courseId: string, activityId: string, query: TScormResultsQuery) {
    return this.execute<GetActivityResultsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].results.$get({
          param: { courseId, activityId },
          query: { page: String(query.page), limit: String(query.limit), sort: query.sort, direction: query.direction }
        }),
      logContext: 'fetching activity results',
      onSuccess: (response) => {
        this.results = response.data ?? [];
        this.resultsSummary = response.summary ?? null;
        this.resultsPagination = response.pagination ?? null;
      }
    });
  }

  /**
   * Fetches every attempt of one learner for the student sheet.
   */
  async getLearnerAttempts(courseId: string, activityId: string, profileId: string) {
    return this.execute<GetActivityLearnerResultRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].results[':profileId'].$get({
          param: { courseId, activityId, profileId }
        }),
      logContext: 'fetching learner attempts',
      onSuccess: (response) => {
        this.learnerAttempts = response.data ?? null;
      }
    });
  }

  /**
   * Deletes one learner's attempts and completion for the activity.
   */
  async resetLearner(courseId: string, activityId: string, profileId: string) {
    await this.execute<ResetActivityLearnerRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].activity[':activityId'].results[':profileId'].reset.$post({
          param: { courseId, activityId, profileId }
        }),
      logContext: 'resetting learner attempts',
      onSuccess: () => {
        snackbar.success('snackbar.activity.learner_reset');
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        this.success = false;
        if (typeof result === 'string') {
          snackbar.error('snackbar.activity.learner_reset_failed');
        }
      }
    });
  }
}

export const activityApi = /* @__PURE__ */ new ActivityApi();
