import { AppError, ErrorCodes } from '@api/utils/errors';
import { env } from '@cio/core/config/env';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { createCourse, updateCourse } from '@cio/core/services/course/course';
import { reorderCourseContent, updateCourseContent } from '@cio/core/services/course/content';
import { DEFAULT_CONTENT_GROUPING } from '@cio/core/services/course/utils';
import {
  createExercise,
  deleteExerciseService,
  getExercise,
  listExercises,
  replaceExerciseService
} from '@api/services/exercise';
import {
  createCourseSection,
  deleteCourseSectionService,
  listCourseSections,
  updateCourseSectionService
} from '@cio/core/services/course/section';
import { createLesson, listLessons, updateLessonService, deleteLessonService } from '@api/services/lesson';
import {
  deleteLessonLanguageService,
  upsertLessonLanguageService,
  updateLessonLanguageService
} from '@cio/core/services/lesson-language';
import {
  createCourseImportDraft,
  getCourseImportDraftById,
  getCourseImportDraftByIdempotencyKey,
  updateCourseImportDraft
} from '@cio/db/queries/course-import';
import { ZLessonVideoItem } from '@cio/utils/validation/lesson';
import { getCourseById, isCourseSlugTaken, updateCourseSlug } from '@cio/db/queries/course';
import { getLessonLanguagesByLessonIds } from '@cio/db/queries/lesson';
import { getOrganizationById } from '@cio/db/queries/organization';
import { getCourseTagsForOrganization } from '@cio/db/queries/tag';
import type { TCourse, TCourseImportDraft, TLessonLanguage, TLocale, TOrganization } from '@db/types';
import {
  type TCourseImportDraftCreate,
  type TCourseImportDraftCreateFromCourse,
  type TCourseImportDraftPayload,
  type TCourseImportDraftPublish,
  type TCourseImportDraftPublishToCourse,
  type TCourseImportDraftExercise,
  type TCourseImportDraftUpdate,
  getDraftRootEntries,
  ZCourseImportDraftPayload,
  ZCourseImportWarning
} from '@cio/utils/validation/course-import';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { assignCourseTagsByName } from '@api/services/tag';
import { generateSlug } from '@cio/utils/functions';
import { ZodError } from 'zod';

type DraftSummary = {
  sectionCount: number;
  lessonCount: number;
  exerciseCount: number;
  localeCount: number;
  warningCount: number;
};

type CourseStructureSnapshot = {
  courseId: string;
  draft: TCourseImportDraftPayload;
};

type PublishDraftResult = {
  courseId: string;
  courseUrl: string;
  bannerImageUrl: string | null;
  tagNames: string[];
  createdSections: number;
  createdLessons: number;
  createdExercises: number;
  localeCount: number;
};

type PublishDraftToExistingCourseResult = PublishDraftResult & {
  updatedSections: number;
  updatedLessons: number;
  updatedExercises: number;
  createdLessonLanguages: number;
  updatedLessonLanguages: number;
  deletedSections: number;
  deletedLessons: number;
  deletedExercises: number;
  deletedLessonLanguages: number;
  untouchedSections: number;
  untouchedLessons: number;
  untouchedExercises: number;
};

function buildDraftSummary(draft: TCourseImportDraftPayload): DraftSummary {
  return {
    sectionCount: draft.sections.length,
    lessonCount: draft.lessons.length,
    exerciseCount: draft.exercises?.length ?? 0,
    localeCount: new Set(draft.lessonLanguages.map((item) => item.locale)).size,
    warningCount: draft.warnings.length
  };
}

async function generateUniqueCourseSlug(baseSlug: string): Promise<string> {
  let suffix = 0;
  let candidate = baseSlug;

  while (true) {
    const taken = await isCourseSlugTaken(candidate);
    if (!taken) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

async function ensureCourseSlug(courseId: string, title: string | null | undefined): Promise<string> {
  const [course] = await getCourseById(courseId);
  if (course?.slug) {
    return course.slug;
  }

  const baseSlug = generateSlug(title, { fallback: 'course' });
  const uniqueSlug = await generateUniqueCourseSlug(baseSlug);
  const updated = await updateCourseSlug(courseId, uniqueSlug);

  if (!updated) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return updated.slug ?? uniqueSlug;
}

async function resolveCourseUrl(organizationId: string, courseId: string, title: string) {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORG_NOT_FOUND, 404);
  }

  const slug = await ensureCourseSlug(courseId, title);
  return `${getDashboardBaseUrl(organization)}/course/${encodeURIComponent(slug)}`;
}

async function resolveUnsplashBannerImage(courseTitle: string, query?: string) {
  if (!env.UNSPLASH_API_KEY) {
    return null;
  }

  const searchQuery = (query?.trim() || courseTitle.trim() || 'education').slice(0, 120);
  const response = await fetch(
    `https://api.unsplash.com/search/photos?page=1&per_page=15&auto=format&fit=crop&w=2970&q=80&client_id=${env.UNSPLASH_API_KEY}&query=${encodeURIComponent(searchQuery)}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    results?: Array<{
      urls?: {
        regular?: string;
      };
    }>;
  };

  const photos = data.results ?? [];
  if (photos.length === 0) {
    return null;
  }

  const photo = photos[Math.floor(Math.random() * photos.length)];
  return photo?.urls?.regular ?? null;
}

async function resolvePublishBannerImage(
  title: string,
  overrides: Pick<TCourseImportDraftPublish, 'bannerImageQuery' | 'bannerImageUrl' | 'generateBannerImage'>
) {
  if (overrides.bannerImageUrl) {
    return overrides.bannerImageUrl;
  }

  if (!overrides.generateBannerImage && !overrides.bannerImageQuery) {
    return null;
  }

  try {
    return await resolveUnsplashBannerImage(title, overrides.bannerImageQuery);
  } catch (error) {
    console.error('resolvePublishBannerImage error:', error);
    return null;
  }
}

async function maybeApplyCourseBannerImage(courseId: string, imageUrl: string | null) {
  if (!imageUrl) {
    return null;
  }

  await updateCourse(courseId, {
    bannerImage: imageUrl
  });

  return imageUrl;
}

function normalizeDraftTagNames(tagNames: string[]) {
  return Array.from(new Map(tagNames.map((tag) => [tag.trim().toLowerCase(), tag.trim()])).values()).filter(Boolean);
}

function parseStoredDraft(record: TCourseImportDraft): TCourseImportDraftPayload {
  return ZCourseImportDraftPayload.parse(record.draft);
}

async function reserveDraftPublishedCourseId(
  orgId: string,
  draftId: string,
  draft: TCourseImportDraftPayload,
  existingSummary: TCourseImportDraft['summary'],
  courseId: string
) {
  await updateCourseImportDraft(orgId, draftId, {
    publishedCourseId: courseId,
    summary: {
      ...(existingSummary ?? {}),
      ...buildDraftSummary(draft),
      publishedCourseId: courseId
    }
  });
}

async function resetCourseContentForDraftRetry(courseId: string) {
  const [exercises, lessons, sections] = await Promise.all([
    listExercises(courseId),
    listLessons(courseId),
    listCourseSections(courseId)
  ]);

  for (const exercise of exercises) {
    await deleteExerciseService(exercise.id);
  }

  for (const lesson of lessons) {
    await deleteLessonService(lesson.id);
  }

  for (const section of sections) {
    await deleteCourseSectionService(section.id);
  }
}

async function assertCourseBelongsToOrganization(orgId: string, courseId: string) {
  const courseOrgId = await getCourseOrganizationId(courseId);

  if (!courseOrgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  if (courseOrgId !== orgId) {
    throw new AppError('Invalid permissions', ErrorCodes.UNAUTHORIZED, 403);
  }
}

async function getCourseRecord(orgId: string, courseId: string): Promise<TCourse> {
  await assertCourseBelongsToOrganization(orgId, courseId);

  const [course] = await getCourseById(courseId);
  if (!course) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return course;
}

/**
 * Course order for each top-level draft entry, keyed `kind:externalId`. Throws when the draft's top-level orders are invalid.
 */
function getDraftRootOrders(draft: TCourseImportDraftPayload) {
  const rootEntries = getDraftRootEntries(draft);
  if (!rootEntries) {
    throw new AppError(
      'Draft top-level orders must be a contiguous 1-based sequence',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  return new Map(rootEntries.map((entry) => [`${entry.kind}:${entry.externalId}`, entry.order]));
}

type DraftContentIds = {
  sectionIdMap: Map<string, string>;
  lessonIdMap: Map<string, string>;
  exerciseIdMap: Map<string, string>;
};

/**
 * Writes every top-level draft entry's position in one validated reorder. Replace mode runs it after its
 * writes and deletions so positions shifted along the way end where the draft puts them.
 */
async function applyDraftRootOrders(courseId: string, draft: TCourseImportDraftPayload, ids: DraftContentIds) {
  const rootEntries = getDraftRootEntries(draft) ?? [];
  const sections = rootEntries
    .filter((entry) => entry.kind === 'section')
    .map((entry) => ({ id: ids.sectionIdMap.get(entry.externalId)!, order: entry.order }));
  const items = rootEntries
    .filter((entry) => entry.kind !== 'section')
    .map((entry) => {
      const id =
        entry.kind === 'lesson' ? ids.lessonIdMap.get(entry.externalId) : ids.exerciseIdMap.get(entry.externalId);
      const type = entry.kind === 'lesson' ? ('LESSON' as const) : ('EXERCISE' as const);

      return { id: id!, type, sectionId: null, order: entry.order };
    });
  if (sections.length === 0 && items.length === 0) return;

  await reorderCourseContent(courseId, {
    ...(sections.length > 0 ? { sections } : {}),
    ...(items.length > 0 ? { items } : {})
  });
}

type MergeRootPlacement = {
  sectionIds: Set<string>;
  lessons: Array<{ id: string; sectionId: string | null }>;
  exercises: Array<{ id: string; sectionId: string | null; lessonId: string | null }>;
};

/**
 * Top-level positions, keyed `kind:externalId`, for the draft entries merge mode adds to the top level or moves
 * there, numbered after `lastRootOrder` in the draft's own order.
 */
function allocateMergeRootOrders(
  draft: TCourseImportDraftPayload,
  lastRootOrder: number,
  existing: MergeRootPlacement
) {
  const lessonsById = new Map(existing.lessons.map((lesson) => [lesson.id, lesson]));
  const exercisesById = new Map(existing.exercises.map((exercise) => [exercise.id, exercise]));
  const needsPosition = (kind: string, externalId: string) => {
    if (kind === 'section') return !existing.sectionIds.has(externalId);

    if (kind === 'lesson') {
      const lesson = lessonsById.get(externalId);
      return !lesson || Boolean(lesson.sectionId);
    }

    const exercise = exercisesById.get(externalId);
    return !exercise || Boolean(exercise.sectionId || exercise.lessonId);
  };

  const orders = new Map<string, number>();
  for (const entry of getDraftRootEntries(draft) ?? []) {
    if (!needsPosition(entry.kind, entry.externalId)) continue;

    orders.set(`${entry.kind}:${entry.externalId}`, lastRootOrder + orders.size + 1);
  }

  return orders;
}

function isRootDraftExercise(exercise: TCourseImportDraftExercise) {
  return !exercise.sectionExternalId && !exercise.lessonExternalId;
}

function inferDraftLocale(languages: TLessonLanguage[]): TLocale {
  const locale = languages[0]?.locale;
  return (locale ?? 'en') as TLocale;
}

function getPrimaryLessonContent(
  lessonExternalId: string,
  lessonLanguages: TCourseImportDraftPayload['lessonLanguages'],
  preferredLocale: TLocale
) {
  const localized = lessonLanguages.find(
    (lessonLanguage) =>
      lessonLanguage.lessonExternalId === lessonExternalId && lessonLanguage.locale === preferredLocale
  );

  if (localized) {
    return localized.content;
  }

  return lessonLanguages.find((lessonLanguage) => lessonLanguage.lessonExternalId === lessonExternalId)?.content;
}

function buildExercisePublishPayload(
  exercise: TCourseImportDraftExercise,
  lessonIdMap: Map<string, string>,
  sectionIdMap: Map<string, string>,
  order = exercise.order
) {
  const lessonId = exercise.lessonExternalId ? lessonIdMap.get(exercise.lessonExternalId) : undefined;
  if (exercise.lessonExternalId && !lessonId) {
    throw new AppError(`Exercise "${exercise.title}" references an unknown lesson`, ErrorCodes.VALIDATION_ERROR, 400);
  }

  const sectionId = exercise.sectionExternalId ? sectionIdMap.get(exercise.sectionExternalId) : undefined;
  if (exercise.sectionExternalId && !sectionId) {
    throw new AppError(`Exercise "${exercise.title}" references an unknown section`, ErrorCodes.VALIDATION_ERROR, 400);
  }

  return {
    title: exercise.title,
    description: exercise.description,
    lessonId: lessonId ?? '',
    sectionId: sectionId ?? '',
    order,
    dueBy: exercise.dueBy,
    questions: exercise.questions?.map((question) => ({
      question: question.question,
      questionTypeId: question.questionTypeId,
      points: question.points,
      order: question.order,
      settings: question.settings,
      options: question.options?.map((option) => ({
        label: option.label,
        isCorrect: option.isCorrect,
        settings: option.settings
      }))
    }))
  };
}

type SnapshotRootKind = 'section' | 'lesson' | 'exercise';

type SnapshotExercise = Awaited<ReturnType<typeof getExercise>>;

const ROOT_KIND_RANK: Record<SnapshotRootKind, number> = { section: 0, lesson: 1, exercise: 2 };

/**
 * Numbers top-level entries 1..n by stored order, breaking ties the way the mixed-outline migration does.
 */
function rankRootEntries(entries: { kind: SnapshotRootKind; id: string; order: number | null }[]) {
  const sorted = [...entries].sort(
    (left, right) =>
      Number(left.order ?? 0) - Number(right.order ?? 0) ||
      ROOT_KIND_RANK[left.kind] - ROOT_KIND_RANK[right.kind] ||
      left.id.localeCompare(right.id)
  );

  return new Map(sorted.map((entry, index) => [`${entry.kind}:${entry.id}`, index + 1]));
}

async function listSnapshotExercises(courseId: string): Promise<SnapshotExercise[]> {
  const exercises = await listExercises(courseId);
  const detailedExercises = await Promise.all(exercises.map((exercise) => getExercise(exercise.id)));

  return detailedExercises.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
}

function buildDraftExercisesSnapshot(
  exercises: SnapshotExercise[],
  isRootExercise: (exercise: SnapshotExercise) => boolean,
  rootOrders: Map<string, number>
): TCourseImportDraftPayload['exercises'] {
  const exerciseOrderCounters = new Map<string, number>();

  return exercises.map((exercise) => {
    const isRoot = isRootExercise(exercise);
    const groupKey = exercise.lessonId ?? exercise.sectionId ?? '';
    const nextOrder = (exerciseOrderCounters.get(groupKey) ?? 0) + 1;
    if (!isRoot) exerciseOrderCounters.set(groupKey, nextOrder);

    const order = isRoot ? rootOrders.get(`exercise:${exercise.id}`)! : nextOrder;

    return {
      externalId: exercise.id,
      lessonExternalId: exercise.lessonId ?? undefined,
      sectionExternalId: isRoot || exercise.lessonId ? undefined : (exercise.sectionId ?? undefined),
      title: exercise.title,
      description: exercise.description ?? undefined,
      order,
      dueBy: exercise.dueBy ?? undefined,
      questions:
        exercise.questions && exercise.questions.length > 0
          ? exercise.questions.map((question) => ({
              question: question.title,
              questionTypeId: question.questionTypeId,
              points: question.points,
              order: question.order,
              settings: question.settings,
              options:
                question.options.length > 0
                  ? question.options.map((option) => ({
                      label: option.label ?? '',
                      isCorrect: option.isCorrect,
                      settings: option.settings
                    }))
                  : undefined
            }))
          : undefined
    };
  });
}

async function buildCourseStructureSnapshot(orgId: string, courseId: string): Promise<CourseStructureSnapshot> {
  const course = await getCourseRecord(orgId, courseId);
  const [sections, lessons, tags] = await Promise.all([
    listCourseSections(courseId),
    listLessons(courseId),
    getCourseTagsForOrganization(orgId, courseId)
  ]);

  if (lessons.length === 0) {
    throw new AppError(
      'Course must contain at least one lesson before it can be imported into a draft',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  const lessonIds = lessons.map((lesson) => lesson.id);
  const lessonLanguages = await getLessonLanguagesByLessonIds(lessonIds);
  const fallbackLocale = inferDraftLocale(lessonLanguages);
  const warnings: TCourseImportDraftPayload['warnings'] = [];
  const isContentGroupingEnabled = course.metadata?.isContentGroupingEnabled ?? DEFAULT_CONTENT_GROUPING;
  const outlineSections = isContentGroupingEnabled ? sections : [];
  const outlineSectionIds = new Set(outlineSections.map((section) => section.id));
  const exercises = await listSnapshotExercises(courseId);
  const isRootLesson = (lesson: (typeof lessons)[number]) =>
    !lesson.sectionId || !outlineSectionIds.has(lesson.sectionId);
  const isRootExercise = (exercise: SnapshotExercise) =>
    !exercise.lessonId && (!exercise.sectionId || !outlineSectionIds.has(exercise.sectionId));
  const rootOrders = rankRootEntries([
    ...outlineSections.map((section) => ({ kind: 'section' as const, id: section.id, order: section.order })),
    ...lessons.filter(isRootLesson).map((lesson) => ({ kind: 'lesson' as const, id: lesson.id, order: lesson.order })),
    ...exercises
      .filter(isRootExercise)
      .map((exercise) => ({ kind: 'exercise' as const, id: exercise.id, order: exercise.order }))
  ]);
  const normalizedSections = outlineSections
    .map((section) => ({
      externalId: section.id,
      title: section.title ?? 'Untitled Section',
      order: rootOrders.get(`section:${section.id}`)!
    }))
    .sort((a, b) => a.order - b.order);

  const sortedLessons = [...lessons].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const lessonOrderCounters = new Map<string, number>();
  let droppedVideoCount = 0;
  const normalizedLessons = sortedLessons.map((lesson) => {
    const sectionExternalId = isRootLesson(lesson) ? undefined : lesson.sectionId!;
    const nextLessonOrder = sectionExternalId ? (lessonOrderCounters.get(sectionExternalId) ?? 0) + 1 : 0;
    if (sectionExternalId) lessonOrderCounters.set(sectionExternalId, nextLessonOrder);

    const order = sectionExternalId ? nextLessonOrder : rootOrders.get(`lesson:${lesson.id}`)!;

    const storedVideos = Array.isArray(lesson.videos) ? lesson.videos : [];
    const parsedVideos = storedVideos.map((video) => ZLessonVideoItem.safeParse(video));
    const videos = parsedVideos.flatMap((result) => (result.success ? [result.data] : []));
    droppedVideoCount += parsedVideos.length - videos.length;

    return {
      externalId: lesson.id,
      ...(sectionExternalId ? { sectionExternalId } : {}),
      title: lesson.title,
      order,
      isUnlocked: lesson.isUnlocked ?? undefined,
      public: lesson.public ?? undefined,
      ...(videos.length > 0 ? { videos } : {})
    };
  });

  if (droppedVideoCount > 0) {
    warnings.push(
      ZCourseImportWarning.parse({
        code: 'LESSON_VIDEO_NOT_REPRESENTABLE',
        message: `${droppedVideoCount} lesson video(s) could not be represented in the draft and were omitted. Publishing this draft will not restore them.`,
        severity: 'warning'
      })
    );
  }

  const normalizedLessonLanguages: TCourseImportDraftPayload['lessonLanguages'] = [];

  for (const lesson of lessons) {
    const localized = lessonLanguages.filter((lessonLanguage) => lessonLanguage.lessonId === lesson.id);

    if (localized.length > 0) {
      const validLocalized = localized
        .map((lessonLanguage) => ({
          lessonExternalId: lesson.id,
          locale: lessonLanguage.locale as TLocale,
          content: lessonLanguage.content?.trim() ?? ''
        }))
        .filter((lessonLanguage) => lessonLanguage.content.length > 0);

      if (validLocalized.length > 0) {
        normalizedLessonLanguages.push(...validLocalized);
        continue;
      }

      warnings.push(
        ZCourseImportWarning.parse({
          code: 'EMPTY_LOCALE_CONTENT_SKIPPED',
          message: `Lesson "${lesson.title}" had empty localized content and required a fallback.`,
          severity: 'warning'
        })
      );
    }

    if (lesson.note?.trim()) {
      normalizedLessonLanguages.push({
        lessonExternalId: lesson.id,
        locale: fallbackLocale,
        content: lesson.note
      });
      warnings.push(
        ZCourseImportWarning.parse({
          code: 'LEGACY_NOTE_FALLBACK',
          message: `Lesson "${lesson.title}" used legacy note content because no lesson_language rows were found.`,
          severity: 'info'
        })
      );
    }
  }

  if (normalizedLessonLanguages.length === 0) {
    throw new AppError(
      'Course lessons must contain note or localized content before they can be imported into a draft',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  const normalizedExercises = buildDraftExercisesSnapshot(exercises, isRootExercise, rootOrders);

  const draft = ZCourseImportDraftPayload.parse({
    course: {
      title: course.title,
      description: course.description,
      type: course.type,
      locale: fallbackLocale,
      metadata: course.metadata,
      compliance: course.compliance ?? undefined
    },
    tags: tags.map((tag) => tag.name),
    sections: normalizedSections,
    lessons: normalizedLessons,
    lessonLanguages: normalizedLessonLanguages,
    exercises: normalizedExercises,
    sourceReferences: [
      {
        type: 'course',
        label: course.title
      }
    ],
    warnings
  });

  return {
    courseId,
    draft
  };
}

export async function createCourseImportDraftService(orgId: string, profileId: string, data: TCourseImportDraftCreate) {
  try {
    if (data.idempotencyKey) {
      const existing = await getCourseImportDraftByIdempotencyKey(orgId, data.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    return await createCourseImportDraft({
      organizationId: orgId,
      createdByProfileId: profileId,
      sourceType: data.sourceType,
      status: 'DRAFT',
      title: data.draft.course.title,
      locale: data.draft.course.locale,
      idempotencyKey: data.idempotencyKey,
      summary: {
        ...buildDraftSummary(data.draft),
        ...(data.summary ?? {})
      },
      draft: data.draft,
      warnings: data.draft.warnings,
      sourceArtifacts: data.sourceArtifacts ?? data.draft.sourceReferences ?? []
    });
  } catch (error) {
    if (error instanceof AppError || error instanceof ZodError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create course import draft',
      ErrorCodes.COURSE_IMPORT_CREATE_FAILED,
      500
    );
  }
}

export async function createCourseImportDraftFromCourseService(
  orgId: string,
  profileId: string,
  data: TCourseImportDraftCreateFromCourse
) {
  const snapshot = await buildCourseStructureSnapshot(orgId, data.courseId);

  return createCourseImportDraftService(orgId, profileId, {
    sourceType: 'course',
    idempotencyKey: data.idempotencyKey,
    summary: {
      sourceCourseId: data.courseId,
      ...(data.summary ?? {})
    },
    sourceArtifacts: [
      {
        type: 'course',
        courseId: data.courseId,
        label: snapshot.draft.course.title
      },
      ...(data.sourceArtifacts ?? [])
    ],
    draft: snapshot.draft
  });
}

export async function getCourseImportStructureService(orgId: string, courseId: string) {
  try {
    return buildCourseStructureSnapshot(orgId, courseId);
  } catch (error) {
    if (error instanceof AppError || error instanceof ZodError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch course structure',
      ErrorCodes.COURSE_IMPORT_FETCH_FAILED,
      500
    );
  }
}

export async function getCourseImportDraftService(orgId: string, draftId: string) {
  try {
    const draft = await getCourseImportDraftById(orgId, draftId);
    if (!draft) {
      throw new AppError('Course import draft not found', ErrorCodes.COURSE_IMPORT_DRAFT_NOT_FOUND, 404);
    }

    return draft;
  } catch (error) {
    if (error instanceof AppError || error instanceof ZodError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch course import draft',
      ErrorCodes.COURSE_IMPORT_FETCH_FAILED,
      500
    );
  }
}

export async function updateCourseImportDraftService(orgId: string, draftId: string, data: TCourseImportDraftUpdate) {
  try {
    const existing = await getCourseImportDraftService(orgId, draftId);

    if (existing.status === 'PUBLISHED') {
      throw new AppError('Published drafts cannot be edited', ErrorCodes.FORBIDDEN, 403);
    }

    const nextDraft = data.draft ?? parseStoredDraft(existing);
    const nextWarnings = data.warnings ?? nextDraft.warnings;
    const updated = await updateCourseImportDraft(orgId, draftId, {
      title: nextDraft.course.title,
      locale: nextDraft.course.locale,
      draft: nextDraft,
      warnings: nextWarnings,
      summary: {
        ...(existing.summary ?? {}),
        ...buildDraftSummary(nextDraft),
        ...(data.summary ?? {})
      },
      sourceArtifacts: data.sourceArtifacts ?? existing.sourceArtifacts
    });

    if (!updated) {
      throw new AppError('Course import draft not found', ErrorCodes.COURSE_IMPORT_DRAFT_NOT_FOUND, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError || error instanceof ZodError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update course import draft',
      ErrorCodes.COURSE_IMPORT_UPDATE_FAILED,
      500
    );
  }
}

export async function updateCourseImportDraftTagsService(
  orgId: string,
  draftId: string,
  tagNames: string[],
  mode: 'merge' | 'replace'
) {
  const existing = await getCourseImportDraftService(orgId, draftId);

  if (existing.status === 'PUBLISHED') {
    throw new AppError('Published drafts cannot be edited', ErrorCodes.FORBIDDEN, 403);
  }

  const draft = parseStoredDraft(existing);
  const nextTags =
    mode === 'replace' ? normalizeDraftTagNames(tagNames) : normalizeDraftTagNames([...draft.tags, ...tagNames]);

  return updateCourseImportDraftService(orgId, draftId, {
    draft: {
      ...draft,
      tags: nextTags
    }
  });
}

export async function publishCourseImportDraftService(
  orgId: string,
  profileId: string,
  draftId: string,
  overrides: TCourseImportDraftPublish
): Promise<PublishDraftResult> {
  try {
    const existing = await getCourseImportDraftService(orgId, draftId);

    if (existing.status === 'PUBLISHED' && existing.publishedCourseId) {
      const [publishedCourse] = await getCourseById(existing.publishedCourseId);
      const courseUrl = await resolveCourseUrl(
        orgId,
        existing.publishedCourseId,
        publishedCourse?.title ?? existing.title
      );
      const draft = parseStoredDraft(existing);
      return {
        courseId: existing.publishedCourseId,
        courseUrl,
        bannerImageUrl: publishedCourse?.bannerImage ?? null,
        tagNames: normalizeDraftTagNames(draft.tags),
        createdSections: 0,
        createdLessons: 0,
        createdExercises: 0,
        localeCount: 0
      };
    }

    const draft = parseStoredDraft(existing);
    const courseTitle = overrides.title ?? draft.course.title;
    const courseDescription = overrides.description ?? draft.course.description;
    const courseType = overrides.type ?? draft.course.type;
    const courseMetadata = overrides.metadata ?? draft.course.metadata;
    const courseCompliance = overrides.compliance ?? draft.course.compliance;
    const courseUpdateFields: Partial<TCourse> = {
      title: courseTitle,
      description: courseDescription,
      type: courseType
    };
    if (courseMetadata) {
      courseUpdateFields.metadata = courseMetadata;
    }
    if (courseCompliance) {
      courseUpdateFields.compliance = courseCompliance;
    }

    const sectionExternalIds = new Set(draft.sections.map((section) => section.externalId));
    draft.lessons.forEach((lesson) => {
      if (lesson.sectionExternalId && !sectionExternalIds.has(lesson.sectionExternalId)) {
        throw new AppError(`Lesson "${lesson.title}" references an unknown section`, ErrorCodes.VALIDATION_ERROR, 400);
      }
    });
    const rootOrders = getDraftRootOrders(draft);

    let courseId = existing.publishedCourseId;

    if (courseId) {
      const [existingCourse] = await getCourseById(courseId);
      if (!existingCourse || existingCourse.status === 'DELETED') {
        courseId = null;
      } else {
        await updateCourse(courseId, courseUpdateFields);
        await resetCourseContentForDraftRetry(courseId);
      }
    }

    if (!courseId) {
      const courseResult = await createCourse(
        profileId,
        {
          title: courseTitle,
          description: courseDescription,
          type: courseType,
          organizationId: orgId,
          compliance: courseCompliance
        },
        'import'
      );

      courseId = courseResult.course.id;
      await reserveDraftPublishedCourseId(orgId, draftId, draft, existing.summary, courseId);
      if (courseMetadata) {
        await updateCourse(courseId, { metadata: courseMetadata });
      }
    }

    const bannerImageUrl = await resolvePublishBannerImage(courseTitle, overrides);
    await maybeApplyCourseBannerImage(courseId, bannerImageUrl);

    const sectionIdMap = new Map<string, string>();
    for (const section of [...draft.sections].sort((a, b) => a.order - b.order)) {
      const createdSection = await createCourseSection(courseId, {
        courseId,
        title: section.title,
        order: rootOrders.get(`section:${section.externalId}`)!
      });

      sectionIdMap.set(section.externalId, createdSection.id);
    }

    const lessonIdMap = new Map<string, string>();
    for (const lesson of [...draft.lessons].sort((a, b) => a.order - b.order)) {
      const sectionId = lesson.sectionExternalId ? sectionIdMap.get(lesson.sectionExternalId) : undefined;
      if (lesson.sectionExternalId && !sectionId) {
        throw new AppError('Referenced section was not created', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const lessonOrder = sectionId ? lesson.order : rootOrders.get(`lesson:${lesson.externalId}`)!;
      const createdLesson = await createLesson(courseId, {
        courseId,
        title: lesson.title,
        note: getPrimaryLessonContent(lesson.externalId, draft.lessonLanguages, draft.course.locale as TLocale),
        sectionId,
        order: lessonOrder,
        isUnlocked: lesson.isUnlocked,
        public: lesson.public,
        videos: lesson.videos
      });

      lessonIdMap.set(lesson.externalId, createdLesson.id);
    }

    for (const lessonLanguage of draft.lessonLanguages) {
      const lessonId = lessonIdMap.get(lessonLanguage.lessonExternalId);
      if (!lessonId) {
        throw new AppError('Referenced lesson was not created', ErrorCodes.VALIDATION_ERROR, 400);
      }

      await upsertLessonLanguageService(
        lessonId,
        {
          locale: lessonLanguage.locale as TLocale,
          content: lessonLanguage.content
        },
        // Imported content is a milestone, not an autosave: keep it forever and
        // don't let a later edit fold into it.
        { versionIntent: 'manual' }
      );
    }

    let createdExercises = 0;
    for (const exercise of draft.exercises ?? []) {
      const exerciseOrder = isRootDraftExercise(exercise)
        ? rootOrders.get(`exercise:${exercise.externalId}`)!
        : exercise.order;
      await createExercise({
        courseId,
        ...buildExercisePublishPayload(exercise, lessonIdMap, sectionIdMap, exerciseOrder)
      });
      createdExercises += 1;
    }

    const appliedTagNames = normalizeDraftTagNames(draft.tags);
    if (appliedTagNames.length > 0) {
      await assignCourseTagsByName(orgId, courseId, {
        tagNames: appliedTagNames,
        mode: 'replace'
      });
    }

    const courseUrl = await resolveCourseUrl(orgId, courseId, courseTitle);

    await updateCourseImportDraft(orgId, draftId, {
      status: 'PUBLISHED',
      publishedCourseId: courseId,
      summary: {
        ...(existing.summary ?? {}),
        ...buildDraftSummary(draft),
        publishedCourseId: courseId
      }
    });

    return {
      courseId,
      courseUrl,
      bannerImageUrl,
      tagNames: appliedTagNames,
      createdSections: sectionIdMap.size,
      createdLessons: lessonIdMap.size,
      createdExercises,
      localeCount: new Set(draft.lessonLanguages.map((item) => item.locale)).size
    };
  } catch (error) {
    if (error instanceof AppError || error instanceof ZodError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to publish course import draft',
      ErrorCodes.COURSE_IMPORT_PUBLISH_FAILED,
      500
    );
  }
}

export async function publishCourseImportDraftToExistingCourseService(
  orgId: string,
  draftId: string,
  overrides: TCourseImportDraftPublishToCourse
): Promise<PublishDraftToExistingCourseResult> {
  try {
    const existingDraft = await getCourseImportDraftService(orgId, draftId);
    const draft = parseStoredDraft(existingDraft);
    const course = await getCourseRecord(orgId, overrides.courseId);
    const syncMode = overrides.syncMode ?? 'merge';
    const courseTitle = overrides.title ?? draft.course.title;
    const courseDescription = overrides.description ?? draft.course.description;
    const courseType = overrides.type ?? draft.course.type;
    const courseMetadata = overrides.metadata ?? draft.course.metadata;
    const courseCompliance = overrides.compliance ?? draft.course.compliance;
    const preferredLocale = draft.course.locale as TLocale;
    const bannerImageUrl = await resolvePublishBannerImage(courseTitle, overrides);

    await updateCourse(course.id, {
      title: courseTitle,
      description: courseDescription,
      type: courseType,
      metadata: courseMetadata,
      compliance: courseCompliance
    });

    await maybeApplyCourseBannerImage(course.id, bannerImageUrl);

    const [existingSections, existingLessons] = await Promise.all([
      listCourseSections(course.id),
      listLessons(course.id)
    ]);
    const existingExercises = await listExercises(course.id);
    const existingSectionIds = new Set(existingSections.map((section) => section.id));
    const existingLessonIds = new Set(existingLessons.map((lesson) => lesson.id));
    const existingExerciseIds = new Set(existingExercises.map((exercise) => exercise.id));
    const existingLessonLanguages = await getLessonLanguagesByLessonIds(existingLessons.map((lesson) => lesson.id));

    const isMerge = syncMode === 'merge';
    const rootOrders = getDraftRootOrders(draft);
    const existingRootOrders = [
      ...existingSections.map((section) => Number(section.order) || 0),
      ...existingLessons.filter((lesson) => !lesson.sectionId).map((lesson) => Number(lesson.order) || 0),
      ...existingExercises
        .filter((exercise) => !exercise.sectionId && !exercise.lessonId)
        .map((exercise) => Number(exercise.order) || 0)
    ];
    let nextRootOrder = isMerge ? Math.max(0, ...existingRootOrders) : 0;
    const mergeRootOrders = isMerge
      ? allocateMergeRootOrders(draft, nextRootOrder, {
          sectionIds: existingSectionIds,
          lessons: existingLessons,
          exercises: existingExercises
        })
      : new Map<string, number>();
    nextRootOrder += mergeRootOrders.size;

    const sectionIdMap = new Map<string, string>();
    let createdSections = 0;
    let updatedSections = 0;

    for (const section of [...draft.sections].sort((a, b) => a.order - b.order)) {
      if (existingSectionIds.has(section.externalId)) {
        const updatedSection = await updateCourseSectionService(section.externalId, {
          title: section.title,
          ...(isMerge ? {} : { order: rootOrders.get(`section:${section.externalId}`)! })
        });
        sectionIdMap.set(section.externalId, updatedSection.id);
        updatedSections += 1;
        continue;
      }

      const createdSection = await createCourseSection(course.id, {
        courseId: course.id,
        title: section.title,
        order: isMerge
          ? mergeRootOrders.get(`section:${section.externalId}`)!
          : rootOrders.get(`section:${section.externalId}`)!
      });
      sectionIdMap.set(section.externalId, createdSection.id);
      createdSections += 1;
    }

    const lessonIdMap = new Map<string, string>();
    let createdLessons = 0;
    let updatedLessons = 0;

    const nextLessonOrderBySection = new Map<string, number>();
    for (const existingLesson of existingLessons) {
      if (!existingLesson.sectionId) {
        continue;
      }

      const current = nextLessonOrderBySection.get(existingLesson.sectionId) ?? 0;
      nextLessonOrderBySection.set(existingLesson.sectionId, Math.max(current, Number(existingLesson.order) || 0));
    }

    const claimNextLessonOrder = (sectionId: string | undefined, externalId: string) => {
      if (!sectionId) return mergeRootOrders.get(`lesson:${externalId}`) ?? ++nextRootOrder;

      const nextOrder = (nextLessonOrderBySection.get(sectionId) ?? 0) + 1;
      nextLessonOrderBySection.set(sectionId, nextOrder);

      return nextOrder;
    };

    for (const lesson of [...draft.lessons].sort((a, b) => a.order - b.order)) {
      const sectionId = lesson.sectionExternalId ? sectionIdMap.get(lesson.sectionExternalId) : undefined;
      if (lesson.sectionExternalId && !sectionId) {
        throw new AppError(`Lesson "${lesson.title}" references an unknown section`, ErrorCodes.VALIDATION_ERROR, 400);
      }

      const note = getPrimaryLessonContent(lesson.externalId, draft.lessonLanguages, preferredLocale);
      const draftOrder = sectionId ? lesson.order : rootOrders.get(`lesson:${lesson.externalId}`)!;

      if (existingLessonIds.has(lesson.externalId)) {
        const originalLesson = existingLessons.find((el) => el.id === lesson.externalId);
        const sectionChanged = Boolean(originalLesson && (originalLesson.sectionId ?? undefined) !== sectionId);

        let mergedOrder: number | undefined;
        if (isMerge) {
          if (sectionChanged) {
            mergedOrder = claimNextLessonOrder(sectionId, lesson.externalId);
          }
        } else {
          mergedOrder = draftOrder;
        }

        const updatedLesson = await updateLessonService(lesson.externalId, {
          title: lesson.title,
          note,
          ...(sectionId ? { sectionId } : {}),
          ...(sectionId && mergedOrder !== undefined ? { order: mergedOrder } : {}),
          isUnlocked: lesson.isUnlocked,
          public: lesson.public,
          videos: lesson.videos
        });
        if (!sectionId && (sectionChanged || mergedOrder !== undefined)) {
          await updateCourseContent(course.id, [
            { id: lesson.externalId, type: 'LESSON', sectionId: null, order: mergedOrder }
          ]);
        }
        lessonIdMap.set(lesson.externalId, updatedLesson.id);
        updatedLessons += 1;
        continue;
      }

      const nextLessonOrder = claimNextLessonOrder(sectionId, lesson.externalId);
      const createdLesson = await createLesson(course.id, {
        courseId: course.id,
        title: lesson.title,
        note,
        sectionId,
        order: isMerge ? nextLessonOrder : draftOrder,
        isUnlocked: lesson.isUnlocked,
        public: lesson.public,
        videos: lesson.videos
      });
      lessonIdMap.set(lesson.externalId, createdLesson.id);
      createdLessons += 1;
    }

    const existingLessonLanguageMap = new Map(
      existingLessonLanguages.map((lessonLanguage) => [
        `${lessonLanguage.lessonId}:${lessonLanguage.locale}`,
        lessonLanguage
      ])
    );
    let createdLessonLanguages = 0;
    let updatedLessonLanguages = 0;

    for (const lessonLanguage of draft.lessonLanguages) {
      const lessonId = lessonIdMap.get(lessonLanguage.lessonExternalId);
      if (!lessonId) {
        throw new AppError('Referenced lesson was not created', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const languageKey = `${lessonId}:${lessonLanguage.locale}`;
      if (existingLessonLanguageMap.has(languageKey)) {
        await updateLessonLanguageService(
          lessonId,
          lessonLanguage.locale as TLocale,
          { content: lessonLanguage.content },
          { versionIntent: 'manual' }
        );
        updatedLessonLanguages += 1;
        continue;
      }

      await upsertLessonLanguageService(
        lessonId,
        {
          locale: lessonLanguage.locale as TLocale,
          content: lessonLanguage.content
        },
        { versionIntent: 'manual' }
      );
      createdLessonLanguages += 1;
    }

    let createdExercises = 0;
    let updatedExercises = 0;

    const nextExerciseOrderByGroup = new Map<string, number>();
    const groupKeyForExercise = (lessonId: string | null | undefined, sectionId: string | null | undefined) =>
      lessonId || sectionId || 'ungrouped';
    for (const existingExercise of existingExercises) {
      const groupKey = groupKeyForExercise(existingExercise.lessonId, existingExercise.sectionId);
      const current = nextExerciseOrderByGroup.get(groupKey) ?? 0;
      nextExerciseOrderByGroup.set(groupKey, Math.max(current, Number(existingExercise.order) || 0));
    }

    const claimNextExerciseOrder = (groupKey: string, externalId: string) => {
      if (groupKey === 'ungrouped') return mergeRootOrders.get(`exercise:${externalId}`) ?? ++nextRootOrder;

      const nextOrder = (nextExerciseOrderByGroup.get(groupKey) ?? 0) + 1;
      nextExerciseOrderByGroup.set(groupKey, nextOrder);

      return nextOrder;
    };

    const exerciseIdMap = new Map<string, string>();
    for (const exercise of draft.exercises ?? []) {
      const draftOrder = isRootDraftExercise(exercise)
        ? rootOrders.get(`exercise:${exercise.externalId}`)!
        : exercise.order;
      const payload = buildExercisePublishPayload(exercise, lessonIdMap, sectionIdMap, draftOrder);

      if (existingExerciseIds.has(exercise.externalId)) {
        const destGroupKey = groupKeyForExercise(payload.lessonId, payload.sectionId);
        const originalExercise = existingExercises.find((existing) => existing.id === exercise.externalId);
        const originalGroupKey = originalExercise
          ? groupKeyForExercise(originalExercise.lessonId, originalExercise.sectionId)
          : destGroupKey;
        const groupChanged = destGroupKey !== originalGroupKey;

        let exerciseOrder: number | undefined;
        if (isMerge) {
          if (groupChanged) {
            exerciseOrder = claimNextExerciseOrder(destGroupKey, exercise.externalId);
          }
        } else {
          exerciseOrder = payload.order;
        }

        const updatePayload = {
          title: payload.title,
          description: payload.description,
          lessonId: payload.lessonId,
          sectionId: payload.sectionId,
          dueBy: payload.dueBy,
          questions: payload.questions,
          ...(exerciseOrder !== undefined ? { order: exerciseOrder } : {})
        };

        await replaceExerciseService(exercise.externalId, updatePayload);
        exerciseIdMap.set(exercise.externalId, exercise.externalId);
        updatedExercises += 1;
        continue;
      }

      const groupKey = groupKeyForExercise(payload.lessonId, payload.sectionId);
      const exerciseOrder = isMerge ? claimNextExerciseOrder(groupKey, exercise.externalId) : payload.order;

      const createdExercise = await createExercise({
        courseId: course.id,
        ...payload,
        order: exerciseOrder
      });
      exerciseIdMap.set(exercise.externalId, createdExercise.id);
      createdExercises += 1;
    }

    const appliedTagNames = normalizeDraftTagNames(draft.tags);
    if (appliedTagNames.length > 0 || syncMode === 'replace') {
      await assignCourseTagsByName(orgId, course.id, {
        tagNames: appliedTagNames,
        mode: syncMode
      });
    }

    const referencedSectionIds = new Set([...sectionIdMap.values()].filter((id) => existingSectionIds.has(id)));
    const referencedLessonIds = new Set([...lessonIdMap.values()].filter((id) => existingLessonIds.has(id)));
    const referencedExerciseIds = new Set(
      (draft.exercises ?? []).map((exercise) => exercise.externalId).filter((id) => existingExerciseIds.has(id))
    );
    let deletedLessonLanguages = 0;
    let deletedExercises = 0;
    let deletedLessons = 0;
    let deletedSections = 0;

    if (syncMode === 'replace') {
      const referencedLanguageKeys = new Set(
        draft.lessonLanguages
          .map((lessonLanguage) => {
            const lessonId = lessonIdMap.get(lessonLanguage.lessonExternalId);
            if (!lessonId || !referencedLessonIds.has(lessonId)) {
              return null;
            }

            return `${lessonId}:${lessonLanguage.locale}`;
          })
          .filter((languageKey): languageKey is string => Boolean(languageKey))
      );

      for (const lessonLanguage of existingLessonLanguages) {
        const lessonId = lessonLanguage.lessonId;
        if (!lessonId) {
          continue;
        }

        if (!referencedLessonIds.has(lessonId)) {
          continue;
        }

        const languageKey = `${lessonId}:${lessonLanguage.locale}`;
        if (referencedLanguageKeys.has(languageKey)) {
          continue;
        }

        await deleteLessonLanguageService(lessonId, lessonLanguage.locale as TLocale);
        deletedLessonLanguages += 1;
      }

      for (const existingExercise of existingExercises) {
        if (referencedExerciseIds.has(existingExercise.id)) {
          continue;
        }

        await deleteExerciseService(existingExercise.id);
        deletedExercises += 1;
      }

      for (const existingLesson of existingLessons) {
        if (referencedLessonIds.has(existingLesson.id)) {
          continue;
        }

        await deleteLessonService(existingLesson.id);
        deletedLessons += 1;
      }

      for (const existingSection of existingSections) {
        if (referencedSectionIds.has(existingSection.id)) {
          continue;
        }

        await deleteCourseSectionService(existingSection.id);
        deletedSections += 1;
      }

      await applyDraftRootOrders(course.id, draft, { sectionIdMap, lessonIdMap, exerciseIdMap });
    }

    const courseUrl = await resolveCourseUrl(orgId, course.id, courseTitle);

    await updateCourseImportDraft(orgId, draftId, {
      status: 'PUBLISHED',
      publishedCourseId: course.id,
      summary: {
        ...(existingDraft.summary ?? {}),
        ...buildDraftSummary(draft),
        publishedCourseId: course.id,
        updatedSections,
        updatedLessons,
        updatedExercises,
        createdLessonLanguages,
        updatedLessonLanguages,
        deletedSections,
        deletedLessons,
        deletedExercises,
        deletedLessonLanguages,
        syncMode
      }
    });

    return {
      courseId: course.id,
      courseUrl,
      bannerImageUrl,
      tagNames: appliedTagNames,
      createdSections,
      updatedSections,
      createdLessons,
      updatedLessons,
      createdExercises,
      updatedExercises,
      createdLessonLanguages,
      updatedLessonLanguages,
      deletedSections,
      deletedLessons,
      deletedExercises,
      deletedLessonLanguages,
      untouchedSections: Math.max(existingSections.length - referencedSectionIds.size - deletedSections, 0),
      untouchedLessons: Math.max(existingLessons.length - referencedLessonIds.size - deletedLessons, 0),
      untouchedExercises: Math.max(existingExercises.length - referencedExerciseIds.size - deletedExercises, 0),
      localeCount: new Set(draft.lessonLanguages.map((item) => item.locale)).size
    };
  } catch (error) {
    if (error instanceof AppError || error instanceof ZodError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to publish course import draft to existing course',
      ErrorCodes.COURSE_IMPORT_PUBLISH_FAILED,
      500
    );
  }
}
