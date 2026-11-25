import * as z from 'zod';

export const ZPublicApiEnrollCourseStudent = z.object({
  email: z
    .email()
    .describe(
      'The student to enroll. Someone not yet in your organization gets an invite and is enrolled when they accept'
    ),
  sendEmail: z
    .boolean()
    .default(true)
    .describe(
      'Send the course invitation, or the welcome email when the person is already in your organization. Default: true.'
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
  inviteId: z.uuid().nullable().describe('Pending course invite id when the student was invited'),
  inviteLink: z
    .string()
    .nullable()
    .describe('Enrollment URL for a newly created invite; null when reusing an existing member or invite'),
  email: z.string()
});
export type TPublicApiEnrollCourseStudentResponse = z.infer<typeof ZPublicApiEnrollCourseStudentResponse>;
