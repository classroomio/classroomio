import { Readable } from 'node:stream';
import type {
  TAutomationCourseTagAssignment,
  TAutomationDraftTagAssignment,
  TAutomationDraftTagParam
} from '@cio/utils/validation/tag';
import type { TCourseLandingPageUpdate } from '@cio/utils/validation/course';
import type {
  TCourseImportCourseParam,
  TCourseImportDraftCreate,
  TCourseImportDraftCreateFromCourse,
  TCourseImportDraftPublish,
  TCourseImportDraftPublishToCourse,
  TCourseImportDraftUpdate
} from '@cio/utils/validation/course-import';

import type { McpServerConfig } from './config';
import type { TGetOrganizationCoursesQuery } from '@cio/utils/validation/organization';
import type {
  TPublicApiAddExerciseQuestion,
  TPublicApiAddExerciseSection,
  TPublicApiUpdateExerciseQuestionFields,
  TPublicApiUpdateExerciseSectionFields,
  TPublicApiCourseExercisesQuery,
  TPublicApiCourseMarksQuery,
  TPublicApiCourseSubmissionsQuery,
  TPublicApiCreateCourseExercise,
  TPublicApiExerciseTemplatesQuery,
  TPublicApiCourseTemplatesQuery,
  TPublicApiCreateCourseFromTemplate,
  TPublicApiSaveCourseTemplate,
  TPublicApiGradeCourseSubmission,
  TPublicApiUpdateCourseExercise,
  TPublicApiUpdateCourseSubmission,
  TPublicApiAddCohortMembers,
  TPublicApiAddCourseMember,
  TPublicApiAddCourseToCohort,
  TPublicApiAssignAudienceCourses,
  TPublicApiAssignStudentsToCohort,
  TPublicApiAudienceQuery,
  TPublicApiCertificateFileFormat,
  TPublicApiCohortNewsfeedQuery,
  TPublicApiCourseInvitesQuery,
  TPublicApiCourseLessonCommentsQuery,
  TPublicApiCourseLessonHistoryQuery,
  TPublicApiCourseLessonsQuery,
  TPublicApiCourseMemberAnalyticsQuery,
  TPublicApiCourseAnalyticsQuery,
  TPublicApiCourseAnalyticsStudentsQuery,
  TPublicApiCourseMembersQuery,
  TPublicApiCreateCourseLessonComment,
  TPublicApiCreateCourseSection,
  TPublicApiDeleteCourseContent,
  TPublicApiLessonLocale,
  TPublicApiReorderCourseContent,
  TPublicApiCloneCourse,
  TPublicApiSetFeaturedCourses,
  TPublicApiSetCourseLessonTranslation,
  TPublicApiUpdateCourseContentLock,
  TPublicApiUpdateCourseLessonComment,
  TPublicApiUpdateCourseSection,
  TPublicApiCreateAsset,
  TPublicApiCreateAudience,
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
  TPublicApiTeamQuery,
  TPublicApiUpdateAudience,
  TPublicApiUpdateCohort,
  TPublicApiUpdateCohortGoal,
  TPublicApiUpdateCohortMember,
  TPublicApiUpdateCohortNewsfeed,
  TPublicApiUpdateCourseCertificate,
  TPublicApiUpdateCourseMember,
  TPublicApiUpdateLesson,
  TPublicApiUpdateTeamMember
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

const toQuerySuffix = (query: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  }

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

  async listCourseExercises(courseId: string, query: Partial<TPublicApiCourseExercisesQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/exercises${toQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  async getCourseExercise(courseId: string, exerciseId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}`, { method: 'GET' });
  }

  async createCourseExercise(courseId: string, payload: TPublicApiCreateCourseExercise) {
    return this.request(`/public-api/v1/courses/${courseId}/exercises`, { method: 'POST', body: payload });
  }

  async updateCourseExercise(
    courseId: string,
    exerciseId: string,
    payload: TPublicApiUpdateCourseExercise,
    force = false
  ) {
    const query = force ? '?force=true' : '';

    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}${query}`, {
      method: 'PUT',
      body: payload
    });
  }

  async deleteCourseExercise(courseId: string, exerciseId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}`, { method: 'DELETE' });
  }

  async addExerciseQuestion(courseId: string, exerciseId: string, payload: TPublicApiAddExerciseQuestion) {
    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}/questions`, {
      method: 'POST',
      body: payload
    });
  }

  async updateExerciseQuestion(
    courseId: string,
    exerciseId: string,
    questionId: number,
    payload: TPublicApiUpdateExerciseQuestionFields
  ) {
    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}/questions/${questionId}`, {
      method: 'PATCH',
      body: payload
    });
  }

  async deleteExerciseQuestion(courseId: string, exerciseId: string, questionId: number, force: boolean) {
    const query = force ? '?force=true' : '';

    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}/questions/${questionId}${query}`, {
      method: 'DELETE'
    });
  }

  async addExerciseSection(courseId: string, exerciseId: string, payload: TPublicApiAddExerciseSection) {
    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}/sections`, {
      method: 'POST',
      body: payload
    });
  }

  async updateExerciseSection(
    courseId: string,
    exerciseId: string,
    sectionId: string,
    payload: TPublicApiUpdateExerciseSectionFields
  ) {
    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}/sections/${sectionId}`, {
      method: 'PATCH',
      body: payload
    });
  }

  async deleteExerciseSection(courseId: string, exerciseId: string, sectionId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}/sections/${sectionId}`, {
      method: 'DELETE'
    });
  }

  async notifyCourseExercise(courseId: string, exerciseId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/exercises/${exerciseId}/notify`, { method: 'POST' });
  }

  async getCourseExerciseNotifyStatus(courseId: string, exerciseId: string, jobId: string, pollCount?: number) {
    const path = `/public-api/v1/courses/${courseId}/exercises/${exerciseId}/notify/${encodeURIComponent(jobId)}`;
    return this.request(`${path}${toQuerySuffix({ pollCount })}`, { method: 'GET' });
  }

  async listExerciseTemplates(query: Partial<TPublicApiExerciseTemplatesQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/exercise-templates${toQuerySuffix(query)}`, { method: 'GET' });
  }

  async getExerciseTemplate(templateId: number) {
    return this.request(`/public-api/v1/exercise-templates/${templateId}`, { method: 'GET' });
  }

  async listCourseTemplates(query: Partial<TPublicApiCourseTemplatesQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/course-templates${toQuerySuffix(query)}`, { method: 'GET' });
  }

  async getCourseTemplate(templateId: string) {
    return this.request(`/public-api/v1/course-templates/${templateId}`, { method: 'GET' });
  }

  async createCourseFromTemplate(templateId: string, payload: TPublicApiCreateCourseFromTemplate) {
    return this.request(`/public-api/v1/course-templates/${templateId}/courses`, { method: 'POST', body: payload });
  }

  async saveCourseAsTemplate(courseId: string, payload: TPublicApiSaveCourseTemplate) {
    return this.request(`/public-api/v1/courses/${courseId}/template`, { method: 'POST', body: payload });
  }

  async listCourseSubmissions(courseId: string, query: Partial<TPublicApiCourseSubmissionsQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/submissions${toQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  async getCourseSubmission(courseId: string, submissionId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/submissions/${submissionId}`, { method: 'GET' });
  }

  async gradeCourseSubmission(courseId: string, submissionId: string, payload: TPublicApiGradeCourseSubmission) {
    return this.request(`/public-api/v1/courses/${courseId}/submissions/${submissionId}/grades`, {
      method: 'PUT',
      body: payload
    });
  }

  async updateCourseSubmission(courseId: string, submissionId: string, payload: TPublicApiUpdateCourseSubmission) {
    return this.request(`/public-api/v1/courses/${courseId}/submissions/${submissionId}`, {
      method: 'PATCH',
      body: payload
    });
  }

  async deleteCourseSubmission(courseId: string, submissionId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/submissions/${submissionId}`, { method: 'DELETE' });
  }

  async getCourseMarks(courseId: string, query: Partial<TPublicApiCourseMarksQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/marks${toQuerySuffix(query)}`, {
      method: 'GET'
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

  // ─── Course Sections, Lessons and Content (public API) ──────────────────

  async listCourseSections(courseId: string, query: Partial<TPublicApiPaginationQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/sections${toPageQuerySuffix(query)}`, {
      method: 'GET'
    });
  }

  async createCourseSection(courseId: string, payload: TPublicApiCreateCourseSection) {
    return this.request(`/public-api/v1/courses/${courseId}/sections`, { method: 'POST', body: payload });
  }

  async updateCourseSection(courseId: string, sectionId: string, payload: TPublicApiUpdateCourseSection) {
    return this.request(`/public-api/v1/courses/${courseId}/sections/${sectionId}`, { method: 'PUT', body: payload });
  }

  async deleteCourseSection(courseId: string, sectionId: string, force = false) {
    const query = force ? '?force=true' : '';

    return this.request(`/public-api/v1/courses/${courseId}/sections/${sectionId}${query}`, { method: 'DELETE' });
  }

  async listCourseLessons(courseId: string, query: Partial<TPublicApiCourseLessonsQuery> = {}) {
    const searchParams = new URLSearchParams(toPageQuerySuffix(query).slice(1));
    if (query.sectionId) searchParams.set('sectionId', query.sectionId);

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.requestPaginated(`/public-api/v1/courses/${courseId}/lessons${querySuffix}`, { method: 'GET' });
  }

  async getCourseLesson(courseId: string, lessonId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}`, { method: 'GET' });
  }

  async deleteCourseLesson(courseId: string, lessonId: string, force = false) {
    const query = force ? '?force=true' : '';

    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}${query}`, { method: 'DELETE' });
  }

  async notifyCourseLessonSessionUpdate(courseId: string, lessonId: string) {
    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}/notify-session-update`, {
      method: 'POST'
    });
  }

  async listCourseLessonTranslations(courseId: string, lessonId: string, locale?: TPublicApiLessonLocale) {
    const querySuffix = locale ? `?locale=${locale}` : '';
    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}/translations${querySuffix}`, {
      method: 'GET'
    });
  }

  async setCourseLessonTranslation(
    courseId: string,
    lessonId: string,
    locale: TPublicApiLessonLocale,
    payload: TPublicApiSetCourseLessonTranslation
  ) {
    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}/translations/${locale}`, {
      method: 'PUT',
      body: payload
    });
  }

  async listCourseLessonHistory(
    courseId: string,
    lessonId: string,
    query: Partial<TPublicApiCourseLessonHistoryQuery>
  ) {
    const searchParams = new URLSearchParams();
    if (query.locale) searchParams.set('locale', query.locale);
    if (query.limit) searchParams.set('limit', String(query.limit));
    if (query.cursor) searchParams.set('cursor', query.cursor);

    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}/history?${searchParams.toString()}`, {
      method: 'GET'
    });
  }

  async listCourseLessonComments(
    courseId: string,
    lessonId: string,
    query: Partial<TPublicApiCourseLessonCommentsQuery> = {}
  ) {
    const searchParams = new URLSearchParams();
    if (query.limit) searchParams.set('limit', String(query.limit));
    if (query.cursor) searchParams.set('cursor', query.cursor);

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}/comments${querySuffix}`, {
      method: 'GET'
    });
  }

  async createCourseLessonComment(courseId: string, lessonId: string, payload: TPublicApiCreateCourseLessonComment) {
    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}/comments`, {
      method: 'POST',
      body: payload
    });
  }

  async updateCourseLessonComment(
    courseId: string,
    lessonId: string,
    commentId: number,
    payload: TPublicApiUpdateCourseLessonComment
  ) {
    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}/comments/${commentId}`, {
      method: 'PUT',
      body: payload
    });
  }

  async deleteCourseLessonComment(courseId: string, lessonId: string, commentId: number) {
    return this.request(`/public-api/v1/courses/${courseId}/lessons/${lessonId}/comments/${commentId}`, {
      method: 'DELETE'
    });
  }

  async cloneCourse(courseId: string, payload: TPublicApiCloneCourse) {
    return this.request(`/public-api/v1/courses/${courseId}/clone`, { method: 'POST', body: payload });
  }

  async setFeaturedCourses(payload: TPublicApiSetFeaturedCourses) {
    return this.request('/public-api/v1/courses/featured', { method: 'PUT', body: payload });
  }

  async reorderCourseContent(courseId: string, payload: TPublicApiReorderCourseContent) {
    return this.request(`/public-api/v1/courses/${courseId}/content/reorder`, { method: 'PUT', body: payload });
  }

  async setCourseContentUnlocked(courseId: string, payload: TPublicApiUpdateCourseContentLock) {
    return this.request(`/public-api/v1/courses/${courseId}/content`, { method: 'PATCH', body: payload });
  }

  async deleteCourseContent(courseId: string, payload: TPublicApiDeleteCourseContent, force = false) {
    const query = force ? '?force=true' : '';

    return this.request(`/public-api/v1/courses/${courseId}/content${query}`, { method: 'DELETE', body: payload });
  }

  // ─── Audience (public API) ──────────────────────────────────────────────

  async listAudienceMembers(query: Partial<TPublicApiAudienceQuery> = {}) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') searchParams.set(key, String(value));
    }

    const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.requestPaginated(`/public-api/v1/audience${querySuffix}`, { method: 'GET' });
  }

  async addAudienceMember(payload: TPublicApiCreateAudience) {
    return this.request('/public-api/v1/audience', { method: 'POST', body: payload });
  }

  async assignAudienceCourses(payload: TPublicApiAssignAudienceCourses) {
    return this.request('/public-api/v1/audience/assign-courses', { method: 'POST', body: payload });
  }

  async getAudienceMember(memberId: number) {
    return this.request(`/public-api/v1/audience/${memberId}`, { method: 'GET' });
  }

  async updateAudienceMember(memberId: number, payload: TPublicApiUpdateAudience) {
    return this.request(`/public-api/v1/audience/${memberId}`, { method: 'PUT', body: payload });
  }

  async removeAudienceMember(memberId: number) {
    return this.request(`/public-api/v1/audience/${memberId}`, { method: 'DELETE' });
  }

  // ─── Team (public API) ──────────────────────────────────────────────────

  async listTeamMembers(query: Partial<TPublicApiTeamQuery> = {}) {
    return this.requestPaginated(`/public-api/v1/team${toPageQuerySuffix(query)}`, { method: 'GET' });
  }

  async getTeamMember(memberId: number) {
    return this.request(`/public-api/v1/team/${memberId}`, { method: 'GET' });
  }

  async updateTeamMember(memberId: number, payload: TPublicApiUpdateTeamMember) {
    return this.request(`/public-api/v1/team/${memberId}`, { method: 'PUT', body: payload });
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
