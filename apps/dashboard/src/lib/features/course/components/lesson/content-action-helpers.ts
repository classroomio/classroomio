import { ContentType } from '@cio/utils/constants/content';
import { assertNever } from '@cio/utils/functions/assert-never';

export type ContentActionItem = {
  type: ContentType;
  contentId: string;
  title?: string | null;
  isUnlocked?: boolean | null;
  sectionId?: string | null;
  order?: number | null;
};

type CourseApiErrorMap = Record<string, string> | undefined | null;

type LessonApi = {
  update: (courseId: string, lessonId: string, payload: Record<string, unknown>) => Promise<unknown>;
  delete: (courseId: string, lessonId: string) => Promise<unknown>;
  errors?: CourseApiErrorMap;
  success?: boolean;
};

type ExerciseApi = {
  update: (courseId: string, exerciseId: string, payload: Record<string, unknown>) => Promise<unknown>;
  delete: (courseId: string, exerciseId: string) => Promise<unknown>;
  errors?: CourseApiErrorMap;
  success?: boolean;
};

function normalizeErrors(errors: CourseApiErrorMap): Record<string, string> {
  if (!errors) return {};
  const entries = Object.entries(errors).filter(([, value]) => Boolean(value));
  return entries.length ? Object.fromEntries(entries) : {};
}

function buildContentPayload(item: ContentActionItem, overrides: Record<string, unknown> = {}) {
  const normalizedSectionId = item.sectionId === '' ? null : item.sectionId;

  return {
    title: item.title || '',
    isUnlocked: item.isUnlocked ?? undefined,
    sectionId: normalizedSectionId ?? undefined,
    order: item.order ?? undefined,
    ...overrides
  };
}

export async function toggleLock({
  item,
  courseId,
  lessonApi,
  exerciseApi
}: {
  item: ContentActionItem;
  courseId: string;
  lessonApi: LessonApi;
  exerciseApi: ExerciseApi;
}) {
  item.isUnlocked = !(item.isUnlocked ?? false);
  const payload = buildContentPayload(item, { order: undefined });

  switch (item.type) {
    case ContentType.Exercise:
      await exerciseApi.update(courseId, item.contentId, payload);
      return normalizeErrors(exerciseApi.errors);
    case ContentType.Lesson:
      await lessonApi.update(courseId, item.contentId, payload);
      return normalizeErrors(lessonApi.errors);
    case ContentType.Section:
      throw new Error(`Unexpected content type: ${item.type}`);
    default:
      return assertNever(item.type);
  }
}

export async function saveContent({
  item,
  courseId,
  lessonApi,
  exerciseApi
}: {
  item: ContentActionItem;
  courseId: string;
  lessonApi: LessonApi;
  exerciseApi: ExerciseApi;
}) {
  const payload = buildContentPayload(item);

  switch (item.type) {
    case ContentType.Exercise:
      await exerciseApi.update(courseId, item.contentId, payload);
      return normalizeErrors(exerciseApi.errors);
    case ContentType.Lesson:
      await lessonApi.update(courseId, item.contentId, payload);
      return normalizeErrors(lessonApi.errors);
    case ContentType.Section:
      throw new Error(`Unexpected content type: ${item.type}`);
    default:
      return assertNever(item.type);
  }
}

export async function deleteContent({
  item,
  courseId,
  lessonApi,
  exerciseApi
}: {
  item: ContentActionItem;
  courseId: string;
  lessonApi: LessonApi;
  exerciseApi: ExerciseApi;
}) {
  switch (item.type) {
    case ContentType.Exercise:
      await exerciseApi.delete(courseId, item.contentId);
      return Boolean(exerciseApi.success);
    case ContentType.Lesson:
      await lessonApi.delete(courseId, item.contentId);
      return Boolean(lessonApi.success);
    case ContentType.Section:
      throw new Error(`Unexpected content type: ${item.type}`);
    default:
      return assertNever(item.type);
  }
}
