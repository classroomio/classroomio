import { AppError, ErrorCodes } from '@api/utils/errors';
import { getAttendanceByCourseId, getAttendanceByStudentAndLesson, upsertAttendance } from '@cio/db/queries/attendance';
import type { TGroupAttendance, TNewGroupAttendance } from '@cio/db/types';
import type { TAttendanceUpsert } from '@cio/utils/validation/attendance';

/**
 * Lists attendance records for a course
 * @param courseId Course ID
 * @param lessonId Optional lesson ID filter
 * @returns Array of attendance records
 */
export async function listAttendance(courseId: string, lessonId?: string): Promise<TGroupAttendance[]> {
  try {
    return await getAttendanceByCourseId(courseId, lessonId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list attendance',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Creates or updates an attendance record
 * @param data Attendance data
 * @returns Created or updated attendance record
 */
export async function upsertAttendanceService(data: TAttendanceUpsert): Promise<TGroupAttendance> {
  try {
    const attendanceData: TNewGroupAttendance = {
      courseId: data.courseId,
      lessonId: data.lessonId,
      studentId: data.studentId,
      isPresent: data.isPresent
    };

    return await upsertAttendance(attendanceData);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to upsert attendance',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
