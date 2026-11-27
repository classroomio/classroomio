import { getActivePendingCourseInvitesForEmail, getUnjoinedPublishedCoursesByIds } from '@cio/db/queries/course/invite';
import { getActivePendingOrgInvitesForEmail } from '@cio/db/queries/organization/invite';
import { getUnjoinedCohortsByIds } from '@cio/db/queries/cohort';
import {
  parseCohortIdsFromInviteMetadata,
  parseCourseIdsFromInviteMetadata
} from '@cio/utils/functions/invite-metadata';
import { getRoleLabel } from '@api/services/organization/invite';

/**
 * Every pending organization invite awaiting this account, across all organizations.
 * Scoped to the person, not to an org, so an invite to an org they are not currently
 * viewing still reaches the dashboard notification panel.
 */
export async function listPendingInvitesForAccount(email: string) {
  if (!email) {
    return [];
  }

  const rows = await getActivePendingOrgInvitesForEmail(email);

  return rows.map((row) => ({
    id: row.invite.id,
    email: row.invite.email,
    roleId: row.invite.roleId,
    roleLabel: getRoleLabel(row.invite.roleId),
    createdAt: row.invite.createdAt,
    expiresAt: row.invite.expiresAt,
    organization: row.organization
  }));
}

/**
 * Course invites this account can accept from inside the app. Empty until the account's email
 * is verified, because an invite is claimed by email match alone.
 */
export async function listPendingCourseInvitesForAccount(user: {
  id: string;
  email?: string | null;
  emailVerified?: boolean | null;
}) {
  if (!user.email || !user.emailVerified) {
    return [];
  }

  const rows = await getActivePendingCourseInvitesForEmail(user.email, user.id);

  return rows.map((row) => ({
    id: row.invite.id,
    createdAt: row.invite.createdAt,
    expiresAt: row.invite.expiresAt,
    course: row.course,
    organization: row.organization
  }));
}

export type TInvitationCourse = {
  /** Live email-bound invite id, or null when the course rides on the org invitation. */
  inviteId: string | null;
  courseId: string;
  title: string | null;
  description: string | null;
  slug: string | null;
  createdAt: string;
  expiresAt: string;
};

export type TInvitationCohort = {
  cohortId: string;
  name: string | null;
};

export type TInvitationOrgInvite = {
  id: string;
  email: string | null;
  roleId: number;
  roleLabel: string;
  createdAt: string;
  expiresAt: string;
};

export type TInvitationGroup = {
  organization: {
    id: string;
    name: string;
    siteName: string;
    avatarUrl: string | null;
  };
  orgInvite: TInvitationOrgInvite | null;
  courses: TInvitationCourse[];
  cohorts: TInvitationCohort[];
};

/**
 * Pending invitations grouped by organization: at most one live org invitation plus the live email-bound course
 * invitations, with one row per course (a directly emailed invite wins over the org invitation's copy) and the
 * cohorts the org invitation carries. Only live invitations, only ACTIVE published courses and cohorts the profile
 * has not joined, only for a verified email, and courses or cohorts from another organization are dropped.
 */
export async function listPendingInvitationsForAccount(user: {
  id: string;
  email?: string | null;
  emailVerified?: boolean | null;
}): Promise<TInvitationGroup[]> {
  if (!user.email || !user.emailVerified) {
    return [];
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  const [orgInvites, courseInvites] = await Promise.all([
    getActivePendingOrgInvitesForEmail(normalizedEmail),
    getActivePendingCourseInvitesForEmail(normalizedEmail, user.id)
  ]);

  const carriedCourseIds = [
    ...new Set(orgInvites.flatMap((row) => parseCourseIdsFromInviteMetadata(row.invite.metadata)))
  ];
  const carriedCohortIds = [
    ...new Set(orgInvites.flatMap((row) => parseCohortIdsFromInviteMetadata(row.invite.metadata)))
  ];
  const [carriedCourses, carriedCohorts] = await Promise.all([
    getUnjoinedPublishedCoursesByIds(carriedCourseIds, user.id),
    getUnjoinedCohortsByIds(carriedCohortIds, user.id)
  ]);
  const carriedCourseById = new Map(carriedCourses.map((course) => [course.id, course]));
  const carriedCohortById = new Map(carriedCohorts.map((cohort) => [cohort.id, cohort]));

  const groups = new Map<string, TInvitationGroup>();
  const groupFor = (organization: TInvitationGroup['organization']): TInvitationGroup => {
    const existing = groups.get(organization.id);
    if (existing) return existing;

    const group: TInvitationGroup = { organization, orgInvite: null, courses: [], cohorts: [] };
    groups.set(organization.id, group);

    return group;
  };
  const addCourse = (group: TInvitationGroup, course: TInvitationCourse): void => {
    if (group.courses.some((existing) => existing.courseId === course.courseId)) return;

    group.courses.push(course);
  };

  const newestFirst = [...courseInvites].sort((a, b) => +new Date(b.invite.createdAt) - +new Date(a.invite.createdAt));
  for (const row of newestFirst) {
    const group = groupFor({
      id: row.organization.id,
      name: row.organization.name,
      siteName: row.organization.siteName,
      avatarUrl: row.organization.avatarUrl ?? null
    });

    addCourse(group, {
      inviteId: row.invite.id,
      courseId: row.course.id,
      title: row.course.title,
      description: row.course.description,
      slug: row.course.slug,
      createdAt: row.invite.createdAt,
      expiresAt: row.invite.expiresAt
    });
  }

  for (const row of orgInvites) {
    const organizationId = row.organization.id;
    const group = groupFor({
      id: organizationId,
      name: row.organization.name,
      siteName: row.organization.siteName,
      avatarUrl: row.organization.avatarUrl ?? null
    });

    group.orgInvite ??= {
      id: row.invite.id,
      email: row.invite.email,
      roleId: row.invite.roleId,
      roleLabel: getRoleLabel(row.invite.roleId),
      createdAt: row.invite.createdAt,
      expiresAt: row.invite.expiresAt
    };

    for (const courseId of parseCourseIdsFromInviteMetadata(row.invite.metadata)) {
      const course = carriedCourseById.get(courseId);
      if (course?.organizationId !== organizationId) continue;

      addCourse(group, {
        inviteId: null,
        courseId,
        title: course.title,
        description: course.description,
        slug: course.slug,
        createdAt: row.invite.createdAt,
        expiresAt: row.invite.expiresAt
      });
    }

    for (const cohortId of parseCohortIdsFromInviteMetadata(row.invite.metadata)) {
      const cohort = carriedCohortById.get(cohortId);
      if (cohort?.organizationId !== organizationId) continue;
      if (group.cohorts.some((existing) => existing.cohortId === cohortId)) continue;

      group.cohorts.push({ cohortId, name: cohort.name ?? null });
    }
  }

  return [...groups.values()].sort((a, b) => a.organization.name.localeCompare(b.organization.name));
}
