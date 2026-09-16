import type {
  TAutomationCourseTagAssignment,
  TAutomationDraftTagAssignment,
  TAutomationDraftTagParam
} from '@cio/utils/validation/tag';
import type {
  TAddCourseMembers,
  TCourseContentReorder,
  TCourseLandingPageUpdate,
  TCourseMembersQuery,
  TCourseUpdateParam,
  TCourseUserAnalyticsQuery,
  TCreateCourseInvite,
  TUpdateCourseMember
} from '@cio/utils/validation/course';
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
import type { TToggleInviteLink } from '@cio/utils/validation/invite-link';

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success?: false;
  error?: string;
  message?: string;
  code?: string;
  field?: string;
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
    return this.request(`/organization/course-import/courses/${encodeURIComponent(courseId)}/structure`, {
      method: 'GET'
    });
  }

  async updateCourseLandingPage(courseId: TCourseImportCourseParam['courseId'], payload: TCourseLandingPageUpdate) {
    return this.request(`/course/${encodeURIComponent(courseId)}/landing-page`, {
      method: 'PUT',
      body: payload
    });
  }

  async reorderCourseContent(courseId: TCourseUpdateParam['courseId'], payload: TCourseContentReorder) {
    return this.request(`/course/${encodeURIComponent(courseId)}/content/reorder`, {
      method: 'PUT',
      body: payload
    });
  }

  async getCourseDraft(draftId: string) {
    return this.request(`/organization/course-import/drafts/${encodeURIComponent(draftId)}`, {
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
    return this.request(`/course/${encodeURIComponent(courseId)}/exercise${querySuffix}`, {
      method: 'GET'
    });
  }

  async getCourseExercise(courseId: string, exerciseId: TExerciseGetParam['exerciseId']) {
    return this.request(`/course/${encodeURIComponent(courseId)}/exercise/${encodeURIComponent(exerciseId)}`, {
      method: 'GET'
    });
  }

  async createCourseExercise(courseId: string, payload: Omit<TExerciseCreate, 'courseId'>) {
    return this.request(`/course/${encodeURIComponent(courseId)}/exercise`, {
      method: 'POST',
      body: {
        ...payload,
        courseId
      }
    });
  }

  async createCourseExerciseFromTemplate(courseId: string, payload: TExerciseFromTemplate) {
    return this.request(`/course/${encodeURIComponent(courseId)}/exercise/from-template`, {
      method: 'POST',
      body: payload
    });
  }

  async updateCourseExercise(courseId: string, exerciseId: TExerciseGetParam['exerciseId'], payload: TExerciseUpdate) {
    return this.request(`/course/${encodeURIComponent(courseId)}/exercise/${encodeURIComponent(exerciseId)}`, {
      method: 'PUT',
      body: payload
    });
  }

  async updateCourseDraft(draftId: string, payload: TCourseImportDraftUpdate) {
    return this.request(`/organization/course-import/drafts/${encodeURIComponent(draftId)}`, {
      method: 'PUT',
      body: payload
    });
  }

  async tagCourseDraft(draftId: TAutomationDraftTagParam['draftId'], payload: TAutomationDraftTagAssignment) {
    return this.request(`/organization/course-import/drafts/${encodeURIComponent(draftId)}/tags`, {
      method: 'PUT',
      body: payload
    });
  }

  async publishCourseDraft(draftId: string, payload: TCourseImportDraftPublish) {
    return this.request(`/organization/course-import/drafts/${encodeURIComponent(draftId)}/publish`, {
      method: 'POST',
      body: payload
    });
  }

  async publishCourseDraftToExistingCourse(draftId: string, payload: TCourseImportDraftPublishToCourse) {
    return this.request(`/organization/course-import/drafts/${encodeURIComponent(draftId)}/publish-existing-course`, {
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

  async listCourseMembers(courseId: string, query: Partial<TCourseMembersQuery> = {}) {
    const searchParams = new URLSearchParams();
    if (query.page) searchParams.set('page', String(query.page));
    if (query.limit) searchParams.set('limit', String(query.limit));
    if (query.search) searchParams.set('search', query.search);
    if (query.roleId) searchParams.set('roleId', String(query.roleId));

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/course/${encodeURIComponent(courseId)}/members${querySuffix}`, {
      method: 'GET'
    });
  }

  async addCourseMembers(courseId: string, payload: TAddCourseMembers) {
    return this.request(`/course/${encodeURIComponent(courseId)}/members`, {
      method: 'POST',
      body: payload
    });
  }

  async updateCourseMember(courseId: string, memberId: string, payload: TUpdateCourseMember) {
    return this.request(`/course/${encodeURIComponent(courseId)}/members/${encodeURIComponent(memberId)}`, {
      method: 'PUT',
      body: payload
    });
  }

  async deleteCourseMember(courseId: string, memberId: string) {
    return this.request(`/course/${encodeURIComponent(courseId)}/members/${encodeURIComponent(memberId)}`, {
      method: 'DELETE'
    });
  }

  async resetCourseMemberProgress(courseId: string, memberId: string) {
    return this.request(`/course/${encodeURIComponent(courseId)}/members/${encodeURIComponent(memberId)}/reset-progress`, {
      method: 'POST'
    });
  }

  async getCourseMemberAnalytics(
    courseId: string,
    userId: string,
    query: Partial<TCourseUserAnalyticsQuery> = {}
  ) {
    const searchParams = new URLSearchParams();
    if (query.includeProgressImpact !== undefined) {
      searchParams.set('includeProgressImpact', String(query.includeProgressImpact));
    }

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/course/${encodeURIComponent(courseId)}/members/${encodeURIComponent(userId)}/analytics${querySuffix}`, {
      method: 'GET'
    });
  }

  async listCourseInvites(courseId: string) {
    return this.request(`/course/${encodeURIComponent(courseId)}/invites`, {
      method: 'GET'
    });
  }

  async createCourseInvite(courseId: string, payload: TCreateCourseInvite) {
    return this.request(`/course/${encodeURIComponent(courseId)}/invites`, {
      method: 'POST',
      body: payload
    });
  }

  async getCourseInviteLink(courseId: string) {
    return this.request(`/course/${encodeURIComponent(courseId)}/invites/link`, {
      method: 'GET'
    });
  }

  async createCourseInviteLink(courseId: string) {
    return this.request(`/course/${encodeURIComponent(courseId)}/invites/link`, {
      method: 'POST'
    });
  }

  async toggleCourseInviteLink(courseId: string, payload: TToggleInviteLink) {
    return this.request(`/course/${encodeURIComponent(courseId)}/invites/link`, {
      method: 'PATCH',
      body: payload
    });
  }

  async revokeCourseInvite(courseId: string, inviteId: string) {
    return this.request(`/course/${encodeURIComponent(courseId)}/invites/${encodeURIComponent(inviteId)}/revoke`, {
      method: 'POST'
    });
  }

  async getCourseInviteAudit(courseId: string, inviteId: string) {
    return this.request(`/course/${encodeURIComponent(courseId)}/invites/${encodeURIComponent(inviteId)}/audit`, {
      method: 'GET'
    });
  }

  private async request<TResponse>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
    }
  ): Promise<TResponse> {
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

    return json.data;
  }
}
