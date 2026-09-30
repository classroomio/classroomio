import { describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/learning-path', () => ({
  hasLiveNonPathGrant: vi.fn(),
  getActivePathGrantsForCourseAndProfile: vi.fn()
}));

import { hasLiveNonPathGrant, getActivePathGrantsForCourseAndProfile } from '@cio/db/queries/learning-path';
import { resolveCourseRedirect } from '../redirect';

describe('resolveCourseRedirect', () => {
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
});
