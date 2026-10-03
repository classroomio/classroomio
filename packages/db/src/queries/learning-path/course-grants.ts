import { ROLE } from '@cio/utils/constants';

import type { DbOrTxClient } from '@db/drizzle';
import { getCourseGroupIds } from '@db/queries/course/course';
import { getGroupMemberByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@db/queries/group';
import { grantCourseAccess } from './enrollment-grant';

/**
 * Ensures LEARNING_PATH course grants for a profile across the path's courses.
 * Enrolls the profile into each course's default student group. Courses where
 * the profile is already on the team (TUTOR/ADMIN groupmember) get no grant.
 * Shared by the API sync path and the queued bulk-enroll worker so every
 * front creates exactly the same rows.
 */
export async function ensureLearningPathCourseGrants(
  pathId: string,
  profileId: string,
  grantedByProfileId: string | undefined,
  dbClient: DbOrTxClient,
  courseIds: string[]
): Promise<void> {
  if (courseIds.length === 0) {
    return;
  }

  const courseGroups = await getCourseGroupIds(courseIds, dbClient);

  if (courseGroups.length === 0) {
    return;
  }

  const groupMemberValues = courseGroups
    .filter((entry): entry is { courseId: string; groupId: string } => Boolean(entry.groupId))
    .map((entry) => ({
      groupId: entry.groupId,
      profileId,
      roleId: ROLE.STUDENT
    }));

  await insertGroupMembersOnConflictDoNothing(groupMemberValues, dbClient);

  for (const entry of courseGroups) {
    if (!entry.groupId) {
      continue;
    }

    const groupMember = await getGroupMemberByGroupAndProfile(entry.groupId, profileId, dbClient);

    // An existing course team row keeps its role (the insert above is
    // DO NOTHING), and team access is role-based, so it gets no grant.
    if (groupMember && groupMember.roleId === ROLE.STUDENT) {
      await grantCourseAccess(
        {
          groupmemberId: groupMember.id,
          courseId: entry.courseId,
          profileId,
          source: 'LEARNING_PATH',
          learningPathId: pathId,
          grantedByProfileId
        },
        dbClient
      );
    }
  }
}
