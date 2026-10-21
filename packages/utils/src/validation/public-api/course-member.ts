import * as z from 'zod';

import {
  CoursePeopleActivityWindow,
  CoursePeopleEnrolledWindow,
  CoursePeopleMembership,
  CoursePeopleProgress,
  CoursePeopleSortBy,
  CoursePeopleSortOrder
} from '../course/people';
import { ROLE } from '../../constants/roles';
import { ZPublicApiCourseParam } from './course';
import { ZPublicApiPaginationQuery } from './pagination';

const ZPublicApiCourseRoleId = z
  .union([z.literal(ROLE.ADMIN), z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)])
  .describe('1 = admin, 2 = tutor, 3 = student');

export const ZPublicApiCourseMemberParam = ZPublicApiCourseParam.extend({
  memberId: z.string().uuid()
});
export type TPublicApiCourseMemberParam = z.infer<typeof ZPublicApiCourseMemberParam>;

export const ZPublicApiCourseMembersQuery = ZPublicApiPaginationQuery.extend({
  search: z.string().trim().max(200).optional().describe('Matches name or email.'),
  roleId: z.coerce
    .number()
    .int()
    .min(ROLE.ADMIN)
    .max(ROLE.STUDENT)
    .optional()
    .describe('1 = admin, 2 = tutor, 3 = student'),
  sortBy: CoursePeopleSortBy.default('role').describe('Default: role.'),
  sortOrder: CoursePeopleSortOrder.default('asc').describe('Default: asc.'),
  progress: CoursePeopleProgress.optional().describe(
    'Joined students only; tutors, admins and pending invites never match.'
  ),
  membership: CoursePeopleMembership.optional().describe('invited = the invite has not been accepted yet.'),
  enrolledWithin: CoursePeopleEnrolledWindow.optional().describe('Added to the course within the last N days.'),
  lastLoginBefore: CoursePeopleActivityWindow.optional().describe(
    'Not logged in for N days or more (including never); never = no login recorded.'
  ),
  certificateEarned: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .describe('true = has earned the course certificate, false = has not.')
    .transform((value) => (value == null ? undefined : value === true || value === 'true'))
});
export type TPublicApiCourseMembersQuery = z.infer<typeof ZPublicApiCourseMembersQuery>;

export const ZPublicApiAddCourseMember = z
  .object({
    profileId: z.uuid().optional().describe('Must belong to someone already in your organization.'),
    roleId: ZPublicApiCourseRoleId,
    email: z
      .email()
      .optional()
      .describe(
        "Must belong to someone already in your organization; it is linked to that person's profile. To onboard someone new, use the invites endpoints."
      ),
    name: z.string().optional().describe('Used in the welcome email sent to added tutors/admins')
  })
  .refine((data) => Boolean(data.profileId) || Boolean(data.email), {
    message: 'Either profileId or email must be provided',
    path: ['profileId']
  });
export type TPublicApiAddCourseMember = z.infer<typeof ZPublicApiAddCourseMember>;

export const ZPublicApiUpdateCourseMember = z
  .object({
    roleId: ZPublicApiCourseRoleId.optional(),
    email: z.email().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
export type TPublicApiUpdateCourseMember = z.infer<typeof ZPublicApiUpdateCourseMember>;

export const ZPublicApiCourseMemberAnalyticsQuery = z.object({
  includeProgressImpact: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .default(false)
    .transform((value) => value === true || value === 'true')
});
export type TPublicApiCourseMemberAnalyticsQuery = z.infer<typeof ZPublicApiCourseMemberAnalyticsQuery>;
