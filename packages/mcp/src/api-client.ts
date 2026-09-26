import type {
  TAutomationCourseTagAssignment,
  TAutomationDraftTagAssignment,
  TAutomationDraftTagParam
} from '@cio/utils/validation/tag';
import type { TCourseContentReorder, TCourseLandingPageUpdate, TCourseUpdateParam } from '@cio/utils/validation/course';
import type {
  TCourseImportCourseParam,
  TCourseImportDraftCreate,
  TCourseImportDraftCreateFromCourse,
  TCourseImportDraftPublish,
  TCourseImportDraftPublishToCourse,
  TCourseImportDraftUpdate
} from '@cio/utils/validation/course-import';
import type {
  TExerciseCreate,
  TExerciseFromTemplate,
  TExerciseGetParam,
  TExerciseListQuery,
  TExerciseUpdate
} from '@cio/utils/validation/exercise';

import type { McpServerConfig } from './config';
import type { TGetOrganizationCoursesQuery } from '@cio/utils/validation/organization';
import type {
  TPublicApiAnalyticsFunnelQuery,
  TPublicApiAnalyticsRangeQuery,
  TPublicApiLoginActivityQuery,
  TPublicApiAddCohortMembers,
  TPublicApiAddCourseToCohort,
  TPublicApiAssignStudentsToCohort,
  TPublicApiCohortNewsfeedQuery,
  TPublicApiCreateCohort,
  TPublicApiCreateCohortGoal,
  TPublicApiCreateCohortNewsfeed,
  TPublicApiCreateCohortNewsfeedComment,
  TPublicApiInviteStudentsToCohort,
  TPublicApiPaginationQuery,
  TPublicApiSetCohortInviteLinkRevoked,
  TPublicApiSetCohortReaction,
  TPublicApiUpdateCohort,
  TPublicApiUpdateCohortGoal,
  TPublicApiUpdateCohortMember,
  TPublicApiUpdateCohortNewsfeed
} from '@cio/utils/validation/public-api';

type ApiSuccess<T> = {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiFailure = {
  success?: false;
  error?: string;
  message?: string;
  code?: string;
  field?: string;
};

type PaginatedResponse<T> = {
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const toPageQuerySuffix = (query: Partial<TPublicApiPaginationQuery>) => {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set('page', String(query.page));
  if (query.limit) searchParams.set('limit', String(query.limit));

  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

const toAnalyticsQuerySuffix = (query: Partial<TPublicApiAnalyticsFunnelQuery>) => {
  const searchParams = new URLSearchParams();
  if (query.days) searchParams.set('days', String(query.days));
  if (query.courseId) searchParams.set('courseId', query.courseId);

  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

export class ClassroomIoApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ClassroomIoApiError';
  }
}

export class ClassroomIoApiClient {
  constructor(private readonly config: McpServerConfig) {}

  async createCourseDraft(payload: TCourseImportDraftCreate) {
    return this.request('/organization/course-import/drafts', {
      method: 'POST',
      body: payload
    });
  }

  async createCourseDraftFromCourse(payload: TCourseImportDraftCreateFromCourse) {
    return this.request('/organization/course-import/drafts/from-course', {
      method: 'POST',
      body: payload
    });
  }

  async getCourseStructure(courseId: TCourseImportCourseParam['courseId']) {
    return this.request(`/organization/course-import/courses/${courseId}/structure`, {
      method: 'GET'
    });
  }

  async updateCourseLandingPage(courseId: TCourseImportCourseParam['courseId'], payload: TCourseLandingPageUpdate) {
    return this.request(`/course/${courseId}/landing-page`, {
      method: 'PUT',
      body: payload
    });
  }

  async reorderCourseContent(courseId: TCourseUpdateParam['courseId'], payload: TCourseContentReorder) {
    return this.request(`/course/${courseId}/content/reorder`, {
      method: 'PUT',
      body: payload
    });
  }

  async getCourseDraft(draftId: string) {
    return this.request(`/organization/course-import/drafts/${draftId}`, {
      method: 'GET'
    });
  }

  async listOrganizationCourses(query: Partial<TGetOrganizationCoursesQuery> = {}) {
    const searchParams = new URLSearchParams();
    if (query.tags) searchParams.set('tags', query.tags);

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/organization/courses${querySuffix}`, {
      method: 'GET'
    });
  }

  async listCourseExercises(courseId: string, query: TExerciseListQuery = {}) {
    const searchParams = new URLSearchParams();
    if (query.lessonId) searchParams.set('lessonId', query.lessonId);
    if (query.sectionId) searchParams.set('sectionId', query.sectionId);

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/course/${courseId}/exercise${querySuffix}`, {
      method: 'GET'
    });
  }

  async getCourseExercise(courseId: string, exerciseId: TExerciseGetParam['exerciseId']) {
    return this.request(`/course/${courseId}/exercise/${exerciseId}`, {
      method: 'GET'
    });
  }

  async createCourseExercise(courseId: string, payload: Omit<TExerciseCreate, 'courseId'>) {
    return this.request(`/course/${courseId}/exercise`, {
      method: 'POST',
      body: {
        ...payload,
        courseId
      }
    });
  }

  async createCourseExerciseFromTemplate(courseId: string, payload: TExerciseFromTemplate) {
    return this.request(`/course/${courseId}/exercise/from-template`, {
      method: 'POST',
      body: payload
    });
  }

  async updateCourseExercise(courseId: string, exerciseId: TExerciseGetParam['exerciseId'], payload: TExerciseUpdate) {
    return this.request(`/course/${courseId}/exercise/${exerciseId}`, {
      method: 'PUT',
      body: payload
    });
  }

  async updateCourseDraft(draftId: string, payload: TCourseImportDraftUpdate) {
    return this.request(`/organization/course-import/drafts/${draftId}`, {
      method: 'PUT',
      body: payload
    });
  }

  async tagCourseDraft(draftId: TAutomationDraftTagParam['draftId'], payload: TAutomationDraftTagAssignment) {
    return this.request(`/organization/course-import/drafts/${draftId}/tags`, {
      method: 'PUT',
      body: payload
    });
  }

  async publishCourseDraft(draftId: string, payload: TCourseImportDraftPublish) {
    return this.request(`/organization/course-import/drafts/${draftId}/publish`, {
      method: 'POST',
      body: payload
    });
  }

  async publishCourseDraftToExistingCourse(draftId: string, payload: TCourseImportDraftPublishToCourse) {
    return this.request(`/organization/course-import/drafts/${draftId}/publish-existing-course`, {
      method: 'POST',
      body: payload
    });
  }

  async tagCourses(payload: TAutomationCourseTagAssignment) {
    return this.request<
      Array<{ courseId: string; tags: Array<{ id: string; name: string; slug: string; color: string }> }>
    >('/organization/tags/courses/assign', {
      method: 'PUT',
      body: payload
    });
  }

  // ─── Cohorts (public API) ────────────────────────────────────────────────

  async listCohorts(query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/cohorts${toPageQuerySuffix(query)}`, { method: 'GET' });
  }

  async createCohort(payload: TPublicApiCreateCohort) {
    return this.request('/public-api/v1/cohorts', {
      method: 'POST',
      body: payload
    });
  }

  async getCohort(cohortId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}`, { method: 'GET' });
  }

  async updateCohort(cohortId: string, payload: TPublicApiUpdateCohort) {
    return this.request(`/public-api/v1/cohorts/${cohortId}`, {
      method: 'PUT',
      body: payload
    });
  }

  async deleteCohort(cohortId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}`, { method: 'DELETE' });
  }

  async listCohortMembers(cohortId: string, query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/cohorts/${cohortId}/members${toPageQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  async addCohortMembers(cohortId: string, payload: TPublicApiAddCohortMembers) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/members`, {
      method: 'POST',
      body: payload
    });
  }

  async updateCohortMember(cohortId: string, memberId: string, payload: TPublicApiUpdateCohortMember) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/members/${memberId}`, {
      method: 'PUT',
      body: payload
    });
  }

  async deleteCohortMember(cohortId: string, memberId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/members/${memberId}`, { method: 'DELETE' });
  }

  async listCohortCourses(cohortId: string, query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/cohorts/${cohortId}/courses${toPageQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  async addCohortCourse(cohortId: string, payload: TPublicApiAddCourseToCohort) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/courses`, {
      method: 'POST',
      body: payload
    });
  }

  async removeCohortCourse(cohortId: string, courseId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/courses/${courseId}`, { method: 'DELETE' });
  }

  async listCohortNewsfeed(cohortId: string, query: Partial<TPublicApiCohortNewsfeedQuery> = {}) {
    const searchParams = new URLSearchParams();
    if (query.cursor) searchParams.set('cursor', query.cursor);
    if (query.limit) searchParams.set('limit', String(query.limit));

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/public-api/v1/cohorts/${cohortId}/newsfeed${querySuffix}`, { method: 'GET' });
  }

  async createCohortNewsfeedPost(cohortId: string, payload: TPublicApiCreateCohortNewsfeed) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/newsfeed`, {
      method: 'POST',
      body: payload
    });
  }

  async updateCohortNewsfeedPost(cohortId: string, feedId: string, payload: TPublicApiUpdateCohortNewsfeed) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/newsfeed/${feedId}`, {
      method: 'PUT',
      body: payload
    });
  }

  async setCohortNewsfeedReaction(cohortId: string, feedId: string, payload: TPublicApiSetCohortReaction) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/newsfeed/${feedId}/react`, {
      method: 'PUT',
      body: payload
    });
  }

  async deleteCohortNewsfeedPost(cohortId: string, feedId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/newsfeed/${feedId}`, { method: 'DELETE' });
  }

  async listCohortNewsfeedComments(cohortId: string, feedId: string, query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(
      `/public-api/v1/cohorts/${cohortId}/newsfeed/${feedId}/comments${toPageQuerySuffix(query)}`,
      { method: 'GET' }
    );
  }

  async createCohortNewsfeedComment(cohortId: string, feedId: string, payload: TPublicApiCreateCohortNewsfeedComment) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/newsfeed/${feedId}/comment`, {
      method: 'POST',
      body: payload
    });
  }

  async deleteCohortNewsfeedComment(cohortId: string, feedId: string, commentId: number) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/newsfeed/${feedId}/comment/${commentId}`, {
      method: 'DELETE'
    });
  }

  async listCohortGoals(cohortId: string, query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/cohorts/${cohortId}/goals${toPageQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  async createCohortGoal(cohortId: string, payload: TPublicApiCreateCohortGoal) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/goals`, {
      method: 'POST',
      body: payload
    });
  }

  async getCohortGoal(cohortId: string, goalId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/goals/${goalId}`, { method: 'GET' });
  }

  async updateCohortGoal(cohortId: string, goalId: string, payload: TPublicApiUpdateCohortGoal) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/goals/${goalId}`, {
      method: 'PUT',
      body: payload
    });
  }

  async archiveCohortGoal(cohortId: string, goalId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/goals/${goalId}/archive`, { method: 'POST' });
  }

  async deleteCohortGoal(cohortId: string, goalId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/goals/${goalId}`, { method: 'DELETE' });
  }

  async evaluateCohortGoal(cohortId: string, goalId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/goals/${goalId}/evaluate`, { method: 'POST' });
  }

  async evaluateAllCohortGoals(cohortId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/goals/evaluate-all`, { method: 'POST' });
  }

  async getOrgGoalsOverview(query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/cohorts/goals/overview${toPageQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  async listMyEnrolledCohorts(query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/cohorts/enrolled${toPageQuerySuffix(query)}`, { method: 'GET' });
  }

  async listMyCohortGoals(query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/cohorts/my/goals${toPageQuerySuffix(query)}`, { method: 'GET' });
  }

  async inviteStudentsToCohort(cohortId: string, payload: TPublicApiInviteStudentsToCohort) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/invite`, { method: 'POST', body: payload });
  }

  async assignStudentsToCohort(cohortId: string, payload: TPublicApiAssignStudentsToCohort) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/invite/assign`, { method: 'POST', body: payload });
  }

  async getCohortInviteLink(cohortId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/invite-link`, { method: 'GET' });
  }

  async createCohortInviteLink(cohortId: string) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/invite-link`, { method: 'POST' });
  }

  async setCohortInviteLinkRevoked(cohortId: string, payload: TPublicApiSetCohortInviteLinkRevoked) {
    return this.request(`/public-api/v1/cohorts/${cohortId}/invite-link`, { method: 'PATCH', body: payload });
  }

  async getOrgAnalyticsOverview() {
    return this.request('/public-api/v1/analytics/overview', { method: 'GET' });
  }

  async getOrgTrafficAnalytics(query: Partial<TPublicApiAnalyticsRangeQuery> = {}) {
    return this.request(`/public-api/v1/analytics/traffic${toAnalyticsQuerySuffix(query)}`, { method: 'GET' });
  }

  async getOrgCountryAnalytics(query: Partial<TPublicApiAnalyticsRangeQuery> = {}) {
    return this.request(`/public-api/v1/analytics/countries${toAnalyticsQuerySuffix(query)}`, { method: 'GET' });
  }

  async getOrgFunnelAnalytics(query: Partial<TPublicApiAnalyticsFunnelQuery> = {}) {
    return this.request(`/public-api/v1/analytics/funnel${toAnalyticsQuerySuffix(query)}`, { method: 'GET' });
  }

  async getOrgCourseTypeAnalytics(query: Partial<TPublicApiAnalyticsRangeQuery> = {}) {
    return this.request(`/public-api/v1/analytics/course-types${toAnalyticsQuerySuffix(query)}`, { method: 'GET' });
  }

  async getOrgTopCoursesAnalytics(query: Partial<TPublicApiAnalyticsRangeQuery> = {}) {
    return this.request(`/public-api/v1/analytics/top-courses${toAnalyticsQuerySuffix(query)}`, { method: 'GET' });
  }

  async getOrgLoginActivity(query: Partial<TPublicApiLoginActivityQuery> = {}) {
    return this.request(`/public-api/v1/analytics/login-activity${toAnalyticsQuerySuffix(query)}`, { method: 'GET' });
  }

  async getOrgComplianceOverview() {
    return this.request('/public-api/v1/analytics/compliance', { method: 'GET' });
  }

  async listOrgComplianceLearners(query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/analytics/compliance/learners${toPageQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  async getLearnerAnalytics(profileId: string) {
    return this.request(`/public-api/v1/analytics/learners/${profileId}`, { method: 'GET' });
  }

  async getCourseAnalytics(courseId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/analytics`, { method: 'GET' });
  }

  async listCourseAnalyticsStudents(courseId: string, query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/analytics/students${toPageQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  private async requestRaw<TResponse>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
    }
  ): Promise<ApiSuccess<TResponse>> {
    const response = await fetch(new URL(path, this.config.CLASSROOMIO_API_URL), {
      method: options.method,
      headers: {
        Authorization: `Bearer ${this.config.CLASSROOMIO_API_KEY}`,
        'content-type': 'application/json',
        'user-agent': this.config.CLASSROOMIO_USER_AGENT
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const json = (await response.json().catch(() => null)) as ApiSuccess<TResponse> | ApiFailure | null;

    if (!response.ok) {
      const errorPayload = json as ApiFailure | null;
      throw new ClassroomIoApiError(
        errorPayload?.error ?? errorPayload?.message ?? `ClassroomIO request failed with status ${response.status}`,
        response.status,
        errorPayload?.code,
        errorPayload?.field
      );
    }

    if (!json || typeof json !== 'object' || !('success' in json) || !json.success) {
      throw new ClassroomIoApiError('ClassroomIO returned an invalid response payload', response.status);
    }

    return json;
  }

  private async request<TResponse>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
    }
  ): Promise<TResponse> {
    const json = await this.requestRaw<TResponse>(path, options);
    return json.data;
  }

  private async requestPaginated<TResponse>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
    }
  ): Promise<PaginatedResponse<TResponse>> {
    const json = await this.requestRaw<TResponse>(path, options);
    if (!json.pagination) {
      throw new ClassroomIoApiError('ClassroomIO returned a response without pagination metadata', 502);
    }

    return { data: json.data, pagination: json.pagination };
  }
}
