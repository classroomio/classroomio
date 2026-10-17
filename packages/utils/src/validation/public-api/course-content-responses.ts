import * as z from 'zod';

// Response shapes for OpenAPI docs only; handlers don't validate against them.
const timestamp = z.string();
const nullableTimestamp = z.string().nullable();
const contentType = z.enum(['LESSON', 'EXERCISE']);

export const ZPublicApiCourseSectionResponse = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid().nullable(),
  title: z.string().nullable(),
  order: z.number(),
  createdAt: timestamp,
  updatedAt: nullableTimestamp
});

export const ZPublicApiCreateCourseSectionResponse = ZPublicApiCourseSectionResponse.extend({
  movedLessons: z.number().describe('Lessons moved in by moveUngrouped; 0 otherwise'),
  movedExercises: z.number().describe('Exercises moved in by moveUngrouped; 0 otherwise')
});

export const ZPublicApiCourseLessonResponse = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  sectionId: z.string().uuid().nullable(),
  title: z.string(),
  slug: z.string().nullable(),
  order: z.number(),
  isUnlocked: z.boolean().nullable(),
  public: z.boolean().nullable(),
  lessonAt: nullableTimestamp,
  callUrl: z.string().nullable(),
  teacherId: z.string().uuid().nullable(),
  completionPolicy: z.string(),
  videoWatchThreshold: z.number().nullable(),
  commentsEnabled: z.boolean(),
  createdAt: nullableTimestamp,
  updatedAt: nullableTimestamp
});

export const ZPublicApiCourseLessonTranslationResponse = z.object({
  id: z.number(),
  lessonId: z.string().uuid().nullable(),
  locale: z.string().nullable(),
  content: z.string().nullable(),
  updatedAt: timestamp
});

export const ZPublicApiCourseLessonDetailResponse = ZPublicApiCourseLessonResponse.extend({
  note: z.string().nullable(),
  videoUrl: z.string().nullable(),
  slideUrl: z.string().nullable(),
  slides: z.array(z.object({ id: z.string(), src: z.string(), platform: z.string() })),
  videos: z.array(
    z.object({
      type: z.string(),
      link: z.string().describe('For uploaded videos, a short-lived signed URL'),
      assetId: z.string().optional(),
      fileName: z.string().optional(),
      watchEnforced: z.boolean().optional(),
      metadata: z.record(z.string(), z.unknown()).optional()
    })
  ),
  documents: z.array(
    z.object({
      type: z.string(),
      name: z.string(),
      link: z.string().describe('A short-lived signed URL'),
      size: z.number().optional(),
      assetId: z.string().optional()
    })
  ),
  translations: z.array(ZPublicApiCourseLessonTranslationResponse)
});

export const ZPublicApiCourseLessonNotifyResponse = z.object({ jobId: z.string() });

export const ZPublicApiCourseLessonHistoryResponse = z.object({
  items: z.array(
    z.object({
      id: z.number().describe('0 for the current content of a lesson with no saved history yet'),
      locale: z.string().nullable(),
      kind: z.enum(['auto', 'manual', 'publish']).nullable(),
      label: z.string().nullable(),
      oldContent: z.string().nullable(),
      newContent: z.string().nullable(),
      timestamp: nullableTimestamp,
      sessionStartedAt: nullableTimestamp,
      editCount: z.number().nullable(),
      isSealed: z.boolean().nullable(),
      authorId: z.string().uuid().nullable(),
      authorName: z.string().nullable()
    })
  ),
  nextCursor: z.string().nullable().describe('Pass back as cursor for older versions; null on the last page')
});

export const ZPublicApiCourseLessonCommentResponse = z.object({
  id: z.number(),
  lessonId: z.string().uuid().nullable(),
  groupmemberId: z.string().uuid().nullable().describe('Course member who wrote it'),
  comment: z.string().nullable(),
  createdAt: timestamp,
  updatedAt: nullableTimestamp
});

export const ZPublicApiCourseLessonCommentsResponse = z.object({
  items: z.array(
    ZPublicApiCourseLessonCommentResponse.extend({
      author: z.object({ fullname: z.string().nullable(), avatarUrl: z.string().nullable() }).nullable()
    })
  ),
  total: z.number(),
  nextCursor: z.string().nullable().describe('Pass back as cursor for older comments; null on the last page')
});

export const ZPublicApiReorderCourseContentResponse = z.object({
  updatedSections: z.number(),
  updatedLessons: z.number(),
  updatedExercises: z.number()
});

export const ZPublicApiCourseContentItemsResponse = z.object({
  items: z.array(z.object({ id: z.string().uuid(), type: contentType }))
});
