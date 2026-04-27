import type { AccountOrg } from '$features/app/types';
import { baseNavConfig as lmsNavConfig } from '$features/ui/navigation/lms-navigation';
import { baseNavConfig as orgNavConfig } from '$features/ui/navigation/org-navigation';
import type { SearchResultItem } from './types';

function resolveTitle(titleKey: string, translate: (key: string) => string) {
  return titleKey.includes('.') ? translate(titleKey) : titleKey;
}

export function buildStaticCatalog(
  translate: (key: string) => string,
  currentOrgPath: string,
  isOrgAdmin: boolean | null
): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  for (const navItem of orgNavConfig) {
    if (navItem.requiresAdmin && !isOrgAdmin) {
      continue;
    }

    const url = navItem.path === '' ? currentOrgPath : `${currentOrgPath}${navItem.path}`;

    if (!navItem.useHashUrl && !navItem.disabled) {
      items.push({
        kind: 'nav',
        id: `nav:${navItem.path || '/'}`,
        title: resolveTitle(navItem.titleKey, translate),
        subtitle: translate('app.search.command_palette.result_types.page'),
        url,
        icon: navItem.icon
      });
    }

    for (const subItem of navItem.items ?? []) {
      if (subItem.requiresAdmin && !isOrgAdmin) {
        continue;
      }

      items.push({
        kind: 'settings',
        id: `settings:${subItem.path}`,
        title: resolveTitle(subItem.titleKey, translate),
        subtitle: resolveTitle(navItem.titleKey, translate),
        url: `${currentOrgPath}${subItem.path}`,
        icon: navItem.icon
      });
    }

    for (const nestedRoute of navItem.nestedRoutes ?? []) {
      items.push({
        kind: navItem.path === '/settings' ? 'settings' : 'nav',
        id: `${navItem.path || 'nav'}:${nestedRoute.path}`,
        title: resolveTitle(nestedRoute.titleKey, translate),
        subtitle: resolveTitle(navItem.titleKey, translate),
        url: `${currentOrgPath}${navItem.path}/${nestedRoute.path}`,
        icon: navItem.icon
      });
    }
  }

  return items;
}

export function buildLmsStaticCatalog(
  translate: (key: string) => string,
  currentOrg: AccountOrg | null
): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  for (const navItem of lmsNavConfig) {
    if (navItem.show && !navItem.show(currentOrg)) {
      continue;
    }

    const url = navItem.path === '' ? '/lms' : `/lms${navItem.path}`;

    if (!navItem.useHashUrl) {
      items.push({
        kind: 'nav',
        id: `lms-nav:${navItem.path || '/'}`,
        title: resolveTitle(navItem.titleKey, translate),
        subtitle: translate('app.search.command_palette.result_types.page'),
        url,
        icon: navItem.icon
      });
    }

    for (const subItem of navItem.items ?? []) {
      items.push({
        kind: 'settings',
        id: `lms-settings:${subItem.path}`,
        title: resolveTitle(subItem.titleKey, translate),
        subtitle: resolveTitle(navItem.titleKey, translate),
        url: `/lms${subItem.path}`,
        icon: navItem.icon
      });
    }

    for (const nestedRoute of navItem.nestedRoutes ?? []) {
      items.push({
        kind: 'nav',
        id: `lms:${navItem.path || 'nav'}:${nestedRoute.path}`,
        title: resolveTitle(nestedRoute.titleKey, translate),
        subtitle: resolveTitle(navItem.titleKey, translate),
        url: `/lms${navItem.path}/${nestedRoute.path}`,
        icon: navItem.icon
      });
    }
  }

  return items;
}

export function filterStaticCatalog(items: SearchResultItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const haystack = `${item.title} ${item.subtitle ?? ''}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
