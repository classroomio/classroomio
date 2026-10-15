import * as z from 'zod';

/**
 * Concrete public API response contracts for learning paths and enrollments.
 * Used with hono-openapi `resolver()` in describeRoute instead of bare
 * `{ type: 'object' }`, and snapshot-tested for stability.
 */

/** Declared once; every public list response reuses it. */
export const ZPublicApiPagination = z
  .object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int()
  })
  .passthrough();
export type TPublicApiPagination = z.infer<typeof ZPublicApiPagination>;

export const ZPublicApiLearningPath = z
  .object({
    id: z.string().uuid(),
    publicId: z.string(),
    organizationId: z.string().uuid(),
    name: z.string(),
    slug: z.string().nullable(),
    description: z.string(),
    coverImage: z.string().nullable(),
    isPublished: z.boolean(),
    cost: z.number(),
    currency: z.string(),
    sequentialUnlock: z.boolean(),
    selfEnrollment: z.boolean(),
    status: z.string(),
    courseCount: z.number().int().optional(),
    memberCount: z.number().int().optional(),
    completionsCount: z.number().int().optional(),
    completionRate: z.number().optional(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable()
  })
  .passthrough();
export type TPublicApiLearningPath = z.infer<typeof ZPublicApiLearningPath>;

export const ZPublicApiPathCourse = z
  .object({
    id: z.string().uuid(),
    learningPathId: z.string().uuid(),
    courseId: z.string().uuid(),
    order: z.number().int(),
    title: z.string(),
    lessonsCount: z.number().int().optional(),
    exercisesCount: z.number().int().optional()
  })
  .passthrough();
export type TPublicApiPathCourse = z.infer<typeof ZPublicApiPathCourse>;

/**
 * A path-course link row as written by add/remove course: the link itself,
 * without the joined course title that the path detail includes.
 */
export const ZPublicApiPathCourseLink = z
  .object({
    id: z.string().uuid(),
    learningPathId: z.string().uuid(),
    courseId: z.string().uuid(),
    order: z.number().int(),
    addedAt: z.string().nullable(),
    removedAt: z.string().nullable()
  })
  .passthrough();
export type TPublicApiPathCourseLink = z.infer<typeof ZPublicApiPathCourseLink>;

export const ZPublicApiPathMember = z
  .object({
    id: z.string().uuid(),
    profileId: z.string().nullable(),
    email: z.string().nullable(),
    roleId: z.number().int(),
    status: z.string(),
    enrolledAt: z.string().nullable(),
    fullName: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
    profileEmail: z.string().nullable().optional()
  })
  .passthrough();
export type TPublicApiPathMember = z.infer<typeof ZPublicApiPathMember>;

const ZPublicApiEnrolledCourseItem = z
  .object({
    kind: z.literal('course'),
    data: z
      .object({
        id: z.string(),
        title: z.string().optional()
      })
      .passthrough()
  })
  .passthrough();

const ZPublicApiEnrolledPathItem = z
  .object({
    kind: z.literal('learning_path'),
    data: z
      .object({
        id: z.string(),
        name: z.string().optional()
      })
      .passthrough()
  })
  .passthrough();

export const ZPublicApiEnrolledItem = z.discriminatedUnion('kind', [
  ZPublicApiEnrolledCourseItem,
  ZPublicApiEnrolledPathItem
]);
export type TPublicApiEnrolledItem = z.infer<typeof ZPublicApiEnrolledItem>;

export const ZPublicApiEnrolledCounts = z
  .object({
    inProgress: z.number().int(),
    completed: z.number().int()
  })
  .passthrough();
export type TPublicApiEnrolledCounts = z.infer<typeof ZPublicApiEnrolledCounts>;

/** Wraps a payload schema in the standard `{ success: true, data }` envelope. */
function successWith<TData extends z.ZodType>(data: TData) {
  return z.object({ success: z.literal(true), data }).passthrough();
}

/** Wraps an item schema in the standard paginated `{ success, data[], pagination }` envelope. */
function pagedList<TItem extends z.ZodType>(item: TItem) {
  return z
    .object({
      success: z.literal(true),
      data: z.array(item),
      pagination: ZPublicApiPagination
    })
    .passthrough();
}

export const ZPublicApiLearningPathResponse = successWith(ZPublicApiLearningPath);
export const ZPublicApiLearningPathListResponse = pagedList(ZPublicApiLearningPath);
export const ZPublicApiLearningPathDetailResponse = successWith(
  ZPublicApiLearningPath.extend({
    courseIds: z.array(z.string().uuid()),
    courses: z.array(ZPublicApiPathCourse)
  }).passthrough()
);
export const ZPublicApiPathMembersResponse = pagedList(ZPublicApiPathMember);
export const ZPublicApiPathCourseLinksResponse = successWith(z.array(ZPublicApiPathCourseLink));
export const ZPublicApiPathCourseLinkResponse = successWith(ZPublicApiPathCourseLink);
export const ZPublicApiReorderPathCoursesResponse = successWith(z.object({ reordered: z.boolean() }).passthrough());
export const ZPublicApiEnrolledListResponse = z
  .object({
    success: z.literal(true),
    data: z.array(ZPublicApiEnrolledItem),
    pagination: ZPublicApiPagination,
    counts: ZPublicApiEnrolledCounts
  })
  .passthrough();
