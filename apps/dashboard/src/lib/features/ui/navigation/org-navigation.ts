import {
  CommunityIcon,
  CourseIcon,
  DashboardIcon,
  PeopleIcon,
  SettingsIcon,
  SetupIcon
} from '@cio/ui/custom/moving-icons';

import type { AccountOrg } from '$features/app/types';
import type { Component } from 'svelte';
import { isActive } from '$lib/utils/functions/app';

export interface NavItem {
  title: string; // translation key
  url: string;
  path: string; // Actual path (e.g., '/settings') for breadcrumb generation
  icon?: Component;
  isActive?: boolean;
  isExpanded?: boolean;
  items?: NavItem[]; // for nested items like settings
  // Metadata for breadcrumb generation
  useHashUrl?: boolean; // Use '#' as URL (for collapsible items like settings)
  nestedRoutes?: NestedRouteConfig[]; // Static nested routes (like community/ask, settings/customize-lms)
  supportsDynamicSegment?: boolean; // Supports dynamic segments (like [slug])
}

export interface NavItemConfig {
  titleKey: string;
  path: string;
  icon?: Component;
  requiresAdmin?: boolean;
  items?: NavItemConfig[];
  useHashUrl?: boolean; // Use '#' as URL (for collapsible items like settings)
  nestedRoutes?: NestedRouteConfig[]; // Static nested routes
  supportsDynamicSegment?: boolean; // Supports dynamic segments (like [slug])
  matchPattern?: string | ((orgSlug: string) => string); // Regex pattern for route matching
}

export interface NestedRouteConfig {
  path: string; // Relative to parent (e.g., 'ask', 'customize-lms')
  titleKey: string; // Translation key or plain text
}

// Base navigation configuration structure
const baseNavConfig: NavItemConfig[] = [
  {
    titleKey: 'org_navigation.dashboard',
    path: '',
    icon: DashboardIcon,
    matchPattern: '^/org/[^/]+/?$' // Exact match only
  },
  {
    titleKey: 'org_navigation.courses',
    path: '/courses',
    icon: CourseIcon,
    matchPattern: '^/org/[^/]+/courses(/.*)?$' // Matches nested routes
  },
  {
    titleKey: 'org_navigation.community',
    path: '/community',
    icon: CommunityIcon,
    supportsDynamicSegment: true, // Supports /community/[slug]
    matchPattern: '^/org/[^/]+/community(/.*)?$', // Matches nested routes
    nestedRoutes: [
      {
        path: 'ask',
        titleKey: 'Ask Question' // Could be translated
      }
    ]
  },
  {
    titleKey: 'org_navigation.audience',
    path: '/audience',
    icon: PeopleIcon,
    matchPattern: '^/org/[^/]+/audience(/.*)?$' // Matches nested routes
  },
  {
    titleKey: 'org_navigation.setup',
    path: '/setup',
    icon: SetupIcon,
    requiresAdmin: true,
    matchPattern: '^/org/[^/]+/setup(/.*)?$' // Matches nested routes
  },
  {
    titleKey: 'org_navigation.settings',
    path: '/settings',
    icon: SettingsIcon,
    useHashUrl: true, // Use '#' for collapsible parent
    matchPattern: '^/org/[^/]+/settings(/.*)?$', // Matches nested routes
    items: [
      {
        titleKey: 'Profile',
        path: '/settings'
      },
      {
        titleKey: 'Organization',
        path: '/settings/org'
      },
      {
        titleKey: 'Landing Page',
        path: '/settings/landingpage'
      },
      {
        titleKey: 'Billing',
        path: '/settings/billing'
      },
      {
        titleKey: 'Payout',
        path: '/settings/payout'
      }
      // {
      //   titleKey: 'Integrations',
      //   path: '/settings/integrations'
      // }
    ],
    nestedRoutes: [
      {
        path: 'customize-lms',
        titleKey: 'Customize LMS'
      },
      {
        path: 'domains',
        titleKey: 'Domains'
      },
      {
        path: 'teams',
        titleKey: 'Teams'
      },
      {
        path: 'payout',
        titleKey: 'Payout'
      }
    ]
  }
];

/**
 * Get navigation items based on organization context and permissions
 */
export function getOrgNavigationItems(
  currentOrgPath: string,
  currentOrg: AccountOrg,
  isOrgAdmin: boolean | null,
  t: (key: string) => string,
  pagePathname: string
): NavItem[] {
  const items: NavItem[] = [];

  for (const config of baseNavConfig) {
    // Skip admin-only items if user is not admin
    if (config.requiresAdmin && !isOrgAdmin) {
      continue;
    }

    const url = config.path === '' ? currentOrgPath : `${currentOrgPath}${config.path}`;
    const fullPath = config.path === '' ? `/org/${currentOrg.siteName}` : `/org/${currentOrg.siteName}${config.path}`;

    // Extract match pattern (handle function case)
    const matchPattern =
      typeof config.matchPattern === 'function' ? config.matchPattern(currentOrg.siteName) : config.matchPattern;

    const item: NavItem = {
      title: t(config.titleKey),
      url: config.useHashUrl ? '#' : url,
      path: config.path, // Store actual path for breadcrumb generation
      icon: config.icon,
      isActive: isActive(pagePathname, fullPath, matchPattern),
      isExpanded: config.items ? isActive(pagePathname, fullPath, matchPattern) : undefined,
      useHashUrl: config.useHashUrl,
      nestedRoutes: config.nestedRoutes,
      supportsDynamicSegment: config.supportsDynamicSegment
    };

    // Handle nested items (like settings sub-items)
    if (config.items) {
      item.items = config.items.map((subConfig) => ({
        title: subConfig.titleKey,
        url: `${currentOrgPath}${subConfig.path}`,
        path: subConfig.path
      }));
    }

    items.push(item);
  }

  return items;
}
