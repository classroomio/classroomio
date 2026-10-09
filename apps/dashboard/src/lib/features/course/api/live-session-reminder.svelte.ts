import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';

import type {
  ListLiveSessionReminderDeliveriesRequest,
  LiveSessionReminderDeliveriesPagination,
  LiveSessionReminderDelivery
} from '../utils/types';

const DELIVERIES_PAGE_SIZE = 20;

/**
 * API class for a course's live session reminder delivery log
 */
export class LiveSessionReminderApi extends BaseApiWithErrors {
  deliveries = $state<LiveSessionReminderDelivery[] | null>(null);
  pagination = $state<LiveSessionReminderDeliveriesPagination | null>(null);
  private requestSeq = 0;

  async listDeliveries(courseId: string, page = 1) {
    const requestSeq = ++this.requestSeq;

    await this.execute<ListLiveSessionReminderDeliveriesRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['live-session-reminders'].deliveries.$get({
          param: { courseId },
          query: { page: String(page), limit: String(DELIVERIES_PAGE_SIZE) }
        }),
      logContext: 'listing live session reminder deliveries',
      onSuccess: (response) => {
        if (requestSeq !== this.requestSeq) return;

        this.deliveries = response.data;
        this.pagination = response.pagination;
        this.success = true;
      },
      onError: (result) => {
        if (requestSeq !== this.requestSeq) return;

        this.deliveries ??= [];
        if (typeof result === 'string') {
          snackbar.error('course.navItem.settings.live_session_reminders.log.load_error');
        }
      }
    });
  }

  reset() {
    this.requestSeq += 1;
    this.deliveries = null;
    this.pagination = null;
  }
}

export const liveSessionReminderApi = /* @__PURE__ */ new LiveSessionReminderApi();
