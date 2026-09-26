import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: vi.fn(),
  getCohortById: vi.fn(),
  getCohortMemberByEmail: vi.fn(),
  getCohortMemberByProfileId: vi.fn(),
  getCoursesByCohort: vi.fn()
}));
vi.mock('@cio/db/queries/course', () => ({ getCourseGroupIds: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ insertGroupMembersOnConflictDoNothing: vi.fn() }));
vi.mock('@cio/db/queries/auth', () => ({ getProfileByEmail: vi.fn() }));
vi.mock('@cio/db/queries/organization', () => ({
  getOrgMembersByProfileIds: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  insertOrganizationMembersOnConflictDoNothing: vi.fn()
}));
vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((callback: (tx: unknown) => unknown) => callback({})) }
}));
vi.mock('../../organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn(),
  notifyStudentMilestone: vi.fn()
}));

import {
  addCohortMember,
  getCohortById,
  getCohortMemberByEmail,
  getCohortMemberByProfileId,
  getCoursesByCohort
} from '@cio/db/queries/cohort';
import { getCourseGroupIds } from '@cio/db/queries/course';
import { getProfileByEmail } from '@cio/db/queries/auth';
import { addCohortMembersSettled } from '@api/services/cohort/cohort';

const COHORT_ID = 'cohort-1';

describe('addCohortMembersSettled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortById).mockResolvedValue({ id: COHORT_ID, organizationId: 'org-1' } as Awaited<
      ReturnType<typeof getCohortById>
    >);
    vi.mocked(getCoursesByCohort).mockResolvedValue([]);
    vi.mocked(getCourseGroupIds).mockResolvedValue([]);
    vi.mocked(getProfileByEmail).mockResolvedValue(null as never);
    vi.mocked(addCohortMember).mockResolvedValue({ id: 'new-member' } as Awaited<ReturnType<typeof addCohortMember>>);
  });

  it('refuses a second email-only membership for an email with no profile, so retries do not duplicate', async () => {
    vi.mocked(getCohortMemberByEmail).mockResolvedValue({ id: 'existing' } as Awaited<
      ReturnType<typeof getCohortMemberByEmail>
    >);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ email: 'New@Example.com', roleId: 3 }]
    });

    expect(getCohortMemberByEmail).toHaveBeenCalledWith(COHORT_ID, 'new@example.com');
    expect(result).toMatchObject({ status: 'rejected', reason: { code: 'MEMBER_ALREADY_IN_COHORT' } });
    expect(addCohortMember).not.toHaveBeenCalled();
  });

  it('adds an email-only membership when the email is not in the cohort yet', async () => {
    vi.mocked(getCohortMemberByEmail).mockResolvedValue(null);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ email: 'new@example.com', roleId: 3 }]
    });

    expect(result).toEqual({ status: 'fulfilled', value: { id: 'new-member' } });
    expect(addCohortMember).toHaveBeenCalledWith(
      expect.objectContaining({ cohortId: COHORT_ID, profileId: null, email: 'new@example.com' }),
      expect.anything()
    );
  });

  it('checks by profileId, not email, when the entry resolves to a profile', async () => {
    vi.mocked(getCohortMemberByProfileId).mockResolvedValue({ id: 'existing' } as Awaited<
      ReturnType<typeof getCohortMemberByProfileId>
    >);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ profileId: 'profile-1', roleId: 3 }]
    });

    expect(getCohortMemberByProfileId).toHaveBeenCalledWith(COHORT_ID, 'profile-1');
    expect(getCohortMemberByEmail).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'rejected',
      reason: { code: 'MEMBER_ALREADY_IN_COHORT', message: 'profile-1 is already a member of this cohort' }
    });
  });
});
