import * as z from 'zod';

import { ATTENDANCE_STATUS_VALUES, CHECK_IN_CODE_LENGTH } from '../../constants/attendance';

export const ZAttendanceStatus = z.enum(ATTENDANCE_STATUS_VALUES);

export const ZAttendanceUpsert = z
  .object({
    courseId: z.string().min(1),
    lessonId: z.string().min(1),
    studentId: z.string().min(1),
    isPresent: z.boolean().optional(),
    status: ZAttendanceStatus.optional()
  })
  .refine((value) => value.isPresent !== undefined || value.status !== undefined, {
    message: 'isPresent or status is required',
    path: ['status']
  });
export type TAttendanceUpsert = z.infer<typeof ZAttendanceUpsert>;

export const ZAttendanceBulkUpsert = z.object({
  lessonId: z.uuid(),
  records: z
    .array(
      z.object({
        studentId: z.uuid(),
        status: ZAttendanceStatus
      })
    )
    .min(1)
    .max(500)
});
export type TAttendanceBulkUpsert = z.infer<typeof ZAttendanceBulkUpsert>;

export const ZAttendanceListQuery = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().optional()
});
export type TAttendanceListQuery = z.infer<typeof ZAttendanceListQuery>;

export const ZLessonCheckInCodeParam = z.object({
  courseId: z.uuid(),
  lessonId: z.uuid()
});
export type TLessonCheckInCodeParam = z.infer<typeof ZLessonCheckInCodeParam>;

export const ZCheckInSubmit = z.object({
  lessonId: z.uuid(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .length(CHECK_IN_CODE_LENGTH)
    .regex(/^[A-Z0-9]+$/)
});
export type TCheckInSubmit = z.infer<typeof ZCheckInSubmit>;
