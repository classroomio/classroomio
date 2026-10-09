import { describe, expect, it } from 'vitest';

import { calcCourseProgressPercent, isBeforeOrEqualDeadline } from '@api/utils/course-completion';
import { evaluateCourseGoLiveReadiness } from '@cio/core/services/course/go-live-readiness';
import { buildCourseContent } from '@cio/core/services/course/utils';
import { reorderContentParam } from '@cio/core/services/agent/agent-tool-schemas';
import { contentWriteBumpsTimestamp } from '@cio/db/queries/course/content-timestamp';
import { ZCourseContentDelete, ZCourseContentReorder, ZCourseContentUpdate } from '@cio/utils/validation/course/course';
import { detectTemplateContentChanges } from '@cio/utils/validation/course/template-sync';
import { ContentType } from '@cio/utils/constants';

function readinessCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'course-1',
    title: 'Workplace Safety Essentials',
    description: 'A practical course for safer day-to-day workplace decisions.',
    overview: 'Learn the policies, habits, and reporting steps that keep teams safe.',
    slug: 'workplace-safety-essentials',
    bannerImage: 'https://example.com/banner.jpg',
    metadata: {
      description: 'A public-facing overview of the safety course.',
      goals: 'Identify hazards and follow safe procedures.',
      requirements: 'No prior training required.',
      allowNewStudent: true
    },
    type: 'SELF_PACED',
    cost: 0,
    certificate: null,
    ...overrides
  };
}

function contentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lesson-1',
    type: ContentType.Lesson,
    title: 'Introduction',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    sectionId: null,
    isUnlocked: true,
    isComplete: false,
    lessonAt: null,
    callUrl: null,
    hasNoteContent: true,
    hasSlideContent: false,
    videosCount: 0,
    documentsCount: 0,
    questionCount: null,
    dueBy: null,
    ...overrides
  };
}

describe('characterization: calcCourseProgressPercent (zero activities)', () => {
  it('returns 0 when a course has no lessons or exercises', () => {
    expect(
      calcCourseProgressPercent({ lessonsCompleted: 0, totalLessons: 0, exercisesCompleted: 0, exercisesCount: 0 })
    ).toBe(0);
  });

  it('combines lessons and exercises into one percentage', () => {
    // 1 of 2 lessons + 1 of 1 exercise = 2/3 = 67%.
    expect(
      calcCourseProgressPercent({ lessonsCompleted: 1, totalLessons: 2, exercisesCompleted: 1, exercisesCount: 1 })
    ).toBe(67);
  });

  it('rounds half-up on fractional progress', () => {
    // 1 of 3 items = 33%.
    expect(
      calcCourseProgressPercent({ lessonsCompleted: 1, totalLessons: 2, exercisesCompleted: 0, exercisesCount: 1 })
    ).toBe(33);
  });
});

describe('characterization: isBeforeOrEqualDeadline', () => {
  it('treats a missing deadline as always within deadline', () => {
    expect(isBeforeOrEqualDeadline(null, new Date('2026-10-09T00:00:00.000Z'))).toBe(true);
    expect(isBeforeOrEqualDeadline(undefined, new Date('2026-10-09T00:00:00.000Z'))).toBe(true);
  });

  it('compares against the current time', () => {
    expect(isBeforeOrEqualDeadline('2027-12-31T23:59:00.000Z', new Date('2026-10-09T00:00:00.000Z'))).toBe(true);
    expect(isBeforeOrEqualDeadline('2020-01-01T00:00:00.000Z', new Date('2026-10-09T00:00:00.000Z'))).toBe(false);
  });
});

describe('characterization: evaluateCourseGoLiveReadiness (zero activities)', () => {
  it('blocks an empty course on content', () => {
    const readiness = evaluateCourseGoLiveReadiness({
      course: readinessCourse() as never,
      contentItems: [],
      organization: null
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers.map((blocker) => blocker.code)).toContain('COURSE_CONTENT_MISSING');
  });

  it('is ready with one complete lesson and full landing copy', () => {
    const readiness = evaluateCourseGoLiveReadiness({
      course: readinessCourse() as never,
      contentItems: [contentRow() as never],
      organization: {
        customDomain: 'school.example.com',
        isCustomDomainVerified: true,
        siteName: 'school'
      } as never
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
  });

  it('flags lessons without content and exercises without questions', () => {
    const readiness = evaluateCourseGoLiveReadiness({
      course: readinessCourse() as never,
      contentItems: [
        contentRow({ hasNoteContent: false, hasSlideContent: false }) as never,
        contentRow({ id: 'exercise-1', type: ContentType.Exercise, title: 'Quiz', questionCount: 0 }) as never
      ],
      organization: null
    });

    expect(readiness.blockers.map((blocker) => blocker.code)).toEqual(
      expect.arrayContaining(['LESSON_CONTENT_EMPTY', 'EXERCISE_QUESTIONS_MISSING'])
    );
  });
});

describe('characterization: buildCourseContent (zero activities)', () => {
  it('returns a flat item list when grouping is off', () => {
    const content = buildCourseContent(
      [
        contentRow({ id: 'lesson-1', order: 2 }) as never,
        contentRow({ id: 'exercise-1', type: ContentType.Exercise, title: 'Quiz', order: 1 }) as never
      ],
      false
    );

    expect(content.grouped).toBe(false);
    expect(content.items.map((item) => item.id)).toEqual(['exercise-1', 'lesson-1']);
  });

  it('groups lessons and exercises under their sections in order', () => {
    const content = buildCourseContent(
      [
        contentRow({ id: 'section-1', type: ContentType.Section, title: 'Basics', order: 1 }) as never,
        contentRow({ id: 'lesson-1', order: 2, sectionId: 'section-1' }) as never,
        contentRow({
          id: 'exercise-1',
          type: ContentType.Exercise,
          title: 'Quiz',
          order: 3,
          sectionId: 'section-1'
        }) as never
      ],
      true
    );

    expect(content.grouped).toBe(true);
    expect(content.sections).toHaveLength(1);
    expect(content.sections[0].items.map((item) => item.id)).toEqual(['lesson-1', 'exercise-1']);
  });

  it('collects section-less items under an ungrouped section', () => {
    const content = buildCourseContent([contentRow({ id: 'lesson-1', sectionId: null }) as never], true);

    expect(content.sections).toHaveLength(1);
    expect(content.sections[0].id).toBe('ungrouped');
  });
});

describe('characterization: course content validation schemas (zero activities)', () => {
  it('accepts lesson and exercise update items', () => {
    const result = ZCourseContentUpdate.safeParse({
      items: [
        { id: 'lesson-1', type: 'LESSON', isUnlocked: false },
        { id: 'exercise-1', type: 'EXERCISE', order: 2 }
      ]
    });

    expect(result.success).toBe(true);
  });

  it('rejects section items where only lessons and exercises are allowed', () => {
    const result = ZCourseContentUpdate.safeParse({ items: [{ id: 'section-1', type: 'SECTION' }] });

    expect(result.success).toBe(false);
  });

  it('requires sections or items on reorder', () => {
    expect(ZCourseContentReorder.safeParse({}).success).toBe(false);
    expect(ZCourseContentReorder.safeParse({ items: [{ id: 'lesson-1', type: 'LESSON', order: 1 }] }).success).toBe(
      true
    );
  });

  it('accepts lesson and exercise deletes', () => {
    expect(ZCourseContentDelete.safeParse({ items: [{ id: 'lesson-1', type: 'LESSON' }] }).success).toBe(true);
    expect(ZCourseContentDelete.safeParse({ items: [{ id: 'section-1', type: 'SECTION' }] }).success).toBe(false);
  });

  it('accepts lesson and exercise items in the agent reorder param', () => {
    const result = reorderContentParam.safeParse({
      items: [
        { id: 'lesson-1', type: 'LESSON', order: 1 },
        { id: 'exercise-1', type: 'EXERCISE', sectionId: null }
      ]
    });

    expect(result.success).toBe(true);
  });
});

describe('characterization: detectTemplateContentChanges (zero activities)', () => {
  it('reports no changes when the course matches the template', () => {
    const stamp = '2026-01-01T00:00:00.000Z';
    const detected = detectTemplateContentChanges({
      courseCreatedAt: stamp,
      templateSections: [{ id: 'section-1', title: 'Basics', order: 1, createdAt: stamp, updatedAt: stamp }],
      templateLessons: [
        {
          id: 'lesson-1',
          title: 'Intro',
          order: 1,
          sectionId: 'section-1',
          createdAt: stamp,
          updatedAt: stamp,
          locales: []
        }
      ],
      templateExercises: [],
      courseSections: [
        {
          id: 'course-section-1',
          title: 'Basics',
          order: 1,
          createdAt: stamp,
          updatedAt: stamp,
          sourceId: 'section-1',
          sourceSyncedAt: stamp
        }
      ],
      courseLessons: [
        {
          id: 'course-lesson-1',
          title: 'Intro',
          order: 1,
          sectionId: 'course-section-1',
          createdAt: stamp,
          updatedAt: stamp,
          sourceId: 'lesson-1',
          sourceSyncedAt: stamp,
          locales: []
        }
      ],
      courseExercises: []
    } as never);

    expect(detected).toEqual([]);
  });

  it('detects a renamed template lesson', () => {
    const stamp = '2026-01-01T00:00:00.000Z';
    const detected = detectTemplateContentChanges({
      courseCreatedAt: stamp,
      templateSections: [],
      templateLessons: [
        {
          id: 'lesson-1',
          title: 'Renamed intro',
          order: 1,
          sectionId: null,
          createdAt: stamp,
          updatedAt: '2026-05-01T00:00:00.000Z',
          locales: []
        }
      ],
      templateExercises: [],
      courseSections: [],
      courseLessons: [
        {
          id: 'course-lesson-1',
          title: 'Intro',
          order: 1,
          sectionId: null,
          createdAt: stamp,
          updatedAt: stamp,
          sourceId: 'lesson-1',
          sourceSyncedAt: stamp,
          locales: []
        }
      ],
      courseExercises: []
    } as never);

    expect(detected).toHaveLength(1);
    expect(detected[0]).toMatchObject({ kind: 'lesson', id: 'lesson-1' });
  });
});

describe('characterization: contentWriteBumpsTimestamp (zero activities)', () => {
  it('ignores order-only and section moves', () => {
    expect(contentWriteBumpsTimestamp(['order'])).toBe(false);
    expect(contentWriteBumpsTimestamp(['sectionId'])).toBe(false);
  });

  it('bumps on content field writes', () => {
    expect(contentWriteBumpsTimestamp(['isUnlocked'])).toBe(true);
    expect(contentWriteBumpsTimestamp(['title'])).toBe(true);
  });
});
