import * as z from 'zod';

import { ROLE } from '@cio/utils/constants';

export const ZCourseRoleId = z.union([z.literal(ROLE.ADMIN), z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)]);
export type TCourseRoleId = z.infer<typeof ZCourseRoleId>;

export const ZCourseMembersParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseMembersParam = z.infer<typeof ZCourseMembersParam>;

export const CoursePeopleSortBy = z.enum(['name', 'role', 'progress', 'lastLogin', 'enrolledAt', 'certificate']);
export type TCoursePeopleSortBy = z.infer<typeof CoursePeopleSortBy>;

export const CoursePeopleSortOrder = z.enum(['asc', 'desc']);
export type TCoursePeopleSortOrder = z.infer<typeof CoursePeopleSortOrder>;

/**
 * Exclusive by precedence, matching `deriveCourseMemberStage`: a member with a
 * certificate or 100% progress is `completed` even if they have no content
 * items left, and a member at 0% is `not_started` unless a certificate exists.
 */
export const CoursePeopleProgress = z.enum(['not_started', 'in_progress', 'completed']);
export type TCoursePeopleProgress = z.infer<typeof CoursePeopleProgress>;

/** A member with no profile is an invite that has not been accepted. */
export const CoursePeopleMembership = z.enum(['joined', 'invited']);
export type TCoursePeopleMembership = z.infer<typeof CoursePeopleMembership>;

/**
 * Staleness thresholds, not recency windows: `90d` means "not logged in for 90
 * days or more", `never` means no login event was ever recorded.
 */
export const CoursePeopleActivityWindow = z.enum(['7d', '30d', '90d', '180d', 'never']);
export type TCoursePeopleActivityWindow = z.infer<typeof CoursePeopleActivityWindow>;

/** Recency windows for joining. A member always has a join date, so there is no `never`. */
export const CoursePeopleEnrolledWindow = z.enum(['7d', '30d', '90d', '180d']);
export type TCoursePeopleEnrolledWindow = z.infer<typeof CoursePeopleEnrolledWindow>;

export const ZCourseMembersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  roleId: z.coerce.number().int().min(1).optional(),
  sortBy: CoursePeopleSortBy.default('role'),
  sortOrder: CoursePeopleSortOrder.default('asc'),
  progress: CoursePeopleProgress.optional(),
  membership: CoursePeopleMembership.optional(),
  enrolledWithin: CoursePeopleEnrolledWindow.optional(),
  lastLoginBefore: CoursePeopleActivityWindow.optional(),
  /**
   * Parsed explicitly because `z.coerce.boolean()` turns the string `"false"`
   * into `true`, which would make "not earned" unrequestable.
   */
  certificateEarned: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => (value == null ? undefined : value === true || value === 'true'))
});
export type TCourseMembersQuery = z.infer<typeof ZCourseMembersQuery>;

/** Days behind each threshold. `never` is an absence, not a cutoff. */
export const COURSE_PEOPLE_WINDOW_DAYS: Record<'7d' | '30d' | '90d' | '180d', number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180
};

export const ZCourseMembersMemberParam = z.object({
  courseId: z.string().min(1),
  memberId: z.string().min(1)
});
export type TCourseMembersMemberParam = z.infer<typeof ZCourseMembersMemberParam>;

export const ZAddCourseMembers = z.array(
  z.object({
    profileId: z.uuid().optional(),
    roleId: ZCourseRoleId,
    email: z.email().optional(),
    name: z.string().optional() // For email sending
  })
);
export type TAddCourseMembers = z.infer<typeof ZAddCourseMembers>;

export const ZUpdateCourseMember = z
  .object({
    roleId: ZCourseRoleId.optional(),
    email: z.email().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
export type TUpdateCourseMember = z.infer<typeof ZUpdateCourseMember>;

export const ZResetCourseMemberProgressParam = z.object({
  courseId: z.string().uuid(),
  memberId: z.string().uuid()
});
export type TResetCourseMemberProgressParam = z.infer<typeof ZResetCourseMemberProgressParam>;
