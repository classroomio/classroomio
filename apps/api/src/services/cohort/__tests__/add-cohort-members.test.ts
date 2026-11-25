import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: vi.fn(),
  getCohortMemberById: vi.fn(),
  updateCohortMember: vi.fn(),
  getCohortById: vi.fn(),
  getCohortMemberByEmail: vi.fn(),
  findCohortMemberRowByProfileId: vi.fn(),
  getCoursesByCohort: vi.fn()
}));
vi.mock('@cio/db/queries/course', () => ({ getCourseGroupIds: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({
  insertGroupMembersOnConflictDoNothing: vi.fn()
}));
vi.mock('@cio/db/queries/auth', () => ({ getProfileByEmail: vi.fn(), getProfileById: vi.fn() }));
vi.mock('@cio/db/queries/organization', () => ({
  getOrgMembersByProfileIds: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  hasLapsedStudentInvite: vi.fn(),
  insertOrganizationMembersOnConflictDoNothing: vi.fn(),
  listActiveOrganizationRoles: vi.fn(),
  selectOrganizationMemberByOrgAndNormalizedEmail: vi.fn(),
  updateOrganizationMemberById: vi.fn()
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
  getCohortMemberById,
  updateCohortMember,
  getCohortMemberByEmail,
  findCohortMemberRowByProfileId,
  getCoursesByCohort
} from '@cio/db/queries/cohort';
import { getCourseGroupIds } from '@cio/db/queries/course';
import { insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import { getProfileByEmail, getProfileById } from '@cio/db/queries/auth';
import {
  getOrganizationMemberIdByOrgAndProfile,
  hasLapsedStudentInvite,
  insertOrganizationMembersOnConflictDoNothing,
  listActiveOrganizationRoles,
  selectOrganizationMemberByOrgAndNormalizedEmail,
  updateOrganizationMemberById
} from '@cio/db/queries/organization';
import { assertStudentCapacityOrThrow } from '../../organization/student-limit';
import { ROLE } from '@cio/utils/constants';
import { addCohortMembersSettled, updateCohortMemberService } from '@api/services/cohort/cohort';

const COHORT_ID = 'cohort-1';

describe('addCohortMembersSettled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortById).mockResolvedValue({ id: COHORT_ID, organizationId: 'org-1' } as Awaited<
      ReturnType<typeof getCohortById>
    >);
    vi.mocked(getCoursesByCohort).mockResolvedValue([]);
    vi.mocked(getCourseGroupIds).mockResolvedValue([]);
    vi.mocked(insertGroupMembersOnConflictDoNothing).mockResolvedValue([]);
    vi.mocked(listActiveOrganizationRoles).mockResolvedValue([]);
    vi.mocked(getProfileByEmail).mockResolvedValue(null as never);
    vi.mocked(addCohortMember).mockResolvedValue({ id: 'new-member' } as Awaited<ReturnType<typeof addCohortMember>>);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);
    vi.mocked(hasLapsedStudentInvite).mockResolvedValue(false);
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
    vi.mocked(findCohortMemberRowByProfileId).mockResolvedValue({ id: 'existing' } as Awaited<
      ReturnType<typeof findCohortMemberRowByProfileId>
    >);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ profileId: 'profile-1', roleId: 3 }]
    });

    expect(findCohortMemberRowByProfileId).toHaveBeenCalledWith(COHORT_ID, 'profile-1');
    expect(getCohortMemberByEmail).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'rejected',
      reason: { code: 'MEMBER_ALREADY_IN_COHORT', message: 'profile-1 is already a member of this cohort' }
    });
  });

  it('enrolls a tutor into the cohort courses that already exist', async () => {
    vi.mocked(findCohortMemberRowByProfileId).mockResolvedValue(null);
    vi.mocked(getCoursesByCohort).mockResolvedValue([{ course: { id: 'course-1' } }] as Awaited<
      ReturnType<typeof getCoursesByCohort>
    >);
    vi.mocked(getCourseGroupIds).mockResolvedValue([{ courseId: 'course-1', groupId: 'group-1' }]);
    vi.mocked(addCohortMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.TUTOR
    } as Awaited<ReturnType<typeof addCohortMember>>);
    vi.mocked(listActiveOrganizationRoles).mockResolvedValue([{ profileId: 'profile-1', roleId: ROLE.TUTOR }]);
    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ profileId: 'profile-1', email: 'tutor@example.com', roleId: ROLE.TUTOR }]
    });

    expect(result.status).toBe('fulfilled');
    expect(insertGroupMembersOnConflictDoNothing).toHaveBeenCalledWith(
      [
        {
          groupId: 'group-1',
          roleId: ROLE.TUTOR,
          profileId: 'profile-1',
          email: 'tutor@example.com'
        }
      ],
      expect.anything()
    );
  });

  it('does not enroll an organization student who is only a cohort tutor', async () => {
    vi.mocked(findCohortMemberRowByProfileId).mockResolvedValue(null);
    vi.mocked(getCoursesByCohort).mockResolvedValue([{ course: { id: 'course-1' } }] as Awaited<
      ReturnType<typeof getCoursesByCohort>
    >);
    vi.mocked(getCourseGroupIds).mockResolvedValue([{ courseId: 'course-1', groupId: 'group-1' }]);
    vi.mocked(addCohortMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.TUTOR
    } as Awaited<ReturnType<typeof addCohortMember>>);
    vi.mocked(listActiveOrganizationRoles).mockResolvedValue([{ profileId: 'profile-1', roleId: ROLE.STUDENT }]);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ profileId: 'profile-1', email: 'student@example.com', roleId: ROLE.TUTOR }]
    });

    expect(result.status).toBe('fulfilled');
    expect(insertGroupMembersOnConflictDoNothing).not.toHaveBeenCalled();
  });

  it('makes a student added to a cohort with no courses an org member, since that grants cohort access', async () => {
    vi.mocked(findCohortMemberRowByProfileId).mockResolvedValue(null);
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(insertOrganizationMembersOnConflictDoNothing).mockResolvedValue([]);
    vi.mocked(addCohortMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof addCohortMember>>);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ profileId: 'profile-1', email: 'student@example.com', roleId: ROLE.STUDENT }]
    });

    expect(result.status).toBe('fulfilled');
    expect(assertStudentCapacityOrThrow).toHaveBeenCalledWith('org-1', 1, expect.anything(), {
      deferNotification: true
    });
    expect(insertOrganizationMembersOnConflictDoNothing).toHaveBeenCalledWith(
      [expect.objectContaining({ organizationId: 'org-1', roleId: ROLE.STUDENT, profileId: 'profile-1' })],
      expect.anything()
    );
    expect(insertGroupMembersOnConflictDoNothing).not.toHaveBeenCalled();
  });

  it('repairs a student already in the cohort with no org membership instead of refusing them', async () => {
    const existing = { id: 'member-1', profileId: 'profile-1', roleId: ROLE.STUDENT };
    vi.mocked(findCohortMemberRowByProfileId).mockResolvedValue(
      existing as Awaited<ReturnType<typeof findCohortMemberRowByProfileId>>
    );
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(insertOrganizationMembersOnConflictDoNothing).mockResolvedValue([]);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ profileId: 'profile-1', roleId: ROLE.STUDENT }]
    });

    expect(result).toEqual({ status: 'fulfilled', value: existing });
    expect(addCohortMember).not.toHaveBeenCalled();
    expect(insertOrganizationMembersOnConflictDoNothing).toHaveBeenCalledWith(
      [expect.objectContaining({ organizationId: 'org-1', roleId: ROLE.STUDENT, profileId: 'profile-1' })],
      expect.anything()
    );
  });

  it('still refuses a student already in the cohort who has an org membership, archived or not', async () => {
    vi.mocked(findCohortMemberRowByProfileId).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof findCohortMemberRowByProfileId>>);
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(42 as never);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ profileId: 'profile-1', roleId: ROLE.STUDENT }]
    });

    expect(result).toMatchObject({ status: 'rejected', reason: { code: 'MEMBER_ALREADY_IN_COHORT' } });
    expect(insertOrganizationMembersOnConflictDoNothing).not.toHaveBeenCalled();
  });
  it('links a pending student row for the email instead of skipping it, with no new seat', async () => {
    vi.mocked(findCohortMemberRowByProfileId).mockResolvedValue(null);
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue({
      id: 7,
      profileId: null,
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof selectOrganizationMemberByOrgAndNormalizedEmail>>);
    vi.mocked(addCohortMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof addCohortMember>>);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ profileId: 'profile-1', email: 'Student@Example.com', roleId: ROLE.STUDENT }]
    });

    expect(result.status).toBe('fulfilled');
    expect(selectOrganizationMemberByOrgAndNormalizedEmail).toHaveBeenCalledWith(
      expect.anything(),
      'org-1',
      'student@example.com'
    );
    expect(updateOrganizationMemberById).toHaveBeenCalledWith(expect.anything(), 7, {
      profileId: 'profile-1',
      verified: true
    });
    expect(assertStudentCapacityOrThrow).not.toHaveBeenCalled();
    expect(insertOrganizationMembersOnConflictDoNothing).not.toHaveBeenCalled();
  });

  it('refuses a student whose email has a pending team invite, rather than making them staff', async () => {
    vi.mocked(findCohortMemberRowByProfileId).mockResolvedValue(null);
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue({
      id: 8,
      profileId: null,
      roleId: ROLE.TUTOR
    } as Awaited<ReturnType<typeof selectOrganizationMemberByOrgAndNormalizedEmail>>);
    vi.mocked(addCohortMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof addCohortMember>>);

    const [result] = await addCohortMembersSettled(COHORT_ID, {
      members: [{ profileId: 'profile-1', email: 'tutor@example.com', roleId: ROLE.STUDENT }]
    });

    expect(result).toMatchObject({ status: 'rejected', reason: { code: 'CONFLICT', statusCode: 409 } });
    expect(updateOrganizationMemberById).not.toHaveBeenCalled();
    expect(insertOrganizationMembersOnConflictDoNothing).not.toHaveBeenCalled();
  });
});

describe('updateCohortMemberService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortById).mockResolvedValue({ id: COHORT_ID, organizationId: 'org-1' } as Awaited<
      ReturnType<typeof getCohortById>
    >);
    vi.mocked(getCohortMemberById).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      email: null,
      roleId: ROLE.TUTOR
    } as Awaited<ReturnType<typeof getCohortMemberById>>);
    vi.mocked(updateCohortMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof updateCohortMember>>);
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(getProfileById).mockResolvedValue({ email: 'Tutor@Example.com' } as Awaited<
      ReturnType<typeof getProfileById>
    >);
    vi.mocked(hasLapsedStudentInvite).mockResolvedValue(false);
  });

  it('refuses to make a cohort tutor a student while their email has a pending team invite', async () => {
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue({
      id: 8,
      profileId: null,
      roleId: ROLE.TUTOR
    } as Awaited<ReturnType<typeof selectOrganizationMemberByOrgAndNormalizedEmail>>);

    await expect(
      updateCohortMemberService(COHORT_ID, 'member-1', { roleId: ROLE.STUDENT } as never)
    ).rejects.toMatchObject({ code: 'CONFLICT', statusCode: 409 });
    expect(selectOrganizationMemberByOrgAndNormalizedEmail).toHaveBeenCalledWith(
      expect.anything(),
      'org-1',
      'tutor@example.com'
    );
    expect(insertOrganizationMembersOnConflictDoNothing).not.toHaveBeenCalled();
  });
});
