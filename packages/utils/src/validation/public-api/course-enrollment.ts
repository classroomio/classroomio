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
      'Email a course invite when the person is not in your organization yet. Default: true. Someone who is already a student is enrolled directly and receives the course welcome email.'
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
  email: z.string()
});
export type TPublicApiEnrollCourseStudentResponse = z.infer<typeof ZPublicApiEnrollCourseStudentResponse>;
