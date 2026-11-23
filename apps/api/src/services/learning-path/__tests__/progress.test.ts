import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/learning-path/learning-path', () => ({
  listLearningPathCourses: vi.fn(),
  listPathMembershipsForCourse: vi.fn(),
  listProfileCourseProgress: vi.fn(),
  markLearningPathMemberCompleted: vi.fn()
}));

import {
  listLearningPathCourses,
  listPathMembershipsForCourse,
  listProfileCourseProgress,
  markLearningPathMemberCompleted,
  type TLearningPathCourseRow,
  type TProfileCourseProgressRow
} from '@cio/db/queries/learning-path/learning-path';
import { ROLE } from '@cio/utils/constants';
import {
  assertCourseNotPathLocked,
  buildLearnerPathProgress,
  evaluateLearningPathCompletion,
  getCoursePathLock
} from '@api/services/learning-path/progress';

const PROFILE_ID = 'profile-1';

function pathCourse(
  courseId: string,
  order: number,
  isPublished = true,
  addedAt = '2026-01-01T00:00:00.000Z'
): TLearningPathCourseRow {
  return {
    pathCourseId: `pc-${courseId}`,
    order,
    courseId,
    title: `Course ${courseId}`,
    description: null,
    logo: '',
    bannerImage: null,
    slug: null,
    groupId: `group-${courseId}`,
    isPublished,
    status: 'ACTIVE',
    metadata: {},
    addedAt,
    cost: 0,
    currency: 'USD',
    lessonCount: 2,
    exerciseCount: 0
  };
}

function progressRow(courseId: string, lessonsCompleted: number, enrolledAt: string): TProfileCourseProgressRow {
  return {
    profileId: PROFILE_ID,
    courseId,
    groupMemberId: `gm-${courseId}`,
    enrolledAt,
    completedAt: null,
    lessonsCount: 2,
    lessonsCompleted,
    exercisesCount: 0,
    exercisesCompleted: 0
  };
}

const PATH_JOINED_AT = '2026-03-01T10:00:00.000Z';
const AFTER_PATH = '2026-03-01T10:00:01.000Z';
const BEFORE_PATH = '2026-02-01T10:00:00.000Z';

describe('buildLearnerPathProgress', () => {
  it('leaves unpublished courses out of the order', () => {
    const progress = buildLearnerPathProgress(
      [pathCourse('a', 1), pathCourse('draft', 2, false), pathCourse('b', 3)],
      [progressRow('a', 2, AFTER_PATH), progressRow('b', 0, AFTER_PATH)],
      true
    );

    expect(progress.courses.map((course) => [course.courseId, course.order, course.state])).toEqual([
      ['a', 1, 'completed'],
      ['b', 2, 'not_started']
    ]);
    expect(progress.nextCourse).toEqual({ courseId: 'b', title: 'Course b' });
    expect(progress.progressPercent).toBe(50);
  });

  it('shows a path nobody has started as not started, with later courses locked', () => {
    const progress = buildLearnerPathProgress([pathCourse('a', 1), pathCourse('b', 2)], [], true);

    expect(progress.courses.map((course) => course.state)).toEqual(['not_started', 'locked']);
    expect(progress.progressPercent).toBe(0);
  });
});

describe('getCoursePathLock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listPathMembershipsForCourse).mockResolvedValue([
      {
        pathId: 'path-1',
        pathName: 'Frontend path',
        sequentialUnlock: true,
        memberId: 'member-1',
        enrolledAt: PATH_JOINED_AT,
        completedAt: null
      }
    ]);
    vi.mocked(listLearningPathCourses).mockResolvedValue([pathCourse('a', 1), pathCourse('b', 2)]);
  });

  it('locks a course the path enrolled the learner in while the previous course is unfinished', async () => {
    vi.mocked(listProfileCourseProgress).mockResolvedValue([
      progressRow('a', 1, AFTER_PATH),
      progressRow('b', 0, AFTER_PATH)
    ]);

    await expect(getCoursePathLock('b', PROFILE_ID)).resolves.toEqual({
      pathId: 'path-1',
      pathName: 'Frontend path',
      blockingCourseId: 'a',
      blockingCourseTitle: 'Course a'
    });
  });

  it('keeps a course open that the learner joined before joining the path', async () => {
    vi.mocked(listProfileCourseProgress).mockResolvedValue([
      progressRow('a', 1, AFTER_PATH),
      progressRow('b', 0, BEFORE_PATH)
    ]);

    await expect(getCoursePathLock('b', PROFILE_ID)).resolves.toBeNull();
  });

  it('keeps a course open that the learner joined before it was added to their path', async () => {
    const addedLater = new Date(new Date(AFTER_PATH).getTime() + 86_400_000).toISOString();
    vi.mocked(listLearningPathCourses).mockResolvedValue([pathCourse('a', 1), pathCourse('b', 2, true, addedLater)]);
    vi.mocked(listProfileCourseProgress).mockResolvedValue([
      progressRow('a', 1, AFTER_PATH),
      progressRow('b', 0, AFTER_PATH)
    ]);

    await expect(getCoursePathLock('b', PROFILE_ID)).resolves.toBeNull();
  });

  it('locks a course the learner joined after it was added to their path', async () => {
    const addedBefore = new Date(new Date(PATH_JOINED_AT).getTime() - 86_400_000).toISOString();
    vi.mocked(listLearningPathCourses).mockResolvedValue([pathCourse('a', 1), pathCourse('b', 2, true, addedBefore)]);
    vi.mocked(listProfileCourseProgress).mockResolvedValue([
      progressRow('a', 1, AFTER_PATH),
      progressRow('b', 0, AFTER_PATH)
    ]);

    await expect(getCoursePathLock('b', PROFILE_ID)).resolves.toMatchObject({ blockingCourseId: 'a' });
  });

  it('unlocks the next course once the previous one is complete', async () => {
    vi.mocked(listProfileCourseProgress).mockResolvedValue([
      progressRow('a', 2, AFTER_PATH),
      progressRow('b', 0, AFTER_PATH)
    ]);

    await expect(getCoursePathLock('b', PROFILE_ID)).resolves.toBeNull();
  });

  it('ignores paths that do not unlock in order', async () => {
    vi.mocked(listPathMembershipsForCourse).mockResolvedValue([
      {
        pathId: 'path-1',
        pathName: 'Frontend path',
        sequentialUnlock: false,
        memberId: 'member-1',
        enrolledAt: PATH_JOINED_AT,
        completedAt: null
      }
    ]);

    await expect(getCoursePathLock('b', PROFILE_ID)).resolves.toBeNull();
    expect(listProfileCourseProgress).not.toHaveBeenCalled();
  });
});

describe('assertCourseNotPathLocked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listPathMembershipsForCourse).mockResolvedValue([
      {
        pathId: 'path-1',
        pathName: 'Frontend path',
        sequentialUnlock: true,
        memberId: 'member-1',
        enrolledAt: PATH_JOINED_AT,
        completedAt: null
      }
    ]);
    vi.mocked(listLearningPathCourses).mockResolvedValue([pathCourse('a', 1), pathCourse('b', 2)]);
    vi.mocked(listProfileCourseProgress).mockResolvedValue([
      progressRow('a', 0, AFTER_PATH),
      progressRow('b', 0, AFTER_PATH)
    ]);
  });

  it('refuses students with LEARNING_PATH_COURSE_LOCKED', async () => {
    await expect(
      assertCourseNotPathLocked({ courseId: 'b', profileId: PROFILE_ID, roleId: ROLE.STUDENT })
    ).rejects.toMatchObject({ code: 'LEARNING_PATH_COURSE_LOCKED', statusCode: 403 });
  });

  it('does not check tutors or admins', async () => {
    await expect(
      assertCourseNotPathLocked({ courseId: 'b', profileId: PROFILE_ID, roleId: ROLE.TUTOR })
    ).resolves.toBeUndefined();
    expect(listPathMembershipsForCourse).not.toHaveBeenCalled();
  });
});

describe('evaluateLearningPathCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listPathMembershipsForCourse).mockResolvedValue([
      {
        pathId: 'path-1',
        pathName: 'Frontend path',
        sequentialUnlock: true,
        memberId: 'member-1',
        enrolledAt: PATH_JOINED_AT,
        completedAt: null
      }
    ]);
    vi.mocked(listLearningPathCourses).mockResolvedValue([pathCourse('a', 1), pathCourse('b', 2)]);
  });

  it('marks the path complete when every course is complete', async () => {
    vi.mocked(listProfileCourseProgress).mockResolvedValue([
      progressRow('a', 2, AFTER_PATH),
      progressRow('b', 2, AFTER_PATH)
    ]);

    await evaluateLearningPathCompletion('b', PROFILE_ID);

    expect(markLearningPathMemberCompleted).toHaveBeenCalledWith('member-1', expect.any(String));
  });

  it('leaves the path open while a course is unfinished', async () => {
    vi.mocked(listProfileCourseProgress).mockResolvedValue([
      progressRow('a', 2, AFTER_PATH),
      progressRow('b', 1, AFTER_PATH)
    ]);

    await evaluateLearningPathCompletion('b', PROFILE_ID);

    expect(markLearningPathMemberCompleted).not.toHaveBeenCalled();
  });
});
