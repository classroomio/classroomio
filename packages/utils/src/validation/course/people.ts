import * as z from 'zod';

import { ROLE } from '@cio/utils/constants';

export const ZCourseRoleId = z.union([z.literal(ROLE.ADMIN), z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)]);
export type TCourseRoleId = z.infer<typeof ZCourseRoleId>;

export const ZCourseMembersParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseMembersParam = z.infer<typeof ZCourseMembersParam>;

export const ZCourseMembersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  roleId: z.coerce.number().int().min(1).optional()
});
export type TCourseMembersQuery = z.infer<typeof ZCourseMembersQuery>;

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
