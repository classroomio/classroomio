import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortById: vi.fn(),
  getCohortMemberRole: vi.fn(),
  isOrgAdminByCohortId: vi.fn()
}));
vi.mock('@api/services/organization/audience', () => ({}));

import { getCohortMemberRole, isOrgAdminByCohortId } from '@cio/db/queries/cohort';
import { scopeCohortPeopleQueryToViewer } from '@api/services/cohort/invite';
import { ROLE } from '@cio/utils/constants';

const QUERY: { page: number; limit: number; membership?: 'joined' | 'invited' } = { page: 1, limit: 20 };

describe('scopeCohortPeopleQueryToViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
  });

  it('keeps the query as asked for a cohort tutor', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR as never);

    await expect(scopeCohortPeopleQueryToViewer('cohort-1', 'tutor-1', QUERY)).resolves.toEqual(QUERY);
  });

  it('keeps the query as asked for an organization admin outside the cohort', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(null as never);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(true);

    await expect(
      scopeCohortPeopleQueryToViewer('cohort-1', 'admin-1', { ...QUERY, membership: 'invited' as const })
    ).resolves.toEqual({ ...QUERY, membership: 'invited' });
  });

  it('limits a cohort student to joined members', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT as never);

    await expect(scopeCohortPeopleQueryToViewer('cohort-1', 'student-1', QUERY)).resolves.toEqual({
      ...QUERY,
      membership: 'joined'
    });
  });

  it('refuses invited people to a cohort student', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT as never);

    await expect(
      scopeCohortPeopleQueryToViewer('cohort-1', 'student-1', { ...QUERY, membership: 'invited' as const })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
