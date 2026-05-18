import { AppError } from '@api/utils/errors';
import { getDocumentText } from '@api/services/agent/document';
import { redis } from '@api/utils/redis/redis';
import { getCourseSectionBinding, getExerciseCourseBinding, getLessonCourseBinding } from '@cio/db/queries/agent';
import { z } from 'zod';
import { CoursePlanFieldsSchema, type CourseTemplateId } from '@cio/ai-assistant';

type ResourceOwnershipRow = {
  courseId: string | null;
  title?: string | null;
};

function buildResourceOwnershipError(params: {
  resourceType: 'Lesson' | 'Exercise' | 'Section';
  resourceId: string;
  courseId: string;
  resource?: ResourceOwnershipRow;
}) {
  const { resourceType, resourceId, resource } = params;

  if (!resource) {
    return new AppError(
      `${resourceType} ${resourceId} does not exist in this course. The ID may have been hallucinated — call get_course_structure to fetch real IDs and retry.`,
      'RESOURCE_NOT_IN_COURSE',
      403
    );
  }

  const titleSuffix = resource.title ? ` (${resource.title})` : '';

  return new AppError(
    `${resourceType} ${resourceId}${titleSuffix} belongs to a different course. Call get_course_structure to fetch IDs for the current course and retry.`,
    'RESOURCE_NOT_IN_COURSE',
    403
  );
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertValidUuid(
  resourceType: 'Lesson' | 'Exercise' | 'Section' | 'ExerciseSection',
  value: string
): void {
  if (!UUID_REGEX.test(value)) {
    throw new AppError(
      `${resourceType} id "${value}" is not a valid UUID. Call get_course_structure to fetch real IDs and try again — never invent or guess UUIDs.`,
      'INVALID_RESOURCE_ID',
      400
    );
  }
}

export async function verifyLessonBelongsToCourse(lessonId: string, courseId: string): Promise<void> {
  assertValidUuid('Lesson', lessonId);

  const lesson = await getLessonCourseBinding(lessonId);

  if (!lesson || lesson.courseId !== courseId) {
    throw buildResourceOwnershipError({
      resourceType: 'Lesson',
      resourceId: lessonId,
      courseId,
      resource: lesson
    });
  }
}

export async function verifyExerciseBelongsToCourse(exerciseId: string, courseId: string): Promise<void> {
  assertValidUuid('Exercise', exerciseId);

  const exercise = await getExerciseCourseBinding(exerciseId);

  if (!exercise || exercise.courseId !== courseId) {
    throw buildResourceOwnershipError({
      resourceType: 'Exercise',
      resourceId: exerciseId,
      courseId,
      resource: exercise
    });
  }
}

export async function verifySectionBelongsToCourse(sectionId: string, courseId: string): Promise<void> {
  assertValidUuid('Section', sectionId);

  const section = await getCourseSectionBinding(sectionId);

  if (!section || section.courseId !== courseId) {
    throw buildResourceOwnershipError({
      resourceType: 'Section',
      resourceId: sectionId,
      courseId,
      resource: section
    });
  }
}

type AttachedMessage = { metadata?: { attachment?: { documentId?: string } } };

export function collectDocumentIds(messages: unknown[], currentDocumentId?: string): string[] {
  const ids = new Set<string>();

  for (const msg of messages as AttachedMessage[]) {
    const id = msg?.metadata?.attachment?.documentId;

    if (id) ids.add(id);
  }

  if (currentDocumentId) ids.add(currentDocumentId);

  return Array.from(ids);
}

export async function loadDocumentsText(documentIds: string[], userId: string): Promise<string | undefined> {
  const loaded = await Promise.all(
    documentIds.map(async (id) => {
      const text = await getDocumentText(id, userId, redis);

      return text ? { id, text } : null;
    })
  );

  const sections = loaded
    .filter((d): d is { id: string; text: string } => d !== null)
    .map((d, i) => `--- Document ${i + 1} (id: ${d.id}) ---\n${d.text}`);

  return sections.length > 0 ? sections.join('\n\n') : undefined;
}

type PlanMetadataMessage = {
  role?: string;
  metadata?: {
    plan?: {
      action?: string;
      payload?: unknown;
    };
  };
};

export function getLatestImplementationPlan(messages: unknown[]): z.infer<typeof CoursePlanFieldsSchema> | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index] as PlanMetadataMessage;

    if (message?.role !== 'user') {
      continue;
    }

    if (message?.metadata?.plan?.action !== 'implement_course_plan') {
      continue;
    }

    const parsedPlan = CoursePlanFieldsSchema.safeParse(message.metadata.plan.payload);

    if (parsedPlan.success) {
      return parsedPlan.data;
    }
  }

  return undefined;
}

const COURSE_TEMPLATE_ID_SET = new Set<CourseTemplateId>(['product_101', 'product_onboarding', 'expert_on_x']);

export function getActiveCourseTemplateId(messages: unknown[]): CourseTemplateId | undefined {
  for (const message of messages) {
    const candidate = message as {
      role?: string;
      metadata?: { template?: { id?: string } };
    };

    if (candidate.role !== 'user') {
      continue;
    }

    const id = candidate.metadata?.template?.id;

    if (id && COURSE_TEMPLATE_ID_SET.has(id as CourseTemplateId)) {
      return id as CourseTemplateId;
    }
  }

  return undefined;
}
