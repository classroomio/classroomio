import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentType } from '@cio/utils/constants/content';

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: async (run: (tx: unknown) => unknown) => run({ __tx: true }) }
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn(),
  createCourse: vi.fn(),
  createCourseNewsfeed: vi.fn(),
  updateCourse: vi.fn(),
  getCourseWithRelations: vi.fn().mockResolvedValue(null)
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseById: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  createGroup: vi.fn(),
  addGroupMember: vi.fn()
}));

vi.mock('@cio/db/queries/activity', () => ({
  createActivities: vi.fn(),
  countActivitiesInCourse: vi.fn(),
  getActivityById: vi.fn(),
  deleteActivity: vi.fn()
}));

vi.mock('@cio/core/services/activity/providers', () => ({
  ACTIVITY_PROVIDERS: { scorm: { createDetails: vi.fn().mockResolvedValue(undefined) } }
}));

vi.mock('@cio/core/services/course/slug', () => ({
  resolveItemSlug: vi.fn().mockResolvedValue('package')
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: vi.fn().mockResolvedValue(undefined)
}));

import { countActivitiesInCourse, getActivityById } from '@cio/db/queries/activity';
import { getCourseById } from '@cio/db/queries/course';
import { getCourseById as getCourseByIdDirect } from '@cio/db/queries/course/course';
import { ACTIVITY_PROVIDERS } from '@cio/core/services/activity/providers';
import { assertCourseAcceptsContent } from '@cio/core/services/course/content';
import { createCourse, updateCourse } from '@cio/core/services/course/course';
import {
  createCourse as createCourseQuery,
  createCourseNewsfeed,
  updateCourse as updateCourseQuery
} from '@cio/db/queries/course';
import { addGroupMember, createGroup } from '@cio/db/queries/group';
import { createActivities } from '@cio/db/queries/activity';

const singleActivityCourse = { id: 'course-1', format: 'single_activity', type: 'SELF_PACED', title: 'Package course' };
const standardCourse = { id: 'course-2', format: 'standard', type: 'SELF_PACED', title: 'Standard' };

describe('assertCourseAcceptsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows every kind in a standard course', async () => {
    vi.mocked(getCourseById).mockResolvedValue([standardCourse] as never);

    for (const type of [ContentType.Section, ContentType.Lesson, ContentType.Exercise, ContentType.Activity]) {
      await expect(assertCourseAcceptsContent('course-2', type)).resolves.toBeUndefined();
    }
  });

  it('refuses sections, lessons and exercises in a single-activity course', async () => {
    vi.mocked(getCourseById).mockResolvedValue([singleActivityCourse] as never);

    for (const type of [ContentType.Section, ContentType.Lesson, ContentType.Exercise]) {
      await expect(assertCourseAcceptsContent('course-1', type)).rejects.toMatchObject({ statusCode: 400 });
    }
  });

  it('allows the first activity but refuses a second one in a single-activity course', async () => {
    vi.mocked(getCourseById).mockResolvedValue([singleActivityCourse] as never);
    vi.mocked(countActivitiesInCourse).mockResolvedValue(0);

    await expect(assertCourseAcceptsContent('course-1', ContentType.Activity)).resolves.toBeUndefined();

    vi.mocked(countActivitiesInCourse).mockResolvedValue(1);

    await expect(assertCourseAcceptsContent('course-1', ContentType.Activity)).rejects.toMatchObject({
      statusCode: 400
    });
  });
});

describe('createCourse with format single_activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createGroup).mockResolvedValue([{ id: 'group-1' }] as never);
    vi.mocked(createCourseQuery).mockResolvedValue([{ id: 'course-1', format: 'single_activity' }] as never);
    vi.mocked(addGroupMember).mockResolvedValue([{ id: 'member-1' }] as never);
    vi.mocked(createCourseNewsfeed).mockResolvedValue([{ id: 'news-1' }] as never);
    vi.mocked(createActivities).mockResolvedValue([{ id: 'act-1' }] as never);
  });

  it('creates the course and its one empty SCORM activity in one transaction', async () => {
    const result = await createCourse('profile-1', {
      title: 'Package course',
      description: 'A single package',
      type: 'SELF_PACED',
      format: 'single_activity',
      organizationId: 'org-1'
    });

    expect(createCourseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'single_activity', type: 'SELF_PACED' }),
      expect.anything()
    );
    expect(createActivities).toHaveBeenCalledWith(
      [expect.objectContaining({ courseId: 'course-1', kind: 'scorm', sectionId: null })],
      expect.anything()
    );
    expect(ACTIVITY_PROVIDERS.scorm.createDetails).toHaveBeenCalledWith('act-1', {}, expect.anything());
    expect(result.activityId).toBe('act-1');
  });

  it('refuses LIVE_CLASS and PUBLIC types for single-activity courses', async () => {
    for (const type of ['LIVE_CLASS', 'PUBLIC'] as const) {
      await expect(
        createCourse('profile-1', {
          title: 'Package course',
          description: 'A single package',
          type,
          format: 'single_activity',
          organizationId: 'org-1'
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    }

    expect(createCourseQuery).not.toHaveBeenCalled();
  });

  it('creates standard courses without an activity', async () => {
    vi.mocked(createCourseQuery).mockResolvedValue([{ id: 'course-2', format: 'standard' }] as never);

    const result = await createCourse('profile-1', {
      title: 'Standard',
      description: 'A standard course',
      type: 'SELF_PACED',
      organizationId: 'org-1'
    });

    expect(createActivities).not.toHaveBeenCalled();
    expect(result.activityId).toBeNull();
  });
});

describe('updateCourse single-activity guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseById).mockResolvedValue([singleActivityCourse] as never);
    vi.mocked(updateCourseQuery).mockResolvedValue({ ...singleActivityCourse, title: 'Renamed' } as never);
  });

  it('refuses LIVE_CLASS and PUBLIC types in a single-activity course', async () => {
    for (const type of ['LIVE_CLASS', 'PUBLIC'] as const) {
      await expect(updateCourse('course-1', { type } as never)).rejects.toMatchObject({ statusCode: 400 });
    }

    expect(updateCourseQuery).not.toHaveBeenCalled();
  });

  it('converts single_activity to standard', async () => {
    const result = await updateCourse('course-1', { format: 'standard' } as never);

    expect(updateCourseQuery).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ format: 'standard' }),
      expect.anything()
    );
    expect(result.course.title).toBe('Renamed');
  });

  it('refuses conversion to a single-activity course', async () => {
    vi.mocked(getCourseById).mockResolvedValue([standardCourse] as never);

    await expect(updateCourse('course-2', { format: 'single_activity' } as never)).rejects.toMatchObject({
      statusCode: 400
    });
    expect(updateCourseQuery).not.toHaveBeenCalled();
  });
});

describe('deleteActivityService in a single-activity course', () => {
  it('refuses to delete the only package', async () => {
    const { deleteActivityService } = await import('@cio/core/services/activity/activity');
    vi.mocked(getActivityById).mockResolvedValue({
      id: 'act-1',
      courseId: 'course-1',
      kind: 'scorm'
    } as never);
    vi.mocked(getCourseByIdDirect).mockResolvedValue([singleActivityCourse] as never);

    await expect(deleteActivityService('course-1', 'act-1')).rejects.toMatchObject({ statusCode: 400 });
  });
});
