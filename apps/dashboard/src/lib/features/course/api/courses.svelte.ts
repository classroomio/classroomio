import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  GetOrgCoursesRequest,
  GetOrgCoursesRequestQuery,
  GetRecommendedCoursesRequest,
  GetUserEnrolledCoursesRequest,
  OrgCourses,
  OrgCoursesPagination,
  OrgCoursesQuery,
  RecommendedCourses,
  UserEnrolledCourses
} from '$features/course/types';

import { SvelteSet } from 'svelte/reactivity';

/**
 * API class for course operations
 */
export class CoursesApi extends BaseApiWithErrors {
  orgCourses = $state<OrgCourses>([]);
  orgCoursesPagination = $state<OrgCoursesPagination | null>(null);
  enrolledCourses = $state<UserEnrolledCourses>([]);
  recommendedCourses = $state<RecommendedCourses>([]);
  recommendedCoursesPagination = $state<{ page: number; limit: number; total: number; totalPages: number } | null>(
    null
  );
  private activeOrgCoursesRequestController: AbortController | null = null;

  cancelOrgCoursesRequest() {
    this.activeOrgCoursesRequestController?.abort();
    this.activeOrgCoursesRequestController = null;
  }

  /** Keeps list UIs in sync after a course is deleted (server data is updated separately on navigation). */
  removeCourseFromLists(courseId: string) {
    this.orgCourses = this.orgCourses.filter((c) => c.id !== courseId);
    this.enrolledCourses = this.enrolledCourses.filter((c) => c.id !== courseId);
    this.recommendedCourses = this.recommendedCourses.filter((c) => c.id !== courseId);
  }

  /**
   * Fetches org courses for the current organization
   * Org ID is automatically added from currentOrg store
   */
  async getOrgCourses(tagSlugs: string[] = []) {
    const allCourses: OrgCourses = [];
    let page = 1;
    let totalPages = 1;
    let lastResponse: Awaited<ReturnType<CoursesApi['getOrgCoursesPage']>> | undefined;

    while (page <= totalPages) {
      const response = await this.getOrgCoursesPage({ page, limit: 100 }, tagSlugs);
      if (!response) {
        return response;
      }

      allCourses.push(...(response.data ?? []));
      totalPages = response.pagination?.totalPages ?? 1;
      lastResponse = response;
      page += 1;
    }

    this.orgCourses = allCourses;
    this.orgCoursesPagination = lastResponse?.pagination ?? null;

    return lastResponse;
  }

  async getOrgCoursesPage(
    query: Partial<OrgCoursesQuery> = {},
    tagSlugs: string[] = [],
    options: { abortPrevious?: boolean; signal?: AbortSignal } = {}
  ) {
    const normalizedTagSlugs = Array.from(new SvelteSet(tagSlugs.map((tag) => tag.trim()).filter(Boolean)));
    const requestQuery: GetOrgCoursesRequestQuery = {
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 20),
      search: query.search,
      tags: normalizedTagSlugs.length > 0 ? normalizedTagSlugs.join(',') : undefined
    };

    let requestSignal = options.signal;
    let requestController: AbortController | null = null;

    if (options.abortPrevious) {
      this.cancelOrgCoursesRequest();
      requestController = new AbortController();
      this.activeOrgCoursesRequestController = requestController;
      requestSignal = requestController.signal;
    }

    const response = await this.execute<GetOrgCoursesRequest>({
      requestFn: () =>
        classroomio.organization.courses.$get(
          {
            query: requestQuery
          },
          {
            init: {
              signal: requestSignal
            }
          }
        ),
      logContext: 'fetching org courses',
      onSuccess: (response) => {
        if (response.data) {
          this.orgCourses = response.data;
        }

        this.orgCoursesPagination = response.pagination;
      }
    });

    if (requestController && this.activeOrgCoursesRequestController === requestController) {
      this.activeOrgCoursesRequestController = null;
    }

    return response;
  }

  /**
   * Fetches user enrolled courses for the current organization
   * Org ID is automatically added from currentOrg store
   */
  async getEnrolledCourses() {
    return this.execute<GetUserEnrolledCoursesRequest>({
      requestFn: () => classroomio.organization.courses.enrolled.$get({}),
      logContext: 'fetching enrolled courses',
      onSuccess: (response) => {
        if (response.data) {
          this.enrolledCourses = response.data;
        }
      }
    });
  }

  /**
   * Fetches recommended courses (published courses user isn't enrolled in) for the current organization
   * Org ID is automatically added from currentOrg store
   */
  async getRecommendedCourses(options?: { limit?: number; page?: number }) {
    const query: Record<string, string> = {};
    if (options?.limit) query.limit = String(options.limit);
    if (options?.page) query.page = String(options.page);

    await this.execute<GetRecommendedCoursesRequest>({
      requestFn: () =>
        classroomio.organization.courses.recommended.$get({
          query
        }),
      logContext: 'fetching recommended courses',
      onSuccess: (response) => {
        if (response.data) {
          this.recommendedCourses = response.data;
        }
        if ('pagination' in response && response.pagination) {
          this.recommendedCoursesPagination = response.pagination as typeof this.recommendedCoursesPagination;
        }
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          console.error('Failed to fetch recommended courses:', result);
          return;
        }
        if ('error' in result) {
          console.error('Failed to fetch recommended courses:', result.error);
        }
      }
    });
  }
}

export const coursesApi = /* @__PURE__ */ new CoursesApi();
