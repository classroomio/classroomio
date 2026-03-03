import {
  AttachmentIcon,
  CommunityIcon,
  CourseIcon,
  DashboardIcon,
  PeopleIcon,
  SettingsIcon,
  SetupIcon
} from '@cio/ui/custom/moving-icons';

import type { AccountOrg } from '$features/app/types';
import type { Component } from 'svelte';
import TagIcon from '@lucide/svelte/icons/tag';
import { isActive } from '$lib/utils/functions/app';

export interface NavItem {
  title: string; // translation key
  url: string;
  path: string; // Actual path (e.g., '/settings') for breadcrumb generation
  icon?: Component;
  isActive?: boolean;
  isExpanded?: boolean;
  items?: NavItem[]; // for nested items like settings
  isPaid?: boolean; // Show upgrade indicator for free plan users
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
  isPaid?: boolean; // Show upgrade indicator for free plan users
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
    titleKey: 'org_navigation.tags',
    path: '/tags',
    icon: TagIcon,
    requiresAdmin: true,
    matchPattern: '^/org/[^/]+/tags(/.*)?$'
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
    titleKey: 'org_navigation.media',
    path: '/media',
    icon: AttachmentIcon,
    matchPattern: '^/org/[^/]+/media(/.*)?$'
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
        titleKey: 'settings.tabs.profile_tab',
        path: '/settings'
      },
      {
        titleKey: 'settings.tabs.organization_tab',
        path: '/settings/org'
      },
      {
        titleKey: 'settings.tabs.landing_page_tab',
        path: '/settings/landingpage'
      },
      {
        titleKey: 'settings.tabs.billing_tab',
        path: '/settings/billing'
      },
      {
        titleKey: 'settings.tabs.auth_tab',
        matchPattern: '^/org/[^/]+/settings/auth(/.*)?$',
        path: '/settings/auth',
        isPaid: true
      },
      {
        titleKey: 'settings.tabs.emails_tab',
        path: '/settings/emails'
      }
    ],
    nestedRoutes: [
      {
        path: 'customize-lms',
        titleKey: 'settings.tabs.customize_lms_tab'
      },
      {
        path: 'domains',
        titleKey: 'settings.tabs.domains_tab'
      },
      {
        path: 'teams',
        titleKey: 'settings.tabs.teams_tab'
      },
      {
        path: 'auth',
        titleKey: 'settings.tabs.auth_tab'
      },
      {
        path: 'auth/sso',
        titleKey: 'settings.tabs.sso_tab'
      },
      {
        path: 'auth/token-auth',
        titleKey: 'settings.tabs.token_auth_tab'
      },
      {
        path: 'emails',
        titleKey: 'settings.tabs.emails_tab'
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
      typeof config.matchPattern === 'function' ? config.matchPattern(currentOrg.siteName!) : config.matchPattern;

    const item: NavItem = {
      title: t(config.titleKey),
      url: config.useHashUrl ? '#' : url,
      path: config.path, // Store actual path for breadcrumb generation
      icon: config.icon,
      isActive: isActive(pagePathname, fullPath, matchPattern),
      isExpanded: config.items ? isActive(pagePathname, fullPath, matchPattern) : undefined,
      useHashUrl: config.useHashUrl,
      nestedRoutes: config.nestedRoutes,
      supportsDynamicSegment: config.supportsDynamicSegment,
      isPaid: config.isPaid
    };

    // Handle nested items (like settings sub-items)
    if (config.items) {
      item.items = config.items.map((subConfig) => {
        const matchPattern =
          typeof subConfig.matchPattern === 'function'
            ? subConfig.matchPattern(currentOrg.siteName!)
            : subConfig.matchPattern;
        const url = `${currentOrgPath}${subConfig.path}`;

        return {
          title: t(subConfig.titleKey),
          isActive: isActive(pagePathname, url, matchPattern, true),
          url: url,
          path: subConfig.path,
          isPaid: subConfig.isPaid
        };
      });
    }

    items.push(item);
  }

  return items;
}
