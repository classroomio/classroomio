import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  EarnedCertificates,
  EarnedCertificatesPagination,
  EarnedCertificatesQuery,
  GetEarnedCertificatesRequest
} from '../utils/types';

/**
 * API class for the student's certificates: course and learning path certificates in one list
 */
class EarnedCertificatesApi extends BaseApiWithErrors {
  items = $state<EarnedCertificates | null>(null);
  pagination = $state<EarnedCertificatesPagination | null>(null);
  private requestSeq = 0;

  /**
   * Fetches one page of the student's downloadable certificates, newest first.
   * Only the newest request writes state, so a slow earlier search never overwrites a later one.
   * Org ID is automatically added from currentOrg store
   */
  async fetchCertificates(options: EarnedCertificatesQuery = {}) {
    const query: Record<string, string> = {};
    if (options.page) query.page = String(options.page);
    if (options.limit) query.limit = String(options.limit);
    if (options.search) query.search = options.search;

    const seq = ++this.requestSeq;

    return this.execute<GetEarnedCertificatesRequest>({
      requestFn: () => classroomio.organization.certificates.$get({ query }),
      logContext: 'fetching earned certificates',
      onSuccess: (response) => {
        if (seq !== this.requestSeq) return;

        this.items = response.data;
        this.pagination = response.pagination;
      }
    });
  }
}

export const earnedCertificatesApi = new EarnedCertificatesApi();
