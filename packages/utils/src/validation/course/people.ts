import * as z from 'zod';

export const ZCourseMembersParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseMembersParam = z.infer<typeof ZCourseMembersParam>;

export const ZCourseMembersMemberParam = z.object({
  courseId: z.string().min(1),
  memberId: z.string().min(1)
});
export type TCourseMembersMemberParam = z.infer<typeof ZCourseMembersMemberParam>;

export const ZAddCourseMembers = z.array(
  z.object({
    profileId: z.uuid().optional(),
    roleId: z.number().int().min(1),
    email: z.email().optional(),
    name: z.string().optional() // For email sending
  })
);
export type TAddCourseMembers = z.infer<typeof ZAddCourseMembers>;

export const ZUpdateCourseMember = z.object({
  roleId: z.number().int().min(1).optional(),
  email: z.email().optional()
});
export type TUpdateCourseMember = z.infer<typeof ZUpdateCourseMember>;
