import * as z from 'zod';

// Lesson Schemas
export const ZLessonCreate = z.object({
  title: z.string().min(1),
  note: z.string().optional(),
  courseId: z.string().min(1),
  sectionId: z.string().optional(),
  order: z.number().int().min(0).optional(),
  lessonAt: z.string().optional(),
  teacherId: z.string().optional(),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional()
});
export type TLessonCreate = z.infer<typeof ZLessonCreate>;

export const ZLessonUpdate = z.object({
  title: z.string().min(1).optional(),
  note: z.string().optional(),
  sectionId: z.string().optional(),
  order: z.number().int().min(0).optional(),
  callUrl: z.string().optional(),
  lessonAt: z.string().optional(),
  teacherId: z.string().optional(),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
  isComplete: z.boolean().optional(),
  videoUrl: z.url().optional(),
  slideUrl: z.url().optional(),
  videos: z
    .array(
      z.object({
        type: z.enum(['youtube', 'generic', 'upload']),
        link: z.string(),
        key: z.string().optional(),
        metadata: z
          .object({
            svid: z.string().optional()
          })
          .optional()
      })
    )
    .optional(),
  documents: z
    .array(
      z.object({
        type: z.string(),
        name: z.string(),
        link: z.string(),
        size: z.number().optional(),
        key: z.string()
      })
    )
    .optional()
});
export type TLessonUpdate = z.infer<typeof ZLessonUpdate>;

export const ZLessonGetParam = z.object({
  lessonId: z.string().min(1)
});
export type TLessonGetParam = z.infer<typeof ZLessonGetParam>;

export const ZLessonListQuery = z.object({
  sectionId: z.string().optional(),
  courseId: z.string().min(1)
});

export const ZLessonHistoryParam = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1)
});
export type TLessonHistoryParam = z.infer<typeof ZLessonHistoryParam>;

export const ZLessonHistoryQuery = z.object({
  locale: z.string().min(1),
  endRange: z.string().transform(Number).pipe(z.number().int().min(0))
});
export type TLessonHistoryQuery = z.infer<typeof ZLessonHistoryQuery>;
export type TLessonListQuery = z.infer<typeof ZLessonListQuery>;

export const ZLessonReorder = z.object({
  lessons: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.number().int().min(0),
        sectionId: z.string().optional()
      })
    )
    .min(1)
});
export type TLessonReorder = z.infer<typeof ZLessonReorder>;

// Lesson Comment Schemas
export const ZLessonCommentCreate = z.object({
  lessonId: z.string().min(1),
  comment: z.string().min(1)
});
export type TLessonCommentCreate = z.infer<typeof ZLessonCommentCreate>;

export const ZLessonCommentGetParam = z.object({
  commentId: z.string().min(1)
});
export type TLessonCommentGetParam = z.infer<typeof ZLessonCommentGetParam>;

export const ZLessonCommentUpdate = z.object({
  comment: z.string().min(1)
});
export type TLessonCommentUpdate = z.infer<typeof ZLessonCommentUpdate>;

export const ZLessonCommentsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(10)
});
export type TLessonCommentsQuery = z.infer<typeof ZLessonCommentsQuery>;

// Lesson Completion Schemas
export const ZLessonCompletionCreate = z.object({
  lessonId: z.string().min(1),
  isComplete: z.boolean()
});
export type TLessonCompletionCreate = z.infer<typeof ZLessonCompletionCreate>;

export const ZLessonCompletionUpdate = z.object({
  isComplete: z.boolean()
});
export type TLessonCompletionUpdate = z.infer<typeof ZLessonCompletionUpdate>;
