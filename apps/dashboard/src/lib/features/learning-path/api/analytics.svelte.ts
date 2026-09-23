import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { GetPathAnalyticsRequest, LearningPathAnalytics } from '../utils/types';

class PathAnalyticsApi extends BaseApiWithErrors {
  analytics = $state<LearningPathAnalytics | null>(null);
  isLoadingAnalytics = $state(false);

  async getAnalytics(pathId: string) {
    this.isLoadingAnalytics = true;

    await this.execute<GetPathAnalyticsRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['analytics'].$get({
          param: { pathId }
        }),
      logContext: 'getting path analytics',
      onSuccess: (result) => {
        this.analytics = result.data;
      }
    });
    this.isLoadingAnalytics = false;
  }
}

export const pathAnalyticsApi = new PathAnalyticsApi();
