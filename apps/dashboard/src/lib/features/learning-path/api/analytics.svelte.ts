import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { GetPathAnalyticsRequest, LearningPathAnalytics } from '../utils/types';

class PathAnalyticsApi extends BaseApiWithErrors {
  analytics = $state<LearningPathAnalytics | null>(null);
  isLoadingAnalytics = $state(false);
  private requestedPathId: string | null = null;

  async getAnalytics(pathId: string) {
    if (this.requestedPathId !== pathId) {
      this.analytics = null;
    }
    this.requestedPathId = pathId;
    this.isLoadingAnalytics = true;

    try {
      await this.execute<GetPathAnalyticsRequest>({
        requestFn: () =>
          classroomio['learning-path'][':pathId']['analytics'].$get({
            param: { pathId }
          }),
        logContext: 'getting path analytics',
        onSuccess: (result) => {
          if (this.requestedPathId === pathId) {
            this.analytics = result.data;
          }
        }
      });
    } finally {
      if (this.requestedPathId === pathId) {
        this.isLoadingAnalytics = false;
      }
    }
  }
}

export const pathAnalyticsApi = new PathAnalyticsApi();
