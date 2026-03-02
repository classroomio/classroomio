import * as z from 'zod';


export const ZCreateApiKey = z.object({
  name: z.string().min(1).max(255).optional().default('Default')
});

export type TCreateApiKey = z.infer<typeof ZCreateApiKey>;

export const ZRevokeApiKeyParam = z.object({
  keyId: z.string().uuid('Invalid key ID format')
});

export type TRevokeApiKeyParam = z.infer<typeof ZRevokeApiKeyParam>;

export const ZPagination = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
});

export type TPagination = z.infer<typeof ZPagination>;

export const ZCreateCoursePublic = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  courseType: z.enum(['SELF_PACED', 'LIVE_CLASS']).optional().default('SELF_PACED')
});

export type TCreateCoursePublic = z.infer<typeof ZCreateCoursePublic>;

export const ZUpdateCoursePublic = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  courseType: z.enum(['SELF_PACED', 'LIVE_CLASS']).optional()
});

export type TUpdateCoursePublic = z.infer<typeof ZUpdateCoursePublic>;

export const ZCourseIdParam = z.object({
  courseId: z.string().uuid('Invalid course ID format')
});

export type TCourseIdParam = z.infer<typeof ZCourseIdParam>;

export const ZListCoursesPublic = z.object({
  page: ZPagination.shape.page,
  limit: ZPagination.shape.limit
});

export type TListCoursesPublic = z.infer<typeof ZListCoursesPublic>;

export const ZAddStudentPublic = z.object({
  email: z.string().email(),
  fullname: z.string().min(1).max(255).optional(),
  username: z.string().min(1).max(255).optional()
});

export type TAddStudentPublic = z.infer<typeof ZAddStudentPublic>;

export const ZUpdateStudentPublic = z.object({
  email: z.string().email().optional(),
  fullname: z.string().min(1).max(255).optional(),
  username: z.string().min(1).max(255).optional()
});

export type TUpdateStudentPublic = z.infer<typeof ZUpdateStudentPublic>;

export const ZStudentIdParam = z.object({
  studentId: z.string().uuid('Invalid student ID format')
});

export type TStudentIdParam = z.infer<typeof ZStudentIdParam>;

export const ZListStudentsPublic = z.object({
  page: ZPagination.shape.page,
  limit: ZPagination.shape.limit
});

export type TListStudentsPublic = z.infer<typeof ZListStudentsPublic>;

export const ZApiErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.string().optional(),
  errors: z.record(z.string(), z.string()).optional()
});

export type TApiErrorResponse = z.infer<typeof ZApiErrorResponse>;

export const ZPaginatedResponse = z.object({
  success: z.literal(true),
  data: z.array(z.unknown()),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative()
  })
});

export type TPaginatedResponse = z.infer<typeof ZPaginatedResponse>;
