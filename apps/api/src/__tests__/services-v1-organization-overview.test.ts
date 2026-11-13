import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn()
}));

vi.mock('@api/services/dash', () => ({
  getOrganizationOverview: vi.fn(),
  getStudentLoginActivity: vi.fn()
}));

vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn(async (key: string, _ttl: number, compute: () => Promise<unknown>) => ({
    data: await compute(),
    generatedAt: key.includes(':loginActivity:') ? '2026-09-27T09:00:00.000Z' : '2026-09-27T10:00:00.000Z'
  }))
}));

import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getOrganizationOverview, getStudentLoginActivity } from '@api/services/dash';
import { getPublicApiOrganizationOverviewService } from '@api/services/v1/organization/overview';
import { cachedRead } from '@api/utils/redis/cached-read';
import { ROLE } from '@cio/utils/constants';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';

const overviewQuery = (include: string[], overrides: Partial<{ days: number; limit: number }> = {}) =>
  ({ include, days: 30, limit: 5, ...overrides }) as never;

const rows = (count: number) => Array.from({ length: count }, (_, index) => ({ id: index }));

describe('public API organization overview service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrganizationOverview).mockResolvedValue({
      totalStudents: 9,
      topCourses: [],
      recentCertifications: []
    } as never);
    vi.mocked(getStudentLoginActivity).mockResolvedValue([]);
  });

  it('returns only the requested sections, keyed by section, with the oldest generatedAt', async () => {
    const result = await getPublicApiOrganizationOverviewService(
      ORG_ID,
      ACTOR_ID,
      overviewQuery(['summary', 'loginActivity'])
    );

    expect(Object.keys(result.data)).toEqual(['summary', 'loginActivity']);
    expect(result.meta).toEqual({
      include: ['summary', 'loginActivity'],
      days: 30,
      limit: 5,
      omitted: [],
      generatedAt: '2026-09-27T09:00:00.000Z'
    });
  });

  it('lets a tutor read the summary and leaves login activity out, listed in meta.omitted', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    const result = await getPublicApiOrganizationOverviewService(
      ORG_ID,
      ACTOR_ID,
      overviewQuery(['summary', 'loginActivity'])
    );

    expect(Object.keys(result.data)).toEqual(['summary']);
    expect(result.meta.omitted).toEqual([{ section: 'loginActivity', reason: 'requires_org_admin' }]);
    expect(getStudentLoginActivity).not.toHaveBeenCalled();
  });

  it('returns an empty data object with a null generatedAt when every section is omitted', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    const result = await getPublicApiOrganizationOverviewService(ORG_ID, ACTOR_ID, overviewQuery(['loginActivity']));

    expect(result.data).toEqual({});
    expect(result.meta.generatedAt).toBeNull();
  });

  it.each([
    ['a student', ROLE.STUDENT],
    ['an actor with no active membership', null]
  ])('rejects %s with 403 before reading anything', async (_label, roleId) => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(roleId);

    await expect(
      getPublicApiOrganizationOverviewService(ORG_ID, ACTOR_ID, overviewQuery(['summary']))
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(cachedRead).not.toHaveBeenCalled();
  });

  it('rejects a key without an actor with 401', async () => {
    await expect(
      getPublicApiOrganizationOverviewService(ORG_ID, null, overviewQuery(['summary']))
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('reads each section once through its own cache key and skips the dashboard cache', async () => {
    await getPublicApiOrganizationOverviewService(
      ORG_ID,
      ACTOR_ID,
      overviewQuery(['summary', 'summary', 'loginActivity'], { days: 7 })
    );

    expect(cachedRead).toHaveBeenCalledTimes(2);
    expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:summary:org-1', 600, expect.any(Function));
    expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:loginActivity:org-1:7', 86_400, expect.any(Function));
    expect(getOrganizationOverview).toHaveBeenCalledWith(ORG_ID, undefined, true);
    expect(getStudentLoginActivity).toHaveBeenCalledWith(ORG_ID, 7, true);
  });

  it('applies limit to the summary lists after the read, without putting it in the cache key', async () => {
    vi.mocked(getOrganizationOverview).mockResolvedValue({
      totalStudents: 9,
      topCourses: rows(5),
      recentCertifications: rows(5)
    } as never);

    const result = await getPublicApiOrganizationOverviewService(
      ORG_ID,
      ACTOR_ID,
      overviewQuery(['summary'], { limit: 2 })
    );

    expect(result.data).toEqual({
      summary: { totalStudents: 9, topCourses: rows(2), recentCertifications: rows(2) }
    });
    expect(cachedRead).toHaveBeenCalledWith('public-api:analytics:summary:org-1', 600, expect.any(Function));
  });
});
