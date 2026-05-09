import { and, asc, eq } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';

/**
 * Queries backing the anonymous public-course surface under
 * `(org-site)/course/[courseSlug]`. Every query in this file assumes the
 * course is already confirmed to be `type = 'PUBLIC'` and `is_published = true`
 * at the service layer; they do not re-check auth.
 */

export interface PublicCourseHeader {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  bannerImage: string | null;
  callout: {
    title: string;
    description: string;
    buttonLabel: string;
    buttonUrl: string;
  } | null;
  org: {
    id: string;
    name: string;
    siteName: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface PublicCourseSection {
  id: string;
  title: string;
  order: number;
}

export interface PublicCourseLessonItem {
  kind: 'lesson';
  id: string;
  slug: string;
  title: string;
  order: number;
  sectionId: string | null;
  isUnlocked: boolean;
  hasVideo: boolean;
}

export interface PublicCourseExerciseItem {
  kind: 'exercise';
  id: string;
  slug: string;
  title: string;
  order: number;
  sectionId: string | null;
  isUnlocked: boolean;
}

export type PublicCourseItem = PublicCourseLessonItem | PublicCourseExerciseItem;

export interface PublicCourseTree {
  course: PublicCourseHeader;
  sections: PublicCourseSection[];
  items: PublicCourseItem[];
}

/**
 * Minimal course row for slug-based guards (e.g. rate limiting). Does not enforce PUBLIC/published.
 */
export async function getCourseRowBySlug(courseSlug: string): Promise<{
  id: string;
  type: string | null;
  isPublished: boolean | null;
  status: string | null;
} | null> {
  try {
    const [row] = await db
      .select({
        id: schema.course.id,
        type: schema.course.type,
        isPublished: schema.course.isPublished,
        status: schema.course.status
      })
      .from(schema.course)
      .where(eq(schema.course.slug, courseSlug))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCourseRowBySlug error:', error);
    throw new Error(`Failed to resolve course by slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch the course header + its sections + every lesson / exercise (metadata only,
 * no bodies) for a public course identified by its URL slug.
 *
 * Returns `null` when the course does not exist, is not published, or its type
 * is not `PUBLIC`.
 */
export async function getPublicCourseTreeBySlug(courseSlug: string): Promise<PublicCourseTree | null> {
  try {
    const [courseRow] = await db
      .select({
        id: schema.course.id,
        slug: schema.course.slug,
        title: schema.course.title,
        description: schema.course.description,
        bannerImage: schema.course.bannerImage,
        callout: schema.course.callout,
        type: schema.course.type,
        isPublished: schema.course.isPublished,
        status: schema.course.status,
        groupId: schema.course.groupId
      })
      .from(schema.course)
      .where(eq(schema.course.slug, courseSlug))
      .limit(1);

    if (!courseRow) return null;
    if (courseRow.type !== 'PUBLIC') return null;
    if (!courseRow.isPublished) return null;
    if (courseRow.status !== 'ACTIVE') return null;
    if (!courseRow.slug) return null;

    // Resolve the owning organization (course → group → organization). The
    // public course page shows org name + avatar in the sticky top header so
    // a guest can recognize the creator.
    let org: PublicCourseHeader['org'] = null;
    if (courseRow.groupId) {
      const [orgRow] = await db
        .select({
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName,
          avatarUrl: schema.organization.avatarUrl
        })
        .from(schema.group)
        .innerJoin(schema.organization, eq(schema.organization.id, schema.group.organizationId))
        .where(eq(schema.group.id, courseRow.groupId))
        .limit(1);

      if (orgRow) {
        org = {
          id: orgRow.id,
          name: orgRow.name,
          siteName: orgRow.siteName ?? null,
          avatarUrl: orgRow.avatarUrl ?? null
        };
      }
    }

    const sectionRows = await db
      .select({
        id: schema.courseSection.id,
        title: schema.courseSection.title,
        order: schema.courseSection.order
      })
      .from(schema.courseSection)
      .where(eq(schema.courseSection.courseId, courseRow.id))
      .orderBy(asc(schema.courseSection.order));

    const lessonRows = await db
      .select({
        id: schema.lesson.id,
        slug: schema.lesson.slug,
        title: schema.lesson.title,
        order: schema.lesson.order,
        sectionId: schema.lesson.sectionId,
        isUnlocked: schema.lesson.isUnlocked,
        videos: schema.lesson.videos,
        videoUrl: schema.lesson.videoUrl
      })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseRow.id))
      .orderBy(asc(schema.lesson.order));

    const exerciseRows = await db
      .select({
        id: schema.exercise.id,
        slug: schema.exercise.slug,
        title: schema.exercise.title,
        order: schema.exercise.order,
        sectionId: schema.exercise.sectionId,
        lessonId: schema.exercise.lessonId,
        isUnlocked: schema.exercise.isUnlocked
      })
      .from(schema.exercise)
      .where(eq(schema.exercise.courseId, courseRow.id))
      .orderBy(asc(schema.exercise.order));

    const sections: PublicCourseSection[] = sectionRows
      .filter((section): section is { id: string; title: string; order: number } => section.order !== null)
      .map((section) => ({
        id: section.id,
        title: section.title,
        order: Number(section.order)
      }));

    const lessonItems: PublicCourseLessonItem[] = lessonRows
      .filter((row): row is typeof row & { slug: string } => typeof row.slug === 'string')
      .map((row) => ({
        kind: 'lesson',
        id: row.id,
        slug: row.slug,
        title: row.title,
        order: row.order === null ? 0 : Number(row.order),
        sectionId: row.sectionId,
        isUnlocked: row.isUnlocked ?? false,
        hasVideo:
          (Array.isArray(row.videos) && row.videos.length > 0) ||
          (typeof row.videoUrl === 'string' && row.videoUrl.length > 0)
      }));

    const exerciseItems: PublicCourseExerciseItem[] = exerciseRows
      .filter((row): row is typeof row & { slug: string } => typeof row.slug === 'string')
      .map((row) => ({
        kind: 'exercise',
        id: row.id,
        slug: row.slug,
        title: row.title,
        order: row.order === null ? 0 : Number(row.order),
        sectionId: row.sectionId,
        isUnlocked: row.isUnlocked ?? true
      }));

    // Sort items so that the visual reading order matches the sidebar:
    // items in the first section come before items in the second, and within
    // a section items are sorted by their own `order`. Unsectioned items go
    // last so the redirect from the course landing page never lands on a
    // floating lesson when sections exist.
    const UNSECTIONED_ORDER = Number.POSITIVE_INFINITY;
    const sectionOrderById = new Map(sections.map((section) => [section.id, section.order]));
    const orderForItem = (item: PublicCourseItem) =>
      item.sectionId && sectionOrderById.has(item.sectionId)
        ? (sectionOrderById.get(item.sectionId) ?? UNSECTIONED_ORDER)
        : UNSECTIONED_ORDER;

    const items = [...lessonItems, ...exerciseItems].sort((left, right) => {
      const sectionDiff = orderForItem(left) - orderForItem(right);
      if (sectionDiff !== 0) return sectionDiff;
      return left.order - right.order;
    });

    const rawCallout = courseRow.callout;
    const callout =
      rawCallout && typeof rawCallout === 'object' && 'title' in rawCallout
        ? {
            title: String((rawCallout as { title: unknown }).title ?? ''),
            description: String((rawCallout as { description: unknown }).description ?? ''),
            buttonLabel: String((rawCallout as { buttonLabel: unknown }).buttonLabel ?? ''),
            buttonUrl: String((rawCallout as { buttonUrl: unknown }).buttonUrl ?? '')
          }
        : null;

    return {
      course: {
        id: courseRow.id,
        slug: courseRow.slug,
        title: courseRow.title,
        description: courseRow.description,
        bannerImage: courseRow.bannerImage,
        callout,
        org
      },
      sections,
      items
    };
  } catch (error) {
    console.error('getPublicCourseTreeBySlug error:', error);
    throw new Error(
      `Failed to get public course tree for slug "${courseSlug}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface PublicLessonContent {
  kind: 'lesson';
  id: string;
  slug: string;
  title: string;
  sectionTitle: string | null;
  isUnlocked: boolean;
  body: string;
  video: {
    type: 'youtube' | 'generic' | 'upload' | 'google_drive';
    link: string;
  } | null;
}

export interface PublicExerciseContent {
  kind: 'exercise';
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sectionTitle: string | null;
  isUnlocked: boolean;
  allowMultipleAttempts: boolean;
  sectionDisplayMode: string;
}

export type PublicCourseItemContent = PublicLessonContent | PublicExerciseContent;

/**
 * Fetch a single lesson or exercise (by per-course unique slug) inside a public course.
 * Returns `null` when the course is not public/published, or the item doesn't exist.
 *
 * The exercise payload returned here intentionally excludes the question list;
 * callers should pair this with `getExerciseQuestions` (which already ships with
 * answer keys) to render the client-side-graded exercise UI.
 */
export async function getPublicCourseItem(
  courseSlug: string,
  itemSlug: string
): Promise<PublicCourseItemContent | null> {
  try {
    const [courseRow] = await db
      .select({
        id: schema.course.id,
        type: schema.course.type,
        isPublished: schema.course.isPublished,
        status: schema.course.status
      })
      .from(schema.course)
      .where(eq(schema.course.slug, courseSlug))
      .limit(1);

    if (!courseRow) return null;
    if (courseRow.type !== 'PUBLIC') return null;
    if (!courseRow.isPublished) return null;
    if (courseRow.status !== 'ACTIVE') return null;

    const [lessonRow] = await db
      .select({
        id: schema.lesson.id,
        slug: schema.lesson.slug,
        title: schema.lesson.title,
        note: schema.lesson.note,
        videoUrl: schema.lesson.videoUrl,
        videos: schema.lesson.videos,
        isUnlocked: schema.lesson.isUnlocked,
        sectionId: schema.lesson.sectionId
      })
      .from(schema.lesson)
      .where(and(eq(schema.lesson.courseId, courseRow.id), eq(schema.lesson.slug, itemSlug)))
      .limit(1);

    if (lessonRow) {
      const section = lessonRow.sectionId
        ? await db
            .select({ title: schema.courseSection.title })
            .from(schema.courseSection)
            .where(eq(schema.courseSection.id, lessonRow.sectionId))
            .limit(1)
        : [];

      // Lesson body lives in `lesson_language` (one row per locale). Prefer the
      // English row when present; otherwise fall back to the first row, then to
      // the legacy `lesson.note` column for very old lessons that predate i18n.
      const languageRows = await db
        .select({
          content: schema.lessonLanguage.content,
          locale: schema.lessonLanguage.locale
        })
        .from(schema.lessonLanguage)
        .where(eq(schema.lessonLanguage.lessonId, lessonRow.id));

      const englishRow = languageRows.find((row) => row.locale === 'en');
      const fallbackRow = languageRows.find((row) => typeof row.content === 'string' && row.content.length > 0);
      const body = englishRow?.content ?? fallbackRow?.content ?? lessonRow.note ?? '';

      const firstVideo =
        Array.isArray(lessonRow.videos) && lessonRow.videos.length > 0
          ? {
              type: lessonRow.videos[0].type,
              link: lessonRow.videos[0].link
            }
          : lessonRow.videoUrl
            ? { type: 'generic' as const, link: lessonRow.videoUrl }
            : null;

      return {
        kind: 'lesson',
        id: lessonRow.id,
        slug: lessonRow.slug ?? itemSlug,
        title: lessonRow.title,
        sectionTitle: section[0]?.title ?? null,
        isUnlocked: lessonRow.isUnlocked ?? false,
        body,
        video: firstVideo
      };
    }

    const [exerciseRow] = await db
      .select({
        id: schema.exercise.id,
        slug: schema.exercise.slug,
        title: schema.exercise.title,
        description: schema.exercise.description,
        isUnlocked: schema.exercise.isUnlocked,
        sectionId: schema.exercise.sectionId,
        lessonId: schema.exercise.lessonId,
        allowMultipleAttempts: schema.exercise.allowMultipleAttempts,
        sectionDisplayMode: schema.exercise.sectionDisplayMode
      })
      .from(schema.exercise)
      .where(and(eq(schema.exercise.courseId, courseRow.id), eq(schema.exercise.slug, itemSlug)))
      .limit(1);

    if (!exerciseRow) return null;

    const resolvedSectionId =
      exerciseRow.sectionId ??
      (exerciseRow.lessonId
        ? ((
            await db
              .select({ sectionId: schema.lesson.sectionId })
              .from(schema.lesson)
              .where(eq(schema.lesson.id, exerciseRow.lessonId))
              .limit(1)
          )[0]?.sectionId ?? null)
        : null);

    const section = resolvedSectionId
      ? await db
          .select({ title: schema.courseSection.title })
          .from(schema.courseSection)
          .where(eq(schema.courseSection.id, resolvedSectionId))
          .limit(1)
      : [];

    return {
      kind: 'exercise',
      id: exerciseRow.id,
      slug: exerciseRow.slug ?? itemSlug,
      title: exerciseRow.title,
      description: exerciseRow.description,
      sectionTitle: section[0]?.title ?? null,
      isUnlocked: exerciseRow.isUnlocked ?? true,
      allowMultipleAttempts: exerciseRow.allowMultipleAttempts,
      sectionDisplayMode: exerciseRow.sectionDisplayMode ?? 'one_question'
    };
  } catch (error) {
    console.error('getPublicCourseItem error:', error);
    throw new Error(
      `Failed to get public course item "${itemSlug}" for course "${courseSlug}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Helper for slug-collision resolution at the service layer. Returns the set of
 * slugs already in use for the given course across both lesson and exercise
 * tables.
 */
export async function getTakenItemSlugs(courseId: string): Promise<Set<string>> {
  try {
    const lessonSlugs = await db
      .select({ slug: schema.lesson.slug })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseId));

    const exerciseSlugs = await db
      .select({ slug: schema.exercise.slug })
      .from(schema.exercise)
      .where(eq(schema.exercise.courseId, courseId));

    const taken = new Set<string>();
    for (const row of lessonSlugs) {
      if (row.slug) taken.add(row.slug);
    }
    for (const row of exerciseSlugs) {
      if (row.slug) taken.add(row.slug);
    }

    return taken;
  } catch (error) {
    console.error('getTakenItemSlugs error:', error);
    throw new Error(
      `Failed to read taken slugs for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Count of questions attached to a public course whose type is NOT auto-gradable.
 * Used to guard conversion of a course to `PUBLIC`.
 */
export async function findNonAutoGradableQuestionsInCourse(
  courseId: string,
  autoGradableTypeIds: readonly number[]
): Promise<
  Array<{
    questionId: number;
    questionTitle: string;
    exerciseId: string;
    exerciseTitle: string;
    typeId: number;
  }>
> {
  try {
    const rows = await db
      .select({
        questionId: schema.question.id,
        questionTitle: schema.question.title,
        exerciseId: schema.exercise.id,
        exerciseTitle: schema.exercise.title,
        typeId: schema.question.questionTypeId
      })
      .from(schema.question)
      .innerJoin(schema.exercise, eq(schema.exercise.id, schema.question.exerciseId))
      .where(eq(schema.exercise.courseId, courseId));

    return rows
      .filter((row) => row.typeId !== null && !autoGradableTypeIds.includes(row.typeId))
      .map((row) => ({
        questionId: row.questionId,
        questionTitle: row.questionTitle ?? 'Untitled question',
        exerciseId: row.exerciseId,
        exerciseTitle: row.exerciseTitle,
        typeId: row.typeId as number
      }));
  } catch (error) {
    console.error('findNonAutoGradableQuestionsInCourse error:', error);
    throw new Error(
      `Failed to scan questions for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
