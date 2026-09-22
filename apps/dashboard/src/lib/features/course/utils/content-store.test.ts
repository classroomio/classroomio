import { describe, expect, it } from 'vitest';
import { ContentType } from '@cio/utils/constants/content';
import { UNGROUPED_SECTION_KEY } from '@cio/utils/functions/course-content';
import { addItemToCourseContent, addSectionToCourseContent, toCourseContentItem } from './content-store';
import type { CourseContent } from './types';

const emptyGroupedContent: CourseContent = {
  grouped: true,
  sections: [],
  items: []
};

describe('addSectionToCourseContent', () => {
  it('appends a section to an empty grouped outline', () => {
    const next = addSectionToCourseContent(emptyGroupedContent, {
      id: 'section-1',
      title: 'Week 1',
      order: 1
    });

    expect(next.grouped).toBe(true);
    expect(next.sections).toEqual([
      {
        id: 'section-1',
        title: 'Week 1',
        order: 1,
        items: []
      }
    ]);
  });

  it('does not duplicate an existing section', () => {
    const content = addSectionToCourseContent(emptyGroupedContent, {
      id: 'section-1',
      title: 'Week 1',
      order: 1
    });

    expect(addSectionToCourseContent(content, { id: 'section-1', title: 'Week 1 again', order: 2 })).toBe(content);
  });
});

describe('addItemToCourseContent', () => {
  it('adds a lesson to the matching section', () => {
    const content = addSectionToCourseContent(emptyGroupedContent, {
      id: 'section-1',
      title: 'Week 1',
      order: 1
    });
    const lesson = toCourseContentItem({
      id: 'lesson-1',
      title: 'Intro',
      type: ContentType.Lesson,
      order: 1,
      sectionId: 'section-1'
    });

    const next = addItemToCourseContent(content, lesson);

    expect(next.sections[0]?.items).toEqual([lesson]);
  });

  it('does not drop an existing section when a later lesson is added', () => {
    const withSection = addSectionToCourseContent(emptyGroupedContent, {
      id: 'section-1',
      title: 'Week 1',
      order: 1
    });
    const lesson = toCourseContentItem({
      id: 'lesson-1',
      title: 'Intro',
      type: ContentType.Lesson,
      order: 1,
      sectionId: 'section-1'
    });

    const next = addItemToCourseContent(withSection, lesson);

    expect(next.sections).toHaveLength(1);
    expect(next.sections[0]?.id).toBe('section-1');
    expect(next.sections[0]?.items).toHaveLength(1);
  });

  it('is idempotent when the same lesson is added twice', () => {
    const content = addSectionToCourseContent(emptyGroupedContent, {
      id: 'section-1',
      title: 'Week 1',
      order: 1
    });
    const lesson = toCourseContentItem({
      id: 'lesson-1',
      title: 'Intro',
      type: ContentType.Lesson,
      order: 1,
      sectionId: 'section-1'
    });
    const withLesson = addItemToCourseContent(content, lesson);

    expect(addItemToCourseContent(withLesson, lesson)).toBe(withLesson);
  });

  it('places unsectioned items in the ungrouped bucket', () => {
    const lesson = toCourseContentItem({
      id: 'lesson-1',
      title: 'Intro',
      type: ContentType.Lesson,
      order: 1
    });

    const next = addItemToCourseContent(emptyGroupedContent, lesson);

    expect(next.sections[0]?.id).toBe(UNGROUPED_SECTION_KEY);
    expect(next.sections[0]?.items).toEqual([lesson]);
  });
});
