import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/learning-path', () => ({
  hasLiveNonPathGrant: vi.fn(),
  getActivePathGrantsForCourseAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseOrgAndStatus: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationMemberIdByOrgAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

import { hasLiveNonPathGrant, getActivePathGrantsForCourseAndProfile } from '@cio/db/queries/learning-path';
import { getCourseOrgAndStatus } from '@cio/db/queries/course';
import { getActiveOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { resolveCourseRedirect } from '../redirect';

describe('resolveCourseRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrgAndStatus).mockResolvedValue({ organizationId: 'org-1', status: 'ACTIVE' });
    vi.mocked(getActiveOrganizationMemberIdByOrgAndProfile).mockResolvedValue(7);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
  });

  it('stays on the course when a non-path grant exists', async () => {
    vi.mocked(hasLiveNonPathGrant).mockResolvedValue(true);
    vi.mocked(getActivePathGrantsForCourseAndProfile).mockResolvedValue([
      { learningPathId: 'path-1', publicId: 'AbC123Xy' }
    ]);

    await expect(resolveCourseRedirect('c-1', 'p-1')).resolves.toEqual({ type: 'course' });
  });

  it('redirects into the path when exactly one live path grant exists', async () => {
    vi.mocked(hasLiveNonPathGrant).mockResolvedValue(false);
    vi.mocked(getActivePathGrantsForCourseAndProfile).mockResolvedValue([
      { learningPathId: 'path-1', publicId: 'AbC123Xy' }
    ]);

    await expect(resolveCourseRedirect('c-1', 'p-1')).resolves.toEqual({ type: 'path', publicId: 'AbC123Xy' });
  });

  it('falls back to the hub with zero or several path grants', async () => {
    vi.mocked(hasLiveNonPathGrant).mockResolvedValue(false);
    vi.mocked(getActivePathGrantsForCourseAndProfile).mockResolvedValue([]);

    await expect(resolveCourseRedirect('c-1', 'p-1')).resolves.toEqual({ type: 'hub' });

    vi.mocked(getActivePathGrantsForCourseAndProfile).mockResolvedValue([
      { learningPathId: 'path-1', publicId: 'AAA' },
      { learningPathId: 'path-2', publicId: 'BBB' }
    ]);

    await expect(resolveCourseRedirect('c-1', 'p-1')).resolves.toEqual({ type: 'hub' });
  });

  it('ignores path grants without a publicId instead of building a broken target', async () => {
    vi.mocked(hasLiveNonPathGrant).mockResolvedValue(false);
    vi.mocked(getActivePathGrantsForCourseAndProfile).mockResolvedValue([{ learningPathId: 'path-1', publicId: null }]);

    await expect(resolveCourseRedirect('c-1', 'p-1')).resolves.toEqual({ type: 'hub' });
  });

  it('a locked path course returns path, not 403', async () => {
    vi.mocked(hasLiveNonPathGrant).mockResolvedValue(false);
    vi.mocked(getActivePathGrantsForCourseAndProfile).mockResolvedValue([
      { learningPathId: 'path-1', publicId: 'AbC123Xy' }
    ]);

    await expect(resolveCourseRedirect('locked-course', 'learner-1')).resolves.toEqual({
      type: 'path',
      publicId: 'AbC123Xy'
    });
  });

  it('a team member gets course', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);

    await expect(resolveCourseRedirect('c-1', 'tutor-1')).resolves.toEqual({ type: 'course' });
    expect(vi.mocked(hasLiveNonPathGrant)).not.toHaveBeenCalled();
  });

  it('a missing course gets 404', async () => {
    vi.mocked(getCourseOrgAndStatus).mockResolvedValue(null);

    await expect(resolveCourseRedirect('missing', 'p-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('a deleted course gets 404', async () => {
    vi.mocked(getCourseOrgAndStatus).mockResolvedValue({ organizationId: 'org-1', status: 'DELETED' });

    await expect(resolveCourseRedirect('deleted', 'p-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('a course outside the caller orgs gets 404', async () => {
    vi.mocked(getActiveOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null);

    await expect(resolveCourseRedirect('c-1', 'outsider-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('an archived member gets 404', async () => {
    vi.mocked(getActiveOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null);

    await expect(resolveCourseRedirect('c-1', 'archived-1')).rejects.toMatchObject({ statusCode: 404 });
  });
});
