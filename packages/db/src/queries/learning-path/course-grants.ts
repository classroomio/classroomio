import { ROLE } from '@cio/utils/constants';

import type { DbOrTxClient } from '@db/drizzle';
import { getCourseGroupIds } from '@db/queries/course/course';
import { getGroupMemberIdByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@db/queries/group';
import { grantCourseAccess } from './enrollment-grant';

/**
 * Ensures LEARNING_PATH course grants for a profile across the path's courses.
 * Enrolls the profile into each course's default student group.
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

    const groupMemberId = await getGroupMemberIdByGroupAndProfile(entry.groupId, profileId, dbClient);

    if (groupMemberId) {
      await grantCourseAccess(
        {
          groupmemberId: groupMemberId,
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
