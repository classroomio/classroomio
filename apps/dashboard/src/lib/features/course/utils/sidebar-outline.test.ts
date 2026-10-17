import { describe, expect, it } from 'vitest';
import { ContentType } from '@cio/utils/constants/content';
import { flattenNavigableItems } from '@cio/utils/functions/course-progression';
import {
  buildSidebarOutline,
  outlineReorderPayload,
  outlineToCourseContent,
  updateSidebarOutlineZone
} from './sidebar-outline';
import type { CourseContent, CourseContentItem } from './types';

const intro = {
  id: 'intro',
  title: 'Introduction',
  type: ContentType.Lesson,
  order: 1,
  sectionId: null
} as CourseContentItem;
const quiz = {
  id: 'quiz',
  title: 'Knowledge check',
  type: ContentType.Exercise,
  order: 1,
  sectionId: 'settings'
} as CourseContentItem;
const courseContent: CourseContent = {
  grouped: true,
  sections: [
    { id: 'settings', title: 'Settings', order: 2, items: [quiz] },
    { id: 'ungrouped', title: '', order: null, items: [intro] }
  ],
  items: []
};

describe('sidebar outline moves', () => {
  it('moves a standalone lesson into a section', () => {
    const entries = buildSidebarOutline(courseContent);
    const section = entries[1];
    if (section.kind !== 'section') throw new Error('Expected a section');
    section.items.unshift(entries[0]);
    const moved = [section];
    expect(outlineReorderPayload(moved)).toEqual({
      sections: [{ id: 'settings', order: 1 }],
      items: [
        { id: 'intro', type: 'LESSON', order: 1, sectionId: 'settings' },
        { id: 'quiz', type: 'EXERCISE', order: 2, sectionId: 'settings' }
      ]
    });
    expect(outlineToCourseContent(moved, true).sections[0].items[0].sectionId).toBe('settings');
  });

  it('moves an exercise outside a section and persists a null parent', () => {
    const entries = buildSidebarOutline(courseContent);
    const section = entries[1];
    if (section.kind !== 'section') throw new Error('Expected a section');
    const movedExercise = section.items[0];
    section.items = [];
    const moved = [movedExercise, entries[0], section];
    const result = outlineToCourseContent(moved, true);
    expect(flattenNavigableItems(result).map((item) => item.id)).toEqual(['quiz', 'intro']);
    expect(outlineReorderPayload(moved).items?.[0]).toEqual({
      id: 'quiz',
      type: 'EXERCISE',
      order: 1,
      sectionId: null
    });
    expect(result.sections.find((entry) => entry.id === 'settings')?.items).toEqual([]);
  });

  it('moves sections with their children intact', () => {
    const entries = buildSidebarOutline(courseContent);
    const moved = [entries[1], entries[0]];
    expect(flattenNavigableItems(outlineToCourseContent(moved, true)).map((item) => item.id)).toEqual([
      'quiz',
      'intro'
    ]);
    expect(outlineReorderPayload(moved).sections).toEqual([{ id: 'settings', order: 1 }]);
  });
});

describe('nested drag event reconciliation', () => {
  it('does not resurrect a removed child when the root zone emits its older section snapshot', () => {
    const staleRoot = buildSidebarOutline(courseContent);
    const currentRoot = updateSidebarOutlineZone(staleRoot, 'settings', []);
    const staleSection = staleRoot[1];
    if (staleSection.kind !== 'section') throw new Error('Expected section');

    const nextRoot = updateSidebarOutlineZone(currentRoot, null, [staleRoot[0], staleSection.items[0], staleSection]);
    const payload = outlineReorderPayload(nextRoot);
    expect(payload.items?.filter((item) => item.id === 'quiz')).toEqual([
      { id: 'quiz', type: 'EXERCISE', order: 2, sectionId: null }
    ]);
  });
});
