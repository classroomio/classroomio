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
import type { TAttachLessonVideo } from '@cio/utils/validation/lesson';
import type { TCoursePresignUrlUpload, TCourseDownloadPresignedUrl } from '@cio/utils/validation/course';

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

  async presignVideoUpload(payload: TCoursePresignUrlUpload) {
    return this.requestFlat<{ url: string; fileKey: string }>('/course/presign/video/upload', {
      method: 'POST',
      body: payload
    });
  }

  async presignVideoDownload(payload: TCourseDownloadPresignedUrl) {
    return this.requestFlat<{ urls: Record<string, string> }>('/course/presign/video/download', {
      method: 'POST',
      body: payload
    });
  }

  async attachLessonVideo(courseId: string, lessonId: string, payload: TAttachLessonVideo) {
    return this.request(
      `/course/${encodeURIComponent(courseId)}/lesson/${encodeURIComponent(lessonId)}/video`,
      {
        method: 'POST',
        body: payload
      }
    );
  }

  /** Uploads bytes directly to a presigned storage URL. No ClassroomIO auth header — the URL's signature is the auth. */
  async putToPresignedUrl(presignedUrl: string, body: Buffer, contentType: string): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'content-type': contentType },
      body: body as unknown as BodyInit
    });

    if (!response.ok) {
      throw new ClassroomIoApiError(`Upload to storage failed with status ${response.status}`, response.status);
    }
  }

  async uploadImage(fileBuffer: Buffer, fileName: string, mimeType: string) {
    const form = new FormData();
    form.append('file', new Blob([fileBuffer as unknown as BlobPart], { type: mimeType }), fileName);

    const response = await fetch(new URL('/media/image', this.config.CLASSROOMIO_API_URL), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.CLASSROOMIO_API_KEY}`,
        'user-agent': this.config.CLASSROOMIO_USER_AGENT
      },
      body: form
    });

    const json = (await response.json().catch(() => null)) as ({ success: true; url: string; fileKey: string } | ApiFailure) | null;

    if (!response.ok) {
      const errorPayload = json as ApiFailure | null;
      throw new ClassroomIoApiError(
        errorPayload?.error ?? errorPayload?.message ?? `Image upload failed with status ${response.status}`,
        response.status,
        errorPayload?.code,
        errorPayload?.field
      );
    }

    if (!json || typeof json !== 'object' || !('success' in json) || !json.success) {
      throw new ClassroomIoApiError('ClassroomIO returned an invalid response payload', response.status);
    }

    return { url: json.url, fileKey: json.fileKey };
  }

  private async request<TResponse>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT';
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

  /** Like {@link request}, but for routes that return their payload as flat top-level fields instead of under `data`. */
  private async requestFlat<TResponse>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT';
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

    const json = (await response.json().catch(() => null)) as ({ success: true } & TResponse) | ApiFailure | null;

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

    const { success: _success, ...rest } = json;
    return rest as TResponse;
  }
}
