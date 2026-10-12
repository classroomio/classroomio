import { describe, expect, it } from 'vitest';

import { ContentType } from '@cio/utils/constants/content';
import { getCourseLessons, getCourseSections, getTotalActivities, getTotalLessons } from './utils';

function lesson(id: string, order: number, sectionId: string | null = null) {
  return { id, type: ContentType.Lesson, title: `Title ${id}`, order, createdAt: null, sectionId };
}

function exerciseItem(id: string, order: number, sectionId: string | null = null) {
  return { id, type: ContentType.Exercise, title: `Title ${id}`, order, createdAt: null, sectionId };
}

describe('characterization: course landing page curriculum (zero activities)', () => {
  it('lists lessons from a flat ungrouped course', () => {
    const course = {
      title: 'Course',
      content: { grouped: false, sections: [], items: [lesson('lesson-1', 1), exerciseItem('exercise-1', 2)] }
    };

    expect(getCourseLessons(course as never).map((entry) => entry.id)).toEqual(['lesson-1']);
  });

  it('groups lessons by section and counts exercises', () => {
    const course = {
      title: 'Course',
      content: {
        grouped: true,
        sections: [
          {
            id: 'section-1',
            title: 'Basics',
            items: [lesson('lesson-1', 1, 'section-1'), exerciseItem('exercise-1', 2, 'section-1')]
          },
          { id: 'section-2', title: 'Advanced', items: [lesson('lesson-2', 1, 'section-2')] }
        ],
        items: []
      }
    };

    const sections = getCourseSections(course as never);

    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({ id: 'section-1', exerciseCount: 1, activityCount: 0 });
    expect(sections[0].activities).toEqual([]);
    expect(sections[0].lessons.map((entry) => entry.id)).toEqual(['lesson-1']);
    expect(getTotalLessons(sections)).toBe(2);
  });

  it('returns an empty curriculum for an empty course', () => {
    const course = { title: 'Empty', content: { grouped: false, sections: [], items: [] } };

    expect(getCourseLessons(course as never)).toEqual([]);
    expect(getCourseSections(course as never)).toEqual([]);
    expect(getTotalLessons([])).toBe(0);
  });

  it('lists packages alongside lessons in their section', () => {
    const course = {
      title: 'Course',
      content: {
        grouped: false,
        sections: [],
        items: [
          lesson('lesson-1', 1),
          {
            id: 'activity-1',
            type: ContentType.Activity,
            title: 'Title activity-1',
            order: 2,
            createdAt: null
          }
        ]
      }
    };

    const [section] = getCourseSections(course as never);

    expect(section.activityCount).toBe(1);
    expect(section.activities.map((entry) => entry.id)).toEqual(['activity-1']);
    expect(section.lessons.map((entry) => entry.id)).toEqual(['lesson-1']);
    expect(getTotalActivities([section])).toBe(1);
  });

  it('lists package modules for a SCORM course', () => {
    const course = {
      title: 'Package course',
      format: 'scorm',
      content: {
        grouped: false,
        sections: [],
        items: [
          {
            id: 'activity-1',
            type: ContentType.Activity,
            title: 'Title activity-1',
            order: 1,
            createdAt: null,
            modules: [
              { identifier: 'm1', title: 'Module one', position: 1 },
              { identifier: 'm2', title: 'Module two', position: 2 }
            ]
          }
        ]
      }
    };

    const [section] = getCourseSections(course as never);

    expect(section.activities).toHaveLength(1);
    expect(section.activities[0].modules?.map((module) => module.title)).toEqual(['Module one', 'Module two']);
  });
});
