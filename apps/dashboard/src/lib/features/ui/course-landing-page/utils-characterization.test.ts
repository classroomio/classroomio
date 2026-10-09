import { describe, expect, it } from 'vitest';

import { ContentType } from '@cio/utils/constants/content';
import { getCourseLessons, getCourseSections, getTotalLessons } from './utils';

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
    expect(sections[0]).toMatchObject({ id: 'section-1', exerciseCount: 1 });
    expect(sections[0].lessons.map((entry) => entry.id)).toEqual(['lesson-1']);
    expect(getTotalLessons(sections)).toBe(2);
  });

  it('returns an empty curriculum for an empty course', () => {
    const course = { title: 'Empty', content: { grouped: false, sections: [], items: [] } };

    expect(getCourseLessons(course as never)).toEqual([]);
    expect(getCourseSections(course as never)).toEqual([]);
    expect(getTotalLessons([])).toBe(0);
  });
});
