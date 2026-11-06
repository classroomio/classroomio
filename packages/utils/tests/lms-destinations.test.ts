import { describe, expect, it } from 'vitest';

import {
  LMS_DESTINATION_KEYS,
  LMS_DESTINATIONS,
  findLmsDestinationForPathname,
  getLmsDestinationByKey,
  getLmsDestinationByPath,
  isLmsDestinationAvailable,
  type LmsAvailabilityContext
} from '../src/lms/lms-destinations';

function buildContext(overrides: Partial<LmsAvailabilityContext> = {}): LmsAvailabilityContext {
  return {
    orgId: 'org-1',
    plans: [{ planName: 'ENTERPRISE', isActive: true }],
    isSelfHosted: false,
    customization: { dashboard: { exercise: true, community: true } },
    ...overrides
  };
}

describe('lms destinations registry', () => {
  it('keeps every key unique', () => {
    expect(new Set(LMS_DESTINATION_KEYS).size).toBe(LMS_DESTINATION_KEYS.length);
    expect(new Set(LMS_DESTINATIONS.map((destination) => destination.key)).size).toBe(LMS_DESTINATIONS.length);
    expect(new Set(LMS_DESTINATIONS.map((destination) => destination.path)).size).toBe(LMS_DESTINATIONS.length);
  });

  it('keeps isConditional aligned with the availability rule', () => {
    const alwaysAvailable = buildContext();
    const alwaysBlocked: LmsAvailabilityContext = {
      orgId: 'org-1',
      plans: [{ planName: 'BASIC', isActive: true }],
      isSelfHosted: false,
      customization: { dashboard: {} }
    };

    for (const destination of LMS_DESTINATIONS) {
      const openByDefault = destination.unavailableReason(alwaysAvailable) === null;
      const blockedByDefault = destination.unavailableReason(alwaysBlocked) !== null;

      if (destination.isConditional) {
        expect(blockedByDefault).toBe(true);
      } else {
        expect(openByDefault).toBe(true);
        expect(destination.unavailableReason(alwaysBlocked)).toBeNull();
      }
    }
  });

  it('gates certificates on the plan', () => {
    const certificates = getLmsDestinationByKey('certificates');
    expect(certificates).toBeDefined();

    expect(
      isLmsDestinationAvailable(certificates!, buildContext({ plans: [{ planName: 'BASIC', isActive: true }] }))
    ).toBe(false);
    expect(
      isLmsDestinationAvailable(certificates!, buildContext({ plans: [{ planName: 'ENTERPRISE', isActive: true }] }))
    ).toBe(true);
    expect(isLmsDestinationAvailable(certificates!, buildContext({ isSelfHosted: true }))).toBe(true);
  });

  it('gates exercises and community on customization toggles', () => {
    const exercises = getLmsDestinationByKey('exercises');
    const community = getLmsDestinationByKey('community');
    expect(exercises).toBeDefined();
    expect(community).toBeDefined();

    expect(isLmsDestinationAvailable(exercises!, buildContext({ customization: { dashboard: {} } }))).toBe(false);
    expect(
      isLmsDestinationAvailable(exercises!, buildContext({ customization: { dashboard: { exercise: true } } }))
    ).toBe(true);
    expect(isLmsDestinationAvailable(community!, buildContext({ customization: { dashboard: {} } }))).toBe(false);
    expect(
      isLmsDestinationAvailable(community!, buildContext({ customization: { dashboard: { community: true } } }))
    ).toBe(true);
  });

  it('keeps always-on pages available', () => {
    for (const key of ['home', 'mylearning', 'explore', 'cohorts', 'settings'] as const) {
      const destination = getLmsDestinationByKey(key);
      expect(destination).toBeDefined();
      expect(isLmsDestinationAvailable(destination!, buildContext())).toBe(true);
      expect(
        isLmsDestinationAvailable(destination!, {
          orgId: null,
          plans: null,
          isSelfHosted: false,
          customization: null
        })
      ).toBe(true);
    }
  });

  it('looks up destinations by key and exact path', () => {
    expect(getLmsDestinationByKey('mylearning')?.path).toBe('/lms/mylearning');
    expect(getLmsDestinationByPath('/lms/mylearning')?.key).toBe('mylearning');
    expect(getLmsDestinationByKey('unknown')).toBeUndefined();
    expect(getLmsDestinationByPath('/lms/mylearning/next')).toBeUndefined();
  });

  it('matches nested pathnames by segment prefix', () => {
    expect(findLmsDestinationForPathname('/lms/community/ask')?.key).toBe('community');
    expect(findLmsDestinationForPathname('/lms/community/some-slug')?.key).toBe('community');
    expect(findLmsDestinationForPathname('/lms/settings/notifications')?.key).toBe('settings');
    expect(findLmsDestinationForPathname('/lms/exercises/attempt-1')?.key).toBe('exercises');
  });

  it('matches home only on the exact root', () => {
    expect(findLmsDestinationForPathname('/lms')?.key).toBe('home');
    expect(findLmsDestinationForPathname('/lms/')?.key).toBe('home');
    expect(findLmsDestinationForPathname('/lms/mylearning')?.key).toBe('mylearning');
    expect(findLmsDestinationForPathname('/lmsxyz')?.key).toBeUndefined();
  });
});
