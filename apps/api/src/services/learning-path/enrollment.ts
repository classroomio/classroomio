import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import { getOrgMembersByProfileIds, insertOrganizationMembersOnConflictDoNothing } from '@cio/db/queries/organization';
import {
  insertLearningPathMembersOnConflictDoNothing,
  type TLearningPathCourseRow
} from '@cio/db/queries/learning-path/learning-path';
import type { TGroupmember, TLearningPathMember, TOrganizationmember } from '@cio/db/types';
import {
  buildMemberSource,
  emitCourseMemberAddedWebhookEvent,
  emitOrganizationMemberWebhookEvent
} from '@cio/core/services/webhook/emit';
import { notifyCourseEnrollment } from '@cio/core/services/notification/course-events';
import type { TEventSource } from '@cio/core/services/posthog';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { ROLE } from '@cio/utils/constants';
import { isSelfEnrollmentAllowed } from '@cio/utils/functions/course-enrollment';
import { isCoursePaid } from '@cio/utils/validation/course';
import { captureLearnersEnrolled } from '@api/services/product-events';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import {
  assertStudentCapacityOrThrow,
  notifyStudentMilestone,
  type StudentMilestoneNotification
} from '@api/services/organization/student-limit';

export type PathCourseGroup = { courseId: string; groupId: string };

type PathCourseEnrollmentFields = Pick<TLearningPathCourseRow, 'courseId' | 'groupId' | 'status' | 'cost' | 'metadata'>;

/** Course groups a path enrolls its students into. Deleted courses are left out. */
export function pathCourseGroups(courses: Pick<TLearningPathCourseRow, 'courseId' | 'groupId' | 'status'>[]) {
  return courses.flatMap((course) =>
    course.groupId && course.status === 'ACTIVE' ? [{ courseId: course.courseId, groupId: course.groupId }] : []
  );
}

/**
 * Whether students may join the path themselves. Joining enrolls them in every course, so each course must
 * be one they could join on its own: free and open to self-enrollment.
 */
export function arePathCoursesSelfEnrollable(courses: PathCourseEnrollmentFields[]): boolean {
  return courses
    .filter((course) => course.status === 'ACTIVE')
    .every((course) => {
      const metadata = course.metadata as Parameters<typeof isSelfEnrollmentAllowed>[0] &
        Parameters<typeof isCoursePaid>[1];

      return !isCoursePaid(course.cost, metadata) && isSelfEnrollmentAllowed(metadata);
    });
}

export type PathEnrollmentRequest = {
  organizationId: string;
  pathId: string | null;
  profileIds: string[];
  courseGroups: PathCourseGroup[];
  method: 'self_enroll' | 'admin';
  source: TEventSource;
  actorProfileId: string | null;
};

export type PathEnrollmentWrite = {
  pathMembers: TLearningPathMember[];
  courseMembers: TGroupmember[];
  createdOrgMembers: TOrganizationmember[];
  milestone: StudentMilestoneNotification | null;
};

/**
 * Makes each profile a STUDENT member of the organization, of the path (when `pathId` is set) and of
 * every course group. Existing rows are left as they are, so repeating a request changes nothing.
 * Pair with `runPathEnrollmentSideEffects` after the transaction commits.
 */
export async function writePathEnrollment(
  request: PathEnrollmentRequest,
  tx: DbOrTxClient
): Promise<PathEnrollmentWrite> {
  const profileIds = [...new Set(request.profileIds)];
  if (profileIds.length === 0) {
    return { pathMembers: [], courseMembers: [], createdOrgMembers: [], milestone: null };
  }

  const existingOrgMembers = await getOrgMembersByProfileIds(request.organizationId, profileIds);
  const existingOrgProfileIds = new Set(existingOrgMembers.map((member) => member.profileId));
  const newOrgStudentCount = profileIds.filter((profileId) => !existingOrgProfileIds.has(profileId)).length;

  const organizationMemberRows = profileIds.map((profileId) => ({
    organizationId: request.organizationId,
    roleId: ROLE.STUDENT,
    profileId,
    verified: true
  }));
  const pathMemberRows = request.pathId
    ? profileIds.map((profileId) => ({ pathId: request.pathId!, profileId, roleId: ROLE.STUDENT }))
    : [];
  const groupMemberRows = request.courseGroups.flatMap(({ groupId }) =>
    profileIds.map((profileId) => ({ groupId, profileId, roleId: ROLE.STUDENT }))
  );

  const milestone = await assertStudentCapacityOrThrow(request.organizationId, newOrgStudentCount, tx, {
    deferNotification: true
  });
  const createdOrgMembers = await insertOrganizationMembersOnConflictDoNothing(organizationMemberRows, tx);
  const pathMembers = await insertLearningPathMembersOnConflictDoNothing(pathMemberRows, tx);
  const courseMembers = await insertGroupMembersOnConflictDoNothing(groupMemberRows, tx);

  return { pathMembers, courseMembers, createdOrgMembers, milestone };
}

export async function enrollStudentsInPath(request: PathEnrollmentRequest): Promise<PathEnrollmentWrite> {
  const result = await db.transaction((tx) => writePathEnrollment(request, tx));
  await runPathEnrollmentSideEffects(request, result);

  return result;
}

export async function runPathEnrollmentSideEffects(request: PathEnrollmentRequest, write: PathEnrollmentWrite) {
  const { courseMembers, createdOrgMembers, milestone } = write;
  captureLearnersEnrolled(courseMembers, request.method === 'self_enroll' ? 'self' : 'admin', request.source);

  if (milestone) {
    notifyStudentMilestone(milestone).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  for (const member of createdOrgMembers) {
    await emitOrganizationMemberWebhookEvent(
      'organization.member.added',
      request.organizationId,
      member,
      request.actorProfileId
    );
  }

  if (courseMembers.length === 0) return;

  const courseIdByGroupId = new Map(request.courseGroups.map((group) => [group.groupId, group.courseId]));
  const profileIdsByCourseId = new Map<string, string[]>();
  const memberSource = buildMemberSource(request.method);

  for (const member of courseMembers) {
    const courseId = courseIdByGroupId.get(member.groupId);
    if (!courseId || !member.profileId) continue;

    profileIdsByCourseId.set(courseId, [...(profileIdsByCourseId.get(courseId) ?? []), member.profileId]);
    await emitCourseMemberAddedWebhookEvent(courseId, member, {
      source: memberSource,
      actorProfileId: request.actorProfileId
    });
  }

  for (const [courseId, profileIds] of profileIdsByCourseId) {
    await ensureComplianceEnrollmentRecordsForProfiles([courseId], profileIds);
    void notifyCourseEnrollment({ courseId, profileIds, actorProfileId: request.actorProfileId });
  }

  await invalidateOrgStats(request.organizationId);
}
