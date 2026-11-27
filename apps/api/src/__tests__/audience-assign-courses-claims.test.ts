import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/services/webhook/emit', () => ({
  emitCohortMemberWebhookEvent: vi.fn(),
  emitCourseWebhookEvent: vi.fn(),
  emitOrganizationMemberWebhookEvent: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  addGroupMembers: vi.fn(),
  claimEmailOnlyGroupMembersForGroups: vi.fn(),
  enrollUsersInCourseGroups: vi.fn(),
  getExistingGroupMembers: vi.fn()
}));

vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: vi.fn(),
  claimEmailOnlyCohortMembersForCohorts: vi.fn(),
  getCohortsByOrg: vi.fn(),
  getCourseIdsByCohortIds: vi.fn(),
  getExistingCohortMembers: vi.fn()
}));

vi.mock('@cio/core/services/organization/supersede-invites', () => ({
  getStaffInvitedEmails: vi.fn().mockResolvedValue(new Set()),
  supersedeStudentOrgInvites: vi.fn(async (_dbClient: unknown, params: { orgId: string; emails: string[] }) => {
    const { createOrganizationInvites } = await import('@cio/db/queries/organization');
    const invitedByProfileId = (params as { invitedByProfileId?: string }).invitedByProfileId ?? 'actor-1';
    const created = await createOrganizationInvites(
      params.emails.map((email: string) => ({
        organizationId: params.orgId,
        roleId: 3,
        email,
        tokenHash: `mock-hash-${email}`,
        createdByProfileId: invitedByProfileId,
        expiresAt: new Date().toISOString(),
        isRevoked: false,
        metadata: {}
      })) as never,
      _dbClient as never
    );
    return {
      revoked: [],
      created,
      inviteByEmail: new Map(
        (created as { id: string; email: string }[]).map((invite) => [(invite.email ?? '').toLowerCase(), invite])
      ),
      tokenByEmail: new Map(params.emails.map((email: string) => [email.toLowerCase(), `mock-token-${email}`])),
      unchanged: [],
      addedCourseIdsByEmail: new Map(),
      removedCourseIdsByEmail: new Map(),
      skippedStaff: [] as string[]
    };
  })
}));

vi.mock('@cio/db/queries/organization', () => ({
  createOrganizationInvite: vi.fn(),
  createOrganizationInvites: vi.fn(),
  createOrganizationMembers: vi.fn(),
  getBulkAudienceMembersByIds: vi.fn().mockResolvedValue([]),
  getOrganizationAudienceMember: vi.fn(),
  getLatestOrganizationInviteMetadataByEmails: vi.fn(),
  getLatestOrganizationInviteRowByOrgAndEmail: vi.fn(),
  getOrgMembersByProfileIds: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn(),
  getStudentOrganizationMemberByOrgAndEmail: vi.fn(),
  hasActiveOrganizationInviteForEmail: vi.fn(),
  hasLapsedStudentInvite: vi.fn(),
  revokeActiveOrganizationInvitesByEmails: vi.fn(),
  updateOrganizationAudienceMember: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseGroupIds: vi.fn(),
  getOrgCourseGroups: vi.fn(),
  getOrgCourses: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({ getProfilesByEmails: vi.fn() }));

vi.mock('@api/services/organization/invite', () => ({ recordOrganizationInviteAudits: vi.fn() }));
vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn(),
  getRemainingStudentSeats: vi.fn(),
  notifyStudentMilestone: vi.fn()
}));
vi.mock('@api/services/course/compliance', () => ({ ensureComplianceEnrollmentRecordsForProfiles: vi.fn() }));
vi.mock('@api/services/course/session-invite', () => ({ getWelcomeSessionIcs: vi.fn() }));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));
vi.mock('@api/services/product-events', () => ({ captureLearnerInvited: vi.fn(), captureLearnersEnrolled: vi.fn() }));
vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@cio/core/config/dashboard-url', () => ({ getDashboardBaseUrl: vi.fn(() => 'https://acme.classroomio.com') }));
vi.mock('@cio/email', () => ({
  buildEmailBranding: vi.fn(() => ({ name: 'Acme' })),
  buildEmailFromName: vi.fn((name: string) => name)
}));
vi.mock('@cio/db/drizzle', () => ({ db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run({})) } }));

import { ROLE } from '@cio/utils/constants';
import { addGroupMembers, claimEmailOnlyGroupMembersForGroups, getExistingGroupMembers } from '@cio/db/queries/group';
import { getOrgCourseGroups } from '@cio/db/queries/course';
import {
  createOrganizationInvites,
  getBulkAudienceMembersByIds,
  getOrgMembersByProfileIds,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails
} from '@cio/db/queries/organization';
import { supersedeStudentOrgInvites } from '@cio/core/services/organization/supersede-invites';
import { getRemainingStudentSeats } from '@api/services/organization/student-limit';
import { assignAudienceToCourses } from '@api/services/organization/audience';

const ORG_ID = 'org-1';
const PROFILE_ID = 'profile-1';
const EMAIL = 'learner@example.com';
const GROUP_ID = 'group-1';

describe('assignAudienceToCourses with an email-only course membership', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getOrganizationById).mockResolvedValue({ id: ORG_ID, name: 'Acme', siteName: 'acme' } as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: PROFILE_ID, email: EMAIL, roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgCourseGroups).mockResolvedValue([
      { groupId: GROUP_ID, courseId: 'course-1', courseTitle: 'Intro', welcomeEmailMessage: null }
    ] as never);
    vi.mocked(getExistingGroupMembers).mockResolvedValue(new Set([`${GROUP_ID}:${PROFILE_ID}`]));
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(Number.POSITIVE_INFINITY);
    vi.mocked(createOrganizationInvites).mockImplementation(async (rows) =>
      (rows as { email: string }[]).map((row, index) => ({ id: `invite-${index}`, email: row.email }) as never)
    );
  });

  it('claims the email-only row before dedupe and reports it as already enrolled', async () => {
    const result = await assignAudienceToCourses(
      ORG_ID,
      { profileIds: [PROFILE_ID], courseIds: ['course-1'], sendEmail: false } as never,
      'dashboard',
      null
    );

    expect(claimEmailOnlyGroupMembersForGroups).toHaveBeenCalledWith(
      [GROUP_ID],
      [{ profileId: PROFILE_ID, email: EMAIL }]
    );
    expect(addGroupMembers).not.toHaveBeenCalled();
    expect(result).toEqual({
      assigned: 0,
      alreadyEnrolled: 1,
      invited: 0,
      emailsSent: 0,
      details: [{ profileId: PROFILE_ID, status: 'already_enrolled' }]
    });
  });

  it('only inserts the memberships that were not claimed', async () => {
    vi.mocked(getExistingGroupMembers).mockResolvedValue(new Set());
    vi.mocked(addGroupMembers).mockResolvedValue([
      { id: 'membership-1', groupId: GROUP_ID, profileId: PROFILE_ID, roleId: ROLE.STUDENT }
    ] as never);

    const result = await assignAudienceToCourses(
      ORG_ID,
      { profileIds: [PROFILE_ID], courseIds: ['course-1'], sendEmail: false } as never,
      'dashboard',
      null
    );

    expect(addGroupMembers).toHaveBeenCalledWith([
      { groupId: GROUP_ID, roleId: ROLE.STUDENT, profileId: PROFILE_ID, email: EMAIL }
    ]);
    expect(result).toEqual({
      assigned: 1,
      alreadyEnrolled: 0,
      invited: 0,
      emailsSent: 0,
      details: [{ profileId: PROFILE_ID, status: 'enrolled' }]
    });
  });

  it('routes a pending member through the org invite instead of writing a course row', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      {
        normalizedEmail: 'pending@example.com',
        profileId: null,
        roleId: ROLE.STUDENT,
        status: 'ACTIVE',
        hasLapsedInvite: false
      }
    ] as never);

    const result = await assignAudienceToCourses(
      ORG_ID,
      { profileIds: [], emails: ['pending@example.com'], courseIds: ['course-1'], sendEmail: false } as never,
      'dashboard',
      'actor-1'
    );

    expect(supersedeStudentOrgInvites).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ orgId: ORG_ID, emails: ['pending@example.com'], courseIds: ['course-1'] })
    );
    expect(addGroupMembers).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      assigned: 0,
      alreadyEnrolled: 0,
      invited: 1,
      details: expect.arrayContaining([{ email: 'pending@example.com', status: 'invited' }])
    });
  });

  it('resolves a pending member by memberId', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([
      { id: 7, profileId: null, email: 'byid@example.com', status: 'ACTIVE' }
    ] as never);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      {
        normalizedEmail: 'byid@example.com',
        profileId: null,
        roleId: ROLE.STUDENT,
        status: 'ACTIVE',
        hasLapsedInvite: false
      }
    ] as never);

    const result = await assignAudienceToCourses(
      ORG_ID,
      { profileIds: [], memberIds: [7], courseIds: ['course-1'], sendEmail: false } as never,
      'dashboard',
      'actor-1'
    );

    expect(result).toMatchObject({ invited: 1 });
    expect(result.details).toEqual(expect.arrayContaining([{ email: 'byid@example.com', status: 'invited' }]));
  });

  it('reports staff, archived, unknown and over-limit rows per row', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([]);
    vi.mocked(getRemainingStudentSeats).mockResolvedValue(0);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockImplementation(async (_orgId, emails) => {
      const directory: Record<string, unknown> = {
        'staff@example.com': {
          normalizedEmail: 'staff@example.com',
          profileId: 'p-staff',
          roleId: ROLE.TUTOR,
          status: 'ACTIVE',
          hasLapsedInvite: false
        },
        'archived@example.com': {
          normalizedEmail: 'archived@example.com',
          profileId: 'p-arch',
          roleId: ROLE.STUDENT,
          status: 'ARCHIVED',
          hasLapsedInvite: false
        },
        'lapsed@example.com': {
          normalizedEmail: 'lapsed@example.com',
          profileId: null,
          roleId: ROLE.STUDENT,
          status: 'ACTIVE',
          hasLapsedInvite: true
        }
      };
      return (emails as string[]).flatMap((email) => (directory[email] ? [directory[email]] : [])) as never;
    });

    const result = await assignAudienceToCourses(
      ORG_ID,
      {
        profileIds: [],
        emails: ['staff@example.com', 'archived@example.com', 'ghost@example.com', 'lapsed@example.com'],
        courseIds: ['course-1'],
        sendEmail: false
      } as never,
      'dashboard',
      'actor-1'
    );

    expect(result).toMatchObject({ assigned: 0, alreadyEnrolled: 0, invited: 0 });
    expect(result.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: 'staff@example.com', status: 'is_staff' }),
        expect.objectContaining({ email: 'archived@example.com', status: 'archived' }),
        expect.objectContaining({ email: 'ghost@example.com', status: 'not_found' }),
        expect.objectContaining({ email: 'lapsed@example.com', status: 'over_seat_limit' })
      ])
    );
    expect(supersedeStudentOrgInvites).not.toHaveBeenCalled();
  });
});
