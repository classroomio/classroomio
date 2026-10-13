import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from '@api/services/plugin/authorization';
import { assertCourseMemberOrOrgAdmin } from '@api/services/v1/shared';
import {
  getPluginCourseById,
  getPluginCoursesList,
  getPluginCourseStructure,
  getPluginLatestPublishedCourse,
  getPluginLessonAccessContext,
  getPluginLessonById,
  getPluginLessonContent,
  getPluginLessonReadingSource,
  getPluginLessonsByCourseId
} from '@cio/db/queries';
import {
  type TPluginApiCourseMetadata,
  type TPluginApiCourseStructure,
  type TPluginApiLessonContent,
  type TPluginApiLessonMetadata,
  ZPluginApiCourseStructure,
  ZPluginApiLessonContent
} from '@cio/utils/validation/plugin';

export interface LessonReadingMetrics {
  wordCount: number;
  estimatedMinutes: number;
}

export interface PluginLatestPublishedCourse {
  id: string;
  title: string;
  slug: string | null;
}

async function authorizePluginContentRead(
  installationId: string,
  organizationId: string,
  requiredScope: 'lesson.metadata:read' | 'course.metadata:read',
  actorId?: string
) {
  return authorizePluginRequest({ installationId, organizationId, actorId, requiredScope });
}

function countWords(html: string): number {
  const plainText = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText ? plainText.split(' ').length : 0;
}

export function computeLessonReadingMetrics(content: string | null): LessonReadingMetrics {
  const wordCount = countWords(content ?? '');
  return {
    wordCount,
    estimatedMinutes: Math.max(1, Math.ceil(wordCount / 200))
  };
}

export async function getLessonReadingMetricsForPlugin(
  installationId: string,
  organizationId: string,
  lessonId: string,
  actorId?: string
): Promise<LessonReadingMetrics> {
  await authorizePluginContentRead(installationId, organizationId, 'lesson.metadata:read', actorId);

  const readingSource = await getPluginLessonReadingSource(lessonId, organizationId);
  if (!readingSource) {
    throw new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404);
  }
  if (actorId) await assertCourseMemberOrOrgAdmin(readingSource.courseId, actorId);

  return computeLessonReadingMetrics(readingSource.content);
}

export async function getLatestPublishedCourseForPlugin(
  installationId: string,
  organizationId: string,
  actorId?: string
): Promise<PluginLatestPublishedCourse | null> {
  await authorizePluginContentRead(installationId, organizationId, 'course.metadata:read', actorId);

  return getPluginLatestPublishedCourse(organizationId);
}

export async function listCoursesForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  options?: { limit?: number; cursor?: string }
): Promise<{ items: TPluginApiCourseMetadata[]; nextCursor: string | null }> {
  const authorization = await authorizePluginContentRead(
    installationId,
    organizationId,
    'course.metadata:read',
    actorId
  );

  return getPluginCoursesList(organizationId, actorId, authorization.organizationRole === 'admin', options);
}

export async function getCourseForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string
): Promise<TPluginApiCourseMetadata> {
  const authorization = await authorizePluginContentRead(
    installationId,
    organizationId,
    'course.metadata:read',
    actorId
  );

  const course = await getPluginCourseById(
    organizationId,
    courseId,
    actorId,
    authorization.organizationRole === 'admin'
  );
  if (!course) {
    throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
  }

  return course;
}

export async function listLessonsForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string,
  options?: { limit?: number; cursor?: string }
): Promise<{ items: TPluginApiLessonMetadata[]; nextCursor: string | null }> {
  await authorizePluginContentRead(installationId, organizationId, 'lesson.metadata:read', actorId);
  await assertCourseMemberOrOrgAdmin(courseId, actorId);

  const result = await getPluginLessonsByCourseId(organizationId, courseId, options);
  if (!result) {
    throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
  }

  const items: TPluginApiLessonMetadata[] = result.items.map((item) => {
    const metrics = computeLessonReadingMetrics(item.content);
    return {
      id: item.id,
      courseId: item.courseId,
      title: item.title,
      type: 'lesson',
      order: Number(item.order),
      published: Boolean(item.public),
      wordCount: metrics.wordCount,
      estimatedMinutes: metrics.estimatedMinutes,
      createdAt: item.createdAt ?? new Date().toISOString(),
      updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString()
    };
  });

  return { items, nextCursor: result.nextCursor };
}

export async function getLessonForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  lessonId: string
): Promise<TPluginApiLessonMetadata> {
  await authorizePluginContentRead(installationId, organizationId, 'lesson.metadata:read', actorId);

  const lesson = await getPluginLessonById(organizationId, lessonId);
  if (!lesson) {
    throw new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404);
  }
  await assertCourseMemberOrOrgAdmin(lesson.courseId, actorId);

  const metrics = computeLessonReadingMetrics(lesson.content);

  return {
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    type: 'lesson',
    order: Number(lesson.order),
    published: Boolean(lesson.public),
    wordCount: metrics.wordCount,
    estimatedMinutes: metrics.estimatedMinutes,
    createdAt: lesson.createdAt ?? new Date().toISOString(),
    updatedAt: lesson.updatedAt ?? lesson.createdAt ?? new Date().toISOString()
  };
}

export async function getCourseStructureForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string
): Promise<TPluginApiCourseStructure> {
  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'course.content:read'
  });

  await assertCourseMemberOrOrgAdmin(courseId, actorId);

  const structure = await getPluginCourseStructure(
    organizationId,
    courseId,
    actorId,
    authorization.organizationRole === 'admin'
  );

  if (!structure) {
    throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
  }

  return ZPluginApiCourseStructure.parse(structure);
}

export async function getLessonContentForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  lessonId: string
): Promise<TPluginApiLessonContent> {
  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'lesson.content:read'
  });

  const lessonContext = await getPluginLessonAccessContext(lessonId, organizationId);
  if (!lessonContext) {
    throw new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404);
  }

  await assertCourseMemberOrOrgAdmin(lessonContext.courseId, actorId);

  const raw = await getPluginLessonContent(
    organizationId,
    lessonId,
    actorId,
    authorization.organizationRole === 'admin'
  );

  if (!raw) {
    throw new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404);
  }

  const metrics = computeLessonReadingMetrics(raw.content);

  const payload: TPluginApiLessonContent = {
    id: raw.id,
    courseId: raw.courseId,
    title: raw.title,
    type: 'lesson',
    order: raw.order,
    content: raw.content,
    attachments: raw.attachments,
    wordCount: metrics.wordCount,
    estimatedMinutes: metrics.estimatedMinutes,
    updatedAt: raw.updatedAt
  };

  return ZPluginApiLessonContent.parse(payload);
}
