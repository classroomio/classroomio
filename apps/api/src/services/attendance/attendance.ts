import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  filterCourseStudentMemberIds,
  getAttendanceByCourseId,
  upsertAttendance
} from '@cio/db/queries/attendance/attendance';
import { getLessonSessionContext } from '@cio/db/queries/attendance/check-in';
import { db } from '@cio/db/drizzle';
import type { TGroupAttendance } from '@cio/db/types';
import { isPresentForAttendanceStatus, type TAttendanceStatus } from '@cio/utils/constants/attendance';
import type { TAttendanceBulkUpsert, TAttendanceUpsert } from '@cio/utils/validation/attendance';

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

function resolveAttendanceStatus(data: Pick<TAttendanceUpsert, 'isPresent' | 'status'>): TAttendanceStatus {
  if (data.status) return data.status;

  return data.isPresent ? 'present' : 'absent';
}

async function assertLessonInCourse(courseId: string, lessonId: string) {
  const session = await getLessonSessionContext(lessonId);
  if (!session || session.courseId !== courseId) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }
}

async function assertCourseStudents(courseId: string, studentIds: string[]) {
  const uniqueIds = [...new Set(studentIds)];
  const validIds = await filterCourseStudentMemberIds(courseId, uniqueIds);
  if (validIds.length !== uniqueIds.length) {
    throw new AppError('Student is not a member of this course', ErrorCodes.ATTENDANCE_STUDENT_NOT_IN_COURSE, 400);
  }
}

/**
 * Records one learner's attendance for a lesson of the course. `status` wins over the legacy `isPresent`; both
 * columns are written so `isPresent` stays true for present and late.
 */
export async function upsertAttendanceService(courseId: string, data: TAttendanceUpsert): Promise<TGroupAttendance> {
  await assertLessonInCourse(courseId, data.lessonId);
  await assertCourseStudents(courseId, [data.studentId]);

  const status = resolveAttendanceStatus(data);

  return upsertAttendance({
    courseId,
    lessonId: data.lessonId,
    studentId: data.studentId,
    status,
    isPresent: isPresentForAttendanceStatus(status)
  });
}

/** Records attendance for several learners of one lesson in a single transaction. */
export async function bulkUpsertAttendanceService(
  courseId: string,
  data: TAttendanceBulkUpsert
): Promise<TGroupAttendance[]> {
  await assertLessonInCourse(courseId, data.lessonId);
  await assertCourseStudents(
    courseId,
    data.records.map((record) => record.studentId)
  );

  return db.transaction(async (tx) => {
    const saved: TGroupAttendance[] = [];
    for (const record of data.records) {
      const row = await upsertAttendance(
        {
          courseId,
          lessonId: data.lessonId,
          studentId: record.studentId,
          status: record.status,
          isPresent: isPresentForAttendanceStatus(record.status)
        },
        tx
      );
      saved.push(row);
    }

    return saved;
  });
}
