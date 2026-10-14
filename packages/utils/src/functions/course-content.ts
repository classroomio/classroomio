/**
 * Identifier for unsectioned content entries in course content.
 */
export const UNGROUPED_SECTION_KEY = 'ungrouped';

/**
 * Course content structure for order calculations.
 */
export type CourseContentForOrder<T extends { order?: number | null } = { order?: number | null }> = {
  grouped: boolean;
  sections: Array<{
    id: string;
    order?: number | null;
    items: T[];
  }>;
  items: T[];
};

/**
 * Calculates the next 1-based order for creating a section.
 *
 * Accounts for both server-rendered sections and locally reserved orders created
 * in the active session while a background outline refresh is pending.
 */
export function calculateNextSectionOrder(
  sections: Array<{ order?: number | null }>,
  reservedOrders: number[] = []
): number {
  const serverOrders = sections.map((section, index) => section.order ?? index + 1);
  const allOrders = [...serverOrders, ...reservedOrders];
  const maxOrder = allOrders.length ? Math.max(...allOrders) : 0;
  return maxOrder + 1;
}

/**
 * Calculates the next 1-based order for creating content (lesson or exercise).
 *
 * Accounts for existing server items in the target section (or ungrouped)
 * as well as locally reserved orders created in the active session while a
 * background outline refresh is pending.
 */
export function calculateNextContentOrder<T extends { order?: number | null }>(
  content: CourseContentForOrder<T> | null | undefined,
  targetSectionId?: string,
  reservedOrders: number[] = []
): number {
  let serverOrders: number[] = [];

  if (content) {
    let items = content.items;

    if (content.grouped) {
      const targetId = targetSectionId ?? UNGROUPED_SECTION_KEY;
      const section = content.sections.find((entry) => entry.id === targetId);
      items = section?.items ?? content.items;
      if (!targetSectionId) {
        serverOrders = content.sections
          .filter((entry) => entry.id !== UNGROUPED_SECTION_KEY)
          .map((entry) => entry.order ?? 0);
      }
    }

    serverOrders.push(...items.map((item, index) => item.order ?? index + 1));
  }

  const allOrders = [...serverOrders, ...reservedOrders];
  const maxOrder = allOrders.length ? Math.max(...allOrders) : 0;

  return maxOrder + 1;
}

export type CourseOutlineEntry<TItem, TSection> =
  | { id: string; kind: 'section'; order: number; section: TSection }
  | { id: string; kind: 'item'; order: number; item: TItem };

export function getCourseOutline<
  TItem extends { id: string; type?: string; order?: number | null },
  TSection extends { id: string; order?: number | null; items: TItem[] }
>(content: { grouped: boolean; sections: TSection[]; items: TItem[] }): CourseOutlineEntry<TItem, TSection>[] {
  const entries: CourseOutlineEntry<TItem, TSection>[] = [];
  const standaloneItems = [...content.items];

  if (content.grouped) {
    for (const section of content.sections) {
      if (section.id === UNGROUPED_SECTION_KEY) {
        standaloneItems.push(...section.items);
        continue;
      }

      entries.push({ id: `SECTION-${section.id}`, kind: 'section', order: section.order ?? 0, section });
    }
  }

  for (const item of standaloneItems) {
    entries.push({ id: `${item.type ?? 'ITEM'}-${item.id}`, kind: 'item', order: item.order ?? 0, item });
  }

  return entries.sort((left, right) => left.order - right.order);
}
