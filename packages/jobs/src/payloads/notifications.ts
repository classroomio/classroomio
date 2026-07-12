import * as z from 'zod';

/**
 * Org branding carried through to the `quizAssigned` email. Mirrors
 * `@cio/email`'s `ZEmailBranding`; defined inline so this lean queue package
 * doesn't take a dependency on the email package. Re-validated against the
 * email template schema at send time.
 */
const ZNotifyBranding = z
  .object({
    orgName: z.string().optional(),
    logoUrl: z.string().url().optional(),
    themeColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .optional()
  })
  .optional();

/**
 * Payload for a `notifications:notify-course-exercise` job. Fired when a
 * teacher clicks "Notify students" on an exercise — the worker fans out one
 * `quizAssigned` email per course member with a deep link to take the quiz.
 */
export const ZNotifyCourseExercisePayload = z.object({
  courseId: z.string().min(1),
  exerciseTitle: z.string().min(1),
  courseName: z.string().min(1),
  orgName: z.string().min(1),
  organizationId: z.string().min(1),
  fromName: z.string().min(1),
  quizUrl: z.string().min(1),
  branding: ZNotifyBranding
});
export type TNotifyCourseExercisePayload = z.infer<typeof ZNotifyCourseExercisePayload>;

/** Periodic scan that emails 24h/1h reminders for upcoming live sessions. No payload. */
export const ZSessionReminderScanPayload = z.object({}).default({});
export type TSessionReminderScanPayload = z.infer<typeof ZSessionReminderScanPayload>;

/**
 * Payload for a `notifications:notify-course-session-update` job. Fired when a
 * teacher changes a live lesson's time/link — emails every member an updated
 * calendar invite (same UID, higher SEQUENCE).
 */
export const ZNotifyCourseSessionUpdatePayload = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1)
});
export type TNotifyCourseSessionUpdatePayload = z.infer<typeof ZNotifyCourseSessionUpdatePayload>;
