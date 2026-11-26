import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/group', () => ({
  addGroupMember: vi.fn(),
  enrollUsersInCourseGroups: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseGroupIds: vi.fn(),
  getCourseWithOrgData: vi.fn(),
  lockCourseStatusForAccept: vi.fn()
}));

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortById: vi.fn(),
  getCourseIdsByCohortIds: vi.fn(),
  insertCohortMemberIfAbsent: vi.fn(),
  lockCohortStatusForAccept: vi.fn()
}));

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: vi.fn()
}));

vi.mock('@cio/core/services/webhook/emit', () => ({
  buildMemberSource: vi.fn(() => ({ source: 'invite_link' })),
  emitCohortMemberWebhookEvent: vi.fn(),
  emitCourseMemberAddedWebhookEvent: vi.fn(),
  emitCourseWebhookEvent: vi.fn()
}));

vi.mock('@api/services/product-events', () => ({
  captureLearnersEnrolled: vi.fn()
}));

import { emitCourseWebhookEvent } from '@cio/core/services/webhook/emit';
import { getInviteLinkHandler } from '@api/services/invite-link/handlers';
import { ROLE } from '@cio/utils/constants';
import type { TInviteLinkWithContext } from '@cio/db/queries/invite-link';

const COURSE_ID = 'course-1';
const COHORT_ID = 'cohort-1';

function buildContext(overrides: Partial<TInviteLinkWithContext>, roleId: number = ROLE.STUDENT) {
  return {
    invite: { roleId },
    organization: {
      id: 'org-1',
      name: 'Acme Academy',
      siteName: 'acme',
      theme: null,
      avatarUrl: null,
      customDomain: null,
      isCustomDomainVerified: null
    },
    course: null,
    cohort: null,
    ...overrides
  } as unknown as TInviteLinkWithContext;
}

describe('invite link redirects', () => {
  it('sends a course link straight into that course', () => {
    const context = buildContext({
      course: {
        id: COURSE_ID,
        title: 'SOC 2 Basics',
        description: null,
        slug: 'soc2',
        status: 'ACTIVE',
        isPublished: true
      }
    });

    expect(getInviteLinkHandler('COURSE').redirectTo(context)).toBe(`/courses/${COURSE_ID}/lessons?next=true`);
  });

  it('falls back to the learning portal for a student joining an unpublished course', () => {
    const context = buildContext({
      course: {
        id: COURSE_ID,
        title: 'SOC 2 Basics',
        description: null,
        slug: 'soc2',
        status: 'ACTIVE',
        isPublished: false
      }
    });

    expect(getInviteLinkHandler('COURSE').redirectTo(context)).toBe('/lms');
  });

  it('still opens an unpublished course for staff invite links', () => {
    const context = buildContext(
      {
        course: {
          id: COURSE_ID,
          title: 'SOC 2 Basics',
          description: null,
          slug: 'soc2',
          status: 'ACTIVE',
          isPublished: false
        }
      },
      ROLE.TUTOR
    );

    expect(getInviteLinkHandler('COURSE').redirectTo(context)).toBe(`/courses/${COURSE_ID}/lessons?next=true`);
  });

  it('opens a cohort link in the student view for students', () => {
    const context = buildContext({
      cohort: { id: COHORT_ID, name: 'Spring cohort', description: null, coverImage: null, status: 'ACTIVE' }
    });

    expect(getInviteLinkHandler('COHORT').redirectTo(context)).toBe(`/cohorts/${COHORT_ID}/newsfeed?source=lms`);
  });

  it('opens a cohort link in the staff view for other roles', () => {
    const context = buildContext(
      { cohort: { id: COHORT_ID, name: 'Spring cohort', description: null, coverImage: null, status: 'ACTIVE' } },
      ROLE.TUTOR
    );

    expect(getInviteLinkHandler('COHORT').redirectTo(context)).toBe(`/cohorts/${COHORT_ID}/newsfeed`);
  });
});

describe('invite link webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const course = {
    id: COURSE_ID,
    title: 'SOC 2 Basics',
    description: null,
    slug: 'soc2',
    status: 'ACTIVE',
    isPublished: true
  };

  function buildCourseContext(inviteId = 'invite-link-1') {
    return buildContext({ invite: { id: inviteId, roleId: ROLE.STUDENT } as never, course });
  }

  it('fires course.invite.accepted when a link join adds a member', async () => {
    const context = buildCourseContext();
    const enrolledMembers = [{ id: 'member-1', groupId: 'group-1', profileId: 'profile-1', roleId: ROLE.STUDENT }];

    await getInviteLinkHandler('COURSE').afterCommit(context, 'profile-1', 'sam@example.com', {
      isFreshJoin: true,
      enrolledMembers
    } as never);

    expect(emitCourseWebhookEvent).toHaveBeenCalledWith(COURSE_ID, 'course.invite.accepted', {
      inviteId: null,
      inviteLinkId: 'invite-link-1',
      email: 'sam@example.com',
      actorProfileId: 'profile-1'
    });
  });

  it('does not fire course.invite.accepted when the member already belonged to the course', async () => {
    const context = buildCourseContext();

    await getInviteLinkHandler('COURSE').afterCommit(context, 'profile-1', 'sam@example.com', {
      isFreshJoin: false,
      enrolledMembers: []
    } as never);

    expect(emitCourseWebhookEvent).not.toHaveBeenCalled();
  });
});
