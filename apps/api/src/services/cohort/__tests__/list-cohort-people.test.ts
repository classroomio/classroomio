import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getPaginatedCohortPeople: vi.fn(),
  getPaginatedInvitedCohortPeople: vi.fn()
}));
vi.mock('@cio/db/queries/course', () => ({ getCourseGroupIds: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ insertGroupMembersOnConflictDoNothing: vi.fn() }));
vi.mock('@cio/db/queries/auth', () => ({ getProfileById: vi.fn() }));
vi.mock('@cio/db/queries/organization', () => ({}));
vi.mock('@cio/db/drizzle', () => ({ db: {} }));
vi.mock('../../organization/student-limit', () => ({}));
vi.mock('../../organization/audience', () => ({ importAudienceMembers: vi.fn() }));
vi.mock('@cio/core/services/webhook/emit', () => ({}));
vi.mock('@api/services/product-events', () => ({ captureLearnersEnrolled: vi.fn() }));

import { getPaginatedCohortPeople, getPaginatedInvitedCohortPeople } from '@cio/db/queries/cohort';
import { listPaginatedCohortPeople } from '@api/services/cohort/cohort';

const COHORT_ID = 'cohort-1';
const BASE_QUERY = { page: 1, limit: 20, sortBy: 'name', sortOrder: 'asc' } as const;

const joinedPerson = {
  id: 'cohort-member-1',
  cohortId: COHORT_ID,
  profileId: 'profile-1',
  roleId: 3,
  email: 'joined@example.com',
  createdAt: '2026-11-01T00:00:00.000Z',
  profile: null,
  lastLoginAt: null
};

const invitedRow = {
  kind: 'org_invite',
  email: 'pending@example.com',
  cohortMemberId: null,
  orgInviteId: 'org-invite-1',
  roleId: 3,
  memberCreatedAt: null,
  inviteCreatedAt: '2026-11-20T12:00:00.000Z',
  inviteExpiresAt: '2099-01-01T00:00:00.000Z',
  courseIds: [],
  cohortIds: [COHORT_ID]
};

describe('listPaginatedCohortPeople', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPaginatedCohortPeople).mockResolvedValue({ items: [joinedPerson], total: 1 } as never);
    vi.mocked(getPaginatedInvitedCohortPeople).mockResolvedValue({ items: [invitedRow], total: 1 } as never);
  });

  it('lists invited people after the joined members', async () => {
    const result = await listPaginatedCohortPeople(COHORT_ID, { ...BASE_QUERY, roleId: 3 } as never);

    expect(result.items.map((person) => [person.email, person.membership, person.invitation?.status ?? null])).toEqual([
      ['joined@example.com', 'joined', null],
      ['pending@example.com', 'invited', 'pending']
    ]);
    expect(result.pagination).toMatchObject({ total: 2 });
    expect(getPaginatedCohortPeople).toHaveBeenCalledWith(
      COHORT_ID,
      expect.objectContaining({ membership: 'joined', offset: 0, limit: 20 })
    );
    expect(getPaginatedInvitedCohortPeople).toHaveBeenCalledWith(
      COHORT_ID,
      expect.objectContaining({ offset: 0, limit: 19, roleId: 3 })
    );
  });

  it('lists only joined members when asked for them', async () => {
    const result = await listPaginatedCohortPeople(COHORT_ID, { ...BASE_QUERY, membership: 'joined' } as never);

    expect(result.items.map((person) => person.email)).toEqual(['joined@example.com']);
    expect(getPaginatedInvitedCohortPeople).not.toHaveBeenCalled();
  });

  it('leaves invited people out when filtering by last login', async () => {
    await listPaginatedCohortPeople(COHORT_ID, { ...BASE_QUERY, lastLoginBefore: '30d' } as never);

    expect(getPaginatedInvitedCohortPeople).not.toHaveBeenCalled();
  });
});
