import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { GetPathAnalyticsRequest, LearningPathAnalytics } from '../utils/types';

class PathAnalyticsApi extends BaseApiWithErrors {
  analytics = $state<LearningPathAnalytics | null>(null);
  isLoadingAnalytics = $state(false);
  private requestedPathId: string | null = null;
  private analyticsRequestSeq = 0;

  async getAnalytics(pathId: string) {
    if (this.requestedPathId !== pathId) {
      this.analytics = null;
    }
    this.requestedPathId = pathId;
    const seq = ++this.analyticsRequestSeq;
    this.isLoadingAnalytics = true;

    try {
      await this.execute<GetPathAnalyticsRequest>({
        requestFn: () =>
          classroomio['learning-path'][':pathId']['analytics'].$get({
            param: { pathId }
          }),
        logContext: 'getting path analytics',
        onSuccess: (result) => {
          if (this.requestedPathId === pathId && seq === this.analyticsRequestSeq) {
            this.analytics = result.data;
          }
        }
      });
    } finally {
      if (this.requestedPathId === pathId && seq === this.analyticsRequestSeq) {
        this.isLoadingAnalytics = false;
      }
    }
  }
}

export const pathAnalyticsApi = new PathAnalyticsApi();
