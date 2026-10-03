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
      items = section?.items ?? [];
    }

    serverOrders = items.map((item, index) => item.order ?? index + 1);
  }

  const allOrders = [...serverOrders, ...reservedOrders];
  const maxOrder = allOrders.length ? Math.max(...allOrders) : 0;

  return maxOrder + 1;
}
