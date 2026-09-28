import { db, type DbOrTxClient } from '@db/drizzle';
import {
  countCourseStudents,
  countOrgTemplates,
  canUseCourseTemplate,
  getCourseById,
  getCourseOrganizationId,
  getCourseSectionsByCourseId,
  getExercisesByCourseId,
  getLessonsByCourseId,
  getQuestionsByExerciseIds,
  listGlobalTemplateCards,
  listOrgTemplateCards,
  listTemplateHighlights,
  lockOrganizationForUpdate,
  updateCourse
} from '@db/queries';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { generateUniqueCourseSlug } from '@cio/core/services/course/landing-page';
import { env } from '@cio/core/config/env';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { isSelfEnrollmentAllowed } from '@cio/utils/functions';
import { getPlanLimit } from '@cio/utils/plans';
import { slugifyTitle } from '@cio/utils/validation';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { cloneCourse } from '@api/services/course/clone';

async function assertTemplateCapacity(orgId: string, dbClient: DbOrTxClient = db) {
  const plan = await getActiveOrganizationPlan(orgId, dbClient);
  const limit = getPlanLimit('templates', plan?.planName);
  if (!Number.isFinite(limit)) return;

  const used = await countOrgTemplates(orgId, dbClient);
  if (used >= limit) {
    throw new AppError(
      `Your plan includes ${limit} template${limit === 1 ? '' : 's'}`,
      ErrorCodes.UPGRADE_REQUIRED,
      403
    );
  }
}

async function requireOrgCourse(courseId: string, orgId: string, dbClient: DbOrTxClient = db) {
  const [course] = await getCourseById(courseId, dbClient);
  if (!course || course.status === 'DELETED') {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const courseOrgId = await getCourseOrganizationId(courseId, dbClient);
  if (courseOrgId !== orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return course;
}

async function requireUsableTemplate(templateId: string, orgId: string) {
  const [template] = await getCourseById(templateId);
  if (!template) {
    throw new AppError('Template not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const templateOrgId = await getCourseOrganizationId(templateId);
  const allowed = canUseCourseTemplate(template, templateOrgId, orgId, env.PLATFORM_TEMPLATES_ORG_ID);
  if (!allowed) {
    throw new AppError('Template not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const platformOrgId = env.PLATFORM_TEMPLATES_ORG_ID;
  const curated = Boolean(platformOrgId && templateOrgId === platformOrgId && template.publicForAll);

  return { template, templateOrgId, global: templateOrgId !== orgId, curated };
}

export async function listCourseTemplates(orgId: string) {
  const orgCards = await listOrgTemplateCards(orgId);
  const platformOrgId = env.PLATFORM_TEMPLATES_ORG_ID;
  const globalCards = platformOrgId ? await listGlobalTemplateCards(platformOrgId) : [];
  const globalIds = new Set(globalCards.map((card) => card.id));

  return {
    org: orgCards.filter((card) => !globalIds.has(card.id)),
    global: globalCards
  };
}

function templatePreviewSettings(
  template: {
    type: string | null;
    certificate: {
      isDownloadable?: boolean;
      deadline?: string | null;
      threshold?: number;
      requiredExerciseId?: string | null;
      exerciseMinScorePercent?: number | null;
    } | null;
    metadata: {
      progressionMode?: 'free' | 'sequential';
      grading?: boolean;
      commentsEnabled?: boolean;
      lessonDownload?: boolean;
      allowSelfEnrollment?: boolean | null;
      allowNewStudent?: boolean | null;
      aiTutor?: { enabled?: boolean };
    } | null;
    compliance: {
      retakeIntervalMonths: number;
      isMandatory?: boolean;
    } | null;
  },
  exercises: { id: string; title: string }[]
) {
  const certificate = template.certificate ?? {};
  const metadata = template.metadata ?? {};
  const certificateOn = certificate.isDownloadable === true;
  const requiredExerciseId = certificate.requiredExerciseId ?? null;
  const finalExercise = requiredExerciseId
    ? exercises.find((exercise) => exercise.id === requiredExerciseId)
    : undefined;
  const score = typeof certificate.exerciseMinScorePercent === 'number' ? certificate.exerciseMinScorePercent : 100;
  const compliance =
    template.type === 'COMPLIANCE' && template.compliance
      ? {
          months: template.compliance.retakeIntervalMonths,
          mandatory: template.compliance.isMandatory === true
        }
      : null;

  return {
    certificate: certificateOn,
    deadline: certificate.deadline ?? null,
    threshold: certificateOn ? (typeof certificate.threshold === 'number' ? certificate.threshold : 100) : null,
    finalExercise: finalExercise ? { title: finalExercise.title, score } : null,
    sequential: metadata.progressionMode === 'sequential',
    grading: metadata.grading === true,
    commentsOff: metadata.commentsEnabled === false,
    lessonDownload: metadata.lessonDownload === true,
    selfEnrollment: isSelfEnrollmentAllowed(metadata),
    aiTutor: metadata.aiTutor?.enabled === true,
    compliance
  };
}

export async function getCourseTemplatePreview(templateId: string, orgId: string) {
  const { template, global, curated } = await requireUsableTemplate(templateId, orgId);
  const [sections, lessons, exercises, highlights] = await Promise.all([
    getCourseSectionsByCourseId(templateId),
    getLessonsByCourseId(templateId),
    getExercisesByCourseId(templateId),
    global ? listTemplateHighlights([templateId]) : Promise.resolve([])
  ]);
  const questions =
    exercises.length > 0 ? await getQuestionsByExerciseIds(exercises.map((exercise) => exercise.id)) : [];
  const questionCountByExercise = new Map<string, number>();
  for (const question of questions) {
    questionCountByExercise.set(question.exerciseId, (questionCountByExercise.get(question.exerciseId) ?? 0) + 1);
  }

  const outline = sections
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((section) => ({
      id: section.id,
      title: section.title,
      lessons: lessons
        .filter((lesson) => lesson.sectionId === section.id)
        .sort((left, right) => left.order - right.order)
        .map((lesson) => ({ id: lesson.id, title: lesson.title })),
      exercises: exercises
        .filter((exercise) => exercise.sectionId === section.id)
        .sort((left, right) => left.order - right.order)
        .map((exercise) => ({
          id: exercise.id,
          title: exercise.title,
          questionCount: questionCountByExercise.get(exercise.id) ?? 0
        }))
    }));

  const unsectionedLessons = lessons.filter((lesson) => !lesson.sectionId);
  const unsectionedExercises = exercises.filter((exercise) => !exercise.sectionId);
  if (unsectionedLessons.length > 0 || unsectionedExercises.length > 0) {
    outline.push({
      id: '',
      title: null,
      lessons: unsectionedLessons
        .sort((left, right) => left.order - right.order)
        .map((lesson) => ({ id: lesson.id, title: lesson.title })),
      exercises: unsectionedExercises
        .sort((left, right) => left.order - right.order)
        .map((exercise) => ({
          id: exercise.id,
          title: exercise.title,
          questionCount: questionCountByExercise.get(exercise.id) ?? 0
        }))
    });
  }

  return {
    id: template.id,
    title: template.title,
    description: template.description,
    type: template.type,
    bannerImage: template.bannerImage,
    global,
    curated,
    counts: {
      sections: sections.length,
      lessons: lessons.length,
      exercises: exercises.length
    },
    highlights: highlights.map((highlight) => ({
      title: highlight.title,
      description: highlight.description
    })),
    settings: templatePreviewSettings(template, exercises),
    outline
  };
}

export async function saveCourseAsTemplate(courseId: string, orgId: string, userId: string, title: string) {
  const slug = await generateUniqueCourseSlug(slugifyTitle(title));
  const course = await db.transaction(async (tx) => {
    await lockOrganizationForUpdate(orgId, tx);
    await requireOrgCourse(courseId, orgId, tx);
    await assertTemplateCapacity(orgId, tx);

    return cloneCourse(
      courseId,
      {
        title,
        userId,
        slug,
        organizationId: orgId,
        isTemplate: true,
        isPublished: false
      },
      tx
    );
  });
  await invalidateOrgStats(orgId);

  return course;
}

export async function duplicateCourseTemplate(templateId: string, orgId: string, userId: string) {
  const template = await requireOrgCourse(templateId, orgId);
  if (!template.isTemplate) {
    throw new AppError('Course is not a template', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return saveCourseAsTemplate(templateId, orgId, userId, template.title);
}

export async function convertCourseToTemplate(courseId: string, orgId: string) {
  const updated = await db.transaction(async (tx) => {
    await lockOrganizationForUpdate(orgId, tx);
    const current = await requireOrgCourse(courseId, orgId, tx);
    if (current.isTemplate) {
      throw new AppError('Course is already a template', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const students = await countCourseStudents(courseId, tx);
    if (students > 0) {
      throw new AppError(`Has ${students} students — save a copy instead`, ErrorCodes.VALIDATION_ERROR, 400);
    }

    await assertTemplateCapacity(orgId, tx);
    const saved = await updateCourse(
      courseId,
      {
        isTemplate: true,
        isPublished: false,
        templateId: null
      },
      tx
    );
    if (!saved) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    return saved;
  });
  await invalidateOrgStats(orgId);

  return updated;
}

export async function createCourseFromTemplate(templateId: string, orgId: string, userId: string, title: string) {
  await requireUsableTemplate(templateId, orgId);
  const slug = await generateUniqueCourseSlug(slugifyTitle(title));

  return cloneCourse(templateId, {
    title,
    userId,
    slug,
    organizationId: orgId,
    isTemplate: false,
    isPublished: false,
    templateId,
    setSourceIds: true
  });
}
