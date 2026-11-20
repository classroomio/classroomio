import { describe, expect, it, vi } from 'vitest';

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

import { getInviteLinkHandler } from '@api/services/invite-link/handlers';
import { ROLE } from '@cio/utils/constants';
import type { TInviteLinkWithContext } from '@cio/db/queries/invite-link';

const COURSE_ID = 'course-1';
const COHORT_ID = 'cohort-1';
const learningPathFixture = {
  id: 'path-1',
  name: 'Sales Excellence',
  description: null,
  coverImage: null,
  slug: 'sales-excellence',
  publicId: 'Ab3dE6gH',
  status: 'ACTIVE',
  isPublished: true,
  welcomeEmailMessage: null
};

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
    learningPath: null,
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
        isPublished: true,
        enrollOnlyInLearningPath: false,
        welcomeEmailMessage: null
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
        isPublished: false,
        enrollOnlyInLearningPath: false,
        welcomeEmailMessage: null
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
          isPublished: false,
          enrollOnlyInLearningPath: false,
          welcomeEmailMessage: null
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

  it('opens a learning path link on the student path page for students', () => {
    const context = buildContext({ learningPath: learningPathFixture });

    expect(getInviteLinkHandler('LEARNING_PATH').redirectTo(context)).toBe('/lms/paths/Ab3dE6gH');
  });

  it('opens a learning path link on the path admin page for other roles', () => {
    const context = buildContext({ learningPath: learningPathFixture }, ROLE.TUTOR);

    expect(getInviteLinkHandler('LEARNING_PATH').redirectTo(context)).toBe('/paths/Ab3dE6gH');
  });
});
