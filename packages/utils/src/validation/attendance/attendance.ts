import * as z from 'zod';

export const ZAttendanceUpsert = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  studentId: z.string().min(1),
  isPresent: z.boolean()
});
export type TAttendanceUpsert = z.infer<typeof ZAttendanceUpsert>;

export const ZAttendanceListQuery = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().optional()
});
export type TAttendanceListQuery = z.infer<typeof ZAttendanceListQuery>;
