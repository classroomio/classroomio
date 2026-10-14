import { getCourseOutline, UNGROUPED_SECTION_KEY } from '@cio/utils/functions/course-content';
import { ContentType } from '@cio/utils/constants/content';
import type { TCourseContentReorder } from '@cio/utils/validation/course';
import type { CourseContent, SidebarOutlineEntry } from './types';

export function buildSidebarOutline(content: CourseContent): SidebarOutlineEntry[] {
  return getCourseOutline(content).map((entry) => {
    if (entry.kind === 'item') return entry;

    const { items, ...section } = entry.section;
    const children: SidebarOutlineEntry[] = items.map((item) => ({
      id: `${item.type}-${item.id}`,
      kind: 'item',
      order: item.order ?? 0,
      item
    }));
    return { id: entry.id, kind: 'section', order: entry.order, section, items: children };
  });
}

export function outlineReorderPayload(entries: SidebarOutlineEntry[], grouped = true): TCourseContentReorder {
  const sections: NonNullable<TCourseContentReorder['sections']> = [];
  const items: NonNullable<TCourseContentReorder['items']> = [];
  function appendItem(entry: SidebarOutlineEntry, order: number, sectionId: string | null) {
    if (entry.kind !== 'item' || entry.item.type === ContentType.Section) return;

    items.push({ id: entry.item.id, type: entry.item.type, order, sectionId });
  }
  entries.forEach((entry, index) => {
    if (entry.kind === 'item') {
      appendItem(entry, index + 1, grouped ? null : entry.item.sectionId);
      return;
    }

    sections.push({ id: entry.section.id, order: index + 1 });
    entry.items.forEach((child, childIndex) => appendItem(child, childIndex + 1, entry.section.id));
  });
  return { ...(sections.length ? { sections } : {}), ...(items.length ? { items } : {}) };
}

export function outlineToCourseContent(entries: SidebarOutlineEntry[], grouped: boolean): CourseContent {
  const sections: CourseContent['sections'] = [];
  const standaloneItems: CourseContent['items'] = [];
  entries.forEach((entry, index) => {
    if (entry.kind === 'item') {
      standaloneItems.push({ ...entry.item, order: index + 1, sectionId: grouped ? null : entry.item.sectionId });
      return;
    }

    const items = entry.items.flatMap((child, childIndex) =>
      child.kind === 'item' ? [{ ...child.item, order: childIndex + 1, sectionId: entry.section.id }] : []
    );
    sections.push({ ...entry.section, order: index + 1, items });
  });
  if (!grouped) return { grouped, sections: [], items: standaloneItems };

  if (standaloneItems.length) {
    sections.push({ id: UNGROUPED_SECTION_KEY, title: '', order: null, items: standaloneItems });
  }
  return { grouped, sections, items: [] };
}

export function updateSidebarOutlineZone(
  outline: SidebarOutlineEntry[],
  sectionId: string | null,
  entries: SidebarOutlineEntry[]
): SidebarOutlineEntry[] {
  if (sectionId) {
    return outline.map((entry) =>
      entry.kind === 'section' && entry.section.id === sectionId ? { ...entry, items: entries } : entry
    );
  }

  const currentSections = new Map(
    outline.flatMap((entry) => (entry.kind === 'section' ? [[entry.id, entry] as const] : []))
  );
  return entries.map((entry) => {
    const currentSection = currentSections.get(entry.id);
    return entry.kind === 'section' && currentSection ? { ...entry, items: currentSection.items } : entry;
  });
}
