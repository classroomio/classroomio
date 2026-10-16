import { describe, expect, it } from 'vitest';

import { ContentType } from '@cio/utils/constants/content';
import {
  getContentItemsProgress,
  getContentRoute,
  getCourseProgress,
  getMentionableContent,
  getOrderedNavigableContent
} from './content';
import { updateContentCompletion } from './content-completion';
import { getStudentContentLockDescriptionKey } from './content-lock-utils';
import { isCourseContentRoute } from './sidebar-routes';
import { calcCourseProgress, getActiveCourseNavKey, getSingleActivityNavLabelKey } from './functions';
import { isCourseMobileBottomNavVisible } from './mobile-bottom-nav';

function activity(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: ContentType.Activity,
    activityKind: 'scorm',
    title: `Package ${id}`,
    order: 3,
    sectionId: null,
    isUnlocked: true,
    isComplete: false,
    ...overrides
  };
}

function lesson(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: ContentType.Lesson,
    title: `Lesson ${id}`,
    order: 1,
    sectionId: null,
    isUnlocked: true,
    isComplete: false,
    ...overrides
  };
}

function groupedCourse(items: unknown[]) {
  return {
    id: 'course-1',
    title: 'Grouped',
    content: {
      grouped: true,
      sections: [{ id: 'section-1', title: 'Basics', order: 1, items }],
      items: []
    }
  };
}

describe('activities in shared content utilities', () => {
  it('routes an activity to its page', () => {
    expect(getContentRoute('course-1', { id: 'activity-1', type: ContentType.Activity })).toBe(
      '/courses/course-1/activities/activity-1'
    );
  });

  it('treats activities as navigable and mentionable', () => {
    const course = groupedCourse([lesson('lesson-1'), activity('activity-1')]);

    expect(getOrderedNavigableContent(course as never).map((item) => item.id)).toEqual(['lesson-1', 'activity-1']);
    expect(getMentionableContent(course as never)).toContainEqual({
      id: 'activity-1',
      title: 'Package activity-1',
      type: ContentType.Activity
    });
  });

  it('counts activities in progress', () => {
    const course = groupedCourse([
      lesson('lesson-1', { isComplete: true }),
      activity('activity-1', { isComplete: true }),
      activity('activity-2', { isComplete: false })
    ]);

    expect(getCourseProgress(course as never)).toMatchObject({
      activitiesTotal: 2,
      activitiesComplete: 1,
      total: 3,
      completed: 2,
      percent: 67
    });
    expect(getContentItemsProgress([]).activitiesTotal).toBe(0);
  });

  it('patches only the matching activity completion', () => {
    const course = groupedCourse([lesson('lesson-1'), activity('activity-1'), activity('activity-2')]);

    const updated = updateContentCompletion(course as never, ContentType.Activity, 'activity-2', true);
    const items = updated.content.sections[0].items as Array<{ id: string; isComplete: boolean }>;
    expect(items.find((item) => item.id === 'activity-2')?.isComplete).toBe(true);
    expect(items.find((item) => item.id === 'activity-1')?.isComplete).toBe(false);
    expect(items.find((item) => item.id === 'lesson-1')?.isComplete).toBe(false);
  });

  it('describes the activity lock with its own copy', () => {
    expect(getStudentContentLockDescriptionKey('progression_locked', ContentType.Activity)).toBe(
      'course.navItem.lessons.content_progression_locked_description_activity'
    );
  });

  it('recognizes activity routes as content routes', () => {
    expect(isCourseContentRoute('/courses/course-1/activities/activity-1')).toBe(true);
    expect(isCourseContentRoute('/courses/course-1/lessons/lesson-1')).toBe(true);
  });

  it('maps the activity segment to the content nav key', () => {
    expect(getActiveCourseNavKey('/courses/course-1/activities/activity-1', 'course-1')).toBe(
      'course.navItems.nav_content'
    );
  });

  it('maps the activity segment to the package nav key in a SCORM course', () => {
    expect(getActiveCourseNavKey('/courses/course-1/activities/activity-1', 'course-1', 'single_activity')).toBe(
      'course.navItems.nav_package'
    );
    expect(
      getActiveCourseNavKey('/courses/course-1/activities/activity-1', 'course-1', { format: 'single_activity' })
    ).toBe('course.navItems.nav_package');
    expect(getSingleActivityNavLabelKey('scorm')).toBe('course.navItems.nav_package');
  });

  it('includes activities in course progress math', () => {
    expect(
      calcCourseProgress({ lessonsCompleted: 1, totalLessons: 1, activitiesCompleted: 1, totalActivities: 2 })
    ).toBe(67);
    expect(calcCourseProgress({ lessonsCompleted: 1, totalLessons: 1 })).toBe(100);
  });

  it('shows the mobile bottom nav on content pages', () => {
    const progress = getContentItemsProgress([activity('activity-1')]);
    expect(
      isCourseMobileBottomNavVisible({
        isCourseLearnerView: true,
        isMobile: true,
        isContentPage: true,
        courseProgress: progress
      })
    ).toBe(true);
  });
});
