import { ContentType } from '@cio/utils/constants/content';
import { ROLE } from '@cio/utils/constants/roles';
import { useState } from 'react';

import type { AttendanceStatus, TeachCourse, TeachCourseMember } from '@/feature/teach/types/teach';

export type AttendanceSession = { id: string; title: string; lessonAt: string | null; number: number };

export function sessionsOf(course: TeachCourse): AttendanceSession[] {
  const items = course.content.grouped
    ? course.content.sections.flatMap((section) => section.items)
    : course.content.items;

  return items
    .filter((item) => item.type === ContentType.Lesson)
    .map((item, index) => ({ id: item.id, title: item.title, lessonAt: item.lessonAt, number: index + 1 }));
}

/** The session closest to now: the latest one already started, otherwise the first upcoming one. */
export function defaultSessionOf(sessions: AttendanceSession[], now = Date.now()) {
  const dated = sessions.filter((session) => session.lessonAt);
  const started = dated
    .filter((session) => new Date(session.lessonAt!).getTime() <= now)
    .sort((first, second) => new Date(second.lessonAt!).getTime() - new Date(first.lessonAt!).getTime());

  return started[0] ?? dated[0] ?? sessions[0] ?? null;
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

type Drafts = Record<string, Record<string, AttendanceStatus>>;

/**
 * Attendance marks for one session: what is saved, the unsaved changes on top of it, and bulk edits.
 * Drafts are kept per session so switching sessions does not discard them.
 */
export function useAttendanceRoster(course: TeachCourse, sessionId: string | null) {
  const [drafts, setDrafts] = useState<Drafts>({});
  const learners = learnersOf(course);
  const draft = (sessionId && drafts[sessionId]) || {};

  const savedStatusOf = (memberId: string): AttendanceStatus | null => {
    const record = course.attendance.find((item) => item.studentId === memberId && item.lessonId === sessionId);
    if (!record) return null;

    return record.isPresent ? 'present' : 'absent';
  };

  const statusOf = (memberId: string) => draft[memberId] ?? savedStatusOf(memberId);

  const update = (next: (current: Record<string, AttendanceStatus>) => Record<string, AttendanceStatus>) => {
    if (!sessionId) return;

    setDrafts((current) => {
      const updated = next({ ...(current[sessionId] ?? {}) });
      for (const [memberId, status] of Object.entries(updated)) {
        if (savedStatusOf(memberId) === status) delete updated[memberId];
      }

      return { ...current, [sessionId]: updated };
    });
  };

  const changes = Object.entries(draft).map(([studentId, status]) => ({ studentId, isPresent: status === 'present' }));
  const counts = { present: 0, absent: 0, unmarked: 0 };
  for (const learner of learners) {
    const status = statusOf(learner.id);
    counts[status ?? 'unmarked'] += 1;
  }

  return {
    learners,
    statusOf,
    counts,
    changes,
    setStatus: (memberId: string, status: AttendanceStatus) =>
      update((current) => ({ ...current, [memberId]: status })),
    markAll: (status: AttendanceStatus) =>
      update(() => Object.fromEntries(learners.map((learner) => [learner.id, status] as const))),
    discard: () => update(() => ({})),
    clearSaved: (savedIds: string[]) => {
      if (!sessionId) return;

      setDrafts((current) => {
        const remaining = { ...(current[sessionId] ?? {}) };
        savedIds.forEach((id) => delete remaining[id]);

        return { ...current, [sessionId]: remaining };
      });
    }
  };
}
