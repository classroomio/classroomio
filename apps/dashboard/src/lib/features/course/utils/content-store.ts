import { ContentType } from '@cio/utils/constants/content';
import { UNGROUPED_SECTION_KEY } from '@cio/utils/functions/course-content';
import type { CourseContent, CourseContentItem } from './types';

export type NewCourseContentSection = {
  id: string;
  title: string;
  order?: number | null;
};

export type NewCourseContentItem = {
  id: string;
  title: string;
  type: ContentType.Lesson | ContentType.Exercise;
  order?: number | null;
  sectionId?: string | null;
  isUnlocked?: boolean | null;
  createdAt?: string | Date | null;
  lessonAt?: string | Date | null;
  callUrl?: string | null;
};

function toNullableTimestamp(value: string | Date | null | undefined): string | null {
  if (!value) return null;

  return value instanceof Date ? value.toISOString() : value;
}

export function toCourseContentItem(item: NewCourseContentItem): CourseContentItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    order: item.order ?? null,
    createdAt: toNullableTimestamp(item.createdAt),
    sectionId: item.sectionId ?? null,
    isUnlocked: item.isUnlocked ?? true,
    isComplete: false,
    lessonAt: toNullableTimestamp(item.lessonAt),
    callUrl: item.callUrl ?? null,
    hasNoteContent: false,
    hasSlideContent: false,
    videosCount: 0,
    documentsCount: 0,
    questionCount: null,
    dueBy: null
  };
}

export function addSectionToCourseContent(content: CourseContent, section: NewCourseContentSection): CourseContent {
  if (content.sections.some((entry) => entry.id === section.id)) {
    return content;
  }

  return {
    grouped: true,
    items: [],
    sections: [
      ...content.sections,
      {
        id: section.id,
        title: section.title,
        order: section.order ?? content.sections.length + 1,
        items: []
      }
    ]
  };
}

function contentHasItem(content: CourseContent, item: CourseContentItem): boolean {
  if (content.grouped) {
    return content.sections.some((section) =>
      section.items.some((entry) => entry.id === item.id && entry.type === item.type)
    );
  }

  return content.items.some((entry) => entry.id === item.id && entry.type === item.type);
}

export function addItemToCourseContent(content: CourseContent, item: CourseContentItem): CourseContent {
  if (contentHasItem(content, item)) {
    return content;
  }

  if (!content.grouped) {
    return {
      ...content,
      items: [...content.items, item]
    };
  }

  const targetSectionId = item.sectionId ?? UNGROUPED_SECTION_KEY;
  const hasSection = content.sections.some((section) => section.id === targetSectionId);

  if (!hasSection) {
    return {
      ...content,
      sections: [
        ...content.sections,
        {
          id: targetSectionId,
          title: targetSectionId === UNGROUPED_SECTION_KEY ? 'Ungrouped' : 'Untitled section',
          order: content.sections.length + 1,
          items: [item]
        }
      ]
    };
  }

  return {
    ...content,
    sections: content.sections.map((section) =>
      section.id === targetSectionId ? { ...section, items: [...section.items, item] } : section
    )
  };
}
