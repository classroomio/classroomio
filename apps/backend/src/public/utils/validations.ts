import { z } from 'zod';

// Course type enum
export const ZCourseType = z.enum(['SELF_PACED', 'LIVE_CLASS']);
export const ZCourseStatus = z.enum(['ACTIVE', 'DELETED']);

// Base course schema
export const ZCourseBase = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  logo: z.string().url().optional(),
  banner_image: z.string().url().optional(),
  cost: z.number().min(0).optional(),
  currency: z.string().optional(),
  is_published: z.boolean(),
  type: ZCourseType,
  status: ZCourseStatus
});

// Course update schema
export const ZCourseUpdate = ZCourseBase.partial();

// Course access schema
export const ZCourseAccess = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  access_type: z.enum(['grant', 'revoke'])
});

// Lesson base schema
export const ZLessonBase = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  video_url: z.string().url().optional(),
  duration: z.number().min(0).optional(),
  is_locked: z.boolean(),
  published: z.boolean(),
  section_id: z.string().uuid('Invalid section ID').optional(),
  order: z.number().min(0).optional()
});

// Lesson create schema
export const ZLessonCreate = ZLessonBase.omit({
  is_locked: true,
  published: true
}).extend({
  is_locked: z.boolean().default(true),
  published: z.boolean().default(false)
});

// Lesson update schema
export const ZLessonUpdate = ZLessonBase.partial();

// Response types
export type TCourseBase = z.infer<typeof ZCourseBase>;
export type TCourseUpdate = z.infer<typeof ZCourseUpdate>;
export type TCourseAccess = z.infer<typeof ZCourseAccess>;
export type TLessonBase = z.infer<typeof ZLessonBase>;
export type TLessonCreate = z.infer<typeof ZLessonCreate>;
export type TLessonUpdate = z.infer<typeof ZLessonUpdate>;
