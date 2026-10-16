import { describe, expect, it } from 'vitest';

import { ContentType } from '@cio/utils/constants/content';
import { updateLessonCompletionInCourseContent } from './content-completion';

function course() {
  return {
    id: 'course-1',
    title: 'Course',
    metadata: { progressionMode: 'free' },
    content: {
      grouped: false,
      sections: [],
      items: [
        { id: 'lesson-1', type: ContentType.Lesson, title: 'One', order: 1, isUnlocked: true, isComplete: false },
        { id: 'lesson-2', type: ContentType.Lesson, title: 'Two', order: 2, isUnlocked: true, isComplete: false },
        { id: 'exercise-1', type: ContentType.Exercise, title: 'Quiz', order: 3, isUnlocked: true, isComplete: false }
      ]
    }
  };
}

describe('characterization: updateLessonCompletionInCourseContent (zero activities)', () => {
  it('patches only the matching lesson', () => {
    const updated = updateLessonCompletionInCourseContent(course() as never, 'lesson-1', true);
    const byId = new Map(updated.content.items.map((entry: { id: string }) => [entry.id, entry]));

    expect((byId.get('lesson-1') as { isComplete: boolean }).isComplete).toBe(true);
    expect((byId.get('lesson-2') as { isComplete: boolean }).isComplete).toBe(false);
    expect((byId.get('exercise-1') as { isComplete: boolean }).isComplete).toBe(false);
  });

  it('leaves exercises untouched when their id matches a lesson id', () => {
    const updated = updateLessonCompletionInCourseContent(course() as never, 'exercise-1', true);
    const byId = new Map(updated.content.items.map((entry: { id: string }) => [entry.id, entry]));

    expect((byId.get('exercise-1') as { isComplete: boolean }).isComplete).toBe(false);
  });

  it('patches grouped content in place', () => {
    const grouped = {
      id: 'course-1',
      title: 'Grouped',
      metadata: { progressionMode: 'free' },
      content: {
        grouped: true,
        sections: [
          {
            id: 'section-1',
            title: 'Basics',
            order: 1,
            items: [
              { id: 'lesson-1', type: ContentType.Lesson, title: 'One', order: 1, isUnlocked: true, isComplete: false }
            ]
          }
        ],
        items: []
      }
    };

    const updated = updateLessonCompletionInCourseContent(grouped as never, 'lesson-1', true);

    expect(updated.content.sections[0].items[0].isComplete).toBe(true);
  });
});
