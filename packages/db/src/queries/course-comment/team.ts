import * as schema from '@db/schema';

import { ROLE } from '@cio/utils/constants';
import { and, db, eq, inArray } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

export type TCourseCommentTeamRole = 'org_admin' | 'admin' | 'tutor';

export interface TCourseCommentTeamMember {
  profileId: string;
  fullname: string;
  username: string;
  avatarUrl: string | null;
  email: string | null;
  role: TCourseCommentTeamRole;
}

const TEAM_ROLE_RANK: Record<TCourseCommentTeamRole, number> = { org_admin: 3, admin: 2, tutor: 1 };

/**
 * Everyone who may use a course's team comments: course ADMIN/TUTOR members who are still active
 * in the course's org, plus every active org admin. Matches `isCourseTeamMemberOrOrgAdmin` for
 * org-owned courses; a course outside any org has no comment team.
 */
export async function listCourseCommentTeam(
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentTeamMember[]> {
  try {
    const [course] = await dbClient
      .select({ organizationId: schema.group.organizationId, groupId: schema.group.id })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (!course?.organizationId) return [];

    const organizationId = course.organizationId;

    const profileColumns = {
      profileId: schema.profile.id,
      fullname: schema.profile.fullname,
      username: schema.profile.username,
      avatarUrl: schema.profile.avatarUrl,
      email: schema.profile.email
    };

    const courseMembers = await dbClient
      .select({ ...profileColumns, roleId: schema.groupmember.roleId })
      .from(schema.groupmember)
      .innerJoin(schema.profile, eq(schema.profile.id, schema.groupmember.profileId))
      .innerJoin(
        schema.organizationmember,
        and(
          eq(schema.organizationmember.profileId, schema.groupmember.profileId),
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.status, 'ACTIVE')
        )
      )
      .where(
        and(
          eq(schema.groupmember.groupId, course.groupId),
          inArray(schema.groupmember.roleId, [ROLE.ADMIN, ROLE.TUTOR])
        )
      );

    const orgAdmins = await dbClient
      .select(profileColumns)
      .from(schema.organizationmember)
      .innerJoin(schema.profile, eq(schema.profile.id, schema.organizationmember.profileId))
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN),
          eq(schema.organizationmember.status, 'ACTIVE')
        )
      );

    const team = new Map<string, TCourseCommentTeamMember>();
    const keepHighestRole = (member: TCourseCommentTeamMember) => {
      const existing = team.get(member.profileId);
      if (!existing || TEAM_ROLE_RANK[member.role] > TEAM_ROLE_RANK[existing.role]) team.set(member.profileId, member);
    };

    for (const member of courseMembers) {
      const role: TCourseCommentTeamRole = member.roleId === ROLE.ADMIN ? 'admin' : 'tutor';
      keepHighestRole({ ...memberFields(member), role });
    }

    for (const admin of orgAdmins) {
      keepHighestRole({ ...memberFields(admin), role: 'org_admin' });
    }

    return [...team.values()].sort((left, right) => left.fullname.localeCompare(right.fullname));
  } catch (error) {
    console.error('listCourseCommentTeam error:', error);
    throw new Error(
      `Failed to list comment team for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function memberFields(row: {
  profileId: string;
  fullname: string;
  username: string;
  avatarUrl: string | null;
  email: string | null;
}): Omit<TCourseCommentTeamMember, 'role'> {
  return {
    profileId: row.profileId,
    fullname: row.fullname,
    username: row.username,
    avatarUrl: row.avatarUrl,
    email: row.email
  };
}
