import { ContentType } from '@cio/utils/constants/content';

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
  return {
    title: item.title || '',
    isUnlocked: item.isUnlocked ?? undefined,
    sectionId: item.sectionId ?? undefined,
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

  if (item.type === ContentType.Exercise) {
    await exerciseApi.update(courseId, item.contentId, payload);
    return normalizeErrors(exerciseApi.errors);
  }

  await lessonApi.update(courseId, item.contentId, payload);
  return normalizeErrors(lessonApi.errors);
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

  if (item.type === ContentType.Exercise) {
    await exerciseApi.update(courseId, item.contentId, payload);
    return normalizeErrors(exerciseApi.errors);
  }

  await lessonApi.update(courseId, item.contentId, payload);
  return normalizeErrors(lessonApi.errors);
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
  if (item.type === ContentType.Exercise) {
    await exerciseApi.delete(courseId, item.contentId);
    return Boolean(exerciseApi.success);
  }

  await lessonApi.delete(courseId, item.contentId);
  return Boolean(lessonApi.success);
}
