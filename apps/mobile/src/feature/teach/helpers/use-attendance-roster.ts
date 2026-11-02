import { ContentType } from '@cio/utils/constants/content';
import { DEFAULT_SESSION_DURATION_MINUTES } from '@cio/utils/functions/live-session';
import { ROLE } from '@cio/utils/constants/roles';
import { useState } from 'react';

import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useSaveAttendanceMutation, type AttendanceMark } from '@/feature/teach/api/attendance';
import type { AttendanceStatus, TeachCourse, TeachCourseMember } from '@/feature/teach/types/teach';

const MINUTE = 60 * 1000;

export type AttendanceSession = {
  id: string;
  title: string;
  lessonAt: string | null;
  sessionDurationMinutes: number | null;
  number: number;
};

export function sessionsOf(course: TeachCourse): AttendanceSession[] {
  const items = course.content.grouped
    ? course.content.sections.flatMap((section) => section.items)
    : course.content.items;

  return items
    .filter((item) => item.type === ContentType.Lesson)
    .map((item, index) => ({
      id: item.id,
      title: item.title,
      lessonAt: item.lessonAt,
      sessionDurationMinutes: item.sessionDurationMinutes,
      number: index + 1
    }));
}

/** The session closest to now: the latest one already started, otherwise the first upcoming one. */
export function defaultSessionOf(sessions: AttendanceSession[], now = Date.now()) {
  const dated = sessions.filter((session) => session.lessonAt);
  const started = dated
    .filter((session) => parseTimestamp(session.lessonAt!) <= now)
    .sort((first, second) => parseTimestamp(second.lessonAt!) - parseTimestamp(first.lessonAt!));

  return started[0] ?? dated[0] ?? sessions[0] ?? null;
}

/** True between a session's start and its end, whether or not it has a call link. */
export function isSessionLive(session: AttendanceSession, now = Date.now()) {
  if (!session.lessonAt) return false;

  const start = parseTimestamp(session.lessonAt);
  const end = start + (session.sessionDurationMinutes ?? DEFAULT_SESSION_DURATION_MINUTES) * MINUTE;

  return now >= start && now < end;
}

/** The live session, otherwise the next one to start; null when no session is live or upcoming. */
export function currentSessionOf(sessions: AttendanceSession[], now = Date.now()) {
  const live = sessions.find((session) => isSessionLive(session, now));
  if (live) return { session: live, live: true };

  const next = sessions
    .filter((session) => session.lessonAt && parseTimestamp(session.lessonAt) > now)
    .sort((first, second) => parseTimestamp(first.lessonAt!) - parseTimestamp(second.lessonAt!))[0];

  return next ? { session: next, live: false } : null;
}

export function learnersOf(course: TeachCourse) {
  return (course.group?.members ?? [])
    .filter((member) => member.roleId === ROLE.STUDENT)
    .sort((first, second) => (learnerName(first) ?? '').localeCompare(learnerName(second) ?? ''));
}

/** The learner's name, username or email; null for an invite with none of them. */
export function learnerName(member: TeachCourseMember) {
  return member.profile?.fullname || member.profile?.username || member.email || null;
}

export function attendanceRecordOf(course: TeachCourse, sessionId: string | null, memberId: string) {
  return course.attendance.find((item) => item.studentId === memberId && item.lessonId === sessionId) ?? null;
}

export type AttendanceCounts = Record<AttendanceStatus | 'unmarked', number>;

type Pending = Record<string, AttendanceStatus>;

const pendingKey = (sessionId: string, memberId: string) => `${sessionId}:${memberId}`;

type RosterOptions = { onSaveError: (error: unknown, marks: AttendanceMark[], retry: () => void) => void };

/**
 * Attendance for one session. Marks save as soon as they are made and show at once; a mark that fails to save
 * reverts and is reported through `onSaveError`.
 */
export function useAttendanceRoster(course: TeachCourse, sessionId: string | null, { onSaveError }: RosterOptions) {
  const save = useSaveAttendanceMutation();
  const [pending, setPending] = useState<Pending>({});
  const learners = learnersOf(course);

  const recordOf = (memberId: string) => attendanceRecordOf(course, sessionId, memberId);

  const statusOf = (memberId: string): AttendanceStatus | null => {
    if (!sessionId) return null;

    return pending[pendingKey(sessionId, memberId)] ?? recordOf(memberId)?.status ?? null;
  };

  const mark = (marks: AttendanceMark[]) => {
    if (!sessionId) return;

    const changed = marks.filter((item) => statusOf(item.studentId) !== item.status);
    if (changed.length === 0) return;

    const sent = Object.fromEntries(changed.map((item) => [pendingKey(sessionId, item.studentId), item.status]));
    setPending((current) => ({ ...current, ...sent }));

    const settle = () =>
      setPending((current) => {
        const next = { ...current };
        for (const [key, status] of Object.entries(sent)) {
          if (next[key] === status) delete next[key];
        }

        return next;
      });

    save
      .mutateAsync({ courseId: course.id, lessonId: sessionId, records: changed })
      .then(settle)
      .catch((error: unknown) => {
        settle();
        onSaveError(error, changed, () => mark(changed));
      });
  };

  const counts: AttendanceCounts = { present: 0, late: 0, absent: 0, unmarked: 0 };
  for (const learner of learners) {
    counts[statusOf(learner.id) ?? 'unmarked'] += 1;
  }

  return {
    learners,
    counts,
    statusOf,
    recordOf,
    setStatus: (memberId: string, status: AttendanceStatus) => mark([{ studentId: memberId, status }]),
    markAll: (status: AttendanceStatus) => mark(learners.map((learner) => ({ studentId: learner.id, status }))),
    markUnmarked: (status: AttendanceStatus) =>
      mark(learners.filter((learner) => !statusOf(learner.id)).map((learner) => ({ studentId: learner.id, status }))),
    /** Learners whose existing mark `markAll(status)` would replace. */
    overwrittenBy: (status: AttendanceStatus) =>
      learners.filter((learner) => {
        const current = statusOf(learner.id);

        return current !== null && current !== status;
      }).length
  };
}
