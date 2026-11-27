import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: vi.fn(),
  getCohortById: vi.fn(),
  getCohortMemberByEmail: vi.fn(),
  getCohortMemberByProfileId: vi.fn(),
  getCoursesByCohort: vi.fn()
}));
vi.mock('@cio/db/queries/course', () => ({ getCourseGroupIds: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({
  insertGroupMembersOnConflictDoNothing: vi.fn()
}));
vi.mock('@cio/db/queries/auth', () => ({ getProfileById: vi.fn() }));
vi.mock('@cio/db/queries/organization', () => ({
  getOrgMembersByProfileIds: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn(),
  insertOrganizationMembersOnConflictDoNothing: vi.fn(),
  listActiveOrganizationRoles: vi.fn()
}));
vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((callback: (tx: unknown) => unknown) => callback({})) }
}));
vi.mock('../../organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn(),
  notifyStudentMilestone: vi.fn()
}));
vi.mock('../../organization/audience', () => ({
  importAudienceMembers: vi.fn()
}));
vi.mock('@cio/core/services/webhook/emit', () => ({
  emitCohortMemberWebhookEvent: vi.fn(),
  emitOrganizationMemberWebhookEvent: vi.fn()
}));
vi.mock('@api/services/product-events', () => ({ captureLearnersEnrolled: vi.fn() }));

import {
  addCohortMember,
  getCohortById,
  getCohortMemberByEmail,
  getCohortMemberByProfileId,
  getCoursesByCohort
} from '@cio/db/queries/cohort';
import { getCourseGroupIds } from '@cio/db/queries/course';
import { insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import { getProfileById } from '@cio/db/queries/auth';
import { getOrganizationMembersByNormalizedEmails, listActiveOrganizationRoles } from '@cio/db/queries/organization';
import { emitCohortMemberWebhookEvent } from '@cio/core/services/webhook/emit';
import { ROLE } from '@cio/utils/constants';
import { importAudienceMembers } from '@api/services/organization/audience';
import { addCohortMembers, addCohortMembersSettled } from '@api/services/cohort/cohort';

const COHORT_ID = 'cohort-1';
const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';

function importRows(rows: Record<string, unknown>[]) {
  return { rows } as never;
}

describe('addCohortMembersSettled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortById).mockResolvedValue({ id: COHORT_ID, organizationId: ORG_ID } as Awaited<
      ReturnType<typeof getCohortById>
    >);
    vi.mocked(getCoursesByCohort).mockResolvedValue([]);
    vi.mocked(getCourseGroupIds).mockResolvedValue([]);
    vi.mocked(insertGroupMembersOnConflictDoNothing).mockResolvedValue([]);
    vi.mocked(listActiveOrganizationRoles).mockResolvedValue([]);
    vi.mocked(getProfileById).mockResolvedValue(null as never);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([]);
    vi.mocked(getCohortMemberByEmail).mockResolvedValue(null);
    vi.mocked(getCohortMemberByProfileId).mockResolvedValue(null);
    vi.mocked(addCohortMember).mockResolvedValue({ id: 'new-member' } as Awaited<ReturnType<typeof addCohortMember>>);
    vi.mocked(importAudienceMembers).mockResolvedValue(importRows([]));
  });

  it('refuses an email that is already in the cohort, so retries do not duplicate', async () => {
    vi.mocked(getCohortMemberByEmail).mockResolvedValue({ id: 'existing' } as Awaited<
      ReturnType<typeof getCohortMemberByEmail>
    >);

    const [result] = await addCohortMembersSettled(
      COHORT_ID,
      { members: [{ email: 'New@Example.com', roleId: ROLE.STUDENT }] },
      'dashboard',
      ACTOR_ID
    );

    expect(getCohortMemberByEmail).toHaveBeenCalledWith(COHORT_ID, 'new@example.com');
    expect(result).toMatchObject({ status: 'rejected', reason: { code: 'MEMBER_ALREADY_IN_COHORT' } });
    expect(addCohortMember).not.toHaveBeenCalled();
    expect(importAudienceMembers).not.toHaveBeenCalled();
  });

  it('invites a student who has not joined through their organization invite instead of writing a cohort row', async () => {
    vi.mocked(importAudienceMembers).mockResolvedValue(
      importRows([{ email: 'new@example.com', status: 'ready', inviteId: 'org-invite-1' }])
    );

    const [result] = await addCohortMembersSettled(
      COHORT_ID,
      { members: [{ email: 'New@Example.com', roleId: ROLE.STUDENT }] },
      'dashboard',
      ACTOR_ID
    );

    expect(importAudienceMembers).toHaveBeenCalledWith(
      ORG_ID,
      {
        recipients: [{ email: 'new@example.com' }],
        cohortIds: [COHORT_ID],
        allCourses: false,
        allCohorts: false,
        sendEmail: true
      },
      ACTOR_ID,
      'dashboard',
      { reissue: 'when-changed', inviteSource: 'COHORT_ADD' }
    );
    expect(addCohortMember).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'fulfilled',
      value: { kind: 'invited', email: 'new@example.com', status: 'invited', inviteId: 'org-invite-1' }
    });
  });

  it('invites a pending roster student once even when they are listed twice', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'pending@example.com', profileId: null, roleId: ROLE.STUDENT, status: 'ACTIVE' }
    ] as never);
    vi.mocked(importAudienceMembers).mockResolvedValue(
      importRows([{ email: 'pending@example.com', status: 'already_invited', inviteId: 'org-invite-1' }])
    );

    const results = await addCohortMembersSettled(
      COHORT_ID,
      {
        members: [
          { email: 'pending@example.com', roleId: ROLE.STUDENT },
          { email: 'Pending@example.com', roleId: ROLE.STUDENT }
        ]
      },
      'dashboard',
      ACTOR_ID
    );

    expect(vi.mocked(importAudienceMembers).mock.calls[0][1]).toMatchObject({
      recipients: [{ email: 'pending@example.com' }]
    });
    expect(results.map((result) => result.status === 'fulfilled' && result.value)).toEqual([
      { kind: 'invited', email: 'pending@example.com', status: 'already_invited', inviteId: 'org-invite-1' },
      { kind: 'invited', email: 'pending@example.com', status: 'already_invited', inviteId: 'org-invite-1' }
    ]);
  });

  it.each([
    ['is_staff', 409, 'STAFF_CANNOT_ENROLL'],
    ['archived', 409, 'ORG_MEMBER_ARCHIVED'],
    ['over_seat_limit', 403, 'UPGRADE_REQUIRED'],
    ['invalid_email', 400, 'VALIDATION_ERROR']
  ])('rejects the entry when the invite row is %s', async (status, statusCode, code) => {
    vi.mocked(importAudienceMembers).mockResolvedValue(importRows([{ email: 'new@example.com', status }]));

    const [result] = await addCohortMembersSettled(
      COHORT_ID,
      { members: [{ email: 'new@example.com', roleId: ROLE.STUDENT }] },
      'dashboard',
      ACTOR_ID
    );

    expect(result).toMatchObject({ status: 'rejected', reason: { statusCode, code } });
  });

  it('rejects an archived organization member before inviting', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'gone@example.com', profileId: 'profile-9', roleId: ROLE.STUDENT, status: 'ARCHIVED' }
    ] as never);
    vi.mocked(getCohortMemberByProfileId).mockResolvedValue(null);

    const [result] = await addCohortMembersSettled(
      COHORT_ID,
      { members: [{ email: 'gone@example.com', roleId: ROLE.STUDENT }] },
      'dashboard',
      ACTOR_ID
    );

    expect(result).toMatchObject({ status: 'rejected', reason: { statusCode: 409, code: 'ORG_MEMBER_ARCHIVED' } });
    expect(importAudienceMembers).not.toHaveBeenCalled();
    expect(addCohortMember).not.toHaveBeenCalled();
  });

  it('refuses to invite without a signed-in actor', async () => {
    const [result] = await addCohortMembersSettled(
      COHORT_ID,
      { members: [{ email: 'new@example.com', roleId: ROLE.STUDENT }] },
      'dashboard',
      null
    );

    expect(importAudienceMembers).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'rejected', reason: { statusCode: 400 } });
  });

  it('adds a joined student directly and enrols them in the cohort courses', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@example.com', profileId: 'profile-1', roleId: ROLE.STUDENT, status: 'ACTIVE' }
    ] as never);
    vi.mocked(getCoursesByCohort).mockResolvedValue([{ course: { id: 'course-1' } }] as Awaited<
      ReturnType<typeof getCoursesByCohort>
    >);
    vi.mocked(getCourseGroupIds).mockResolvedValue([{ courseId: 'course-1', groupId: 'group-1' }]);
    vi.mocked(addCohortMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof addCohortMember>>);

    const [result] = await addCohortMembersSettled(
      COHORT_ID,
      { members: [{ email: 'Ada@example.com', roleId: ROLE.STUDENT }] },
      'dashboard',
      ACTOR_ID
    );

    expect(getCohortMemberByProfileId).toHaveBeenCalledWith(COHORT_ID, 'profile-1');
    expect(addCohortMember).toHaveBeenCalledWith(
      expect.objectContaining({ cohortId: COHORT_ID, profileId: 'profile-1', email: 'ada@example.com' }),
      expect.anything()
    );
    expect(insertGroupMembersOnConflictDoNothing).toHaveBeenCalledWith(
      [{ groupId: 'group-1', roleId: ROLE.STUDENT, profileId: 'profile-1', email: 'ada@example.com' }],
      expect.anything()
    );
    expect(emitCohortMemberWebhookEvent).toHaveBeenCalledWith(
      'cohort.member.added',
      ORG_ID,
      COHORT_ID,
      expect.objectContaining({ id: 'member-1' }),
      ACTOR_ID
    );
    expect(importAudienceMembers).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'fulfilled', value: { kind: 'added' } });
  });

  it('checks by profileId, not email, when the entry names a profile', async () => {
    vi.mocked(getProfileById).mockResolvedValue({ id: 'profile-1', email: 'p1@example.com' } as never);
    vi.mocked(getCohortMemberByProfileId).mockResolvedValue({ id: 'existing' } as Awaited<
      ReturnType<typeof getCohortMemberByProfileId>
    >);

    const [result] = await addCohortMembersSettled(
      COHORT_ID,
      { members: [{ profileId: 'profile-1', roleId: ROLE.STUDENT }] },
      'dashboard',
      ACTOR_ID
    );

    expect(getCohortMemberByProfileId).toHaveBeenCalledWith(COHORT_ID, 'profile-1');
    expect(getCohortMemberByEmail).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'rejected',
      reason: { code: 'MEMBER_ALREADY_IN_COHORT', message: 'profile-1 is already a member of this cohort' }
    });
  });

  it('enrolls a tutor into the cohort courses that already exist', async () => {
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
      [{ groupId: 'group-1', roleId: ROLE.TUTOR, profileId: 'profile-1', email: 'tutor@example.com' }],
      expect.anything()
    );
  });

  it('does not enroll an organization student who is only a cohort tutor', async () => {
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
});

describe('addCohortMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortById).mockResolvedValue({ id: COHORT_ID, organizationId: ORG_ID } as Awaited<
      ReturnType<typeof getCohortById>
    >);
    vi.mocked(getCoursesByCohort).mockResolvedValue([]);
    vi.mocked(getCourseGroupIds).mockResolvedValue([]);
    vi.mocked(getProfileById).mockResolvedValue(null as never);
    vi.mocked(getCohortMemberByEmail).mockResolvedValue(null);
    vi.mocked(getCohortMemberByProfileId).mockResolvedValue(null);
  });

  it('splits outcomes into added, invited and errors', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockImplementation(async (_orgId, emails) =>
      emails[0] === 'joined@example.com'
        ? ([{ normalizedEmail: 'joined@example.com', profileId: 'profile-1', roleId: ROLE.STUDENT }] as never)
        : []
    );
    vi.mocked(addCohortMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-1',
      roleId: ROLE.STUDENT
    } as never);
    vi.mocked(importAudienceMembers).mockResolvedValue(
      importRows([
        { email: 'new@example.com', status: 'ready', inviteId: 'org-invite-1' },
        { email: 'staff@example.com', status: 'is_staff' }
      ])
    );

    const result = await addCohortMembers(
      COHORT_ID,
      {
        members: [
          { email: 'joined@example.com', roleId: ROLE.STUDENT },
          { email: 'new@example.com', roleId: ROLE.STUDENT },
          { email: 'staff@example.com', roleId: ROLE.STUDENT }
        ]
      },
      ACTOR_ID
    );

    expect(result.added.map((member) => member?.id)).toEqual(['member-1']);
    expect(result.invited).toEqual([{ email: 'new@example.com', status: 'invited', inviteId: 'org-invite-1' }]);
    expect(result.errors).toEqual(['This email belongs to an admin or tutor']);
  });
});
