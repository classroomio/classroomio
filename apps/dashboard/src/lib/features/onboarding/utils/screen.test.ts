import { describe, expect, it } from 'vitest';
import { ROUTE } from '$lib/utils/constants/routes';
import { getScreenForPath, getScreenOrderIndex, isScreenAheadOfSession } from './screen';

describe('getScreenForPath', () => {
  it.each([
    [ROUTE.ONBOARDING_BUSINESS, 'business'],
    [ROUTE.ONBOARDING_PREPARING, 'preparing'],
    [ROUTE.ONBOARDING_CUSTOMISE, 'customise']
  ])('maps %s to %s', (path, screen) => {
    expect(getScreenForPath(path)).toBe(screen);
  });

  it('ignores a trailing slash', () => {
    expect(getScreenForPath('/onboarding/')).toBeNull();
  });

  it('returns null for the flow root and unknown paths', () => {
    expect(getScreenForPath(ROUTE.ONBOARDING)).toBeNull();
    expect(getScreenForPath('/courses')).toBeNull();
  });
});

describe('getScreenOrderIndex', () => {
  it('orders the screens the way the flow runs', () => {
    expect(getScreenOrderIndex('business')).toBeLessThan(getScreenOrderIndex('preparing'));
    expect(getScreenOrderIndex('preparing')).toBeLessThan(getScreenOrderIndex('customise'));
  });

  it('places preparing between business and customise', () => {
    expect(getScreenOrderIndex('preparing')).toBe(getScreenOrderIndex('business') + 1);
    expect(getScreenOrderIndex('preparing')).toBe(getScreenOrderIndex('customise') - 1);
  });
});

describe('isScreenAheadOfSession', () => {
  it('blocks a screen the session has not reached', () => {
    expect(isScreenAheadOfSession('customise', 'business')).toBe(true);
  });

  it('allows the screen the session is on and every earlier one', () => {
    expect(isScreenAheadOfSession('business', 'business')).toBe(false);
  });

  it('treats preparing as reachable while the session is on customise', () => {
    expect(isScreenAheadOfSession('preparing', 'customise')).toBe(false);
    expect(isScreenAheadOfSession('preparing', 'business')).toBe(true);
  });
});
