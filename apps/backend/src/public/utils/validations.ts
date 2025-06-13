import { z } from 'zod';

// Simple but robust sanitization utility
const sanitize = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/['";]/g, '') // Remove quotes and semicolons to prevent SQL injection
    .slice(0, 1000); // Reasonable length limit
};

// Course and Lesson Types
export const ZCourseType = z.enum(['SELF_PACED', 'LIVE_CLASS']);
export const ZCourseStatus = z.enum(['ACTIVE', 'DELETED']);

// Base string fields with validation and sanitization
const baseString = z.string().min(1).transform(sanitize);
const optionalString = z.string().transform(sanitize).optional();
const baseUrl = z.string().url().transform(sanitize);
const optionalUrl = baseUrl.optional();

// Organization schemas
export const ZOrganizationUpdate = z.object({
  name: baseString,
  avatar_url: optionalUrl
});

// Course schemas
export const ZCourseBase = z.object({
  title: baseString,
  description: optionalString,
  slug: baseString,
  logo: optionalUrl,
  banner_image: optionalUrl,
  cost: z.number().min(0).optional(),
  currency: optionalString,
  is_published: z.boolean(),
  type: ZCourseType,
  status: ZCourseStatus
});

export const ZCourseUpdate = ZCourseBase.partial();

export const ZCourseAccess = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  access_type: z.enum(['grant', 'revoke'])
});

// Lesson schemas
export const ZLessonBase = z.object({
  title: baseString,
  content: optionalString,
  video_url: optionalUrl,
  duration: z.number().min(0).optional(),
  is_locked: z.boolean(),
  published: z.boolean(),
  section_id: z.string().uuid('Invalid section ID').optional(),
  order: z.number().min(0).optional()
});

export const ZLessonCreate = ZLessonBase.omit({
  is_locked: true,
  published: true
}).extend({
  is_locked: z.boolean().default(true),
  published: z.boolean().default(false)
});

export const ZLessonUpdate = ZLessonBase.partial();

// Types
export type TOrganizationUpdate = z.infer<typeof ZOrganizationUpdate>;
export type TCourseBase = z.infer<typeof ZCourseBase>;
export type TCourseUpdate = z.infer<typeof ZCourseUpdate>;
export type TCourseAccess = z.infer<typeof ZCourseAccess>;
export type TLessonBase = z.infer<typeof ZLessonBase>;
export type TLessonCreate = z.infer<typeof ZLessonCreate>;
export type TLessonUpdate = z.infer<typeof ZLessonUpdate>;
