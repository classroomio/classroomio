import type { JoinedCourseLink, PendingInvitationGroup } from './types';

export type InvitationJoinTarget = { kind: 'org'; inviteId: string } | { kind: 'course'; inviteId: string } | null;

/**
 * What "Join {org}" accepts: the org invitation when there is one, otherwise
 * the first directly emailed course invitation. Binding fulfils the rest, so
 * one accept covers every pending row in the org.
 */
export function getJoinTarget(group: PendingInvitationGroup): InvitationJoinTarget {
  if (group.orgInvite) {
    return { kind: 'org', inviteId: group.orgInvite.id };
  }

  const emailed = group.courses.find((course) => course.inviteId);
  if (emailed?.inviteId) {
    return { kind: 'course', inviteId: emailed.inviteId };
  }

  return null;
}

type FulfilledSummary = {
  courses?: { id: string; title: string | null }[] | null;
  cohorts?: { id: string; name: string | null }[] | null;
};

/**
 * Courses to show in the success state: the accepted course (when the join went
 * through a course invite) plus every auto-fulfilled one, deduped by id.
 */
export function buildJoinedCourseLinks(
  group: PendingInvitationGroup,
  acceptedInviteId: string,
  fulfilled: FulfilledSummary | null | undefined
): JoinedCourseLink[] {
  const links = new Map<string, string | null>();

  const acceptedCourse = group.courses.find(
    (course) => course.inviteId === acceptedInviteId || course.courseId === acceptedInviteId
  );
  if (acceptedCourse) {
    links.set(acceptedCourse.courseId, acceptedCourse.title);
  }

  for (const course of fulfilled?.courses ?? []) {
    if (!links.has(course.id)) {
      links.set(course.id, course.title);
    }
  }

  return [...links].map(([id, title]) => ({ id, title }));
}

/** Course lesson links for the success state. */
export function courseLessonsHref(courseId: string): string {
  return `/courses/${courseId}/lessons?next=true`;
}
