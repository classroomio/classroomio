import { Readable } from 'node:stream';
import type {
  TAutomationCourseTagAssignment,
  TAutomationDraftTagAssignment,
  TAutomationDraftTagParam
} from '@cio/utils/validation/tag';
import { pickTagColor, slugifyTagValue } from '@cio/utils/validation/tag';
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
  TPublicApiAddCohortMembers,
  TPublicApiAddCourseMember,
  TPublicApiAddCourseToCohort,
  TPublicApiAssignStudentsToCohort,
  TPublicApiCertificateFileFormat,
  TPublicApiCohortNewsfeedQuery,
  TPublicApiCourseInvitesQuery,
  TPublicApiCourseMemberAnalyticsQuery,
  TPublicApiCourseAnalyticsQuery,
  TPublicApiCourseAnalyticsStudentsQuery,
  TPublicApiCourseMembersQuery,
  TPublicApiCreateAsset,
  TPublicApiCreateCohort,
  TPublicApiCreateCohortGoal,
  TPublicApiCreateCohortNewsfeed,
  TPublicApiCreateCohortNewsfeedComment,
  TPublicApiCreateCourseInvite,
  TPublicApiCreateLesson,
  TPublicApiInviteStudentsToCohort,
  TPublicApiOrgAnalyticsQuery,
  TPublicApiListCourseCertificatesQuery,
  TPublicApiPaginationQuery,
  TPublicApiSetCohortInviteLinkRevoked,
  TPublicApiSetCohortReaction,
  TPublicApiCreateTag,
  TPublicApiCreateTagGroup,
  TPublicApiTagsQuery,
  TPublicApiUpdateTag,
  TPublicApiUpdateTagGroup,
  TPublicApiUpdateCohort,
  TPublicApiUpdateCohortGoal,
  TPublicApiUpdateCohortMember,
  TPublicApiUpdateCohortNewsfeed,
  TPublicApiUpdateCourseCertificate,
  TPublicApiUpdateCourseMember,
  TPublicApiUpdateLesson
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
  meta?: unknown;
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

type TCourseTag = { id: string; name: string; slug: string; color: string };
type TTagGroup = { id: string; slug: string; tags: TCourseTag[] };

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

const toPageQuerySuffix = (query: Partial<TPublicApiPaginationQuery>) => {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set('page', String(query.page));
  if (query.limit) searchParams.set('limit', String(query.limit));

  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

const toAnalyticsQuerySuffix = (query: Partial<TPublicApiOrgAnalyticsQuery | TPublicApiCourseAnalyticsQuery>) => {
  const searchParams = new URLSearchParams();
  if (query.include?.length) searchParams.set('include', query.include.join(','));
  if (query.days) searchParams.set('days', String(query.days));
  if ('limit' in query && query.limit) searchParams.set('limit', String(query.limit));

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

  /** Matches tags by slug, creating missing ones (and their group) before setting each course's tagIds. */
  async tagCourses(payload: TAutomationCourseTagAssignment) {
    const groupName = payload.groupName?.trim() || 'Automation';
    const groups = await this.listAllTagGroups();
    const tagIds = await this.ensureTagIds(groups, payload.tagNames, groupName);
    const results: Array<{ courseId: string; tags: TCourseTag[] }> = [];

    for (const courseId of new Set(payload.courseIds)) {
      const existingIds =
        payload.mode === 'merge'
          ? (await this.listAllTagGroups(courseId)).flatMap((group) => group.tags.map((tag) => tag.id))
          : [];
      const course = await this.setCourseTags(courseId, [...new Set([...existingIds, ...tagIds])]);

      results.push({ courseId, tags: course.tags });
    }

    return results;
  }

  async setCourseTags(courseId: string, tagIds: string[]) {
    return this.request<{ tags: TCourseTag[] }>(`/public-api/v1/courses/${encodeURIComponent(courseId)}`, {
      method: 'PUT',
      body: { tagIds }
    });
  }

  async createTag(payload: TPublicApiCreateTag) {
    return this.request<{ id: string }>('/public-api/v1/tags', { method: 'POST', body: payload });
  }

  async updateTag(tagId: string, payload: TPublicApiUpdateTag) {
    return this.request(`/public-api/v1/tags/${encodeURIComponent(tagId)}`, { method: 'PUT', body: payload });
  }

  async createTagGroup(payload: TPublicApiCreateTagGroup) {
    return this.request<{ id: string }>('/public-api/v1/tags/groups', { method: 'POST', body: payload });
  }

  async updateTagGroup(groupId: string, payload: TPublicApiUpdateTagGroup) {
    return this.request(`/public-api/v1/tags/groups/${encodeURIComponent(groupId)}`, { method: 'PUT', body: payload });
  }

  async listTags(query: Partial<TPublicApiTagsQuery> = {}) {
    const searchParams = new URLSearchParams();
    if (query.page) searchParams.set('page', String(query.page));
    if (query.limit) searchParams.set('limit', String(query.limit));
    if (query.courseId) searchParams.set('courseId', query.courseId);

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.requestPaginated<TTagGroup[]>(`/public-api/v1/tags${querySuffix}`, { method: 'GET' });
  }

  private async listAllTagGroups(courseId?: string) {
    const groups: TTagGroup[] = [];

    for (let page = 1; ; page++) {
      const result = await this.listTags({ page, limit: 100, courseId });
      groups.push(...result.data);

      if (page >= result.pagination.totalPages) return groups;
    }
  }

  private async ensureTagIds(groups: TTagGroup[], tagNames: string[], groupName: string) {
    const tagsBySlug = new Map(groups.flatMap((group) => group.tags.map((tag) => [tag.slug, tag.id] as const)));
    let groupId = groups.find((group) => group.slug === slugifyTagValue(groupName))?.id;
    const tagIds = new Set<string>();

    for (const rawName of tagNames) {
      const name = rawName.trim();
      const slug = slugifyTagValue(name);
      const existingId = tagsBySlug.get(slug);
      if (existingId) {
        tagIds.add(existingId);
        continue;
      }

      groupId ??= (await this.createTagGroup({ name: groupName })).id;
      const created = await this.createTag({ name, groupId, color: pickTagColor(name) });
      tagsBySlug.set(slug, created.id);
      tagIds.add(created.id);
    }

    return [...tagIds];
  }

  async getCourseCertificate(courseId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/certificate`, { method: 'GET' });
  }

  async updateCourseCertificate(courseId: string, payload: TPublicApiUpdateCourseCertificate) {
    return this.request(`/public-api/v1/courses/${courseId}/certificate`, {
      method: 'PATCH',
      body: payload
    });
  }

  async listCourseCertificates(courseId: string, query: Partial<TPublicApiListCourseCertificatesQuery> = {}) {
    const searchParams = new URLSearchParams();
    if (query.page) searchParams.set('page', String(query.page));
    if (query.limit) searchParams.set('limit', String(query.limit));
    if (query.search) searchParams.set('search', query.search);

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/certificates${querySuffix}`, {
      method: 'GET'
    });
  }

  async downloadCourseCertificate(courseId: string, memberId: string, format: TPublicApiCertificateFileFormat) {
    const response = await this.send(
      `/public-api/v1/courses/${courseId}/certificates/${memberId}/download?format=${format}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as ApiFailure | null;
      throw toApiError(response.status, errorPayload);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') ?? 'application/octet-stream';

    return { base64: bytes.toString('base64'), mimeType };
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

  async getOrgAnalytics(query: Partial<TPublicApiOrgAnalyticsQuery> = {}) {
    return this.requestWithMeta(`/public-api/v1/analytics${toAnalyticsQuerySuffix(query)}`);
  }

  async listComplianceLearners(query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/analytics/compliance/learners${toPageQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  async getLearnerAnalytics(profileId: string) {
    return this.request(`/public-api/v1/analytics/learners/${profileId}`, { method: 'GET' });
  }

  async getCourseAnalytics(courseId: string, query: Partial<TPublicApiCourseAnalyticsQuery> = {}) {
    return this.requestWithMeta(`/public-api/v1/courses/${courseId}/analytics${toAnalyticsQuerySuffix(query)}`);
  }

  async listCourseAnalyticsStudents(courseId: string, query: Partial<TPublicApiCourseAnalyticsStudentsQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/analytics/students${toPageQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  private send(path: string, options: RequestOptions) {
    return fetch(new URL(path, this.config.CLASSROOMIO_API_URL), {
      method: options.method,
      headers: {
        Authorization: `Bearer ${this.config.CLASSROOMIO_API_KEY}`,
        'content-type': 'application/json',
        'user-agent': this.config.CLASSROOMIO_USER_AGENT
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  }

  private async requestRaw<TResponse>(path: string, options: RequestOptions): Promise<ApiSuccess<TResponse>> {
    const response = await this.send(path, options);

    const json = (await response.json().catch(() => null)) as ApiSuccess<TResponse> | ApiFailure | null;

    if (!response.ok) {
      throw toApiError(response.status, json as ApiFailure | null);
    }

    if (!json || typeof json !== 'object' || !('success' in json) || !json.success) {
      throw new ClassroomIoApiError('ClassroomIO returned an invalid response payload', response.status);
    }

    return json;
  }

  // ─── Media and lessons (public API) ──────────────────────────────────────

  async createAssetUpload(payload: TPublicApiCreateAsset) {
    return this.request<{ assetId: string; uploadUrl: string; expiresAt: string }>('/public-api/v1/assets', {
      method: 'POST',
      body: payload
    });
  }

  async createLesson(courseId: string, payload: Omit<TPublicApiCreateLesson, never>) {
    return this.request(`/public-api/v1/courses/${encodeURIComponent(courseId)}/lessons`, {
      method: 'POST',
      body: payload
    });
  }

  async updateLesson(courseId: string, lessonId: string, payload: Omit<TPublicApiUpdateLesson, never>) {
    return this.request(
      `/public-api/v1/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
      { method: 'PUT', body: payload }
    );
  }

  /** Sends bytes straight to storage. No ClassroomIO header — the URL's signature is the auth. */
  /**
   * Streams a file to storage.
   *
   * `content-length` is set explicitly for two reasons: a stream body would
   * otherwise be sent chunked, and the presigned URL signs that header — so the
   * request must declare exactly the size the reservation was checked against.
   */
  async putToPresignedUrl(
    presignedUrl: string,
    body: Readable,
    contentType: string,
    contentLength: number
  ): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'content-type': contentType,
        'content-length': String(contentLength)
      },
      body: Readable.toWeb(body) as unknown as BodyInit,
      // Required by undici to send a streaming request body.
      duplex: 'half'
    } as RequestInit & { duplex: 'half' });

    if (!response.ok) {
      throw new ClassroomIoApiError(`Upload to storage failed with status ${response.status}`, response.status);
    }
  }

  private async request<TResponse>(path: string, options: RequestOptions): Promise<TResponse> {
    const json = await this.requestRaw<TResponse>(path, options);
    return json.data;
  }

  private async requestPaginated<TResponse>(
    path: string,
    options: RequestOptions
  ): Promise<PaginatedResponse<TResponse>> {
    const json = await this.requestRaw<TResponse>(path, options);
    if (!json.pagination) {
      throw new ClassroomIoApiError('ClassroomIO returned a response without pagination metadata', 502);
    }

    return { data: json.data, pagination: json.pagination };
  }

  private async requestWithMeta<TResponse>(path: string) {
    const json = await this.requestRaw<TResponse>(path, { method: 'GET' });
    return { data: json.data, meta: json.meta };
  }
}

function toApiError(status: number, errorPayload: ApiFailure | null) {
  return new ClassroomIoApiError(
    errorPayload?.error ?? errorPayload?.message ?? `ClassroomIO request failed with status ${status}`,
    status,
    errorPayload?.code,
    errorPayload?.field
  );
}
