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
  TPublicApiAddCourseMember,
  TPublicApiCourseMemberAnalyticsQuery,
  TPublicApiCourseMembersQuery,
  TPublicApiCourseInvitesQuery,
  TPublicApiCreateCourseInvite,
  TPublicApiUpdateCourseMember
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

  // ─── Course Members (public API) ────────────────────────────────────────

  async listCourseMembers(courseId: string, query: Partial<TPublicApiCourseMembersQuery> = {}) {
    const searchParams = new URLSearchParams();
    if (query.page) searchParams.set('page', String(query.page));
    if (query.limit) searchParams.set('limit', String(query.limit));
    if (query.search) searchParams.set('search', query.search);
    if (query.roleId) searchParams.set('roleId', String(query.roleId));

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/members${querySuffix}`, { method: 'GET' });
  }

  async addCourseMember(courseId: string, payload: TPublicApiAddCourseMember) {
    return this.request(`/public-api/v1/courses/${courseId}/members`, {
      method: 'POST',
      body: payload
    });
  }

  async getCourseMember(courseId: string, memberId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/members/${memberId}`, { method: 'GET' });
  }

  async updateCourseMember(courseId: string, memberId: string, payload: TPublicApiUpdateCourseMember) {
    return this.request(`/public-api/v1/courses/${courseId}/members/${memberId}`, {
      method: 'PUT',
      body: payload
    });
  }

  async deleteCourseMember(courseId: string, memberId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/members/${memberId}`, { method: 'DELETE' });
  }

  async resetCourseMemberProgress(courseId: string, memberId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/members/${memberId}/reset-progress`, {
      method: 'POST'
    });
  }

  async getCourseMemberAnalytics(
    courseId: string,
    memberId: string,
    query: Partial<TPublicApiCourseMemberAnalyticsQuery> = {}
  ) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) searchParams.set(key, String(value));
    }

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/public-api/v1/courses/${courseId}/members/${memberId}/analytics${querySuffix}`, {
      method: 'GET'
    });
  }

  // ─── Course Invites (public API) ────────────────────────────────────────

  async listCourseInvites(courseId: string, query: Partial<TPublicApiCourseInvitesQuery> = {}) {
    const searchParams = new URLSearchParams();
    if (query.page) searchParams.set('page', String(query.page));
    if (query.limit) searchParams.set('limit', String(query.limit));

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/invites${querySuffix}`, { method: 'GET' });
  }

  async createCourseInvite(courseId: string, payload: TPublicApiCreateCourseInvite) {
    return this.request(`/public-api/v1/courses/${courseId}/invites`, {
      method: 'POST',
      body: payload
    });
  }

  async revokeCourseInvite(courseId: string, inviteId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/invites/${inviteId}/revoke`, { method: 'POST' });
  }

  private async requestRaw<TResponse>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
    }
  ): Promise<TResponse> {
    const json = await this.requestRaw<TResponse>(path, options);
    return json.data;
  }

  private async requestPaginated<TResponse>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
