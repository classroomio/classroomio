import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  getCourseById: vi.fn(),
  getCourseWithOrgData: vi.fn()
}));

vi.mock('@cio/db/queries/course', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/queries/course')>()),
  getCourseById: mocks.getCourseById,
  getCourseWithOrgData: mocks.getCourseWithOrgData
}));

import { createStudentInvite } from '../invite';

describe('createStudentInvite and enrollOnlyInLearningPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuses to create an invite for a course that is enroll-only in a learning path', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'c-1', title: 'Path-only', enrollOnlyInLearningPath: true }]);

    await expect(createStudentInvite('c-1', 'admin-1', {} as never)).rejects.toMatchObject({
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 400
    });
    expect(mocks.getCourseWithOrgData).not.toHaveBeenCalled();
  });

  it('continues past the gate for a course taken on its own', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'c-1', title: 'Open', enrollOnlyInLearningPath: false }]);
    // Stop right after the path-only guard: a missing org row ends the call with a 404.
    mocks.getCourseWithOrgData.mockResolvedValue(null);

    await expect(createStudentInvite('c-1', 'admin-1', {} as never)).rejects.toMatchObject({
      code: ErrorCodes.COURSE_NOT_FOUND
    });
    expect(mocks.getCourseWithOrgData).toHaveBeenCalledWith('c-1');
  });
});
