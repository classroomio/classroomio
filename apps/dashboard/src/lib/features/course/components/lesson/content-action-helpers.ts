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

type ActivityApi = {
  update: (courseId: string, activityId: string, payload: Record<string, unknown>) => Promise<unknown>;
  delete: (courseId: string, activityId: string) => Promise<unknown>;
  errors?: CourseApiErrorMap;
  success?: boolean;
};

function normalizeErrors(errors: CourseApiErrorMap): Record<string, string> {
  if (!errors) return {};
  const entries = Object.entries(errors).filter(([, value]) => Boolean(value));
  return entries.length ? Object.fromEntries(entries) : {};
}

function buildContentPayload(item: ContentActionItem, overrides: Record<string, unknown> = {}, omitEmptyTitle = false) {
  const normalizedSectionId = item.sectionId === '' ? null : item.sectionId;
  const payload: Record<string, unknown> = {
    title: item.title || '',
    isUnlocked: item.isUnlocked ?? undefined,
    sectionId: normalizedSectionId ?? undefined,
    order: item.order ?? undefined,
    ...overrides
  };

  if (omitEmptyTitle && !item.title) delete payload.title;

  return payload;
}

export async function toggleLock({
  item,
  courseId,
  lessonApi,
  exerciseApi,
  activityApi
}: {
  item: ContentActionItem;
  courseId: string;
  lessonApi: LessonApi;
  exerciseApi: ExerciseApi;
  activityApi: ActivityApi;
}): Promise<Record<string, string>> {
  item.isUnlocked = !(item.isUnlocked ?? false);
  const payload = buildContentPayload(item, { order: undefined }, item.type === ContentType.Activity);

  switch (item.type) {
    case ContentType.Exercise:
      await exerciseApi.update(courseId, item.contentId, payload);
      return normalizeErrors(exerciseApi.errors);
    case ContentType.Lesson:
      await lessonApi.update(courseId, item.contentId, payload);
      return normalizeErrors(lessonApi.errors);
    case ContentType.Activity:
      await activityApi.update(courseId, item.contentId, payload);
      return normalizeErrors(activityApi.errors);
    case ContentType.Section:
      return {};
    default:
      return {};
  }
}

export async function saveContent({
  item,
  courseId,
  lessonApi,
  exerciseApi,
  activityApi
}: {
  item: ContentActionItem;
  courseId: string;
  lessonApi: LessonApi;
  exerciseApi: ExerciseApi;
  activityApi: ActivityApi;
}): Promise<Record<string, string>> {
  const payload = buildContentPayload(item);

  switch (item.type) {
    case ContentType.Exercise:
      await exerciseApi.update(courseId, item.contentId, payload);
      return normalizeErrors(exerciseApi.errors);
    case ContentType.Lesson:
      await lessonApi.update(courseId, item.contentId, payload);
      return normalizeErrors(lessonApi.errors);
    case ContentType.Activity:
      await activityApi.update(courseId, item.contentId, payload);
      return normalizeErrors(activityApi.errors);
    case ContentType.Section:
      return {};
    default:
      return {};
  }
}

export async function deleteContent({
  item,
  courseId,
  lessonApi,
  exerciseApi,
  activityApi
}: {
  item: ContentActionItem;
  courseId: string;
  lessonApi: LessonApi;
  exerciseApi: ExerciseApi;
  activityApi: ActivityApi;
}) {
  switch (item.type) {
    case ContentType.Exercise:
      await exerciseApi.delete(courseId, item.contentId);
      return Boolean(exerciseApi.success);
    case ContentType.Lesson:
      await lessonApi.delete(courseId, item.contentId);
      return Boolean(lessonApi.success);
    case ContentType.Activity:
      await activityApi.delete(courseId, item.contentId);
      return Boolean(activityApi.success);
    case ContentType.Section:
      return false;
    default:
      return false;
  }
}
