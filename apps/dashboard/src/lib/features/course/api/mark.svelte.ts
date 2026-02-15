import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { GetMarksRequest, Marks } from '../utils/types';

import { snackbar } from '$features/ui/snackbar/store';

/**
 * API class for mark operations
 */
export class MarkApi extends BaseApiWithErrors {
  data = $state<Marks | null>(null);

  /**
   * Gets marks for a course
   */
  async getMarks(courseId: string) {
    await this.execute<GetMarksRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].mark.$get({
          param: { courseId }
        }),
      logContext: 'fetching marks',
      onSuccess: (response) => {
        if (response.data) {
          this.data = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch marks');
        }
      }
    });
  }
}

export const markApi = new MarkApi();
