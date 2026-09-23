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

vi.mock('@cio/db/queries/learning-path', () => ({
  enrollMember: vi.fn(),
  getCourseIdsByLearningPathId: vi.fn().mockResolvedValue([]),
  getExistingPathMembers: vi.fn().mockResolvedValue(new Set()),
  getOrgLearningPathsByIds: vi.fn().mockResolvedValue([]),
  listLearningPaths: vi.fn().mockResolvedValue([])
}));

vi.mock('@api/services/learning-path/member-management', () => ({
  enrollProfileInLearningPath: vi.fn().mockResolvedValue({ id: 'path-member-1' })
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

import {
  createOrganizationInvites,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  getOrgMembersByProfileIds
} from '@cio/db/queries/organization';
import { getExistingPathMembers, getOrgLearningPathsByIds, listLearningPaths } from '@cio/db/queries/learning-path';
import { enrollProfileInLearningPath } from '@api/services/learning-path/member-management';
import { getRemainingStudentSeats } from '@api/services/organization/student-limit';
import { importAudienceMembers } from '@api/services/organization/audience';
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
      { id: 'path-1', name: 'Path One', autoEnroll: false, sequentialUnlock: false }
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
      { id: 'path-1', name: 'Path One', autoEnroll: false, sequentialUnlock: false },
      { id: 'path-2', name: 'Path Two', autoEnroll: false, sequentialUnlock: false }
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

  it('stores pathIds on the org invite for new emails so they enroll on acceptance', async () => {
    const result = await importAudienceMembers(ORG, pathImport(['new@test.dev'], ['path-1']), ACTOR);

    expect(result.imported).toBe(1);
    expect(vi.mocked(enrollProfileInLearningPath)).not.toHaveBeenCalled();
    expect(vi.mocked(createOrganizationInvites)).toHaveBeenCalledWith([
      expect.objectContaining({ metadata: expect.objectContaining({ pathIds: ['path-1'] }) })
    ]);
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
    vi.mocked(listLearningPaths).mockResolvedValue([
      { id: 'path-1', name: 'Path 1' },
      { id: 'path-2', name: 'Path 2' }
    ] as never);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([
      { id: 'path-1', name: 'Path 1', autoEnroll: false, sequentialUnlock: false },
      { id: 'path-2', name: 'Path 2', autoEnroll: false, sequentialUnlock: false }
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
