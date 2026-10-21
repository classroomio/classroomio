import { beforeEach, describe, expect, it, vi } from 'vitest';

const TX = { tx: true };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run(TX)) }
}));
vi.mock('@cio/core/services/course/course', () => ({ updateCourse: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseById: vi.fn() }));
vi.mock('@api/services/tag', () => ({ replaceCourseTags: vi.fn() }));

import { updateCourse } from '@cio/core/services/course/course';
import { getCourseById } from '@cio/db/queries/course';
import { replaceCourseTags } from '@api/services/tag';
import { updateCourseWithTags } from '@api/services/course/update-course';

const base = { courseId: 'course-1', orgId: 'org-1', updatedByUserId: 'actor-1', tagIds: ['tag-1'] };

describe('updateCourseWithTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(replaceCourseTags).mockResolvedValue([{ id: 'tag-1' }] as never);
  });

  it('only replaces tags on a tags-only change, so unrelated course checks cannot block it', async () => {
    vi.mocked(getCourseById).mockResolvedValue([{ id: 'course-1', cost: 50, metadata: {} }] as never);

    const result = await updateCourseWithTags({ ...base, courseData: {} });

    expect(updateCourse).not.toHaveBeenCalled();
    expect(getCourseById).toHaveBeenCalledWith('course-1', TX);
    expect(replaceCourseTags).toHaveBeenCalledWith(
      'org-1',
      'course-1',
      { tagIds: ['tag-1'] },
      {
        updatedByUserId: 'actor-1',
        dbClient: TX
      }
    );
    expect(result).toEqual({
      course: { id: 'course-1', cost: 50, metadata: {} },
      conversionOffenders: null,
      tags: [{ id: 'tag-1' }]
    });
  });

  it('returns 404 on a tags-only change to a missing course', async () => {
    vi.mocked(getCourseById).mockResolvedValue([] as never);

    await expect(updateCourseWithTags({ ...base, courseData: {} })).rejects.toMatchObject({ statusCode: 404 });
    expect(replaceCourseTags).not.toHaveBeenCalled();
  });

  it('runs the full course update when other fields change', async () => {
    vi.mocked(updateCourse).mockResolvedValue({ course: { id: 'course-1' }, conversionOffenders: null } as never);

    await updateCourseWithTags({ ...base, courseData: { title: 'New title' } });

    expect(updateCourse).toHaveBeenCalledWith('course-1', { title: 'New title' }, TX);
    expect(getCourseById).not.toHaveBeenCalled();
  });
});
