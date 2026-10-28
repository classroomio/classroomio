import { ZUpdateInsightsSettings } from '@cio/utils/validation/insights';
import { snackbar } from '$features/ui/snackbar/store';
import { BaseApi, classroomio } from '$lib/utils/services/api';

import type { UpdateInsightsSettingsRequest } from '../utils/types';
import { insightsApi } from './insights.svelte';

class InsightsSettingsApi extends BaseApi {
  isSaving = $state(false);

  /**
   * Saves the org's student target (null clears it) and draws it on the growth chart at once. Returns whether it saved.
   */
  async updateStudentTarget(studentTarget: number | null): Promise<boolean> {
    const parsed = ZUpdateInsightsSettings.safeParse({ studentTarget });
    if (!parsed.success) {
      snackbar.error('snackbar.insights.target_invalid');
      return false;
    }

    this.isSaving = true;
    const response = await this.execute<UpdateInsightsSettingsRequest>({
      requestFn: () => classroomio.insights.settings.$put({ json: parsed.data }),
      logContext: 'saving insights settings',
      onSuccess: (result) => {
        if (insightsApi.dashboard) insightsApi.dashboard.scope.studentTarget = result.data.studentTarget;

        snackbar.success('snackbar.insights.target_saved');
      },
      onError: () => snackbar.error('snackbar.insights.target_failed')
    });
    this.isSaving = false;

    return Boolean(response);
  }
}

export const insightsSettingsApi = new InsightsSettingsApi();
