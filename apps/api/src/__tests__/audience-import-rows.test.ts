import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/services/webhook/emit', () => ({
  emitWebhookEvent: vi.fn().mockResolvedValue(undefined),
  emitCohortMemberWebhookEvent: vi.fn().mockResolvedValue(undefined),
  emitCourseWebhookEvent: vi.fn().mockResolvedValue(undefined),
  emitOrganizationMemberWebhookEvent: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@cio/db/queries/organization', () => ({
  createOrganizationInvite: vi.fn(),
  createOrganizationInviteAudits: vi.fn().mockResolvedValue(undefined),
  // Echo the rows back with ids, so the audit step downstream has invites to read.
  createOrganizationInvites: vi
    .fn()
    .mockImplementation(async (rows: { email: string }[]) =>
      rows.map((row, index) => ({ id: `invite-${index}`, email: row.email }))
    ),
  createOrganizationMembers: vi.fn().mockImplementation(async (rows: { email: string }[]) => rows),
  getOrganizationAudienceMember: vi.fn(),
  getLatestOrganizationInviteMetadataByEmails: vi.fn().mockResolvedValue([]),
  getLatestOrganizationInviteRowByOrgAndEmail: vi.fn(),
  getOrgMembersByProfileIds: vi.fn().mockResolvedValue([]),
  getOrganizationById: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn(),
  getStudentOrganizationMemberByOrgAndEmail: vi.fn(),
  hasActiveOrganizationInviteForEmail: vi.fn().mockResolvedValue(false),
  hasLapsedStudentInvite: vi.fn().mockResolvedValue(false),
  revokeActiveOrganizationInvitesByEmails: vi.fn().mockResolvedValue([]),
  updateOrganizationAudienceMember: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseGroupIds: vi.fn().mockResolvedValue([]),
  getOrgCourseGroups: vi.fn().mockResolvedValue([]),
  getOrgCourses: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: vi.fn(),
  claimEmailOnlyCohortMembersForCohorts: vi.fn().mockResolvedValue({ claimed: 0, removedDuplicates: 0 }),
  getCohortsByOrg: vi.fn().mockResolvedValue([]),
  getCourseIdsByCohortIds: vi.fn().mockResolvedValue([]),
  getExistingCohortMembers: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/db/queries/group', () => ({
  addGroupMembers: vi.fn(),
  claimEmailOnlyGroupMembersForGroups: vi.fn().mockResolvedValue({ claimed: 0, removedDuplicates: 0 }),
  enrollUsersInCourseGroups: vi.fn().mockResolvedValue(undefined),
  getExistingGroupMembers: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfilesByEmails: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn().mockResolvedValue(null),
  getRemainingStudentSeats: vi.fn().mockResolvedValue(Number.POSITIVE_INFINITY),
  notifyStudentMilestone: vi.fn().mockResolvedValue(undefined)
}));

// The audience service merges student invites through the shared supersede
// helper. These row-level tests mock the query layer, so emulate the merge with
// those same mocks instead of touching a database.
vi.mock('@cio/core/services/organization/supersede-invites', () => ({
  getStaffInvitedEmails: vi.fn().mockResolvedValue(new Set()),
  supersedeStudentOrgInvites: vi.fn(
    async (
      _dbClient: unknown,
      params: {
        orgId: string;
        emails: string[];
        courseIds?: string[];
        cohortIds?: string[];
        pathIds?: string[];
        fullnamesByEmail?: Map<string, string>;
      }
    ) => {
      const {
        revokeActiveOrganizationInvitesByEmails,
        createOrganizationInvites,
        getLatestOrganizationInviteMetadataByEmails
      } = await import('@cio/db/queries/organization');
      const invitedByProfileId = (params as { invitedByProfileId?: string }).invitedByProfileId ?? 'actor-1';
      const courseIds = [...new Set((params.courseIds ?? []).filter(Boolean))];
      const cohortIds = [...new Set((params.cohortIds ?? []).filter(Boolean))];
      const pathIds = [...new Set((params.pathIds ?? []).filter(Boolean))];
      const nameless = params.emails.filter((email) => !params.fullnamesByEmail?.get(email));
      const previous = await getLatestOrganizationInviteMetadataByEmails(
        params.orgId,
        nameless,
        _dbClient as never
      ).catch(() => []);
      const previousFullnameByEmail = new Map<string, string>();
      for (const row of previous as { email: string; metadata: unknown }[]) {
        const metadata = (row.metadata ?? {}) as { fullname?: unknown };
        if (typeof metadata.fullname === 'string' && metadata.fullname.trim()) {
          previousFullnameByEmail.set(row.email.toLowerCase(), metadata.fullname.trim());
        }
      }
      const revoked = await revokeActiveOrganizationInvitesByEmails(
        params.orgId,
        params.emails,
        invitedByProfileId,
        _dbClient as never
      );
      const created = await createOrganizationInvites(
        params.emails.map((email: string) => ({
          organizationId: params.orgId,
          roleId: 3,
          email,
          tokenHash: `mock-hash-${email}`,
          createdByProfileId: invitedByProfileId,
          expiresAt: new Date().toISOString(),
          isRevoked: false,
          metadata: {
            courseIds: courseIds.length > 0 ? courseIds : undefined,
            cohortIds: cohortIds.length > 0 ? cohortIds : undefined,
            pathIds: pathIds.length > 0 ? pathIds : undefined,
            fullname: params.fullnamesByEmail?.get(email) ?? previousFullnameByEmail.get(email.toLowerCase())
          }
        })) as never,
        _dbClient as never
      );
      return {
        revoked,
        created,
        inviteByEmail: new Map(
          (created as { id: string; email: string }[]).map((invite) => [(invite.email ?? '').toLowerCase(), invite])
        ),
        tokenByEmail: new Map(params.emails.map((email: string) => [email.toLowerCase(), `mock-token-${email}`])),
        unchanged: [],
        addedCourseIdsByEmail: new Map(params.emails.map((email: string) => [email.toLowerCase(), courseIds])),
        removedCourseIdsByEmail: new Map(),
        skippedStaff: [] as string[]
      };
    }
  )
}));

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn().mockResolvedValue({ createdRecords: [] })
}));

vi.mock('@api/services/course/session-invite', () => ({
  getWelcomeSessionIcs: vi.fn().mockResolvedValue(undefined)
}));

const TX = { tx: true };
vi.mock('@cio/db/drizzle', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/drizzle')>()),
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run(TX)) }
}));

import {
  createOrganizationInvite,
  createOrganizationInvites,
  createOrganizationMembers,
  getOrganizationAudienceMember,
  getLatestOrganizationInviteRowByOrgAndEmail,
  getOrganizationById,
  getLatestOrganizationInviteMetadataByEmails,
  getOrganizationMembersByNormalizedEmails,
  getStudentOrganizationMemberByOrgAndEmail,
  hasLapsedStudentInvite,
  revokeActiveOrganizationInvitesByEmails,
  updateOrganizationAudienceMember
} from '@cio/db/queries/organization';
import { addCohortMember, getCohortsByOrg } from '@cio/db/queries/cohort';
import { getOrgCourseGroups, getOrgCourses } from '@cio/db/queries/course';
import { addGroupMembers, enrollUsersInCourseGroups, getExistingGroupMembers } from '@cio/db/queries/group';
import { getOrgMembersByProfileIds } from '@cio/db/queries/organization';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import {
  assertStudentCapacityOrThrow,
  getRemainingStudentSeats,
  notifyStudentMilestone
} from '@api/services/organization/student-limit';
import {
  importAudienceMembers,
  resendAudienceInvite,
  updatePendingAudienceMemberEmail
} from '@api/services/organization/audience';
import { supersedeStudentOrgInvites } from '@cio/core/services/organization/supersede-invites';
import { ROLE } from '@cio/utils/constants';

const ORG = 'org-1';
const ACTOR = 'actor-1';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrganizationById).mockResolvedValue({ id: ORG, siteName: 'acme' } as never);
  vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([]);
  vi.mocked(getRemainingStudentSeats).mockResolvedValue(Number.POSITIVE_INFINITY);
});

function csv(...lines: string[]) {
  return { recipientCsv: lines.join('\n'), allCourses: false, allCohorts: false, sendEmail: false } as never;
}

describe('importAudienceMembers — one bad row does not fail the batch', () => {
  it('reports a malformed address per row and imports the rest', async () => {
    const result = await importAudienceMembers(ORG, csv('email', 'ada@test.dev', 'broken', 'grace@test.dev'), ACTOR);

    expect(result.rows.map((row) => row.status)).toEqual(['ready', 'invalid_email', 'ready']);
    expect(result.imported).toBe(2);
  });

  it('reports a linked-account conflict when a concurrent import wins the email', async () => {
    vi.mocked(createOrganizationMembers).mockRejectedValueOnce({
      cause: { code: '23505', constraint_name: 'organizationmember_org_email_unique' }
    } as never);

    await expect(importAudienceMembers(ORG, csv('email', 'race@test.dev'), ACTOR)).rejects.toMatchObject({
      statusCode: 409,
      code: 'ORG_MEMBER_EMAIL_LINKED_TO_OTHER_ACCOUNT'
    });
  });

  it('reports a staff address rather than rejecting the file', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'admin@test.dev', profileId: 'p-admin', roleId: ROLE.ADMIN }
    ] as never);

    const result = await importAudienceMembers(ORG, csv('email', 'ada@test.dev', 'admin@test.dev'), ACTOR);

    expect(result.rows).toEqual([
      { email: 'ada@test.dev', name: undefined, status: 'ready', inviteId: 'invite-0' },
      { email: 'admin@test.dev', name: undefined, status: 'is_staff' }
    ]);
    expect(result.imported).toBe(1);
  });

  it('marks an existing student as already a member', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);

    const result = await importAudienceMembers(ORG, csv('email', 'ada@test.dev'), ACTOR);

    expect(result.rows[0].status).toBe('already_member');
    expect(result.imported).toBe(0);
  });

  it('reports a fresh invite for a student who has not joined yet', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: null, roleId: ROLE.STUDENT }
    ] as never);

    const result = await importAudienceMembers(ORG, csv('email', 'ada@test.dev'), ACTOR);

    expect(result.rows[0].status).toBe('invite_resent');
    expect(result).toMatchObject({ pendingInvitesRenewed: 1 });
    expect(createOrganizationInvites).toHaveBeenCalled();
    expect(result.imported).toBe(0);
  });

  it('flags in-file duplicates without importing them twice', async () => {
    const result = await importAudienceMembers(ORG, csv('email', 'ada@test.dev', 'ADA@test.dev'), ACTOR);

    expect(result.rows.map((row) => row.status)).toEqual(['ready', 'duplicate_in_file']);
    expect(result.imported).toBe(1);
  });

  it('succeeds with per-row reasons when nothing is importable', async () => {
    const result = await importAudienceMembers(ORG, csv('email', 'broken', 'also-broken'), ACTOR);

    expect(result.imported).toBe(0);
    expect(result.rows.every((row) => row.status === 'invalid_email')).toBe(true);
  });

  it('returns every result field when nothing is importable', async () => {
    const result = await importAudienceMembers(
      ORG,
      { recipients: [{ email: 'broken' }], allCourses: false, allCohorts: false, sendEmail: false } as never,
      ACTOR
    );

    expect(result).toEqual({
      imported: 0,
      enrolled: 0,
      emailsSent: 0,
      emailsFailed: 0,
      emailFailures: [],
      rows: [{ email: 'broken', name: undefined, status: 'invalid_email' }],
      assigned: 0,
      alreadyEnrolledInCourses: 0,
      alreadyEnrolledInCohorts: 0,
      pendingInvitesRenewed: 0,
      truncated: 0
    });
  });
});

describe('importAudienceMembers — seat limit', () => {
  it('imports what fits and marks the overflow rather than refusing the file', async () => {
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(2);

    const result = await importAudienceMembers(
      ORG,
      csv('email', 'a@test.dev', 'b@test.dev', 'c@test.dev', 'd@test.dev'),
      ACTOR
    );

    expect(result.imported).toBe(2);
    expect(result.rows.map((row) => row.status)).toEqual(['ready', 'ready', 'over_seat_limit', 'over_seat_limit']);
  });

  it('marks every row over the limit when no seats remain', async () => {
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(0);

    const result = await importAudienceMembers(ORG, csv('email', 'a@test.dev', 'b@test.dev'), ACTOR);

    expect(result.imported).toBe(0);
    expect(result.rows.every((row) => row.status === 'over_seat_limit')).toBe(true);
  });

  it('adds only the free seats from a 1000-address list', async () => {
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(20);
    const recipients = Array.from({ length: 1000 }, (_, i) => ({ email: `s${i}@test.dev` }));

    const result = await importAudienceMembers(
      ORG,
      { recipients, allCourses: false, allCohorts: false, sendEmail: false } as never,
      ACTOR
    );

    expect(result.imported).toBe(20);
    expect(result.rows.filter((row) => row.status === 'ready')).toHaveLength(20);
    expect(result.rows.filter((row) => row.status === 'over_seat_limit')).toHaveLength(980);
  });

  it('does not re-invite an address another request added first', async () => {
    vi.mocked(createOrganizationMembers).mockImplementationOnce(
      async (rows) => rows.filter((row) => row.email !== 'b@test.dev') as never
    );

    const result = await importAudienceMembers(ORG, csv('email', 'a@test.dev', 'b@test.dev'), ACTOR);

    expect(result.rows.map((row) => row.status)).toEqual(['ready', 'already_member']);
    expect(result.imported).toBe(1);
    expect(createOrganizationInvites).toHaveBeenCalledWith(
      [expect.objectContaining({ email: 'a@test.dev' })],
      expect.anything()
    );
  });

  it('checks capacity and inserts members in the same transaction', async () => {
    await importAudienceMembers(ORG, csv('email', 'a@test.dev', 'b@test.dev'), ACTOR);

    expect(assertStudentCapacityOrThrow).toHaveBeenCalledWith(ORG, 2, TX, { deferNotification: true });
    expect(createOrganizationMembers).toHaveBeenCalledWith(expect.any(Array), TX);
  });

  it('sends the seat milestone email only after the members are saved', async () => {
    const milestone = { orgId: ORG, milestone: 'reached' } as never;
    vi.mocked(assertStudentCapacityOrThrow).mockResolvedValueOnce(milestone);

    await importAudienceMembers(ORG, csv('email', 'a@test.dev'), ACTOR);

    expect(notifyStudentMilestone).toHaveBeenCalledWith(milestone);
  });

  it('adds nobody when a concurrent import fills the last seats first', async () => {
    vi.mocked(assertStudentCapacityOrThrow).mockRejectedValueOnce(new Error('UPGRADE_REQUIRED'));

    await expect(importAudienceMembers(ORG, csv('email', 'a@test.dev'), ACTOR)).rejects.toThrow('UPGRADE_REQUIRED');
    expect(createOrganizationMembers).not.toHaveBeenCalled();
  });

  it('renews a lapsed invite only when a seat is free, in file order with new addresses', async () => {
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(1);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      {
        normalizedEmail: 'lapsed@test.dev',
        profileId: null,
        roleId: ROLE.STUDENT,
        status: 'ACTIVE',
        hasLapsedInvite: true
      }
    ] as never);

    const result = await importAudienceMembers(ORG, csv('email', 'lapsed@test.dev', 'new@test.dev'), ACTOR);

    expect(result.rows.map((row) => row.status)).toEqual(['invite_resent', 'over_seat_limit']);
    expect(result.imported).toBe(0);
  });

  it('reports a lapsed invite as over the limit when no seats remain', async () => {
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(0);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      {
        normalizedEmail: 'lapsed@test.dev',
        profileId: null,
        roleId: ROLE.STUDENT,
        status: 'ACTIVE',
        hasLapsedInvite: true
      }
    ] as never);

    const result = await importAudienceMembers(ORG, csv('email', 'lapsed@test.dev'), ACTOR);

    expect(result.rows[0].status).toBe('over_seat_limit');
    expect(result).toMatchObject({ pendingInvitesRenewed: 0 });
    expect(createOrganizationInvites).not.toHaveBeenCalled();
  });

  it('renews a still-pending invite without needing a free seat', async () => {
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(0);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      {
        normalizedEmail: 'pending@test.dev',
        profileId: null,
        roleId: ROLE.STUDENT,
        status: 'ACTIVE',
        hasLapsedInvite: false
      }
    ] as never);

    const result = await importAudienceMembers(ORG, csv('email', 'pending@test.dev'), ACTOR);

    expect(result.rows[0].status).toBe('invite_resent');
    expect(result).toMatchObject({ pendingInvitesRenewed: 1 });
    expect(assertStudentCapacityOrThrow).not.toHaveBeenCalled();
  });

  it('counts a renewed lapsed invite in the seat check, so milestone emails fire', async () => {
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(5);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      {
        normalizedEmail: 'lapsed@test.dev',
        profileId: null,
        roleId: ROLE.STUDENT,
        status: 'ACTIVE',
        hasLapsedInvite: true
      }
    ] as never);

    await importAudienceMembers(ORG, csv('email', 'lapsed@test.dev', 'new@test.dev'), ACTOR);

    expect(assertStudentCapacityOrThrow).toHaveBeenCalledWith(ORG, 2, TX, { deferNotification: true });
  });

  it('renews lapsed invites inside the seat-check transaction, so the seat is taken under the lock', async () => {
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(5);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      {
        normalizedEmail: 'lapsed@test.dev',
        profileId: null,
        roleId: ROLE.STUDENT,
        status: 'ACTIVE',
        hasLapsedInvite: true
      }
    ] as never);

    await importAudienceMembers(ORG, csv('email', 'lapsed@test.dev'), ACTOR);

    expect(assertStudentCapacityOrThrow).toHaveBeenCalledWith(ORG, 1, TX, { deferNotification: true });
    expect(revokeActiveOrganizationInvitesByEmails).toHaveBeenCalledWith(ORG, ['lapsed@test.dev'], ACTOR, TX);
    expect(createOrganizationInvites).toHaveBeenCalledWith([expect.objectContaining({ email: 'lapsed@test.dev' })], TX);
  });
});

describe('resendAudienceInvite — seat limit', () => {
  beforeEach(() => {
    vi.mocked(getStudentOrganizationMemberByOrgAndEmail).mockResolvedValue({
      id: 7,
      profileId: null,
      email: 'ada@test.dev'
    });
    vi.mocked(getLatestOrganizationInviteRowByOrgAndEmail).mockResolvedValue(null as never);
  });

  it('does not need a free seat to resend a still-pending invite', async () => {
    vi.mocked(hasLapsedStudentInvite).mockResolvedValue(false);

    await resendAudienceInvite(ORG, { email: 'ada@test.dev' } as never, ACTOR);

    expect(assertStudentCapacityOrThrow).not.toHaveBeenCalled();
    expect(supersedeStudentOrgInvites).toHaveBeenCalledWith(
      TX,
      expect.objectContaining({ orgId: ORG, emails: ['ada@test.dev'] })
    );
    expect(createOrganizationInvites).toHaveBeenCalledWith([expect.objectContaining({ email: 'ada@test.dev' })], TX);
  });

  it('checks for a free seat in the same transaction when the invite was revoked or expired', async () => {
    vi.mocked(hasLapsedStudentInvite).mockResolvedValue(true);

    await resendAudienceInvite(ORG, { email: 'ada@test.dev' } as never, ACTOR);

    expect(hasLapsedStudentInvite).toHaveBeenCalledWith(ORG, 7, TX);
    expect(assertStudentCapacityOrThrow).toHaveBeenCalledWith(ORG, 1, TX, { deferNotification: true });
    expect(revokeActiveOrganizationInvitesByEmails).toHaveBeenCalledWith(ORG, ['ada@test.dev'], ACTOR, TX);
    expect(createOrganizationInvites).toHaveBeenCalledWith([expect.objectContaining({ email: 'ada@test.dev' })], TX);
  });

  it('sends no new invite when the plan is full', async () => {
    vi.mocked(hasLapsedStudentInvite).mockResolvedValue(true);
    vi.mocked(assertStudentCapacityOrThrow).mockRejectedValueOnce(new Error('UPGRADE_REQUIRED'));

    await expect(resendAudienceInvite(ORG, { email: 'ada@test.dev' } as never, ACTOR)).rejects.toThrow(
      'UPGRADE_REQUIRED'
    );
    expect(createOrganizationInvites).not.toHaveBeenCalled();
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });
});

describe('importAudienceMembers — cohort invites', () => {
  function cohortInvite(sendEmail: boolean, ...emails: string[]) {
    return {
      recipientCsv: ['email', ...emails].join('\n'),
      cohortIds: ['cohort-1'],
      allCourses: false,
      allCohorts: false,
      sendEmail
    } as never;
  }

  beforeEach(() => {
    vi.mocked(getCohortsByOrg).mockResolvedValue([{ id: 'cohort-1', name: 'Cohort A' }] as never);
  });

  it('creates an org invite tagged with the cohort for an unknown email and queues the invite email', async () => {
    const result = await importAudienceMembers(ORG, cohortInvite(true, 'new@test.dev'), ACTOR);

    expect(createOrganizationInvites).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          email: 'new@test.dev',
          createdByProfileId: ACTOR,
          metadata: expect.objectContaining({ cohortIds: ['cohort-1'] })
        })
      ],
      expect.anything()
    );
    expect(enqueueTransactionalEmail).toHaveBeenCalledWith(
      'studentOrgInvite',
      expect.objectContaining({ to: 'new@test.dev' })
    );
    expect(result.emailsSent).toBe(1);
  });

  it('creates the invite but sends no email when sendEmail is false', async () => {
    const result = await importAudienceMembers(ORG, cohortInvite(false, 'new@test.dev'), ACTOR);

    expect(createOrganizationInvites).toHaveBeenCalled();
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
    expect(result.emailsSent).toBe(0);
  });

  it('does not create an invite for an existing student; they are enrolled directly', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);

    const result = await importAudienceMembers(ORG, cohortInvite(false, 'ada@test.dev'), ACTOR);

    expect(result.rows[0].status).toBe('already_member');
    expect(createOrganizationInvites).not.toHaveBeenCalled();
  });
});

describe('importAudienceMembers — structured recipients', () => {
  it('accepts parsed rows and keeps their names', async () => {
    const result = await importAudienceMembers(
      ORG,
      {
        recipients: [
          { email: 'Ada@Test.dev', name: 'Ada Lovelace' },
          { email: 'nope', name: 'Broken' }
        ],
        allCourses: false,
        allCohorts: false,
        sendEmail: false
      } as never,
      ACTOR
    );

    expect(result.rows).toEqual([
      { email: 'ada@test.dev', name: 'Ada Lovelace', status: 'ready', inviteId: 'invite-0' },
      { email: 'nope', name: 'Broken', status: 'invalid_email' }
    ]);
  });

  it('deduplicates structured rows the client did not clean', async () => {
    const result = await importAudienceMembers(
      ORG,
      {
        recipients: [{ email: 'ada@test.dev' }, { email: 'ada@test.dev' }],
        allCourses: false,
        allCohorts: false,
        sendEmail: false
      } as never,
      ACTOR
    );

    expect(result.rows.map((row) => row.status)).toEqual(['ready', 'duplicate_in_file']);
  });
});

describe('importAudienceMembers — names stored with the invite', () => {
  function storedFullnames() {
    const rows = vi.mocked(createOrganizationInvites).mock.calls.flatMap(([invites]) => invites) as unknown as {
      email: string;
      metadata: { fullname?: string };
    }[];

    return Object.fromEntries(rows.map((row) => [row.email, row.metadata.fullname]));
  }

  it('stores each imported name in its invite metadata', async () => {
    await importAudienceMembers(ORG, csv('email,name', 'ada@test.dev,Ada Lovelace', 'grace@test.dev,'), ACTOR);

    expect(storedFullnames()).toEqual({ 'ada@test.dev': 'Ada Lovelace', 'grace@test.dev': undefined });
  });

  it('keeps the first row name when a later duplicate row carries another name', async () => {
    await importAudienceMembers(
      ORG,
      csv('email,name', 'ada@test.dev,Ada Lovelace', 'ada@test.dev,Someone Else'),
      ACTOR
    );

    expect(storedFullnames()).toEqual({ 'ada@test.dev': 'Ada Lovelace' });
  });

  it('keeps the saved name, even from a revoked invite, when a pending student is imported again without one', async () => {
    vi.mocked(getLatestOrganizationInviteMetadataByEmails).mockResolvedValueOnce([
      { email: 'ada@test.dev', metadata: { source: 'AUDIENCE_IMPORT', fullname: 'Ada Lovelace' } }
    ] as never);

    await importAudienceMembers(ORG, csv('email', 'ada@test.dev'), ACTOR);

    expect(storedFullnames()).toEqual({ 'ada@test.dev': 'Ada Lovelace' });
  });

  it('prefers the name in the new import over the previous invite name', async () => {
    vi.mocked(getLatestOrganizationInviteMetadataByEmails).mockResolvedValueOnce([
      { email: 'ada@test.dev', metadata: { source: 'AUDIENCE_IMPORT', fullname: 'Ada Lovelace' } }
    ] as never);

    await importAudienceMembers(ORG, csv('email,name', 'ada@test.dev,Ada King'), ACTOR);

    expect(storedFullnames()).toEqual({ 'ada@test.dev': 'Ada King' });
  });
});

describe('updatePendingAudienceMemberEmail — seat limit', () => {
  beforeEach(() => {
    vi.mocked(getOrganizationAudienceMember).mockResolvedValue({
      id: 7,
      profileId: null,
      email: 'old@test.dev'
    } as never);
    vi.mocked(updateOrganizationAudienceMember).mockResolvedValue({ id: 7 } as never);
    vi.mocked(getLatestOrganizationInviteRowByOrgAndEmail).mockResolvedValue(null as never);
  });

  it('does not need a free seat to correct a still-pending invite', async () => {
    vi.mocked(hasLapsedStudentInvite).mockResolvedValue(false);

    await updatePendingAudienceMemberEmail(ORG, 7, { email: 'new@test.dev', sendEmail: false }, ACTOR);

    expect(assertStudentCapacityOrThrow).not.toHaveBeenCalled();
    expect(updateOrganizationAudienceMember).toHaveBeenCalled();
  });

  it('leaves the member unchanged when a lapsed invite would need a seat and none is free', async () => {
    vi.mocked(hasLapsedStudentInvite).mockResolvedValue(true);
    vi.mocked(assertStudentCapacityOrThrow).mockRejectedValueOnce(new Error('UPGRADE_REQUIRED'));

    await expect(
      updatePendingAudienceMemberEmail(ORG, 7, { email: 'new@test.dev', sendEmail: false }, ACTOR)
    ).rejects.toThrow('UPGRADE_REQUIRED');
    expect(hasLapsedStudentInvite).toHaveBeenCalledWith(ORG, 7, TX);
    expect(assertStudentCapacityOrThrow).toHaveBeenCalledWith(ORG, 1, TX, { deferNotification: true });
    expect(revokeActiveOrganizationInvitesByEmails).not.toHaveBeenCalled();
    expect(updateOrganizationAudienceMember).not.toHaveBeenCalled();
  });
});

describe('importAudienceMembers — row outcomes for course invites', () => {
  function courseInvite(...emails: string[]) {
    return {
      recipients: emails.map((email) => ({ email })),
      courseIds: ['course-1'],
      allCourses: false,
      allCohorts: false,
      sendEmail: false
    } as never;
  }

  beforeEach(() => {
    vi.mocked(getOrgCourses).mockResolvedValue({ items: [{ id: 'course-1', title: 'Course 1' }] } as never);
    vi.mocked(getOrgCourseGroups).mockResolvedValue([
      { courseId: 'course-1', groupId: 'group-1', courseTitle: 'Course 1' }
    ] as never);
  });

  it('reports an archived student as archived and sends them no invite', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'gone@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT, status: 'ARCHIVED' }
    ] as never);

    const result = await importAudienceMembers(ORG, courseInvite('gone@test.dev'), ACTOR);

    expect(result.rows).toEqual([{ email: 'gone@test.dev', name: undefined, status: 'archived' }]);
    expect(createOrganizationInvites).not.toHaveBeenCalled();
    expect(addGroupMembers).not.toHaveBeenCalled();
  });

  it('reports already_invited when the live invite already covers the course', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: null, roleId: ROLE.STUDENT }
    ] as never);
    const merge = vi.mocked(supersedeStudentOrgInvites).getMockImplementation()!;
    vi.mocked(supersedeStudentOrgInvites).mockImplementationOnce(async (...args) => {
      const merged = await merge(...args);
      return { ...merged, unchanged: merged.created, tokenByEmail: new Map() } as never;
    });

    const result = await importAudienceMembers(ORG, courseInvite('ada@test.dev'), ACTOR, 'dashboard', {
      reissue: 'when-changed'
    });

    expect(supersedeStudentOrgInvites).toHaveBeenCalledWith(
      TX,
      expect.objectContaining({ emails: ['ada@test.dev'], courseIds: ['course-1'] })
    );
    expect(result.rows).toEqual([
      { email: 'ada@test.dev', name: undefined, status: 'already_invited', inviteId: 'invite-0' }
    ]);
  });

  it('returns the invite id and accept link for each invite it issues', async () => {
    const result = await importAudienceMembers(ORG, courseInvite('new@test.dev'), ACTOR, 'dashboard', {
      includeInviteLinks: true
    });

    expect(result.rows[0]).toMatchObject({ status: 'ready', inviteId: 'invite-0' });
    expect(result.rows[0].inviteLink).toContain('mock-token-new%40test.dev');
  });

  it('does not enrol a new email in the course before they accept', async () => {
    const result = await importAudienceMembers(ORG, courseInvite('new@test.dev'), ACTOR);

    expect(createOrganizationInvites).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          email: 'new@test.dev',
          metadata: expect.objectContaining({ courseIds: ['course-1'] })
        })
      ],
      expect.anything()
    );
    expect(addGroupMembers).not.toHaveBeenCalled();
    expect(enrollUsersInCourseGroups).not.toHaveBeenCalled();
    expect(addCohortMember).not.toHaveBeenCalled();
    expect(result.rows[0].enrollment).toBeUndefined();
    expect(result.enrolled).toBe(0);
  });

  it('enrols a joined student directly and marks the row enrolled', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' }
    ] as never);
    vi.mocked(getExistingGroupMembers).mockResolvedValue(new Set());
    vi.mocked(addGroupMembers).mockResolvedValue([{ id: 'gm-1', profileId: 'p-1', groupId: 'group-1' }] as never);

    const result = await importAudienceMembers(ORG, courseInvite('ada@test.dev'), ACTOR);

    expect(addGroupMembers).toHaveBeenCalledWith([
      expect.objectContaining({ groupId: 'group-1', profileId: 'p-1', roleId: ROLE.STUDENT })
    ]);
    expect(createOrganizationInvites).not.toHaveBeenCalled();
    expect(result.rows).toEqual([
      { email: 'ada@test.dev', name: undefined, status: 'already_member', enrollment: 'enrolled' }
    ]);
    expect(result.enrolled).toBe(1);
  });

  it('marks a joined student already in the course as already_enrolled', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' }
    ] as never);
    vi.mocked(getExistingGroupMembers).mockResolvedValue(new Set(['group-1:p-1']));

    const result = await importAudienceMembers(ORG, courseInvite('ada@test.dev'), ACTOR);

    expect(addGroupMembers).not.toHaveBeenCalled();
    expect(result.rows[0]).toMatchObject({ status: 'already_member', enrollment: 'already_enrolled' });
    expect(result.alreadyEnrolledInCourses).toBe(1);
  });
});
