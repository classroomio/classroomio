import {
  CertificateIcon,
  CommunityIcon,
  CourseIcon,
  ExerciseIcon,
  ExploreIcon,
  GoalIcon,
  HomeIcon,
  SettingsIcon
} from '@cio/ui/custom/moving-icons';

import type { AccountOrg } from '$features/app/types';
import type { Component } from 'svelte';
import {
  isLmsDestinationAvailable,
  LMS_DESTINATIONS,
  type LmsAvailabilityContext,
  type LmsDestinationKey
} from '@cio/utils/lms';
import { isActive } from '$lib/utils/functions/app';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

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

type LmsNavUiMeta = Pick<
  NavItemConfig,
  'icon' | 'matchPattern' | 'items' | 'nestedRoutes' | 'useHashUrl' | 'supportsDynamicSegment'
>;

export const LMS_DESTINATION_ICONS: Record<LmsDestinationKey, Component> = {
  home: HomeIcon,
  mylearning: CourseIcon,
  certificates: CertificateIcon,
  explore: ExploreIcon,
  cohorts: GoalIcon,
  exercises: ExerciseIcon,
  community: CommunityIcon,
  settings: SettingsIcon
};

const LMS_NAV_UI_META: Record<LmsDestinationKey, LmsNavUiMeta> = {
  home: {
    icon: LMS_DESTINATION_ICONS.home,
    matchPattern: '^/lms/?$'
  },
  mylearning: {
    icon: LMS_DESTINATION_ICONS.mylearning,
    matchPattern: '^/lms/mylearning(/.*)?$'
  },
  certificates: {
    icon: LMS_DESTINATION_ICONS.certificates,
    matchPattern: '^/lms/certificates(/.*)?$'
  },
  explore: {
    icon: LMS_DESTINATION_ICONS.explore,
    matchPattern: '^/lms/explore(/.*)?$'
  },
  cohorts: {
    icon: LMS_DESTINATION_ICONS.cohorts,
    matchPattern: '^/lms/cohorts(/.*)?$'
  },
  exercises: {
    icon: LMS_DESTINATION_ICONS.exercises,
    matchPattern: '^/lms/exercises(/.*)?$'
  },
  community: {
    icon: LMS_DESTINATION_ICONS.community,
    matchPattern: '^/lms/community(/.*)?$',
    supportsDynamicSegment: true,
    nestedRoutes: [
      {
        path: 'ask',
        titleKey: 'Ask Question'
      }
    ]
  },
  settings: {
    icon: LMS_DESTINATION_ICONS.settings,
    useHashUrl: true,
    matchPattern: '^/lms/settings(/.*)?$',
    items: [
      {
        titleKey: 'Profile',
        path: '/settings'
      },
      {
        titleKey: 'Notifications',
        path: '/settings/notifications'
      },
      {
        titleKey: 'Integrations',
        path: '/settings/integrations'
      }
    ],
    nestedRoutes: [
      {
        path: 'notifications',
        titleKey: 'settings.tabs.notifications_tab'
      },
      {
        path: 'integrations',
        titleKey: 'settings.tabs.integrations_tab'
      }
    ]
  }
};

/**
 * Adapts the dashboard org row to the registry availability context.
 */
export function toLmsAvailabilityContext(currentOrg: AccountOrg | null): LmsAvailabilityContext {
  return {
    orgId: currentOrg?.id ?? null,
    plans: currentOrg?.plans ?? null,
    isSelfHosted: PUBLIC_IS_SELFHOSTED === 'true',
    customization: (currentOrg?.customization as LmsAvailabilityContext['customization']) ?? null
  };
}

// Base navigation configuration structure
export const baseNavConfig: NavItemConfig[] = LMS_DESTINATIONS.map((destination) => ({
  titleKey: destination.titleKey,
  path: destination.path === '/lms' ? '' : destination.path.slice('/lms'.length),
  ...LMS_NAV_UI_META[destination.key],
  show: (currentOrg: AccountOrg | null) => isLmsDestinationAvailable(destination, toLmsAvailabilityContext(currentOrg))
}));

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
