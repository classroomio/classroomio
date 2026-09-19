import type { NavGroup, NavConfig, NavItemConfig } from './types';

/**
 * Applies navigation transformations (remove, rename, add) to a navigation structure.
 * Pure function: does not mutate baseNav and returns a fresh structure.
 */
export function applyNavConfig(baseNav: NavGroup[], navConfig: NavConfig = {}): NavGroup[] {
  const removeSet = new Set(navConfig.remove ?? []);
  const renameMap = navConfig.rename ?? {};
  const addItems = navConfig.add ?? [];

  // Deep clone groups to guarantee immutability
  const result: NavGroup[] = baseNav.map((group) => {
    const items: NavItemConfig[] = group.items
      .filter((item) => !removeSet.has(item.key))
      .map((item) => {
        const renamedTitle = renameMap[item.key];
        return {
          ...item,
          title: renamedTitle !== undefined ? renamedTitle : item.title
        };
      });

    return {
      ...group,
      items
    };
  });

  // Handle items to add
  for (const item of addItems) {
    if (removeSet.has(item.key)) {
      continue;
    }

    const renamedTitle = renameMap[item.key];
    const itemToAdd: NavItemConfig = {
      ...item,
      title: renamedTitle !== undefined ? renamedTitle : item.title
    };

    const targetGroup = item.group ? result.find((g) => g.labelKey === item.group) : undefined;
    if (targetGroup) {
      targetGroup.items.push(itemToAdd);
    } else {
      result.push({
        labelKey: item.group ?? null,
        items: [itemToAdd]
      });
    }
  }

  return result;
}
