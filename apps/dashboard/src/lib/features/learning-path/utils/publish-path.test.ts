import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({
  learningPathApi: { update: vi.fn() }
}));

import { learningPathApi } from '../api';
import { publishPath } from './publish-path';
import { MAX_PATH_SLUG_LENGTH } from './path-slug';
import type { LearningPathDetail, UpdateLearningPathData } from './types';

const updateMock = vi.mocked(learningPathApi.update);

function createMockPath(overrides: Partial<LearningPathDetail> = {}): LearningPathDetail {
  return {
    id: 'path-123',
    publicId: 'P1234567',
    name: 'Test Path',
    slug: null,
    ...overrides
  } as LearningPathDetail;
}

beforeEach(() => {
  updateMock.mockReset();
});

describe('publishPath', () => {
  it('returns failure without calling update when path is missing', async () => {
    const result = await publishPath(null);

    expect(result).toEqual({ ok: false, reason: 'failed' });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns failure without calling update when path has no id', async () => {
    const result = await publishPath(createMockPath({ id: '' }));

    expect(result).toEqual({ ok: false, reason: 'failed' });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('reuses the existing slug trimmed when present', async () => {
    const path = createMockPath({ slug: '  existing-slug  ' });
    updateMock.mockResolvedValue({ slug: 'existing-slug' } as UpdateLearningPathData);

    const result = await publishPath(path);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(
      'P1234567',
      { isPublished: true, slug: 'existing-slug' },
      { showSuccessToast: false }
    );
    expect(result).toEqual({ ok: true, slug: 'existing-slug' });
  });

  it('mints a slug from the name when missing and returns the server slug', async () => {
    const path = createMockPath({ slug: null });
    updateMock.mockResolvedValue({ slug: 'test-path-1720000000000' } as UpdateLearningPathData);

    const result = await publishPath(path);

    expect(updateMock).toHaveBeenCalledTimes(1);
    const [, payload] = updateMock.mock.calls[0];
    const mintedSlug = (payload as { slug: string }).slug;
    expect(mintedSlug.startsWith('test-path-')).toBe(true);
    expect(result).toEqual({ ok: true, slug: 'test-path-1720000000000' });
  });

  it('keeps generated slugs within the API limit for max-length names', async () => {
    const path = createMockPath({ name: 'a'.repeat(255), slug: null });
    updateMock.mockImplementation(async (_pathId, data) => ({ slug: data.slug }) as UpdateLearningPathData);

    const result = await publishPath(path);

    expect(updateMock).toHaveBeenCalledTimes(1);
    const [, payload] = updateMock.mock.calls[0];
    const mintedSlug = (payload as { slug: string }).slug;
    expect(mintedSlug.length).toBeLessThanOrEqual(MAX_PATH_SLUG_LENGTH);
    expect(result).toEqual({ ok: true, slug: mintedSlug });
  });

  it('falls back to id when publicId is missing', async () => {
    const path = createMockPath({ publicId: undefined, slug: 'my-slug' });
    updateMock.mockResolvedValue({ slug: 'my-slug' } as UpdateLearningPathData);

    const result = await publishPath(path);

    expect(updateMock).toHaveBeenCalledWith(
      'path-123',
      { isPublished: true, slug: 'my-slug' },
      { showSuccessToast: false }
    );
    expect(result).toEqual({ ok: true, slug: 'my-slug' });
  });

  it('returns failure when the update fails', async () => {
    updateMock.mockResolvedValue(null);

    const result = await publishPath(createMockPath({ slug: 'my-slug' }));

    expect(result).toEqual({ ok: false, reason: 'failed' });
  });
});
