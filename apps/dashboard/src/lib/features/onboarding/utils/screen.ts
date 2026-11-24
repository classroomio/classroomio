import type { TOnboardingScreen } from '@cio/utils/constants/onboarding';
import { ROUTE } from '$lib/utils/constants/routes';

const SCREEN_BY_PATH: Record<string, TOnboardingScreen> = {
  [ROUTE.ONBOARDING_BUSINESS]: 'business',
  [ROUTE.ONBOARDING_PREPARING]: 'preparing',
  [ROUTE.ONBOARDING_CUSTOMISE]: 'customise'
};

/** Where each screen sits in the flow. Preparing shares the business position; it is not a step. */
const SCREEN_ORDER: TOnboardingScreen[] = ['business', 'preparing', 'customise', 'complete'];

export function getScreenForPath(pathname: string): TOnboardingScreen | null {
  const normalized = pathname.replace(/\/$/, '');

  return SCREEN_BY_PATH[normalized] ?? null;
}

export function getScreenOrderIndex(screen: TOnboardingScreen): number {
  return SCREEN_ORDER.indexOf(screen);
}

/** A screen is ahead of the session when the flow has not reached it yet. */
export function isScreenAheadOfSession(pathScreen: TOnboardingScreen, sessionScreen: TOnboardingScreen): boolean {
  if (pathScreen === 'preparing' && sessionScreen === 'customise') return false;

  return getScreenOrderIndex(pathScreen) > getScreenOrderIndex(sessionScreen);
}
