export interface PluginApiOrganizationProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  locale: string;
}

export interface PluginApiIdentityProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
  role: 'admin' | 'tutor' | 'student';
}

export interface PluginApiCourseMetadata {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  status: string;
  visibility: 'public' | 'private';
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PluginApiLessonMetadata {
  id: string;
  courseId: string;
  title: string;
  type: string;
  order: number;
  published: boolean;
  wordCount: number;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface PluginApiCourseSectionLessonRef {
  id: string;
  title: string;
  order: number;
  type: string;
}

export interface PluginApiCourseSection {
  id: string;
  title: string;
  order: number;
  lessons: PluginApiCourseSectionLessonRef[];
}

export interface PluginApiCourseStructure {
  courseId: string;
  sections: PluginApiCourseSection[];
}

export interface PluginApiLessonAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface PluginApiLessonContent {
  id: string;
  courseId: string;
  title: string;
  type: string;
  order: number;
  content: string | null;
  attachments: PluginApiLessonAttachment[];
  wordCount: number;
  estimatedMinutes: number;
  updatedAt: string;
}

export interface PluginApiCourseEnrollment {
  id: string;
  courseId: string;
  profileId: string;
  role: 'admin' | 'tutor' | 'student';
  status: 'active' | 'completed';
  enrolledAt: string;
  completedAt: string | null;
}

export interface PluginApiExerciseMetadata {
  id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description: string | null;
  order: number;
  allowMultipleAttempts: boolean;
  completionPolicy: string;
  passThreshold: number | null;
  questionCount: number;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface PluginApiIssuedCertificate {
  id: string;
  courseId: string;
  profileId: string;
  cycleNumber: number;
  issuedAt: string;
  expiresAt: string;
  status: string;
  verificationUrl: string | null;
}

export interface PluginApiCursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PluginApiLessonProgress {
  isComplete: boolean;
}

export interface PluginApiCourseProgress {
  courseId: string;
  percentage: number;
  lessonsCompleted: number;
  totalLessons: number;
  isComplete: boolean;
  certificateEarnedAt: string | null;
}

export interface PluginApiCertificateTemplate {
  id: string;
  name: string;
  style: string;
  description: string;
  accentColor: string;
  subtitle: string;
  version: number;
  design: Record<string, unknown>;
}

export interface PluginApiAppliedCertificateTemplate {
  courseId: string;
  isDownloadable: boolean;
  design: Record<string, unknown> | null;
  sourceTemplate: {
    pluginId: string;
    externalTemplateId: string;
    version: number;
    name: string;
    appliedAt: string;
  } | null;
}

export interface PluginApiApplyCertificateTemplateRequest {
  externalTemplateId: string;
  externalTemplateVersion: number;
  name: string;
  design: Record<string, unknown>;
}

export interface PluginApiApplyCertificateTemplateResult {
  courseId: string;
  appliedAt: string;
  templateVersion: number;
  design: Record<string, unknown>;
}

export interface PluginApiStorageRecord<T = unknown> {
  namespace: string;
  key: string;
  value: T;
  scope: 'organization' | 'user';
  updatedAt?: string;
}

interface PluginApiSuccess<T> {
  success: true;
  data: T;
  requestId: string;
}

interface PluginApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
  requestId: string;
}

export interface ClassroomIOPluginServerClientOptions {
  accessToken: string;
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}

export class PluginApiError extends Error {
  readonly code: string;
  readonly requestId: string | null;
  readonly retryable: boolean;
  readonly status: number;

  constructor(options: { code: string; message: string; requestId?: string; retryable?: boolean; status: number }) {
    super(options.message);
    this.name = 'PluginApiError';
    this.code = options.code;
    this.requestId = options.requestId ?? null;
    this.retryable = options.retryable ?? false;
    this.status = options.status;
  }
}

function isOrganizationProfile(value: unknown): value is PluginApiOrganizationProfile {
  if (!value || typeof value !== 'object') return false;

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.id === 'string' &&
    typeof profile.name === 'string' &&
    (profile.avatarUrl === null || typeof profile.avatarUrl === 'string') &&
    typeof profile.locale === 'string'
  );
}

function isIdentityProfile(value: unknown): value is PluginApiIdentityProfile {
  if (!value || typeof value !== 'object') return false;

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.id === 'string' &&
    typeof profile.displayName === 'string' &&
    (profile.avatarUrl === null || typeof profile.avatarUrl === 'string') &&
    typeof profile.locale === 'string' &&
    (profile.role === 'admin' || profile.role === 'tutor' || profile.role === 'student')
  );
}

function isCourseMetadata(value: unknown): value is PluginApiCourseMetadata {
  if (!value || typeof value !== 'object') return false;

  const course = value as Record<string, unknown>;
  return (
    typeof course.id === 'string' &&
    typeof course.title === 'string' &&
    (course.slug === null || typeof course.slug === 'string') &&
    (course.description === null || typeof course.description === 'string') &&
    (course.imageUrl === null || typeof course.imageUrl === 'string') &&
    typeof course.status === 'string' &&
    (course.visibility === 'public' || course.visibility === 'private') &&
    typeof course.published === 'boolean' &&
    (course.publishedAt === null || typeof course.publishedAt === 'string') &&
    typeof course.createdAt === 'string' &&
    typeof course.updatedAt === 'string'
  );
}

function isLessonMetadata(value: unknown): value is PluginApiLessonMetadata {
  if (!value || typeof value !== 'object') return false;

  const lesson = value as Record<string, unknown>;
  return (
    typeof lesson.id === 'string' &&
    typeof lesson.courseId === 'string' &&
    typeof lesson.title === 'string' &&
    typeof lesson.type === 'string' &&
    typeof lesson.order === 'number' &&
    typeof lesson.published === 'boolean' &&
    typeof lesson.wordCount === 'number' &&
    typeof lesson.estimatedMinutes === 'number' &&
    typeof lesson.createdAt === 'string' &&
    typeof lesson.updatedAt === 'string'
  );
}

function isCourseStructure(value: unknown): value is PluginApiCourseStructure {
  if (!value || typeof value !== 'object') return false;
  const struct = value as Record<string, unknown>;
  return (
    typeof struct.courseId === 'string' &&
    Array.isArray(struct.sections) &&
    struct.sections.every(
      (sec) =>
        sec &&
        typeof sec === 'object' &&
        typeof sec.id === 'string' &&
        typeof sec.title === 'string' &&
        typeof sec.order === 'number' &&
        Array.isArray(sec.lessons) &&
        sec.lessons.every(
          (les: any) =>
            les &&
            typeof les === 'object' &&
            typeof les.id === 'string' &&
            typeof les.title === 'string' &&
            typeof les.order === 'number' &&
            typeof les.type === 'string'
        )
    )
  );
}

function isLessonContent(value: unknown): value is PluginApiLessonContent {
  if (!value || typeof value !== 'object') return false;
  const lesson = value as Record<string, unknown>;
  return (
    typeof lesson.id === 'string' &&
    typeof lesson.courseId === 'string' &&
    typeof lesson.title === 'string' &&
    typeof lesson.type === 'string' &&
    typeof lesson.order === 'number' &&
    (lesson.content === null || typeof lesson.content === 'string') &&
    Array.isArray(lesson.attachments) &&
    typeof lesson.wordCount === 'number' &&
    typeof lesson.estimatedMinutes === 'number' &&
    typeof lesson.updatedAt === 'string'
  );
}

function isCourseEnrollment(value: unknown): value is PluginApiCourseEnrollment {
  if (!value || typeof value !== 'object') return false;
  const enr = value as Record<string, unknown>;
  return (
    typeof enr.id === 'string' &&
    typeof enr.courseId === 'string' &&
    typeof enr.profileId === 'string' &&
    (enr.role === 'admin' || enr.role === 'tutor' || enr.role === 'student') &&
    (enr.status === 'active' || enr.status === 'completed') &&
    typeof enr.enrolledAt === 'string' &&
    (enr.completedAt === null || typeof enr.completedAt === 'string')
  );
}

function isExerciseMetadata(value: unknown): value is PluginApiExerciseMetadata {
  if (!value || typeof value !== 'object') return false;
  const ex = value as Record<string, unknown>;
  return (
    typeof ex.id === 'string' &&
    typeof ex.courseId === 'string' &&
    (ex.lessonId === null || typeof ex.lessonId === 'string') &&
    typeof ex.title === 'string' &&
    (ex.description === null || typeof ex.description === 'string') &&
    typeof ex.order === 'number' &&
    typeof ex.allowMultipleAttempts === 'boolean' &&
    typeof ex.completionPolicy === 'string' &&
    (ex.passThreshold === null || typeof ex.passThreshold === 'number') &&
    typeof ex.questionCount === 'number' &&
    typeof ex.totalPoints === 'number' &&
    typeof ex.createdAt === 'string' &&
    typeof ex.updatedAt === 'string'
  );
}

function isIssuedCertificate(value: unknown): value is PluginApiIssuedCertificate {
  if (!value || typeof value !== 'object') return false;
  const cert = value as Record<string, unknown>;
  return (
    typeof cert.id === 'string' &&
    typeof cert.courseId === 'string' &&
    typeof cert.profileId === 'string' &&
    typeof cert.cycleNumber === 'number' &&
    typeof cert.issuedAt === 'string' &&
    typeof cert.expiresAt === 'string' &&
    typeof cert.status === 'string' &&
    (cert.verificationUrl === null || typeof cert.verificationUrl === 'string')
  );
}

function isCursorPage<T>(value: unknown, itemGuard: (item: unknown) => item is T): value is PluginApiCursorPage<T> {
  if (!value || typeof value !== 'object') return false;

  const page = value as Record<string, unknown>;
  return (
    Array.isArray(page.items) &&
    page.items.every(itemGuard) &&
    (page.nextCursor === null || typeof page.nextCursor === 'string')
  );
}

function isLessonProgress(value: unknown): value is PluginApiLessonProgress {
  if (!value || typeof value !== 'object') return false;

  const progress = value as Record<string, unknown>;
  return typeof progress.isComplete === 'boolean';
}

function isCourseProgress(value: unknown): value is PluginApiCourseProgress {
  if (!value || typeof value !== 'object') return false;

  const progress = value as Record<string, unknown>;
  return (
    typeof progress.courseId === 'string' &&
    typeof progress.percentage === 'number' &&
    typeof progress.lessonsCompleted === 'number' &&
    typeof progress.totalLessons === 'number' &&
    typeof progress.isComplete === 'boolean' &&
    (progress.certificateEarnedAt === null || typeof progress.certificateEarnedAt === 'string')
  );
}

function isCertificateTemplate(value: unknown): value is PluginApiCertificateTemplate {
  if (!value || typeof value !== 'object') return false;

  const tmpl = value as Record<string, unknown>;
  return (
    typeof tmpl.id === 'string' &&
    typeof tmpl.name === 'string' &&
    typeof tmpl.style === 'string' &&
    typeof tmpl.description === 'string' &&
    typeof tmpl.accentColor === 'string' &&
    typeof tmpl.subtitle === 'string' &&
    typeof tmpl.version === 'number' &&
    typeof tmpl.design === 'object' &&
    tmpl.design !== null
  );
}

function isCertificateTemplateList(value: unknown): value is PluginApiCertificateTemplate[] {
  return Array.isArray(value) && value.every(isCertificateTemplate);
}

function isAppliedCertificateTemplate(value: unknown): value is PluginApiAppliedCertificateTemplate {
  if (!value || typeof value !== 'object') return false;

  const tmpl = value as Record<string, unknown>;
  return (
    typeof tmpl.courseId === 'string' &&
    typeof tmpl.isDownloadable === 'boolean' &&
    (tmpl.design === null || typeof tmpl.design === 'object') &&
    (tmpl.sourceTemplate === null || typeof tmpl.sourceTemplate === 'object')
  );
}

function isApplyCertificateTemplateResult(value: unknown): value is PluginApiApplyCertificateTemplateResult {
  if (!value || typeof value !== 'object') return false;

  const res = value as Record<string, unknown>;
  return (
    typeof res.courseId === 'string' &&
    typeof res.appliedAt === 'string' &&
    typeof res.templateVersion === 'number' &&
    typeof res.design === 'object' &&
    res.design !== null
  );
}

function isStorageRecord(value: unknown): value is PluginApiStorageRecord {
  if (!value || typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.namespace === 'string' &&
    typeof record.key === 'string' &&
    'value' in record &&
    (record.scope === 'organization' || record.scope === 'user')
  );
}

function isStorageRecordList(value: unknown): value is { items: PluginApiStorageRecord[] } {
  if (!value || typeof value !== 'object') return false;

  const list = value as Record<string, unknown>;
  return Array.isArray(list.items) && list.items.every(isStorageRecord);
}

function isStorageDeleteResult(value: unknown): value is { deleted: boolean } {
  if (!value || typeof value !== 'object') return false;

  const res = value as Record<string, unknown>;
  return typeof res.deleted === 'boolean';
}

export class ClassroomIOPluginServerClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof globalThis.fetch;

  constructor(options: ClassroomIOPluginServerClientOptions) {
    this.accessToken = options.accessToken;
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.fetchImplementation = options.fetch ?? globalThis.fetch;
  }

  private async get<T>(path: string, validate: (value: unknown) => value is T): Promise<T> {
    const response = await this.fetchImplementation(`${this.baseUrl}/plugin-api/v1${path}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.accessToken}`
      }
    });
    const body = (await response.json()) as PluginApiSuccess<unknown> | PluginApiFailure;

    if (!response.ok || body.success === false) {
      const failure = body.success === false ? body : null;
      throw new PluginApiError({
        code: failure?.error.code ?? 'invalid_response',
        message: failure?.error.message ?? 'ClassroomIO Plugin API request failed',
        requestId: failure?.requestId,
        retryable: failure?.error.retryable,
        status: response.status
      });
    }

    if (!validate(body.data)) {
      throw new PluginApiError({
        code: 'invalid_response',
        message: 'ClassroomIO Plugin API returned an invalid response',
        requestId: body.requestId,
        status: response.status
      });
    }

    return body.data;
  }

  private async put<T>(path: string, body: unknown, validate: (value: unknown) => value is T): Promise<T> {
    const response = await this.fetchImplementation(`${this.baseUrl}/plugin-api/v1${path}`, {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${this.accessToken}`
      },
      body: JSON.stringify(body)
    });
    const responseBody = (await response.json()) as PluginApiSuccess<unknown> | PluginApiFailure;

    if (!response.ok || responseBody.success === false) {
      const failure = responseBody.success === false ? responseBody : null;
      throw new PluginApiError({
        code: failure?.error.code ?? 'invalid_response',
        message: failure?.error.message ?? 'ClassroomIO Plugin API request failed',
        requestId: failure?.requestId,
        retryable: failure?.error.retryable,
        status: response.status
      });
    }

    if (!validate(responseBody.data)) {
      throw new PluginApiError({
        code: 'invalid_response',
        message: 'ClassroomIO Plugin API returned an invalid response',
        requestId: responseBody.requestId,
        status: response.status
      });
    }

    return responseBody.data;
  }

  private async delete<T>(path: string, validate: (value: unknown) => value is T): Promise<T> {
    const response = await this.fetchImplementation(`${this.baseUrl}/plugin-api/v1${path}`, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.accessToken}`
      }
    });
    const responseBody = (await response.json()) as PluginApiSuccess<unknown> | PluginApiFailure;

    if (!response.ok || responseBody.success === false) {
      const failure = responseBody.success === false ? responseBody : null;
      throw new PluginApiError({
        code: failure?.error.code ?? 'invalid_response',
        message: failure?.error.message ?? 'ClassroomIO Plugin API request failed',
        requestId: failure?.requestId,
        retryable: failure?.error.retryable,
        status: response.status
      });
    }

    if (!validate(responseBody.data)) {
      throw new PluginApiError({
        code: 'invalid_response',
        message: 'ClassroomIO Plugin API returned an invalid response',
        requestId: responseBody.requestId,
        status: response.status
      });
    }

    return responseBody.data;
  }

  readonly organization = {
    getProfile: async (): Promise<PluginApiOrganizationProfile> => {
      return this.get('/organization/profile', isOrganizationProfile);
    }
  };

  readonly identity = {
    getProfile: async (): Promise<PluginApiIdentityProfile> => {
      return this.get('/identity/profile', isIdentityProfile);
    }
  };

  readonly courses = {
    list: async (options?: {
      limit?: number;
      cursor?: string;
    }): Promise<PluginApiCursorPage<PluginApiCourseMetadata>> => {
      const searchParams = new URLSearchParams();
      if (options?.limit !== undefined) searchParams.set('limit', String(options.limit));
      if (options?.cursor) searchParams.set('cursor', options.cursor);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.get(`/courses${query}`, (value): value is PluginApiCursorPage<PluginApiCourseMetadata> =>
        isCursorPage(value, isCourseMetadata)
      );
    },
    get: async (courseId: string): Promise<PluginApiCourseMetadata> => {
      return this.get(`/courses/${encodeURIComponent(courseId)}`, isCourseMetadata);
    },
    getStructure: async (courseId: string): Promise<PluginApiCourseStructure> => {
      return this.get(`/courses/${encodeURIComponent(courseId)}/structure`, isCourseStructure);
    },
    listEnrollments: async (
      courseId: string,
      options?: { limit?: number; cursor?: string }
    ): Promise<PluginApiCursorPage<PluginApiCourseEnrollment>> => {
      const searchParams = new URLSearchParams();
      if (options?.limit !== undefined) searchParams.set('limit', String(options.limit));
      if (options?.cursor) searchParams.set('cursor', options.cursor);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.get(
        `/courses/${encodeURIComponent(courseId)}/enrollments${query}`,
        (value): value is PluginApiCursorPage<PluginApiCourseEnrollment> => isCursorPage(value, isCourseEnrollment)
      );
    },
    getEnrollment: async (courseId: string, enrollmentId: string): Promise<PluginApiCourseEnrollment> => {
      return this.get(
        `/courses/${encodeURIComponent(courseId)}/enrollments/${encodeURIComponent(enrollmentId)}`,
        isCourseEnrollment
      );
    },
    listExercises: async (
      courseId: string,
      options?: { lessonId?: string; limit?: number; cursor?: string }
    ): Promise<PluginApiCursorPage<PluginApiExerciseMetadata>> => {
      const searchParams = new URLSearchParams();
      if (options?.lessonId) searchParams.set('lessonId', options.lessonId);
      if (options?.limit !== undefined) searchParams.set('limit', String(options.limit));
      if (options?.cursor) searchParams.set('cursor', options.cursor);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.get(
        `/courses/${encodeURIComponent(courseId)}/exercises${query}`,
        (value): value is PluginApiCursorPage<PluginApiExerciseMetadata> => isCursorPage(value, isExerciseMetadata)
      );
    },
    getProgress: async (courseId: string): Promise<PluginApiCourseProgress> => {
      return this.progress.getCourse(courseId);
    },
    getCertificateTemplate: async (courseId: string): Promise<PluginApiAppliedCertificateTemplate> => {
      return this.certificateTemplates.getApplied(courseId);
    },
    applyCertificateTemplate: async (
      courseId: string,
      data: PluginApiApplyCertificateTemplateRequest
    ): Promise<PluginApiApplyCertificateTemplateResult> => {
      return this.certificateTemplates.apply(courseId, data);
    }
  };

  readonly lessons = {
    listByCourse: async (
      courseId: string,
      options?: { limit?: number; cursor?: string }
    ): Promise<PluginApiCursorPage<PluginApiLessonMetadata>> => {
      const searchParams = new URLSearchParams();
      if (options?.limit !== undefined) searchParams.set('limit', String(options.limit));
      if (options?.cursor) searchParams.set('cursor', options.cursor);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.get(
        `/courses/${encodeURIComponent(courseId)}/lessons${query}`,
        (value): value is PluginApiCursorPage<PluginApiLessonMetadata> => isCursorPage(value, isLessonMetadata)
      );
    },
    get: async (lessonId: string): Promise<PluginApiLessonMetadata> => {
      return this.get(`/lessons/${encodeURIComponent(lessonId)}`, isLessonMetadata);
    },
    getContent: async (lessonId: string): Promise<PluginApiLessonContent> => {
      return this.get(`/lessons/${encodeURIComponent(lessonId)}/content`, isLessonContent);
    },
    getProgress: async (lessonId: string): Promise<PluginApiLessonProgress> => {
      return this.progress.getLesson(lessonId);
    },
    setProgress: async (lessonId: string, isComplete: boolean): Promise<PluginApiLessonProgress> => {
      return this.progress.setLesson(lessonId, isComplete);
    },
    resetProgress: async (lessonId: string): Promise<PluginApiLessonProgress> => {
      return this.progress.resetLesson(lessonId);
    }
  };

  readonly progress = {
    getLesson: async (lessonId: string): Promise<PluginApiLessonProgress> => {
      return this.get(`/lessons/${encodeURIComponent(lessonId)}/progress`, isLessonProgress);
    },
    setLesson: async (lessonId: string, isComplete: boolean): Promise<PluginApiLessonProgress> => {
      return this.put(`/lessons/${encodeURIComponent(lessonId)}/progress`, { isComplete }, isLessonProgress);
    },
    resetLesson: async (lessonId: string): Promise<PluginApiLessonProgress> => {
      return this.delete(`/lessons/${encodeURIComponent(lessonId)}/progress`, isLessonProgress);
    },
    getCourse: async (courseId: string): Promise<PluginApiCourseProgress> => {
      return this.get(`/courses/${encodeURIComponent(courseId)}/progress`, isCourseProgress);
    }
  };

  readonly certificateTemplates = {
    listAvailable: async (): Promise<PluginApiCertificateTemplate[]> => {
      return this.get('/certificates/templates', isCertificateTemplateList);
    },
    getApplied: async (courseId: string): Promise<PluginApiAppliedCertificateTemplate> => {
      return this.get(`/courses/${encodeURIComponent(courseId)}/certificate-template`, isAppliedCertificateTemplate);
    },
    apply: async (
      courseId: string,
      data: PluginApiApplyCertificateTemplateRequest
    ): Promise<PluginApiApplyCertificateTemplateResult> => {
      return this.put(
        `/courses/${encodeURIComponent(courseId)}/certificate-template`,
        data,
        isApplyCertificateTemplateResult
      );
    }
  };

  readonly exercises = {
    get: async (exerciseId: string): Promise<PluginApiExerciseMetadata> => {
      return this.get(`/exercises/${encodeURIComponent(exerciseId)}`, isExerciseMetadata);
    }
  };

  readonly certificates = {
    listIssued: async (options?: {
      courseId?: string;
      limit?: number;
      cursor?: string;
    }): Promise<PluginApiCursorPage<PluginApiIssuedCertificate>> => {
      const searchParams = new URLSearchParams();
      if (options?.courseId) searchParams.set('courseId', options.courseId);
      if (options?.limit !== undefined) searchParams.set('limit', String(options.limit));
      if (options?.cursor) searchParams.set('cursor', options.cursor);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.get(
        `/certificates/issued${query}`,
        (value): value is PluginApiCursorPage<PluginApiIssuedCertificate> => isCursorPage(value, isIssuedCertificate)
      );
    },
    getIssued: async (certificateId: string): Promise<PluginApiIssuedCertificate> => {
      return this.get(`/certificates/issued/${encodeURIComponent(certificateId)}`, isIssuedCertificate);
    }
  };

  readonly storage = {
    get: async <T = unknown>(
      namespace: string,
      key: string,
      options?: { scope?: 'organization' | 'user' }
    ): Promise<PluginApiStorageRecord<T>> => {
      const searchParams = new URLSearchParams();
      if (options?.scope) searchParams.set('scope', options.scope);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.get(
        `/storage/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}${query}`,
        (value): value is PluginApiStorageRecord<T> => isStorageRecord(value)
      );
    },
    list: async <T = unknown>(
      namespace: string,
      options?: { scope?: 'organization' | 'user' }
    ): Promise<PluginApiStorageRecord<T>[]> => {
      const searchParams = new URLSearchParams();
      if (options?.scope) searchParams.set('scope', options.scope);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const result = await this.get(`/storage/${encodeURIComponent(namespace)}${query}`, isStorageRecordList);
      return result.items as PluginApiStorageRecord<T>[];
    },
    set: async <T = unknown>(
      namespace: string,
      key: string,
      value: T,
      options?: { scope?: 'organization' | 'user' }
    ): Promise<PluginApiStorageRecord<T>> => {
      const payload = {
        value,
        scope: options?.scope ?? 'organization'
      };
      return this.put(
        `/storage/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`,
        payload,
        (val): val is PluginApiStorageRecord<T> => isStorageRecord(val)
      );
    },
    delete: async (
      namespace: string,
      key: string,
      options?: { scope?: 'organization' | 'user' }
    ): Promise<{ deleted: boolean }> => {
      const searchParams = new URLSearchParams();
      if (options?.scope) searchParams.set('scope', options.scope);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.delete(
        `/storage/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}${query}`,
        isStorageDeleteResult
      );
    }
  };
}

export function createClassroomIOPluginServerClient(
  options: ClassroomIOPluginServerClientOptions
): ClassroomIOPluginServerClient {
  return new ClassroomIOPluginServerClient(options);
}
