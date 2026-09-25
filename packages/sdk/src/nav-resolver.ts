import type { NavGroup, NavConfig, NavItemConfig, PluginDefinition, ResolvedPluginNavItem } from './types';

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

/**
 * Resolves the list of sidebar nav items contributed by installed plugins.
 *
 * A plugin's nav item is included only when:
 * 1. The plugin declares `pluginNav`.
 * 2. The plugin's activation kind is `'always'`, OR the plugin's `capabilityId` is
 *    present in `enabledCapabilityIds` (i.e. the org has enabled that capability).
 *
 * @param plugins        - The full list of configured plugins (from `configuredPlugins`).
 * @param orgSlug        - The current organization slug, used to build the `href`.
 * @param enabledCapabilityIds - Set of capability IDs enabled for the active organization.
 */
export function resolveDynamicPluginNav(
  plugins: PluginDefinition[],
  orgSlug: string,
  enabledCapabilityIds: Set<string>
): ResolvedPluginNavItem[] {
  const resolvedItems: ResolvedPluginNavItem[] = [];

  for (const plugin of plugins) {
    if (!plugin.pluginNav) continue;

    const { activation } = plugin;
    const isAlways = !activation || activation.kind === 'always';
    const isCapabilityEnabled =
      activation?.kind === 'org-capability' && enabledCapabilityIds.has(activation.capabilityId);

    if (!isAlways && !isCapabilityEnabled) continue;

    const navDef = plugin.pluginNav;

    resolvedItems.push({
      pluginId: plugin.id,
      titleKey: navDef.titleKey,
      href: `/org/${orgSlug}/plugins/${navDef.path}`,
      icon: navDef.icon,
      group: navDef.group ?? 'tools',
      adminOnly: navDef.adminOnly ?? false
    });
  }

  return resolvedItems;
}
