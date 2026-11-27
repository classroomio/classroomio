import * as z from 'zod';

export const ZPublicApiEnrollCourseStudent = z.object({
  email: z
    .email()
    .describe(
      'The student to enroll. If they have not joined, the course goes on their organization invite; a new email becomes a pending member and uses a seat'
    ),
  sendEmail: z
    .boolean()
    .default(true)
    .describe(
      'Send the organization invite email when the invite is new or changed, or the welcome email when they already joined your organization. Default: true.'
    )
});
export type TPublicApiEnrollCourseStudent = z.infer<typeof ZPublicApiEnrollCourseStudent>;

export const ZPublicApiCourseEnrollmentStatus = z.enum(['enrolled', 'already_enrolled', 'invited', 'already_invited']);
export type TPublicApiCourseEnrollmentStatus = z.infer<typeof ZPublicApiCourseEnrollmentStatus>;

export const ZPublicApiEnrollCourseStudentResponse = z.object({
  status: ZPublicApiCourseEnrollmentStatus.describe(
    'enrolled and invited describe what this call did; already_enrolled and already_invited mean nothing changed'
  ),
  memberId: z.uuid().nullable().describe('Course member id when the student is enrolled'),
  inviteId: z
    .uuid()
    .nullable()
    .describe('Organization invite id when the student was invited; the invite carries this course'),
  inviteKind: z
    .enum(['organization'])
    .nullable()
    .describe(
      'Always organization when inviteId is set: course email invites are organization invites that list courses'
    ),
  inviteLink: z
    .string()
    .nullable()
    .describe('Accept URL for an invite this call issued; null when reusing an existing member or invite'),
  email: z.string()
});
export type TPublicApiEnrollCourseStudentResponse = z.infer<typeof ZPublicApiEnrollCourseStudentResponse>;
