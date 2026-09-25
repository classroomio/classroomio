import * as z from 'zod';

import { ROLE } from '../../constants/roles';
import { ZPublicApiCourseParam } from './course';

const ZPublicApiCourseRoleId = z
  .union([z.literal(ROLE.ADMIN), z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)])
  .describe('1 = admin, 2 = tutor, 3 = student');

export const ZPublicApiCourseMemberParam = ZPublicApiCourseParam.extend({
  memberId: z.string().uuid()
});
export type TPublicApiCourseMemberParam = z.infer<typeof ZPublicApiCourseMemberParam>;

export const ZPublicApiCourseMembersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  roleId: z.coerce.number().int().min(1).optional()
});
export type TPublicApiCourseMembersQuery = z.infer<typeof ZPublicApiCourseMembersQuery>;

export const ZPublicApiAddCourseMember = z
  .object({
    profileId: z.uuid().optional(),
    roleId: ZPublicApiCourseRoleId,
    email: z.email().optional(),
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
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((value) => value === 'true')
});
export type TPublicApiCourseMemberAnalyticsQuery = z.infer<typeof ZPublicApiCourseMemberAnalyticsQuery>;
