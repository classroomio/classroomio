import * as z from 'zod';

export const STUDENT_REPORT_EXPIRY_DAYS = [7, 30, 90] as const;
export const STUDENT_REPORT_MAX_STUDENTS = 100;
export const STUDENT_REPORT_COMMENT_MAX_LENGTH = 2000;

export const ZStudentReportCreate = z
  .object({
    profileIds: z.array(z.uuid()).min(1).max(STUDENT_REPORT_MAX_STUDENTS),
    periodStart: z.iso.datetime(),
    periodEnd: z.iso.datetime(),
    teacherComment: z.string().trim().max(STUDENT_REPORT_COMMENT_MAX_LENGTH).optional(),
    parentEmail: z.email().max(254).optional(),
    expiresInDays: z
      .number()
      .refine((days) => (STUDENT_REPORT_EXPIRY_DAYS as readonly number[]).includes(days))
      .default(30),
    sendToParent: z.boolean().default(false)
  })
  .refine((input) => new Date(input.periodStart) <= new Date(input.periodEnd), { path: ['periodEnd'] })
  .refine((input) => !input.sendToParent || (Boolean(input.parentEmail) && input.profileIds.length === 1), {
    path: ['parentEmail']
  });
export type TStudentReportCreate = z.infer<typeof ZStudentReportCreate>;

export const ZStudentReportListQuery = z.object({
  profileId: z.uuid()
});

export const ZStudentReportParam = z.object({
  reportId: z.uuid()
});

export const ZStudentReportToken = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/)
});
