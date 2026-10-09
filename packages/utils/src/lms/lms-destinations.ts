import { isOrgOnFreePlan, type OrgPlanLike } from '../plans/org-plan';

export const LMS_DESTINATION_KEYS = [
  'home',
  'mylearning',
  'certificates',
  'explore',
  'cohorts',
  'exercises',
  'community',
  'settings'
] as const;

export type LmsDestinationKey = (typeof LMS_DESTINATION_KEYS)[number];

export type LmsAvailabilityContext = {
  orgId: string | null | undefined;
  plans: OrgPlanLike[] | null | undefined;
  isSelfHosted: boolean;
  customization: { dashboard?: { exercise?: boolean; community?: boolean } } | null | undefined;
};

export type LmsUnavailableReason = 'customization' | 'plan';

export type LmsDestination = {
  key: LmsDestinationKey;
  path: `/lms${string}`;
  titleKey: `lms_navigation.${string}`;
  isConditional: boolean;
  unavailableReason: (context: LmsAvailabilityContext) => LmsUnavailableReason | null;
};

export const LMS_DESTINATIONS: readonly LmsDestination[] = [
  { key: 'home', path: '/lms', titleKey: 'lms_navigation.home', isConditional: false, unavailableReason: () => null },
  {
    key: 'mylearning',
    path: '/lms/mylearning',
    titleKey: 'lms_navigation.my_learning',
    isConditional: false,
    unavailableReason: () => null
  },
  {
    key: 'certificates',
    path: '/lms/certificates',
    titleKey: 'lms_navigation.certificates',
    isConditional: true,
    unavailableReason: ({ orgId, plans, isSelfHosted }) =>
      isOrgOnFreePlan({ orgId, plans, isSelfHosted }) ? 'plan' : null
  },
  {
    key: 'explore',
    path: '/lms/explore',
    titleKey: 'lms_navigation.explore',
    isConditional: false,
    unavailableReason: () => null
  },
  {
    key: 'cohorts',
    path: '/lms/cohorts',
    titleKey: 'lms_navigation.cohorts',
    isConditional: false,
    unavailableReason: () => null
  },
  {
    key: 'exercises',
    path: '/lms/exercises',
    titleKey: 'lms_navigation.exercise',
    isConditional: true,
    unavailableReason: ({ customization }) => (customization?.dashboard?.exercise === true ? null : 'customization')
  },
  {
    key: 'community',
    path: '/lms/community',
    titleKey: 'lms_navigation.community',
    isConditional: true,
    unavailableReason: ({ customization }) => (customization?.dashboard?.community === true ? null : 'customization')
  },
  {
    key: 'settings',
    path: '/lms/settings',
    titleKey: 'lms_navigation.settings',
    isConditional: false,
    unavailableReason: () => null
  }
];

export const LMS_FALLBACK_PATH = '/lms';

/**
 * Finds a destination by its registry key.
 */
export function getLmsDestinationByKey(key: string): LmsDestination | undefined {
  return LMS_DESTINATIONS.find((destination) => destination.key === key);
}

/**
 * Finds a destination by its exact stored path.
 */
export function getLmsDestinationByPath(path: string): LmsDestination | undefined {
  return LMS_DESTINATIONS.find((destination) => destination.path === path);
}

/**
 * Matches any pathname under /lms to its destination. Home matches only /lms exactly.
 */
export function findLmsDestinationForPathname(pathname: string): LmsDestination | undefined {
  if (pathname === '/lms' || pathname === '/lms/') {
    return getLmsDestinationByKey('home');
  }

  return LMS_DESTINATIONS.find(
    (destination) =>
      destination.key !== 'home' && (pathname === destination.path || pathname.startsWith(`${destination.path}/`))
  );
}

/**
 * Reports whether a destination is available under the given org context.
 */
export function isLmsDestinationAvailable(destination: LmsDestination, context: LmsAvailabilityContext): boolean {
  return destination.unavailableReason(context) === null;
}
