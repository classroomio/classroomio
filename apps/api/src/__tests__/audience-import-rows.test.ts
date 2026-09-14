import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  getOrganizationAudienceMember: vi.fn(),
  getLatestOrganizationInviteRowByOrgAndEmail: vi.fn(),
  getOrgMembersByProfileIds: vi.fn().mockResolvedValue([]),
  getOrganizationById: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn(),
  getStudentOrganizationMemberByOrgAndEmail: vi.fn(),
  hasActiveOrganizationInviteForEmail: vi.fn().mockResolvedValue(false),
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
  getCohortsByOrg: vi.fn().mockResolvedValue([]),
  getCourseIdsByCohortIds: vi.fn().mockResolvedValue([]),
  getExistingCohortMembers: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/db/queries/group', () => ({
  addGroupMembers: vi.fn(),
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
  notifyStudentMilestone: vi.fn()
}));

import { getOrganizationById, getOrganizationMembersByNormalizedEmails } from '@cio/db/queries/organization';
import { getRemainingStudentSeats } from '@api/services/organization/student-limit';
import { importAudienceMembers } from '@api/services/organization/audience';
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
