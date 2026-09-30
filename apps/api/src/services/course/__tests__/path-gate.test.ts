import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCodes } from '@api/utils/errors';

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn()
}));

import { getCourseById } from '@cio/db/queries/course';
import { assertCourseAllowsDirectStudentAdd, assertCourseNotPathGated } from '../path-gate';

describe('assertCourseNotPathGated', () => {
  it('rejects path-gated courses', () => {
    expect(() => assertCourseNotPathGated({ requiresLearningPath: true })).toThrowError(
      expect.objectContaining({ code: ErrorCodes.VALIDATION_ERROR, statusCode: 400 })
    );
  });

  it('allows regular courses and missing rows', () => {
    expect(() => assertCourseNotPathGated({ requiresLearningPath: false })).not.toThrow();
    expect(() => assertCourseNotPathGated(null)).not.toThrow();
    expect(() => assertCourseNotPathGated(undefined)).not.toThrow();
  });
});

describe('assertCourseAllowsDirectStudentAdd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects path-gated courses', async () => {
    vi.mocked(getCourseById).mockResolvedValue([{ id: 'c-1', requiresLearningPath: true }] as never);

    await expect(assertCourseAllowsDirectStudentAdd('c-1')).rejects.toMatchObject({
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 400
    });
  });

  it('allows regular courses and forwards the transaction client', async () => {
    const tx = { id: 'tx' };
    vi.mocked(getCourseById).mockResolvedValue([{ id: 'c-1', requiresLearningPath: false }] as never);

    await expect(assertCourseAllowsDirectStudentAdd('c-1', tx as never)).resolves.toBeUndefined();
    expect(vi.mocked(getCourseById)).toHaveBeenCalledWith('c-1', tx);
  });
});
