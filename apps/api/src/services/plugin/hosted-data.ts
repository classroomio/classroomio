import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from './authorization';
import { assertCourseMemberOrOrgAdmin } from '@api/services/v1/shared';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { getLessonCompletionService, upsertLessonCompletionService } from '@api/services/lesson';
import { calcCourseProgressPercent } from '@api/utils/course-completion';
import { ContentType } from '@cio/utils/constants';
import {
  getCourseById,
  getCourseProgress,
  getCourseWithOrgData,
  getOrganizationById,
  getPluginCourseById,
  getPluginCoursesList,
  getPluginCourseStructure,
  getPluginExerciseById,
  getPluginExercisesList,
  getPluginIssuedCertificateById,
  getPluginIssuedCertificatesList,
  getPluginLessonAccessContext,
  getPluginLessonById,
  getPluginLessonContent,
  getPluginLessonsByCourseId,
  getProfileById,
  recordPluginAuditEvent,
  updateCourse
} from '@cio/db/queries';
import {
  ZPluginApiCourseStructure,
  ZPluginApiExerciseMetadata,
  ZPluginApiIssuedCertificate,
  ZPluginApiLessonContent,
  type TPluginApiCourseMetadata,
  type TPluginApiExerciseMetadata,
  type TPluginApiIssuedCertificate,
  type TPluginApiLessonContent,
  type TPluginApiLessonMetadata
} from '@cio/utils/validation/plugin';
import { CERTIFICATE_TEMPLATES, DEFAULT_CERTIFICATE_DESIGN, resolveCertificateDesign } from '@cio/certificates';

function readingMetrics(content: string | null) {
  const text = (content ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = text ? text.split(' ').length : 0;

  return { wordCount, estimatedMinutes: Math.max(1, Math.ceil(wordCount / 200)) };
}

export async function getHostedIdentity(installationId: string, organizationId: string, actorId: string) {
  const auth = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'identity.profile:read'
  });
  const profile = await getProfileById(actorId);
  if (!profile) throw new AppError('Profile not found', 'NOT_FOUND', 404);
  const displayName = profile.fullname?.trim() || profile.username?.trim() || 'User';

  return {
    id: profile.id,
    displayName,
    avatarUrl: profile.avatarUrl ?? null,
    locale: profile.locale ?? 'en',
    role: auth.organizationRole ?? 'student'
  };
}

export async function getHostedOrganization(installationId: string, organizationId: string, actorId: string) {
  await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'organization.profile:read'
  });
  const organization = await getOrganizationById(organizationId);
  if (!organization) throw new AppError('Organization not found', 'NOT_FOUND', 404);

  return {
    id: organization.id,
    name: organization.name,
    avatarUrl: organization.avatarUrl ?? null,
    locale: organization.settings?.language?.locale ?? 'en'
  };
}

export async function listHostedCourses(
  installationId: string,
  organizationId: string,
  actorId: string,
  options: { limit?: number; cursor?: string; publishedOnly?: boolean }
) {
  const auth = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'course.metadata:read'
  });

  return getPluginCoursesList(organizationId, actorId, auth.organizationRole !== 'student', options);
}

export async function getHostedCourse(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string
): Promise<TPluginApiCourseMetadata> {
  const auth = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'course.metadata:read'
  });
  const course = await getPluginCourseById(organizationId, courseId, actorId, auth.organizationRole !== 'student');
  if (!course) throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);

  return course;
}

export async function getHostedCourseStructure(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string
) {
  const auth = await authorizePluginRequest({
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
    auth.organizationRole === 'admin'
  );
  if (!structure) throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);

  return ZPluginApiCourseStructure.parse(structure);
}

export async function listHostedLessons(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string,
  options: { limit?: number; cursor?: string }
) {
  await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'lesson.metadata:read'
  });
  await assertCourseMemberOrOrgAdmin(courseId, actorId);
  const result = await getPluginLessonsByCourseId(organizationId, courseId, options);
  if (!result) throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
  const items: TPluginApiLessonMetadata[] = result.items.map((lesson) => {
    const metrics = readingMetrics(lesson.content);

    return {
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      type: 'lesson',
      order: Number(lesson.order),
      published: Boolean(lesson.public),
      ...metrics,
      lessonAt: lesson.lessonAt,
      callUrl: lesson.callUrl,
      recordingUrl: lesson.recordingUrl,
      sessionDurationMinutes: lesson.sessionDurationMinutes,
      instructor: lesson.instructor,
      createdAt: lesson.createdAt ?? new Date().toISOString(),
      updatedAt: lesson.updatedAt ?? lesson.createdAt ?? new Date().toISOString()
    };
  });

  return { items, nextCursor: result.nextCursor };
}

export async function getHostedLesson(
  installationId: string,
  organizationId: string,
  actorId: string,
  lessonId: string
): Promise<TPluginApiLessonMetadata> {
  await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'lesson.metadata:read'
  });
  const lesson = await getPluginLessonById(organizationId, lessonId);
  if (!lesson) throw new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404);
  await assertCourseMemberOrOrgAdmin(lesson.courseId, actorId);
  const metrics = readingMetrics(lesson.content);

  return {
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    type: 'lesson',
    order: Number(lesson.order),
    published: Boolean(lesson.public),
    ...metrics,
    lessonAt: lesson.lessonAt,
    callUrl: lesson.callUrl,
    recordingUrl: lesson.recordingUrl,
    sessionDurationMinutes: lesson.sessionDurationMinutes,
    instructor: lesson.instructor,
    createdAt: lesson.createdAt ?? new Date().toISOString(),
    updatedAt: lesson.updatedAt ?? lesson.createdAt ?? new Date().toISOString()
  };
}

export async function getHostedLessonContent(
  installationId: string,
  organizationId: string,
  actorId: string,
  lessonId: string
): Promise<TPluginApiLessonContent> {
  const auth = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'lesson.content:read'
  });
  const lessonContext = await getPluginLessonAccessContext(lessonId, organizationId);
  if (!lessonContext) throw new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404);
  await assertCourseMemberOrOrgAdmin(lessonContext.courseId, actorId);
  const lesson = await getPluginLessonContent(organizationId, lessonId, actorId, auth.organizationRole === 'admin');
  if (!lesson) throw new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404);
  const metrics = readingMetrics(lesson.content);
  const payload = { ...lesson, type: 'lesson', ...metrics };

  return ZPluginApiLessonContent.parse(payload);
}

export async function listHostedExercises(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string,
  options: { limit?: number; cursor?: string; lessonId?: string }
) {
  const auth = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'exercise.metadata:read'
  });
  await assertCourseMemberOrOrgAdmin(courseId, actorId);
  const canReadAll = auth.organizationRole === 'admin' || auth.organizationRole === 'tutor';
  const result = await getPluginExercisesList(organizationId, courseId, actorId, canReadAll, options);

  return { items: result.items.map((item) => ZPluginApiExerciseMetadata.parse(item)), nextCursor: result.nextCursor };
}

export async function getHostedExercise(
  installationId: string,
  organizationId: string,
  actorId: string,
  exerciseId: string
): Promise<TPluginApiExerciseMetadata> {
  const auth = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'exercise.metadata:read'
  });
  const canReadAll = auth.organizationRole === 'admin' || auth.organizationRole === 'tutor';
  const exercise = await getPluginExerciseById(organizationId, exerciseId, actorId, canReadAll);
  if (!exercise) throw new AppError('Exercise not found', 'EXERCISE_NOT_FOUND', 404);
  await assertCourseMemberOrOrgAdmin(exercise.courseId, actorId);

  return ZPluginApiExerciseMetadata.parse(exercise);
}

async function authorizeLessonProgress(
  installationId: string,
  organizationId: string,
  actorId: string,
  lessonId: string,
  scope: 'learner.progress:read' | 'learner.progress:write'
) {
  await authorizePluginRequest({ installationId, organizationId, actorId, requiredScope: scope });
  const lesson = await getPluginLessonAccessContext(lessonId, organizationId);
  if (!lesson) throw new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404);
  await assertEnrolledStudentContentAccess({
    courseId: lesson.courseId,
    profileId: actorId,
    contentId: lessonId,
    type: ContentType.Lesson
  });

  return lesson.courseId;
}

export async function getHostedLessonProgress(
  installationId: string,
  organizationId: string,
  actorId: string,
  lessonId: string
) {
  await authorizeLessonProgress(installationId, organizationId, actorId, lessonId, 'learner.progress:read');
  const completion = await getLessonCompletionService(lessonId, actorId);

  return { isComplete: Boolean(completion?.isComplete) };
}

export async function setHostedLessonProgress(
  installationId: string,
  organizationId: string,
  actorId: string,
  lessonId: string,
  isComplete: boolean
) {
  const courseId = await authorizeLessonProgress(
    installationId,
    organizationId,
    actorId,
    lessonId,
    'learner.progress:write'
  );
  const completion = await upsertLessonCompletionService(lessonId, actorId, isComplete);
  if (isComplete) void evaluateCourseCertification(courseId, actorId);

  return { isComplete: Boolean(completion.isComplete) };
}

export async function getHostedCourseProgress(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string
) {
  await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'learner.progress:read'
  });
  const course = await getPluginCourseById(organizationId, courseId);
  if (!course) throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
  const progress = await getCourseProgress(courseId, actorId);
  if (!progress.groupMemberId) throw new AppError('Learner is not enrolled in course', 'FORBIDDEN', 403);
  const percentage = calcCourseProgressPercent({
    lessonsCompleted: progress.lessonsCompleted,
    totalLessons: progress.lessonsCount,
    exercisesCompleted: progress.exercisesCompleted,
    exercisesCount: progress.exercisesCount
  });

  return {
    courseId,
    percentage,
    lessonsCompleted: progress.lessonsCompleted,
    totalLessons: progress.lessonsCount,
    isComplete: percentage >= 100 || Boolean(progress.certificateEarnedAt),
    certificateEarnedAt: progress.certificateEarnedAt
  };
}

export async function listHostedCertificates(
  installationId: string,
  organizationId: string,
  actorId: string,
  options: { limit?: number; cursor?: string; courseId?: string }
) {
  const auth = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'certificate.issued:read'
  });
  if (options.courseId) await assertCourseMemberOrOrgAdmin(options.courseId, actorId);
  const canReadAll = auth.organizationRole === 'admin' || auth.organizationRole === 'tutor';
  const result = await getPluginIssuedCertificatesList(organizationId, options.courseId, actorId, canReadAll, options);

  return { items: result.items.map((item) => ZPluginApiIssuedCertificate.parse(item)), nextCursor: result.nextCursor };
}

export async function getHostedCertificate(
  installationId: string,
  organizationId: string,
  actorId: string,
  certificateId: string
): Promise<TPluginApiIssuedCertificate> {
  const auth = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'certificate.issued:read'
  });
  const canReadAll = auth.organizationRole === 'admin' || auth.organizationRole === 'tutor';
  const certificate = await getPluginIssuedCertificateById(organizationId, certificateId, actorId, canReadAll);
  if (!certificate) throw new AppError('Certificate not found', 'CERTIFICATE_NOT_FOUND', 404);

  return ZPluginApiIssuedCertificate.parse(certificate);
}

export async function listHostedCertificateTemplates(installationId: string, organizationId: string, actorId: string) {
  await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'certificate.template:read'
  });

  return CERTIFICATE_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.label,
    style: template.id,
    description: template.description,
    accentColor: DEFAULT_CERTIFICATE_DESIGN.accentColor,
    subtitle: DEFAULT_CERTIFICATE_DESIGN.subtitle ?? '',
    version: 1,
    design: { ...DEFAULT_CERTIFICATE_DESIGN, templateId: template.id } as unknown as Record<string, unknown>
  }));
}

export async function getHostedAppliedCertificateTemplate(
  installationId: string,
  organizationId: string,
  actorId: string,
  courseId: string
) {
  await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'certificate.template:read',
    allowedRoles: ['admin', 'tutor']
  });
  const organizationData = await getCourseWithOrgData(courseId);
  if (!organizationData || organizationData.orgId !== organizationId) {
    throw new AppError('Course not found in this organization', 'NOT_FOUND', 404);
  }
  const [course] = await getCourseById(courseId);
  if (!course) throw new AppError('Course not found', 'NOT_FOUND', 404);
  const certificate = (course.certificate as Record<string, unknown>) ?? {};
  const design = certificate.design
    ? (resolveCertificateDesign({ design: certificate.design as never }) as unknown as Record<string, unknown>)
    : null;

  return {
    courseId,
    isDownloadable: Boolean(certificate.isDownloadable),
    design,
    sourceTemplate: certificate.sourceTemplate ?? null
  };
}

export async function applyHostedCertificateTemplate(input: {
  installationId: string;
  organizationId: string;
  actorId: string;
  courseId: string;
  externalTemplateId: string;
  externalTemplateVersion: number;
  name: string;
  design: unknown;
}) {
  const auth = await authorizePluginRequest({
    installationId: input.installationId,
    organizationId: input.organizationId,
    actorId: input.actorId,
    requiredScope: 'certificate.template:write',
    allowedRoles: ['admin', 'tutor']
  });
  const organizationData = await getCourseWithOrgData(input.courseId);
  if (!organizationData || organizationData.orgId !== input.organizationId) {
    throw new AppError('Course not found in this organization', 'NOT_FOUND', 404);
  }
  const [course] = await getCourseById(input.courseId);
  if (!course) throw new AppError('Course not found', 'NOT_FOUND', 404);
  const normalizedDesign = resolveCertificateDesign({ design: input.design as never });
  const design = normalizedDesign as unknown as Record<string, unknown>;
  const appliedAt = new Date().toISOString();
  const existing = (course.certificate as Record<string, unknown>) ?? {};
  const certificate = {
    ...existing,
    isDownloadable: true,
    design,
    sourceTemplate: {
      pluginId: auth.installation.pluginId,
      externalTemplateId: input.externalTemplateId,
      version: input.externalTemplateVersion,
      name: input.name,
      appliedAt
    }
  };
  await updateCourse(input.courseId, { certificate: certificate as never });
  await recordPluginAuditEvent({
    installationId: input.installationId,
    organizationId: input.organizationId,
    actorProfileId: input.actorId,
    action: 'certificate_template.applied',
    resource: input.courseId,
    outcome: 'success',
    metadata: {
      externalTemplateId: input.externalTemplateId,
      templateVersion: input.externalTemplateVersion,
      name: input.name
    }
  });

  return { courseId: input.courseId, appliedAt, templateVersion: input.externalTemplateVersion, design };
}
