import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn(),
  mergeCourseMetadata: vi.fn()
}));

vi.mock('@api/services/v1/shared', () => ({
  assertCourseTeamAccess: vi.fn()
}));

import { getCourseById, mergeCourseMetadata } from '@cio/db/queries/course';
import { assertCourseTeamAccess } from '@api/services/v1/shared';
import {
  getPublicApiCourseSettingsService,
  updatePublicApiCourseSettingsService
} from '@api/services/v1/courses/settings';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const params = { courseId: COURSE_ID };

function mockCourse(course: Record<string, unknown>) {
  vi.mocked(getCourseById).mockResolvedValue([{ id: COURSE_ID, isPrivate: false, ...course }] as never);
}

describe('course settings service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertCourseTeamAccess).mockResolvedValue(undefined);
  });

  it('applies the dashboard defaults to a course that never saved its settings', async () => {
    mockCourse({ metadata: { goals: '', description: '', requirements: '' } });

    const settings = await getPublicApiCourseSettingsService('org-1', 'actor-1', params);

    expect(settings).toEqual({
      progressionMode: 'free',
      allowSelfEnrollment: true,
      allowMarkdownExport: false,
      commentsEnabled: true
    });
    expect(assertCourseTeamAccess).toHaveBeenCalledWith('org-1', 'actor-1', COURSE_ID);
  });

  it('reads the legacy self-enrollment key', async () => {
    mockCourse({ metadata: { allowNewStudent: false } });

    const settings = await getPublicApiCourseSettingsService('org-1', 'actor-1', params);

    expect(settings.allowSelfEnrollment).toBe(false);
  });

  it('merges only the sent settings and returns the stored result', async () => {
    mockCourse({ metadata: {} });
    vi.mocked(mergeCourseMetadata).mockResolvedValue({
      metadata: { progressionMode: 'sequential', commentsEnabled: false }
    } as never);

    const settings = await updatePublicApiCourseSettingsService('org-1', 'actor-1', params, {
      progressionMode: 'sequential',
      commentsEnabled: false
    });

    expect(mergeCourseMetadata).toHaveBeenCalledWith(COURSE_ID, {
      progressionMode: 'sequential',
      commentsEnabled: false
    });
    expect(settings.progressionMode).toBe('sequential');
    expect(settings.commentsEnabled).toBe(false);
  });

  it('refuses self-enrollment on a private course', async () => {
    mockCourse({ isPrivate: true, metadata: {} });

    await expect(
      updatePublicApiCourseSettingsService('org-1', 'actor-1', params, { allowSelfEnrollment: true })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mergeCourseMetadata).not.toHaveBeenCalled();
  });

  it('stops before writing when the key creator is not on the course team', async () => {
    vi.mocked(assertCourseTeamAccess).mockRejectedValue(new Error('forbidden'));

    await expect(
      updatePublicApiCourseSettingsService('org-1', 'actor-1', params, { progressionMode: 'sequential' })
    ).rejects.toThrow('forbidden');
    expect(mergeCourseMetadata).not.toHaveBeenCalled();
  });
});
