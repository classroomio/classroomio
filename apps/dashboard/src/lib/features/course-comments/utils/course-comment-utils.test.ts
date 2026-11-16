import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils/functions/translations', () => ({
  t: {
    get: (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key)
  }
}));

import {
  formatCommentDate,
  formatCommentTime,
  getAnchorChipLabel,
  getAnchorStateLabel,
  getPersonBadge,
  getThreadPath,
  isCourseCommentViewer,
  toCommentSegments
} from './anchor-utils';
import {
  groupThreadsByPage,
  matchesBlockFilter,
  matchesPeopleFilter,
  matchesStatusFilter,
  sortThreads
} from './filter-utils';
import type { CourseCommentThread } from './types';

const ADA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const GRACE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function thread(overrides: Partial<CourseCommentThread> = {}): CourseCommentThread {
  return {
    id: 't1',
    courseId: 'c1',
    status: 'open',
    anchorType: 'course',
    anchor: {
      locale: null,
      quote: null,
      prefix: null,
      suffix: null,
      start: null,
      seconds: null,
      slideNumber: null,
      x: null,
      y: null
    },
    anchorState: 'ok',
    location: { kind: 'course' },
    blockId: null,
    blockType: null,
    questionId: null,
    questionTitle: null,
    createdAt: '2026-11-14T10:00:00.000Z',
    lastActivityAt: '2026-11-14T10:00:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
    unreadCount: 0,
    comments: [
      {
        id: 'c1',
        author: { profileId: ADA, fullname: 'Ada', avatarUrl: null, role: 'admin', state: 'member' },
        body: 'Hi',
        mentions: [],
        editedAt: null,
        createdAt: '2026-11-14T10:00:00.000Z',
        canEdit: true,
        canDelete: true
      }
    ],
    ...overrides
  } as CourseCommentThread;
}

describe('isCourseCommentViewer', () => {
  it('lets course admins, tutors and org admins in, never in the student experience', () => {
    expect(isCourseCommentViewer({ isStudentExperience: false, isOrgAdmin: false, courseRoleId: 1 })).toBe(true);
    expect(isCourseCommentViewer({ isStudentExperience: false, isOrgAdmin: false, courseRoleId: 2 })).toBe(true);
    expect(isCourseCommentViewer({ isStudentExperience: false, isOrgAdmin: true, courseRoleId: null })).toBe(true);
    expect(isCourseCommentViewer({ isStudentExperience: false, isOrgAdmin: false, courseRoleId: 3 })).toBe(false);
    expect(isCourseCommentViewer({ isStudentExperience: true, isOrgAdmin: true, courseRoleId: 1 })).toBe(false);
  });
});

describe('labels', () => {
  it('formats video times', () => {
    expect(formatCommentTime(84)).toBe('1:24');
    expect(formatCommentTime(3725)).toBe('1:02:05');
  });

  it('labels anchors by kind', () => {
    const time = thread({ anchorType: 'time', blockType: 'video', anchor: { ...thread().anchor, seconds: 84 } });
    const slide = thread({ anchorType: 'slide', blockType: 'slides', anchor: { ...thread().anchor, slideNumber: 3 } });
    const exercisePage = thread({
      anchorType: 'page',
      location: { kind: 'exercise', exerciseId: 'e1', title: 'Quiz' }
    });

    expect(getAnchorChipLabel(time)).toBe('course.navItem.lessons.materials.blocks.types.video · 1:24');
    expect(getAnchorChipLabel(slide)).toBe('course_comments.anchor.slide:{"number":3}');
    expect(getAnchorChipLabel(exercisePage)).toBe('course_comments.anchor.exercise');
  });

  it('says an image changed rather than a video', () => {
    expect(getAnchorStateLabel(thread({ anchorType: 'point', anchorState: 'media_changed' }))).toBe(
      'course_comments.anchor_state.image_changed'
    );
    expect(getAnchorStateLabel(thread({ anchorType: 'time', anchorState: 'media_changed' }))).toBe(
      'course_comments.anchor_state.media_changed'
    );
    expect(getAnchorStateLabel(thread())).toBeNull();
  });

  it('marks former members over their role', () => {
    expect(
      getPersonBadge({ profileId: ADA, fullname: 'Ada', avatarUrl: null, role: null, state: 'former_member' })
    ).toBe('course_comments.person.former_member');
    expect(getPersonBadge({ profileId: ADA, fullname: 'Ada', avatarUrl: null, role: 'tutor', state: 'member' })).toBe(
      'course_comments.person.role.tutor'
    );
  });

  it('formats dates relative to now', () => {
    const now = new Date('2026-11-14T12:00:00.000Z');

    expect(formatCommentDate('2026-11-14T10:00:00.000Z', 'en', now)).toBe('2 hours ago');
    expect(formatCommentDate('2026-11-14T11:59:40.000Z', 'en', now)).toBe('now');
  });
});

describe('toCommentSegments', () => {
  it('shows mentions with the current name and greys out people who left', () => {
    const body = '@Gracie and @Ada';
    const comment = {
      ...thread().comments[0],
      body,
      mentions: [
        { profileId: GRACE, start: 0, end: 7, fullname: 'Grace Hopper', isActive: true },
        { profileId: ADA, start: 12, end: 16, fullname: 'Ada', isActive: false }
      ]
    };

    expect(toCommentSegments(comment)).toEqual([
      { kind: 'mention', text: '@Grace Hopper', inactive: false },
      { kind: 'text', text: ' and ' },
      { kind: 'mention', text: '@Ada', inactive: true }
    ]);
  });
});

describe('filters', () => {
  it('matches status buckets', () => {
    const unread = thread({ unreadCount: 2 });
    const resolved = thread({ status: 'resolved' });

    expect(matchesStatusFilter(unread, { unread: true, read: false, resolved: false })).toBe(true);
    expect(matchesStatusFilter(thread(), { unread: true, read: false, resolved: false })).toBe(false);
    expect(matchesStatusFilter(resolved, { unread: true, read: true, resolved: false })).toBe(false);
    expect(matchesStatusFilter(resolved, { unread: false, read: false, resolved: true })).toBe(true);
  });

  it('matches people who commented', () => {
    expect(matchesPeopleFilter(thread(), new Set())).toBe(true);
    expect(matchesPeopleFilter(thread(), new Set([ADA]))).toBe(true);
    expect(matchesPeopleFilter(thread(), new Set([GRACE]))).toBe(false);
  });

  it('matches the block on the same lesson only', () => {
    const onBlock = thread({ blockId: 'b1', location: { kind: 'lesson', lessonId: 'l1', title: 'One' } });

    expect(matchesBlockFilter(onBlock, { lessonId: 'l1', blockId: 'b1', blockType: 'note' })).toBe(true);
    expect(matchesBlockFilter(onBlock, { lessonId: 'l2', blockId: 'b1', blockType: 'note' })).toBe(false);
  });

  it('groups General first, then pages in course order, then pages missing from the outline', () => {
    const general = thread({ id: 'g' });
    const second = thread({ id: 's', location: { kind: 'lesson', lessonId: 'l2', title: 'Two' } });
    const first = thread({ id: 'f', location: { kind: 'exercise', exerciseId: 'e1', title: 'Quiz' } });
    const orphan = thread({ id: 'o', location: { kind: 'lesson', lessonId: 'gone', title: 'Old lesson' } });

    const groups = groupThreadsByPage(
      [second, orphan, general, first],
      [
        { id: 'e1', title: 'Quiz' },
        { id: 'l2', title: 'Two' }
      ]
    );

    expect(groups.map((group) => [group.key, group.title])).toEqual([
      ['general', null],
      ['e1', 'Quiz'],
      ['l2', 'Two'],
      ['gone', 'Old lesson']
    ]);
  });

  it('sorts by latest activity', () => {
    const older = thread({ id: 'old', lastActivityAt: '2026-11-13T10:00:00.000Z' });
    const newer = thread({ id: 'new', lastActivityAt: '2026-11-14T10:00:00.000Z' });

    expect(sortThreads([older, newer]).map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('links lesson, exercise and course threads', () => {
    expect(getThreadPath('c1', thread({ id: 't', location: { kind: 'lesson', lessonId: 'l1', title: null } }))).toBe(
      '/courses/c1/lessons/l1?thread=t'
    );
    expect(getThreadPath('c1', thread({ id: 't' }))).toBe('/courses/c1/lessons?thread=t');
  });
});
