import {
  captureCourseEvent,
  captureServerEvent,
  identifyOrganizationGroup,
  isServerEventsEnabled,
  recordServerEvents,
  type TEventSource
} from '@cio/core/services/posthog';
import { getCoursesByGroupIds } from '@cio/db/queries/course/course';
import { getProfileByGroupMemberId } from '@cio/db/queries/course/people';
import type { TGroupmember } from '@cio/db/types';
import { ROLE } from '@cio/utils/constants';
import { PLAN } from '@cio/utils/plans';

export function captureOrganizationCreated(
  profileId: string,
  organization: { id: string; name: string | null; siteName: string | null },
  source: Extract<TEventSource, 'onboarding' | 'add_org' | 'workspace'>,
  planName: string = PLAN.BASIC
): void {
  identifyOrganizationGroup(organization.id, {
    name: organization.name,
    site_name: organization.siteName,
    plan: planName
  });

  captureServerEvent({
    event: 'organization_created',
    distinctId: profileId,
    orgId: organization.id,
    properties: { org_id: organization.id, source }
  });
}

export function captureLearnerInvited(input: {
  profileId: string | null | undefined;
  orgId: string;
  target: 'course' | 'org' | 'cohort';
  inviteType: 'email' | 'link';
  count: number;
  courseId?: string;
  cohortId?: string;
  source: TEventSource;
}): void {
  if (input.count < 1) return;

  captureServerEvent({
    event: 'learner_invited',
    distinctId: input.profileId,
    orgId: input.orgId,
    properties: {
      target: input.target,
      invite_type: input.inviteType,
      invite_count: input.count,
      ...(input.courseId && { course_id: input.courseId }),
      ...(input.cohortId && { cohort_id: input.cohortId }),
      source: input.source
    }
  });
}

export type TEnrollSource = 'self' | 'invite' | 'invite_link' | 'admin' | 'audience' | 'cohort' | 'org_invite';

/**
 * One `learner_enrolled` per new student membership. Rows that aren't students are skipped,
 * and the course, org and price are looked up from the group in the background.
 */
export function captureLearnersEnrolled(
  members: Array<Pick<TGroupmember, 'groupId' | 'profileId' | 'roleId'>>,
  enrollSource: TEnrollSource,
  source: TEventSource = 'dashboard'
): void {
  if (!isServerEventsEnabled()) return;

  const students = members.filter((member) => member.profileId && member.roleId === ROLE.STUDENT);
  if (students.length === 0) return;

  void (async () => {
    try {
      const courses = await getCoursesByGroupIds([...new Set(students.map((student) => student.groupId))]);
      const courseByGroupId = new Map(courses.map((course) => [course.groupId, course]));

      await recordServerEvents(
        students.flatMap((student) => {
          const course = courseByGroupId.get(student.groupId);
          if (!course) return [];

          const isPaid = Number(course.cost ?? 0) > 0;

          return {
            event: 'learner_enrolled',
            distinctId: student.profileId,
            orgId: course.organizationId,
            properties: {
              course_id: course.courseId,
              is_paid: isPaid,
              enroll_source: enrollSource,
              source
            }
          };
        })
      );
    } catch (error) {
      console.error('captureLearnersEnrolled error:', error);
    }
  })();
}

export function captureExerciseSubmitted(input: {
  courseId: string;
  exerciseId: string;
  groupMemberId: string;
  isAutoGraded: boolean;
  source: TEventSource;
}): void {
  if (!isServerEventsEnabled()) return;

  void (async () => {
    try {
      const profile = await getProfileByGroupMemberId(input.groupMemberId);

      captureCourseEvent(input.courseId, {
        event: 'exercise_submitted',
        distinctId: profile?.id,
        properties: { exercise_id: input.exerciseId, is_auto_graded: input.isAutoGraded, source: input.source }
      });
    } catch (error) {
      console.error('captureExerciseSubmitted error:', error);
    }
  })();
}
