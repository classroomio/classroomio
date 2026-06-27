import {
  ApiIcon,
  ChartColumnIcon,
  AttachmentIcon,
  CommunityIcon,
  CourseIcon,
  DashboardIcon,
  GoalIcon,
  HomeIcon,
  LandingPageIcon,
  PeopleIcon,
  SettingsIcon,
  SetupIcon,
  TagIcon,
  ZapIcon
} from '@cio/ui/custom/moving-icons';

import type { AccountOrg } from '$features/app/types';
import BotIcon from '@lucide/svelte/icons/bot';
import type { Component } from 'svelte';
import { isActive } from '$lib/utils/functions/app';

export interface NavItem {
  title: string;
  url: string;
  path: string; // Actual path (e.g., '/settings') for breadcrumb generation
  icon?: Component;
  isActive?: boolean;
  isExpanded?: boolean;
  /** When set, `isActive` for this item is determined by this regex on the pathname */
  matchPattern?: string;
  items?: NavItem[]; // for nested items like settings
  isPaid?: boolean; // Show upgrade indicator for free plan users
  disabled?: boolean;
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
  disableWhenNotAdmin?: boolean;
  items?: NavItemConfig[];
  useHashUrl?: boolean; // Use '#' as URL (for collapsible items like settings)
  nestedRoutes?: NestedRouteConfig[]; // Static nested routes
  supportsDynamicSegment?: boolean; // Supports dynamic segments (like [slug])
  matchPattern?: string | ((orgSlug: string) => string); // Regex pattern for route matching
  isPaid?: boolean; // Show upgrade indicator for free plan users
  group?: string | null; // Group label key for sidebar grouping
}

export interface NavGroup {
  labelKey: string | null;
  items: NavItem[];
}

export interface NestedRouteConfig {
  path: string; // Relative to parent (e.g., 'ask', 'customize-lms')
  titleKey: string; // Translation key or plain text
}

// Base navigation configuration structure
export const baseNavConfig: NavItemConfig[] = [
  {
    group: 'home',
    titleKey: 'org_navigation.home',
    path: '',
    icon: HomeIcon,
    matchPattern: '^/org/[^/]+/?$'
  },
  {
    group: 'home',
    titleKey: 'org_navigation.dashboard',
    path: '/dash',
    icon: DashboardIcon,
    matchPattern: '^/org/[^/]+/dash(/.*)?$'
  },
  {
    group: 'home',
    titleKey: 'org_navigation.stats',
    path: '/stats',
    icon: ChartColumnIcon,
    useHashUrl: true,
    matchPattern: '^/org/[^/]+/(analytics|compliance)(/.*)?$',
    items: [
      {
        titleKey: 'org_navigation.analytics',
        path: '/analytics',
        matchPattern: '^/org/[^/]+/analytics(/.*)?$'
      },
      {
        titleKey: 'org_navigation.compliance',
        path: '/compliance',
        requiresAdmin: true,
        matchPattern: '^/org/[^/]+/compliance(/.*)?$'
      }
    ]
  },
  {
    group: 'home',
    titleKey: 'org_navigation.setup',
    path: '/setup',
    icon: SetupIcon,
    requiresAdmin: true,
    matchPattern: '^/org/[^/]+/setup(/.*)?$'
  },
  {
    group: 'content',
    titleKey: 'org_navigation.courses',
    path: '/courses',
    icon: CourseIcon,
    matchPattern: '^/org/[^/]+/courses(/.*)?$' // Matches nested routes
  },
  {
    group: 'content',
    titleKey: 'org_navigation.programs',
    path: '/programs',
    icon: GoalIcon,
    matchPattern: '^/org/[^/]+/programs(/.*)?$'
  },
  {
    group: 'content',
    titleKey: 'org_navigation.media',
    path: '/media',
    icon: AttachmentIcon,
    matchPattern: '^/org/[^/]+/media(/.*)?$'
  },
  {
    group: 'content',
    titleKey: 'org_navigation.tags',
    path: '/tags',
    icon: TagIcon,
    requiresAdmin: true,
    matchPattern: '^/org/[^/]+/tags(/.*)?$'
  },
  {
    group: 'content',
    titleKey: 'org_navigation.widgets',
    path: '/widgets',
    icon: LandingPageIcon,
    matchPattern: '^(/org/[^/]+/widgets(/.*)?|/widgets/[^/]+(/.*)?)$'
  },
  {
    group: 'people',
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
    group: 'people',
    titleKey: 'org_navigation.audience',
    path: '/audience',
    icon: PeopleIcon,
    matchPattern: '^/org/[^/]+/audience(/.*)?$' // Matches nested routes
  },
  {
    group: 'automation',
    titleKey: 'automation.tabs.mcp',
    path: '/mcp',
    icon: BotIcon,
    requiresAdmin: true,
    disableWhenNotAdmin: true,
    matchPattern: '^/org/[^/]+/mcp(/.*)?$'
  },
  {
    group: 'automation',
    titleKey: 'automation.tabs.api',
    path: '/api',
    icon: ApiIcon,
    requiresAdmin: true,
    disableWhenNotAdmin: true,
    matchPattern: '^/org/[^/]+/api(/.*)?$'
  },
  {
    group: 'automation',
    titleKey: 'automation.tabs.zapier',
    path: '/zapier',
    icon: ZapIcon,
    requiresAdmin: true,
    disableWhenNotAdmin: true,
    matchPattern: '^/org/[^/]+/zapier(/.*)?$'
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
        path: '/settings',
        matchPattern: '^/org/[^/]+/settings/?$'
      },
      {
        titleKey: 'settings.tabs.organization_tab',
        path: '/settings/org',
        matchPattern: '^/org/[^/]+/settings/(org|customize-lms|domains|teams)(/.*)?$',
        nestedRoutes: [
          {
            path: 'domains',
            titleKey: 'settings.organization.organization_profile.custom_domain.heading'
          },
          {
            path: 'teams',
            titleKey: 'settings.organization.organization_profile.team.heading'
          },
          {
            path: 'customize-lms',
            titleKey: 'settings.tabs.customize_lms_tab'
          }
        ]
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
        titleKey: 'settings.tabs.ai_credits_tab',
        path: '/settings/ai-credits'
      },
      {
        titleKey: 'settings.tabs.ai_tutor_tab',
        path: '/settings/ai-tutor'
      },
      {
        titleKey: 'settings.tabs.auth_tab',
        matchPattern: '^/org/[^/]+/settings/auth(/.*)?$',
        path: '/settings/auth',
        isPaid: true
      }
    ],
    nestedRoutes: [
      {
        path: 'billing',
        titleKey: 'settings.tabs.billing_tab'
      },
      {
        path: 'ai-credits',
        titleKey: 'settings.tabs.ai_credits_tab'
      },
      {
        path: 'ai-tutor',
        titleKey: 'settings.tabs.ai_tutor_tab'
      },
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
    if (config.requiresAdmin && !isOrgAdmin && !config.disableWhenNotAdmin) {
      continue;
    }

    const visibleSubConfigs = config.items?.filter((sub) => !sub.requiresAdmin || isOrgAdmin) ?? [];

    if (config.items && visibleSubConfigs.length === 0) {
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
      matchPattern,
      isActive: isActive(pagePathname, fullPath, matchPattern),
      isExpanded: config.items ? isActive(pagePathname, fullPath, matchPattern) : undefined,
      disabled: Boolean(config.disableWhenNotAdmin && !isOrgAdmin),
      useHashUrl: config.useHashUrl,
      nestedRoutes: config.nestedRoutes,
      supportsDynamicSegment: config.supportsDynamicSegment,
      isPaid: config.isPaid
    };

    // Handle nested items (like settings sub-items)
    if (visibleSubConfigs.length > 0) {
      item.items = visibleSubConfigs.map((subConfig) => {
        const subMatchPattern =
          typeof subConfig.matchPattern === 'function'
            ? subConfig.matchPattern(currentOrg.siteName!)
            : subConfig.matchPattern;
        const subUrl = `${currentOrgPath}${subConfig.path}`;

        return {
          title: t(subConfig.titleKey),
          isActive: isActive(pagePathname, subUrl, subMatchPattern, true),
          url: subUrl,
          path: subConfig.path,
          matchPattern: subMatchPattern,
          isPaid: subConfig.isPaid,
          nestedRoutes: subConfig.nestedRoutes
        };
      });
    }

    items.push(item);
  }

  return items;
}

const GROUP_ORDER: Array<{ key: string | null; labelKey: string | null }> = [
  { key: 'home', labelKey: 'org_navigation.home' },
  { key: 'content', labelKey: 'org_navigation.content' },
  { key: 'people', labelKey: 'org_navigation.people' },
  { key: 'automation', labelKey: 'org_navigation.automation' },
  { key: null, labelKey: null }
];

/**
 * Get navigation items grouped for the sidebar
 */
export function getOrgNavigationGroups(
  currentOrgPath: string,
  currentOrg: AccountOrg,
  isOrgAdmin: boolean | null,
  t: (key: string) => string,
  pagePathname: string
): NavGroup[] {
  const pathnameOnly = pagePathname.split('?')[0];
  const groupedMap = new Map<string | null, NavItem[]>();

  for (const groupDef of GROUP_ORDER) {
    groupedMap.set(groupDef.key, []);
  }

  for (const config of baseNavConfig) {
    if (config.requiresAdmin && !isOrgAdmin && !config.disableWhenNotAdmin) {
      continue;
    }

    const visibleSubConfigs = config.items?.filter((sub) => !sub.requiresAdmin || isOrgAdmin) ?? [];

    if (config.items && visibleSubConfigs.length === 0) {
      continue;
    }

    const url = config.path === '' ? currentOrgPath : `${currentOrgPath}${config.path}`;
    const fullPath = config.path === '' ? `/org/${currentOrg.siteName}` : `/org/${currentOrg.siteName}${config.path}`;
    const matchPattern =
      typeof config.matchPattern === 'function' ? config.matchPattern(currentOrg.siteName!) : config.matchPattern;

    const item: NavItem = {
      title: t(config.titleKey),
      url: config.useHashUrl ? '#' : url,
      path: config.path,
      icon: config.icon,
      matchPattern,
      isActive: isActive(pathnameOnly, fullPath, matchPattern),
      isExpanded: config.items ? isActive(pathnameOnly, fullPath, matchPattern) : undefined,
      disabled: Boolean(config.disableWhenNotAdmin && !isOrgAdmin),
      useHashUrl: config.useHashUrl,
      nestedRoutes: config.nestedRoutes,
      supportsDynamicSegment: config.supportsDynamicSegment,
      isPaid: config.isPaid
    };

    if (visibleSubConfigs.length > 0) {
      item.items = visibleSubConfigs.map((subConfig) => {
        const subMatchPattern =
          typeof subConfig.matchPattern === 'function'
            ? subConfig.matchPattern(currentOrg.siteName!)
            : subConfig.matchPattern;
        const subUrl = `${currentOrgPath}${subConfig.path}`;
        return {
          title: t(subConfig.titleKey),
          isActive: isActive(pathnameOnly, subUrl, subMatchPattern, true),
          url: subUrl,
          path: subConfig.path,
          matchPattern: subMatchPattern,
          isPaid: subConfig.isPaid,
          nestedRoutes: subConfig.nestedRoutes
        };
      });
    }

    const groupKey = config.group !== undefined ? config.group : null;
    const bucket = groupedMap.get(groupKey) ?? groupedMap.get(null)!;
    bucket.push(item);
  }

  return GROUP_ORDER.filter(({ key }) => (groupedMap.get(key) ?? []).length > 0).map(({ key, labelKey }) => ({
    labelKey,
    items: groupedMap.get(key) ?? []
  }));
}
