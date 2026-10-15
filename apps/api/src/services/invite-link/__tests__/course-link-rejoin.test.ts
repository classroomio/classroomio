import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

/**
 * Re-joining a course through its share link repairs a STUDENT's revoked
 * grant without creating a second membership; tutors and tutor links never
 * write a grant.
 */

const mocks = vi.hoisted(() => ({
  lockCourseStatusForAccept: vi.fn(),
  getCourseById: vi.fn(),
  getGroupMemberByGroupAndProfile: vi.fn(),
  addGroupMember: vi.fn(),
  recordDirectCourseGrant: vi.fn()
}));

vi.mock('@cio/db/queries/course', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/queries/course')>()),
  lockCourseStatusForAccept: mocks.lockCourseStatusForAccept,
  getCourseById: mocks.getCourseById
}));
vi.mock('@cio/db/queries/group', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/queries/group')>()),
  getGroupMemberByGroupAndProfile: mocks.getGroupMemberByGroupAndProfile,
  addGroupMember: mocks.addGroupMember
}));
vi.mock('@api/services/course/enrollment-grants', () => ({
  recordDirectCourseGrant: mocks.recordDirectCourseGrant,
  recordDirectCourseGrantsBulk: vi.fn()
}));

import { getInviteLinkHandler } from '../handlers';

const tx = { id: 'tx' };
const COURSE = { id: 'c-1', title: 'Course', description: null, status: 'ACTIVE', enrollOnlyInLearningPath: false };

function context(roleId: number) {
  return {
    invite: { id: 'link-1', resourceType: 'COURSE', roleId, isRevoked: false },
    organization: { id: 'org-1', name: 'Org', siteName: 'org' },
    course: COURSE,
    cohort: null,
    learningPath: null
  } as never;
}

describe('course share link re-join', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lockCourseStatusForAccept.mockResolvedValue({ status: 'ACTIVE', groupId: 'g-1' });
    mocks.getCourseById.mockResolvedValue([COURSE]);
  });

  it('repairs an existing student grant through a student link', async () => {
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-1', roleId: ROLE.STUDENT });

    const result = await getInviteLinkHandler('COURSE').enrollMembership(
      tx as never,
      context(ROLE.STUDENT),
      'p-1',
      'a@test.dev'
    );

    expect(result).toEqual({ isFreshJoin: false });
    expect(mocks.addGroupMember).not.toHaveBeenCalled();
    expect(mocks.recordDirectCourseGrant).toHaveBeenCalledWith(
      { groupmemberId: 'gm-1', courseId: 'c-1', profileId: 'p-1' },
      { source: 'INVITE' },
      tx
    );
  });

  it('writes no grant for an existing tutor', async () => {
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-2', roleId: ROLE.TUTOR });

    await getInviteLinkHandler('COURSE').enrollMembership(tx as never, context(ROLE.STUDENT), 'p-2', 't@test.dev');

    expect(mocks.recordDirectCourseGrant).not.toHaveBeenCalled();
  });

  it('writes no grant when an existing student opens a tutor link', async () => {
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-3', roleId: ROLE.STUDENT });

    await getInviteLinkHandler('COURSE').enrollMembership(tx as never, context(ROLE.TUTOR), 'p-3', 's@test.dev');

    expect(mocks.recordDirectCourseGrant).not.toHaveBeenCalled();
  });
});
