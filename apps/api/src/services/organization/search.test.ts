import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryMocks = vi.hoisted(() => ({
  searchLmsCohorts: vi.fn(),
  searchLmsCourses: vi.fn(),
  searchOrgAudience: vi.fn(),
  searchOrgCohorts: vi.fn(),
  searchOrgCourses: vi.fn(),
  searchOrgTagsAndGroups: vi.fn(),
  searchOrgWidgets: vi.fn()
}));

vi.mock('@cio/db/queries', () => queryMocks);

import { searchOrganization } from './search';

describe('searchOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryMocks.searchOrgCourses.mockResolvedValue([]);
    queryMocks.searchOrgCohorts.mockResolvedValue([]);
    queryMocks.searchOrgWidgets.mockResolvedValue([]);
    queryMocks.searchOrgTagsAndGroups.mockResolvedValue([]);
    queryMocks.searchOrgAudience.mockResolvedValue([{ memberId: 1 }]);
  });

  it('does not query or return audience members when audience access is disabled', async () => {
    const result = await searchOrganization('org-1', 'alex', 5, false);

    expect(queryMocks.searchOrgAudience).not.toHaveBeenCalled();
    expect(result.audience).toEqual([]);
  });

  it('returns audience matches when audience access is enabled', async () => {
    const result = await searchOrganization('org-1', 'alex', 5, true);

    expect(queryMocks.searchOrgAudience).toHaveBeenCalledWith('org-1', 'alex', 5);
    expect(result.audience).toEqual([{ memberId: 1 }]);
  });
});
