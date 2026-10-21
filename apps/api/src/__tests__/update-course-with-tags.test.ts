import { beforeEach, describe, expect, it, vi } from 'vitest';

const TX = { tx: true };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run(TX)) }
}));
vi.mock('@cio/core/services/course/course', () => ({ updateCourse: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseByIdForUpdate: vi.fn() }));
vi.mock('@cio/db/queries/tag', () => ({ getCourseTagsForOrganization: vi.fn() }));
vi.mock('@api/services/tag', () => ({ replaceCourseTags: vi.fn() }));

import { updateCourse } from '@cio/core/services/course/course';
import { getCourseByIdForUpdate } from '@cio/db/queries/course';
import { getCourseTagsForOrganization } from '@cio/db/queries/tag';
import { replaceCourseTags } from '@api/services/tag';
import { updateCourseWithTags } from '@api/services/course/update-course';

const base = { courseId: 'course-1', orgId: 'org-1', updatedByUserId: 'actor-1' };
const lockedCourse = { id: 'course-1', cost: 50, metadata: {} };
const replaceOptions = { updatedByUserId: 'actor-1', dbClient: TX };

describe('updateCourseWithTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseByIdForUpdate).mockResolvedValue([lockedCourse] as never);
    vi.mocked(replaceCourseTags).mockResolvedValue([{ id: 'tag-1' }] as never);
  });

  it('locks the course row before changing its tags', async () => {
    await updateCourseWithTags({ ...base, courseData: {}, tagIds: ['tag-1'] });

    expect(getCourseByIdForUpdate).toHaveBeenCalledWith('course-1', TX);
    expect(vi.mocked(getCourseByIdForUpdate).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(replaceCourseTags).mock.invocationCallOrder[0]
    );
  });

  it('only replaces tags on a tags-only change, so unrelated course checks cannot block it', async () => {
    const result = await updateCourseWithTags({ ...base, courseData: {}, tagIds: ['tag-1'] });

    expect(updateCourse).not.toHaveBeenCalled();
    expect(replaceCourseTags).toHaveBeenCalledWith('org-1', 'course-1', { tagIds: ['tag-1'] }, replaceOptions);
    expect(result).toEqual({ course: lockedCourse, conversionOffenders: null, tags: [{ id: 'tag-1' }] });
  });

  it('adds addTagIds to the tags already on the course, read under the lock', async () => {
    vi.mocked(getCourseTagsForOrganization).mockResolvedValue([{ id: 'tag-old' }] as never);

    await updateCourseWithTags({ ...base, courseData: {}, addTagIds: ['tag-new'] });

    expect(getCourseTagsForOrganization).toHaveBeenCalledWith('org-1', 'course-1', TX);
    expect(replaceCourseTags).toHaveBeenCalledWith(
      'org-1',
      'course-1',
      { tagIds: ['tag-old', 'tag-new'] },
      replaceOptions
    );
  });

  it('does not read the current tags when tagIds replaces them', async () => {
    await updateCourseWithTags({ ...base, courseData: {}, tagIds: [] });

    expect(getCourseTagsForOrganization).not.toHaveBeenCalled();
    expect(replaceCourseTags).toHaveBeenCalledWith('org-1', 'course-1', { tagIds: [] }, replaceOptions);
  });

  it('returns 404 for a missing course', async () => {
    vi.mocked(getCourseByIdForUpdate).mockResolvedValue([] as never);

    await expect(updateCourseWithTags({ ...base, courseData: {}, tagIds: ['tag-1'] })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(replaceCourseTags).not.toHaveBeenCalled();
  });

  it('runs the full course update when other fields change', async () => {
    vi.mocked(updateCourse).mockResolvedValue({ course: { id: 'course-1' }, conversionOffenders: null } as never);

    await updateCourseWithTags({ ...base, courseData: { title: 'New title' }, tagIds: ['tag-1'] });

    expect(updateCourse).toHaveBeenCalledWith('course-1', { title: 'New title' }, TX);
  });
});
