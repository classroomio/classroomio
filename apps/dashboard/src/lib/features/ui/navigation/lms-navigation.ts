import type { AccountOrg } from '$features/app/types';
import CogIcon from '@lucide/svelte/icons/cog';
import type { Component } from 'svelte';
import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import LibraryBigIcon from '@lucide/svelte/icons/library-big';
import ListTodoIcon from '@lucide/svelte/icons/list-todo';
import MapPlusIcon from '@lucide/svelte/icons/map-plus';
import UsersIcon from '@lucide/svelte/icons/users';
import { isActive } from '$lib/utils/functions/app';

export interface NavItem {
  title: string;
  url: string;
  path: string;
  icon?: Component;
  isActive?: boolean;
  isExpanded?: boolean;
  show?: () => boolean;
  items?: NavItem[];
  useHashUrl?: boolean;
  nestedRoutes?: NestedRouteConfig[];
  supportsDynamicSegment?: boolean;
}

export interface NestedRouteConfig {
  path: string; // Relative to parent (e.g., 'ask', 'integrations')
  titleKey: string; // Translation key or plain text
}

export interface NavItemConfig {
  titleKey: string;
  path: string;
  icon?: Component;
  show?: (currentOrg: AccountOrg | null) => boolean;
  matchPattern?: string;
  items?: NavItemConfig[];
  useHashUrl?: boolean;
  nestedRoutes?: NestedRouteConfig[];
  supportsDynamicSegment?: boolean;
}

// Base navigation configuration structure
const baseNavConfig: NavItemConfig[] = [
  {
    titleKey: 'lms_navigation.home',
    path: '',
    icon: LayoutDashboardIcon,
    matchPattern: '^/lms/?$'
  },
  {
    titleKey: 'lms_navigation.my_learning',
    path: '/mylearning',
    icon: LibraryBigIcon,
    matchPattern: '^/lms/mylearning(/.*)?$'
  },
  {
    titleKey: 'lms_navigation.exercise',
    path: '/exercises',
    icon: ListTodoIcon,
    matchPattern: '^/lms/exercises(/.*)?$',
    show: (currentOrg) => currentOrg?.customization?.dashboard?.exercise === true
  },
  {
    titleKey: 'lms_navigation.community',
    path: '/community',
    icon: UsersIcon,
    matchPattern: '^/lms/community(/.*)?$',
    show: (currentOrg) => currentOrg?.customization?.dashboard?.community === true,
    supportsDynamicSegment: true, // Supports /community/[slug]
    nestedRoutes: [
      {
        path: 'ask',
        titleKey: 'Ask Question' // Could be translated
      }
    ]
  },
  {
    titleKey: 'lms_navigation.explore',
    path: '/explore',
    icon: MapPlusIcon,
    matchPattern: '^/lms/explore(/.*)?$'
  },
  {
    titleKey: 'lms_navigation.settings',
    path: '/settings',
    icon: CogIcon,
    useHashUrl: true,
    matchPattern: '^/lms/settings(/.*)?$',
    items: [
      {
        titleKey: 'Profile',
        path: '/settings'
      },
      {
        titleKey: 'Integrations',
        path: '/settings/integrations'
      }
    ]
  }
];

/**
 * Get LMS navigation items based on organization context
 */
export function getLmsNavigationItems(
  currentOrg: AccountOrg | null,
  t: (key: string) => string,
  pagePathname: string
): NavItem[] {
  const items: NavItem[] = [];

  for (const config of baseNavConfig) {
    // Skip items that should be hidden based on customization
    if (config.show && !config.show(currentOrg)) {
      continue;
    }

    const url = config.path === '' ? '/lms' : `/lms${config.path}`;
    const fullPath = config.path === '' ? '/lms' : `/lms${config.path}`;

    const item: NavItem = {
      title: t(config.titleKey),
      url: config.useHashUrl ? '#' : url,
      path: config.path,
      icon: config.icon,
      isActive: isActive(pagePathname, fullPath, config.matchPattern),
      isExpanded: config.items ? isActive(pagePathname, fullPath, config.matchPattern) : undefined,
      useHashUrl: config.useHashUrl,
      nestedRoutes: config.nestedRoutes,
      supportsDynamicSegment: config.supportsDynamicSegment,
      show: config.show ? () => config.show!(currentOrg) : undefined
    };

    // Handle nested items (like settings sub-items)
    if (config.items) {
      item.items = config.items.map((subConfig) => ({
        title: t(`settings.tabs.${subConfig.titleKey.toLowerCase()}_tab`) || subConfig.titleKey,
        url: `/lms${subConfig.path}`,
        path: subConfig.path
      }));
    }

    items.push(item);
  }

  return items;
}
