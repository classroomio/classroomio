import { AppError, ErrorCodes } from '@api/utils/errors';
import { getAttendanceByStudentAndLesson, upsertAttendance } from '@cio/db/queries/attendance/attendance';
import {
  deleteLessonCheckInCode,
  getCourseStudentMemberId,
  getLessonCheckInCode,
  getLessonSessionContext,
  replaceLessonCheckInCode
} from '@cio/db/queries/attendance/check-in';
import type { TLessonCheckInCode } from '@cio/db/types';
import { CHECK_IN_CODE_TTL_MINUTES, isPresentForAttendanceStatus } from '@cio/utils/constants/attendance';
import type { TCheckInSubmit } from '@cio/utils/validation/attendance';

import {
  buildCheckInQrPayload,
  checkInCodesMatch,
  checkInStatusAt,
  generateCheckInCode,
  mergeCheckInStatus
} from './check-in-code';

const MS_PER_MINUTE = 60 * 1000;

function toCheckInCodePayload(row: TLessonCheckInCode) {
  return {
    lessonId: row.lessonId,
    code: row.code,
    expiresAt: new Date(row.expiresAt).toISOString(),
    qrPayload: buildCheckInQrPayload(row.lessonId, row.code)
  };
}

async function getCourseLessonOrThrow(courseId: string, lessonId: string) {
  const session = await getLessonSessionContext(lessonId);
  if (!session || session.courseId !== courseId) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  return session;
}

/** Issues a fresh check-in code for the lesson, replacing any earlier code. */
export async function createLessonCheckInCode(courseId: string, lessonId: string, actorProfileId: string) {
  await getCourseLessonOrThrow(courseId, lessonId);

  const expiresAt = new Date(Date.now() + CHECK_IN_CODE_TTL_MINUTES * MS_PER_MINUTE).toISOString();
  const code = generateCheckInCode();
  const row = await replaceLessonCheckInCode({ lessonId, code, expiresAt, createdByProfileId: actorProfileId });

  return toCheckInCodePayload(row);
}

/** The lesson's unexpired check-in code, or null when there is none. */
export async function getActiveLessonCheckInCode(courseId: string, lessonId: string) {
  await getCourseLessonOrThrow(courseId, lessonId);

  const row = await getLessonCheckInCode(lessonId);
  if (!row || new Date(row.expiresAt).getTime() <= Date.now()) return null;

  return toCheckInCodePayload(row);
}

export async function revokeLessonCheckInCode(courseId: string, lessonId: string) {
  await getCourseLessonOrThrow(courseId, lessonId);

  const revoked = await deleteLessonCheckInCode(lessonId);

  return { lessonId, revoked };
}

/**
 * Marks the signed-in learner present, or late when they check in after the grace window, for a lesson of a course
 * they are a student of in the active organization. Throws when the code is wrong or expired.
 */
export async function checkInToLesson(organizationId: string, profileId: string, input: TCheckInSubmit) {
  const session = await getLessonSessionContext(input.lessonId);
  if (!session || session.organizationId !== organizationId) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  const studentId = await getCourseStudentMemberId(session.courseId, profileId);
  if (!studentId) {
    throw new AppError('You are not a student of this course', ErrorCodes.CHECK_IN_NOT_ENROLLED, 403);
  }

  const activeCode = await getLessonCheckInCode(input.lessonId);
  if (!activeCode || !checkInCodesMatch(activeCode.code, input.code)) {
    throw new AppError('This check-in code is not valid', ErrorCodes.CHECK_IN_CODE_INVALID, 400);
  }

  const now = new Date();
  if (new Date(activeCode.expiresAt).getTime() <= now.getTime()) {
    throw new AppError('This check-in code has expired', ErrorCodes.CHECK_IN_CODE_EXPIRED, 400);
  }

  const existing = await getAttendanceByStudentAndLesson(session.courseId, input.lessonId, studentId);
  const status = mergeCheckInStatus(existing?.status ?? null, checkInStatusAt(session.lessonAt, now));
  const checkedInAt = existing?.checkedInAt ?? now.toISOString();

  const record = await upsertAttendance({
    courseId: session.courseId,
    lessonId: input.lessonId,
    studentId,
    status,
    isPresent: isPresentForAttendanceStatus(status),
    checkedInAt
  });

  return {
    courseId: session.courseId,
    courseTitle: session.courseTitle,
    lessonId: session.lessonId,
    lessonTitle: session.lessonTitle,
    status: record.status,
    checkedInAt: record.checkedInAt ? new Date(record.checkedInAt).toISOString() : null
  };
}
