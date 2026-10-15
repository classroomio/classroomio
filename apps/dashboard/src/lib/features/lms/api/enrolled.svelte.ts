import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  GetEnrolledRequest,
  EnrolledCounts,
  EnrolledItems,
  EnrolledPagination,
  EnrolledQuery
} from '../utils/types';

/**
 * API class for the student's learning feed: courses and learning paths in one list
 */
class EnrolledApi extends BaseApiWithErrors {
  items = $state<EnrolledItems>([]);
  pagination = $state<EnrolledPagination | null>(null);
  counts = $state<EnrolledCounts>({ inProgress: 0, completed: 0 });

  /**
   * Fetches one page of the student's courses and learning paths, most recently progressed first.
   * Courses inside a path the student is in are summed into that path's item.
   * `status` selects a My Learning tab; `counts` always holds both tab totals.
   * Org ID is automatically added from currentOrg store
   */
  async fetchEnrolled(options?: EnrolledQuery) {
    const query: Record<string, string> = {};
    if (options?.page) query.page = String(options.page);
    if (options?.limit) query.limit = String(options.limit);
    if (options?.status) query.status = options.status;
    if (options?.search) query.search = options.search;

    return this.execute<GetEnrolledRequest>({
      requestFn: () => classroomio.organization['enrolled'].$get({ query }),
      logContext: 'fetching enrolled',
      onSuccess: (response) => {
        this.items = response.data;
        this.pagination = response.pagination;
        this.counts = response.counts;
      }
    });
  }
}

export const enrolledApi = new EnrolledApi();
