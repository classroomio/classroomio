import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({})) }
}));

vi.mock('@cio/core/services/organization/supersede-invites', () => ({
  supersedeStudentOrgInvites: vi.fn(
    async (
      _tx: unknown,
      input: { emails: string[]; add: { courseIds: string[]; cohortIds: string[]; pathIds: string[] } }
    ) => ({
      invites: input.emails.map((email: string, index: number) => ({
        email,
        inviteId: `invite-${index}`,
        token: `token-${index}`,
        expiresAt: '2026-03-01T00:00:00.000Z',
        courseIds: input.add.courseIds,
        cohortIds: input.add.cohortIds,
        pathIds: input.add.pathIds,
        accessNamesLabel: undefined,
        merged: false
      })),
      skipped: []
    })
  )
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
  createOrganizationMembers: vi.fn().mockResolvedValue([]),
  getActiveOrganizationInvitesByEmails: vi.fn().mockResolvedValue([]),
  getOrganizationAudienceMember: vi.fn(),
  getLatestOrganizationInviteRowByOrgAndEmail: vi.fn(),
  getOrgMembersByProfileIds: vi.fn().mockResolvedValue([]),
  getOrganizationById: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn(),
  getStudentOrganizationMemberByOrgAndEmail: vi.fn(),
  hasActiveOrganizationInviteForEmail: vi.fn().mockResolvedValue(false),
  lockOrganizationInviteEmails: vi.fn().mockResolvedValue(undefined),
  revokeActiveOrganizationInvitesByEmails: vi.fn().mockResolvedValue([]),
  revokeOrganizationInvitesByIds: vi.fn().mockResolvedValue([]),
  updateOrganizationAudienceMember: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseGroupIds: vi.fn().mockResolvedValue([]),
  getOrgCourseGroups: vi.fn().mockResolvedValue([]),
  getOrgCourses: vi.fn().mockResolvedValue([]),
  getEnrollOnlyInLearningPathCourses: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: vi.fn(),
  getCohortMemberByProfileId: vi.fn().mockResolvedValue({ id: 'cm-1', roleId: 3 }),
  getCohortsByOrg: vi.fn().mockResolvedValue([]),
  getCourseIdsByCohortIds: vi.fn().mockResolvedValue([]),
  getExistingCohortMembers: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/db/queries/group', () => ({
  addGroupMembers: vi.fn(),
  enrollUsersInCourseGroups: vi.fn().mockResolvedValue(undefined),
  getExistingGroupMembers: vi.fn().mockResolvedValue([]),
  getGroupMemberByGroupAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  enrollMember: vi.fn(),
  getCourseIdsInPath: vi.fn().mockResolvedValue([]),
  getExistingPathMembers: vi.fn().mockResolvedValue(new Set()),
  getOrgLearningPathsByIds: vi.fn().mockResolvedValue([]),
  grantCourseAccess: vi.fn(),
  listLearningPaths: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } })
}));

vi.mock('@api/services/learning-path/member-management', () => ({
  enrollProfileInLearningPath: vi.fn().mockResolvedValue({ id: 'path-member-1' })
}));

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn().mockResolvedValue({ createdCount: 0 })
}));

vi.mock('@api/services/course/enrollment-grants', () => ({
  recordDirectCourseGrant: vi.fn().mockResolvedValue(undefined),
  recordDirectCourseGrantsBulk: vi.fn().mockResolvedValue(0)
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

vi.mock('@api/services/course/path-gate', () => ({
  assertCourseAllowsDirectStudentAdd: vi.fn().mockResolvedValue(undefined),
  filterOutPathOnlyCourseIds: vi.fn(async (courseIds: string[]) => ({
    allowedCourseIds: courseIds,
    skippedPathOnlyCourseIds: []
  }))
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn().mockResolvedValue(null),
  getRemainingStudentSeats: vi.fn().mockResolvedValue(Number.POSITIVE_INFINITY),
  notifyStudentMilestone: vi.fn()
}));

import { db } from '@cio/db/drizzle';
import { getProfilesByEmails } from '@cio/db/queries/auth';
import { addCohortMember } from '@cio/db/queries/cohort';
import { supersedeStudentOrgInvites } from '@cio/core/services/organization/supersede-invites';
import {
  createOrganizationInviteAudits,
  createOrganizationInvites,
  createOrganizationMembers,
  getActiveOrganizationInvitesByEmails,
  getLatestOrganizationInviteRowByOrgAndEmail,
  getOrganizationAudienceMember,
  revokeOrganizationInvitesByIds,
  updateOrganizationAudienceMember,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  getOrgMembersByProfileIds,
  getStudentOrganizationMemberByOrgAndEmail
} from '@cio/db/queries/organization';
import {
  getExistingPathMembers,
  getOrgLearningPathsByIds,
  grantCourseAccess,
  listLearningPaths
} from '@cio/db/queries/learning-path';
import { getCourseIdsByCohortIds, getExistingCohortMembers } from '@cio/db/queries/cohort';
import { getCourseGroupIds } from '@cio/db/queries/course';
import { getGroupMemberByGroupAndProfile } from '@cio/db/queries/group';
import { getOrgCourses, getOrgCourseGroups, getEnrollOnlyInLearningPathCourses } from '@cio/db/queries/course';
import { getCohortsByOrg } from '@cio/db/queries/cohort';
import { recordDirectCourseGrantsBulk } from '@api/services/course/enrollment-grants';
import { addGroupMembers, getExistingGroupMembers } from '@cio/db/queries/group';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { enrollProfileInLearningPath } from '@api/services/learning-path/member-management';
import { getRemainingStudentSeats } from '@api/services/organization/student-limit';
import {
  importAudienceMembers,
  resendAudienceInvite,
  updatePendingAudienceMemberEmail
} from '@api/services/organization/audience';
import { ROLE } from '@cio/utils/constants';
import { membershipKey } from '@cio/utils/functions';

const ORG = 'org-1';
const ACTOR = 'actor-1';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrganizationById).mockResolvedValue({ id: ORG, siteName: 'acme' } as never);
  vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([]);
  vi.mocked(getRemainingStudentSeats).mockResolvedValue(Number.POSITIVE_INFINITY);
});

function csv(...lines: string[]) {
  return { recipientCsv: lines.join('\n'), sendEmail: false } as never;
}

describe('importAudienceMembers — one bad row does not fail the batch', () => {
  it('reports a malformed address per row and imports the rest', async () => {
    const result = await importAudienceMembers(ORG, csv('email', 'ada@test.dev', 'broken', 'grace@test.dev'), ACTOR);

    expect(result.rows.map((row) => row.status)).toEqual(['ready', 'invalid_email', 'ready']);
    expect(result.imported).toBe(2);
  });

  it('reports a staff address rather than rejecting the file', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'admin@test.dev', profileId: 'p-admin', roleId: ROLE.ADMIN }
    ] as never);

    const result = await importAudienceMembers(ORG, csv('email', 'ada@test.dev', 'admin@test.dev'), ACTOR);

    expect(result.rows).toEqual([
      { email: 'ada@test.dev', name: undefined, status: 'ready' },
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
      { email: 'ada@test.dev', name: 'Ada Lovelace', status: 'ready' },
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

describe('importAudienceMembers — learning paths', () => {
  const pathImport = (emails: string[], pathIds: string[]) =>
    ({
      recipientCsv: ['email', ...emails].join('\n'),
      pathIds,
      sendEmail: false
    }) as never;

  beforeEach(() => {
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([
      { id: 'path-1', name: 'Path One', sequentialUnlock: false }
    ] as never);
    vi.mocked(getExistingPathMembers).mockResolvedValue(new Set());
  });

  it('enrolls existing student profiles into paths as STUDENT without creating pending rows', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' }
    ] as never);

    const result = await importAudienceMembers(ORG, pathImport(['ada@test.dev'], ['path-1']), ACTOR);

    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'path-1' }),
      expect.objectContaining({ profileId: 'p-1', roleId: ROLE.STUDENT })
    );
    expect(vi.mocked(ensureComplianceEnrollmentRecordsForProfiles)).toHaveBeenCalledWith([], ['p-1']);
    expect(result.enrolled).toBe(1);
  });

  it('skips enrolling an existing student who is already a member of the path', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' }
    ] as never);
    vi.mocked(getExistingPathMembers).mockResolvedValue(new Set([membershipKey('path-1', 'p-1')]));

    const result = await importAudienceMembers(ORG, pathImport(['ada@test.dev'], ['path-1']), ACTOR);

    expect(vi.mocked(getExistingPathMembers)).toHaveBeenCalledWith([{ learningPathId: 'path-1', profileId: 'p-1' }]);
    expect(vi.mocked(enrollProfileInLearningPath)).not.toHaveBeenCalled();
    expect(result.enrolled).toBe(0);
  });

  it('handles a mixed batch where some students are already enrolled and others are not', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT },
      { normalizedEmail: 'grace@test.dev', profileId: 'p-2', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' },
      { profileId: 'p-2', roleId: ROLE.STUDENT, email: 'grace@test.dev' }
    ] as never);
    // ada (p-1) is already enrolled, grace (p-2) is not
    vi.mocked(getExistingPathMembers).mockResolvedValue(new Set([membershipKey('path-1', 'p-1')]));

    const result = await importAudienceMembers(ORG, pathImport(['ada@test.dev', 'grace@test.dev'], ['path-1']), ACTOR);

    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'path-1' }),
      expect.objectContaining({ profileId: 'p-2', roleId: ROLE.STUDENT })
    );
    expect(result.enrolled).toBe(1);
  });

  it('does not enroll organization staff (ADMIN or TUTOR) as students into learning paths', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'admin@test.dev', profileId: 'p-admin', roleId: ROLE.ADMIN },
      { normalizedEmail: 'tutor@test.dev', profileId: 'p-tutor', roleId: ROLE.TUTOR }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-admin', roleId: ROLE.ADMIN, email: 'admin@test.dev' },
      { profileId: 'p-tutor', roleId: ROLE.TUTOR, email: 'tutor@test.dev' }
    ] as never);

    const result = await importAudienceMembers(
      ORG,
      pathImport(['admin@test.dev', 'tutor@test.dev'], ['path-1']),
      ACTOR
    );

    expect(vi.mocked(enrollProfileInLearningPath)).not.toHaveBeenCalled();
    expect(result.enrolled).toBe(0);
  });

  it('enrolls an existing student into multiple learning paths at once', async () => {
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([
      { id: 'path-1', name: 'Path One', sequentialUnlock: false },
      { id: 'path-2', name: 'Path Two', sequentialUnlock: false }
    ] as never);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' }
    ] as never);

    const result = await importAudienceMembers(ORG, pathImport(['ada@test.dev'], ['path-1', 'path-2']), ACTOR);

    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'path-1' }),
      expect.objectContaining({ profileId: 'p-1', roleId: ROLE.STUDENT })
    );
    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'path-2' }),
      expect.objectContaining({ profileId: 'p-1', roleId: ROLE.STUDENT })
    );
    expect(result.enrolled).toBe(2);
  });

  it('enrolls every student-path pair in a multi-student multi-path batch', async () => {
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([
      { id: 'path-1', name: 'Path One', sequentialUnlock: false },
      { id: 'path-2', name: 'Path Two', sequentialUnlock: false }
    ] as never);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT },
      { normalizedEmail: 'grace@test.dev', profileId: 'p-2', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' },
      { profileId: 'p-2', roleId: ROLE.STUDENT, email: 'grace@test.dev' }
    ] as never);

    const result = await importAudienceMembers(
      ORG,
      pathImport(['ada@test.dev', 'grace@test.dev'], ['path-1', 'path-2']),
      ACTOR
    );

    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledTimes(4);

    for (const pathId of ['path-1', 'path-2']) {
      for (const profileId of ['p-1', 'p-2']) {
        expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledWith(
          expect.objectContaining({ id: pathId }),
          expect.objectContaining({ profileId, roleId: ROLE.STUDENT })
        );
      }
    }

    expect(result.enrolled).toBe(4);
  });

  it('stores pathIds on the org invite for new emails so they enroll on acceptance', async () => {
    const result = await importAudienceMembers(ORG, pathImport(['new@test.dev'], ['path-1']), ACTOR);

    expect(result.imported).toBe(1);
    expect(vi.mocked(enrollProfileInLearningPath)).not.toHaveBeenCalled();
    const { supersedeStudentOrgInvites } = await import('@cio/core/services/organization/supersede-invites');
    expect(vi.mocked(supersedeStudentOrgInvites)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        orgId: ORG,
        emails: ['new@test.dev'],
        source: 'AUDIENCE_IMPORT',
        add: expect.objectContaining({ pathIds: ['path-1'] })
      })
    );
  });

  it('drops pathIds that do not belong to the organization', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' }
    ] as never);

    const result = await importAudienceMembers(ORG, pathImport(['ada@test.dev'], ['path-1', 'bogus']), ACTOR);

    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'path-1' }),
      expect.anything()
    );
    expect(result.enrolled).toBe(1);
  });

  it('resolves all organization paths when allPaths is true', async () => {
    vi.mocked(listLearningPaths).mockResolvedValue({
      data: [
        { id: 'path-1', name: 'Path 1' },
        { id: 'path-2', name: 'Path 2' }
      ],
      pagination: { page: 1, limit: 2, total: 2, totalPages: 1 }
    } as never);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([
      { id: 'path-1', name: 'Path 1', sequentialUnlock: false },
      { id: 'path-2', name: 'Path 2', sequentialUnlock: false }
    ] as never);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' }
    ] as never);

    const result = await importAudienceMembers(
      ORG,
      {
        recipientCsv: ['email', 'ada@test.dev'].join('\n'),
        allPaths: true,
        sendEmail: false
      } as never,
      ACTOR
    );

    expect(vi.mocked(listLearningPaths)).toHaveBeenCalledWith(ORG);
    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledTimes(2);
    expect(result.enrolled).toBe(2);
  });
});

describe('importAudienceMembers — path-only courses', () => {
  const pathOnlyImport = {
    recipientCsv: ['email', 'ada@test.dev'].join('\n'),
    courseIds: ['c-direct', 'c-path-only'],
    sendEmail: false
  } as never;

  beforeEach(() => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' }
    ] as never);
    vi.mocked(getOrgCourses).mockResolvedValue({
      items: [
        { id: 'c-direct', title: 'Direct Course' },
        { id: 'c-path-only', title: 'Path-only Course' }
      ],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1
    } as never);
    vi.mocked(getEnrollOnlyInLearningPathCourses).mockResolvedValue([{ id: 'c-path-only', title: 'Path-only Course' }]);
    vi.mocked(getExistingGroupMembers).mockResolvedValue(new Set() as never);
    vi.mocked(getOrgCourseGroups).mockResolvedValue([
      { groupId: 'g-direct', courseId: 'c-direct', courseTitle: 'Direct Course', welcomeEmailMessage: null }
    ] as never);
  });

  it('skips direct assignment into path-only courses but still assigns the rest', async () => {
    const result = await importAudienceMembers(ORG, pathOnlyImport, ACTOR);

    expect(vi.mocked(addGroupMembers)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(addGroupMembers)).toHaveBeenCalledWith(
      [expect.objectContaining({ groupId: 'g-direct', profileId: 'p-1', roleId: ROLE.STUDENT })],
      expect.anything()
    );
    expect(vi.mocked(ensureComplianceEnrollmentRecordsForProfiles)).toHaveBeenCalledWith(['c-direct'], ['p-1']);
    expect(vi.mocked(recordDirectCourseGrantsBulk)).toHaveBeenCalledWith(
      expect.objectContaining({
        groupIds: ['g-direct'],
        profileIds: ['p-1'],
        courseIds: ['c-direct'],
        source: 'ORG_AUDIENCE'
      }),
      expect.anything()
    );
    expect(result.assigned).toBe(1);
    expect(result.skippedPathOnlyCourses).toEqual(['c-path-only']);
    expect(result.skippedPathOnlyCourseNames).toEqual(['Path-only Course']);
  });

  it('reports no skips when every course accepts direct enrollment', async () => {
    vi.mocked(getEnrollOnlyInLearningPathCourses).mockResolvedValue([]);

    const result = await importAudienceMembers(ORG, pathOnlyImport, ACTOR);

    expect(result.skippedPathOnlyCourses).toEqual([]);
    expect(result.skippedPathOnlyCourseNames).toEqual([]);
  });
});

describe('importAudienceMembers — cohort provenance', () => {
  beforeEach(() => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'ada@test.dev', profileId: 'p-1', roleId: ROLE.STUDENT }
    ] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-1', roleId: ROLE.STUDENT, email: 'ada@test.dev' }
    ] as never);
    vi.mocked(getCohortsByOrg).mockResolvedValue([{ id: 'cohort-1', name: 'Cohort One' }] as never);
    vi.mocked(getExistingCohortMembers).mockResolvedValue(new Set() as never);
    vi.mocked(getCourseIdsByCohortIds).mockResolvedValue(['c-1']);
    vi.mocked(getCourseGroupIds).mockResolvedValue([{ courseId: 'c-1', groupId: 'g-1' }]);
    vi.mocked(getGroupMemberByGroupAndProfile).mockResolvedValue({ id: 'gm-1', roleId: 3 });
  });

  it('records COHORT grants when assigning students through cohorts', async () => {
    const result = await importAudienceMembers(
      ORG,
      { recipientCsv: ['email', 'ada@test.dev'].join('\n'), cohortIds: ['cohort-1'], sendEmail: false } as never,
      ACTOR
    );

    expect(vi.mocked(grantCourseAccess)).toHaveBeenCalledWith(
      expect.objectContaining({
        groupmemberId: 'gm-1',
        courseId: 'c-1',
        profileId: 'p-1',
        source: 'COHORT',
        cohortId: 'cohort-1'
      }),
      expect.anything()
    );
    expect(result.assigned).toBe(1);
  });
});

describe('importAudienceMembers — new emails that already have a profile', () => {
  beforeEach(() => {
    vi.mocked(getProfilesByEmails).mockResolvedValue([{ id: 'p-new', email: 'new@test.dev' }] as never);
    vi.mocked(getOrgMembersByProfileIds).mockResolvedValue([
      { profileId: 'p-new', roleId: ROLE.STUDENT, email: 'new@test.dev' }
    ] as never);
    vi.mocked(getCohortsByOrg).mockResolvedValue([{ id: 'cohort-1', name: 'Cohort One' }] as never);
    vi.mocked(getExistingCohortMembers).mockResolvedValue(new Set() as never);
    vi.mocked(getCourseIdsByCohortIds).mockResolvedValue([]);
  });

  it('links the existing profile on the new org row inside the import transaction', async () => {
    await importAudienceMembers(ORG, csv('email', 'new@test.dev'), ACTOR);

    expect(vi.mocked(createOrganizationMembers)).toHaveBeenCalledWith(
      [expect.objectContaining({ email: 'new@test.dev', profileId: 'p-new', roleId: ROLE.STUDENT })],
      expect.anything()
    );
  });

  it('enrolls the linked profile into the requested cohort', async () => {
    const result = await importAudienceMembers(
      ORG,
      { recipientCsv: ['email', 'new@test.dev'].join('\n'), cohortIds: ['cohort-1'], sendEmail: false } as never,
      ACTOR
    );

    expect(vi.mocked(addCohortMember)).toHaveBeenCalledWith(
      expect.objectContaining({ cohortId: 'cohort-1', profileId: 'p-new', roleId: ROLE.STUDENT }),
      expect.anything()
    );
    expect(result.imported).toBe(1);
  });

  it('a failure while creating invites rolls the member rows back with it', async () => {
    const insideTransaction = vi.fn();
    vi.mocked(db.transaction).mockImplementationOnce((async (callback: (tx: unknown) => unknown) => {
      insideTransaction();
      return callback({});
    }) as never);
    vi.mocked(supersedeStudentOrgInvites).mockRejectedValueOnce(new Error('invite insert failed'));

    await expect(importAudienceMembers(ORG, csv('email', 'new@test.dev'), ACTOR)).rejects.toThrow(
      'invite insert failed'
    );

    // Member rows and invites share one transaction, so the rejection is a rollback;
    // nothing after it (cohorts, paths, emails) runs.
    expect(insideTransaction).toHaveBeenCalledOnce();
    expect(vi.mocked(createOrganizationMembers)).toHaveBeenCalledOnce();
    expect(vi.mocked(addCohortMember)).not.toHaveBeenCalled();
  });
});

describe('updatePendingAudienceMemberEmail', () => {
  const studentInvite = (id: string, metadata: unknown) => ({
    id,
    roleId: ROLE.STUDENT,
    email: 'old@test.dev',
    metadata
  });

  beforeEach(() => {
    vi.mocked(getOrganizationAudienceMember).mockResolvedValue({
      id: 9,
      email: 'old@test.dev',
      profileId: null
    } as never);
    vi.mocked(updateOrganizationAudienceMember).mockResolvedValue({ id: 9, email: 'new@test.dev' } as never);
    vi.mocked(getLatestOrganizationInviteRowByOrgAndEmail).mockResolvedValue(null);
    vi.mocked(getActiveOrganizationInvitesByEmails).mockImplementation(async (_orgId: string, emails: string[]) =>
      emails[0] === 'old@test.dev'
        ? ([
            studentInvite('inv-course', { courseIds: ['c-1'] }),
            studentInvite('inv-path', { pathIds: ['p-1'] }),
            { id: 'inv-staff', roleId: ROLE.TUTOR, email: 'old@test.dev', metadata: {} }
          ] as never)
        : []
    );
  });

  it("carries every live invite's resources to the new address and revokes only the student invites", async () => {
    await updatePendingAudienceMemberEmail(ORG, 9, { email: 'New@Test.dev', sendEmail: false }, ACTOR);

    expect(vi.mocked(supersedeStudentOrgInvites)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        emails: ['new@test.dev'],
        add: { courseIds: ['c-1'], cohortIds: [], pathIds: ['p-1'] }
      })
    );
    expect(vi.mocked(revokeOrganizationInvitesByIds)).toHaveBeenCalledWith(
      ['inv-course', 'inv-path'],
      ACTOR,
      expect.anything()
    );
    expect(vi.mocked(createOrganizationInviteAudits)).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ inviteId: 'inv-course', eventType: 'REVOKED' }),
        expect.objectContaining({ inviteId: 'inv-path', eventType: 'REVOKED' })
      ]),
      expect.anything()
    );
  });

  it("also carries an expired latest invite's resources", async () => {
    vi.mocked(getLatestOrganizationInviteRowByOrgAndEmail).mockResolvedValue({
      metadata: { cohortIds: ['co-1'] }
    } as never);

    await updatePendingAudienceMemberEmail(ORG, 9, { email: 'new@test.dev', sendEmail: false }, ACTOR);

    expect(vi.mocked(supersedeStudentOrgInvites)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ add: { courseIds: ['c-1'], cohortIds: ['co-1'], pathIds: ['p-1'] } })
    );
  });

  it('rejects an address that already has a staff invite, changing nothing', async () => {
    vi.mocked(getActiveOrganizationInvitesByEmails).mockResolvedValue([
      { id: 'inv-staff', roleId: ROLE.TUTOR, email: 'new@test.dev', metadata: {} }
    ] as never);

    await expect(
      updatePendingAudienceMemberEmail(ORG, 9, { email: 'new@test.dev', sendEmail: false }, ACTOR)
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(vi.mocked(updateOrganizationAudienceMember)).not.toHaveBeenCalled();
    expect(vi.mocked(revokeOrganizationInvitesByIds)).not.toHaveBeenCalled();
  });

  it('a failure while creating the new invite rolls the email change back with it', async () => {
    vi.mocked(supersedeStudentOrgInvites).mockRejectedValueOnce(new Error('invite insert failed'));

    await expect(
      updatePendingAudienceMemberEmail(ORG, 9, { email: 'new@test.dev', sendEmail: false }, ACTOR)
    ).rejects.toThrow('invite insert failed');

    // The member update ran inside the same transaction that rejected.
    expect(vi.mocked(updateOrganizationAudienceMember)).toHaveBeenCalledWith(
      ORG,
      9,
      { email: 'new@test.dev', verified: false },
      expect.anything()
    );
    expect(vi.mocked(revokeOrganizationInvitesByIds)).not.toHaveBeenCalled();
  });
});

describe('resendAudienceInvite', () => {
  it('loads every course on the invite, not just the first page of 20', async () => {
    const courseIds = Array.from({ length: 25 }, (_, index) => `c-${index}`);
    vi.mocked(getStudentOrganizationMemberByOrgAndEmail).mockResolvedValue({
      email: 'p@test.dev',
      profileId: null
    } as never);
    vi.mocked(getLatestOrganizationInviteRowByOrgAndEmail).mockResolvedValue({ metadata: { courseIds } } as never);
    vi.mocked(getOrgCourses).mockResolvedValue({ items: [], total: 0, page: 1, limit: 25, totalPages: 0 } as never);

    await resendAudienceInvite(ORG, { email: 'p@test.dev' } as never, ACTOR);

    expect(vi.mocked(getOrgCourses)).toHaveBeenCalledWith({ orgId: ORG, courseIds, limit: 25 });
  });

  it('returns 409 when an active staff invite covers the address', async () => {
    vi.mocked(getStudentOrganizationMemberByOrgAndEmail).mockResolvedValue({
      email: 'p@test.dev',
      profileId: null
    } as never);
    vi.mocked(getLatestOrganizationInviteRowByOrgAndEmail).mockResolvedValue(null);
    vi.mocked(supersedeStudentOrgInvites).mockResolvedValueOnce({
      invites: [],
      skipped: [{ email: 'p@test.dev', reason: 'STAFF_INVITE' }]
    } as never);

    await expect(resendAudienceInvite(ORG, { email: 'p@test.dev' } as never, ACTOR)).rejects.toMatchObject({
      statusCode: 409
    });
  });
});
