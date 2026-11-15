import { ZUpdateAnalyticsSettings } from '@cio/utils/validation/analytics';
import { snackbar } from '$features/ui/snackbar/store';
import { BaseApi, classroomio } from '$lib/utils/services/api';

import type { UpdateAnalyticsSettingsRequest } from '../utils/types';
import { analyticsApi } from './analytics.svelte';

class AnalyticsSettingsApi extends BaseApi {
  isSaving = $state(false);

  /**
   * Saves the org's student target (null clears it) and draws it on the growth chart at once. Returns whether it saved.
   */
  async updateStudentTarget(studentTarget: number | null): Promise<boolean> {
    const parsed = ZUpdateAnalyticsSettings.safeParse({ studentTarget });
    if (!parsed.success) {
      snackbar.error('snackbar.analytics.target_invalid');
      return false;
    }

    this.isSaving = true;
    const response = await this.execute<UpdateAnalyticsSettingsRequest>({
      requestFn: () => classroomio.analytics.settings.$put({ json: parsed.data }),
      logContext: 'saving analytics settings',
      onSuccess: (result) => {
        if (analyticsApi.dashboard) analyticsApi.dashboard.scope.studentTarget = result.data.studentTarget;

        snackbar.success('snackbar.analytics.target_saved');
      },
      onError: () => snackbar.error('snackbar.analytics.target_failed')
    });
    this.isSaving = false;

    return Boolean(response);
  }
}

export const analyticsSettingsApi = new AnalyticsSettingsApi();
